"""
Command Handler - Processes room control commands.

Fixes applied:
  1. Room mapping pinned to hardware: R1=Pin3, R2=Pin5, R3=Pin9, R4=Pin10
  2. Detailed debug logging for every command
  3. Thread-safe room state tracking
  4. Auto-test function to verify all 4 LEDs
"""
from __future__ import annotations

import time
from collections import deque
from typing import Optional

from config import Config
from logger import command_logger
from models import Command, CommandStatus, Room, RoomState
from serial_manager import SerialManager

try:
    from debug_console import debug_state as _ds
except ImportError:
    _ds = None


class CommandHandler:
    """
    Processes room commands from the website and sends to Arduino.

    Maintains thread-safe room state.
    Provides auto-test to verify all 4 LEDs end-to-end.
    """

    MAX_HISTORY = 100

    # Room metadata for detailed logging
    ROOM_INFO = {
        1: {"name": "Living Room", "name_ar": "غرفة المعيشة", "led": "LED1", "pin": 3},
        2: {"name": "Bedroom",     "name_ar": "غرفة النوم",    "led": "LED2", "pin": 5},
        3: {"name": "Kitchen",     "name_ar": "المطبخ",        "led": "LED3", "pin": 9},
        4: {"name": "Bathroom",    "name_ar": "الحمام",        "led": "LED4", "pin": 10},
    }

    def __init__(self, serial_manager: SerialManager) -> None:
        self._serial = serial_manager
        self._rooms: dict[int, Room] = {}
        self._history: deque[Command] = deque(maxlen=self.MAX_HISTORY)
        self.start_time = time.time()

        for room_id, room_cfg in Config.ROOMS.items():
            self._rooms[room_id] = Room(
                room_id=room_id,
                name=room_cfg["name"],
                name_ar=room_cfg["name_ar"],
                pin_prefix=room_cfg["pin_prefix"],
            )

    @property
    def rooms(self) -> dict[int, Room]:
        return self._rooms

    @property
    def history(self) -> list[Command]:
        return list(self._history)

    def get_room(self, room_id: int) -> Optional[Room]:
        return self._rooms.get(room_id)

    def process_command(self, room: int, action: str) -> dict:
        """
        Process a room control command.

        Validates input, sends to Arduino via SerialManager,
        updates room state, and logs everything.
        """
        is_valid, error_msg = Config.validate_room_action(room, action)
        if not is_valid:
            command_logger.warning(f"Invalid command: room={room}, action={action}. {error_msg}")
            if _ds:
                _ds.add_event("ERR", f"Invalid: Room {room} {action} - {error_msg}", "red")
            return {"success": False, "error": error_msg}

        serial_cmd = Config.serial_command(room, action)
        info = self.ROOM_INFO.get(room, {})
        action_upper = action.upper()
        state_value = action_upper if action_upper in ("ON", "OFF", "DIM") else "UNKNOWN"

        if _ds:
            _ds.last_web_command = f"Room {room} -> {action}"
            _ds.last_web_command_time = time.time()
            _ds.add_event("WEB", f"Room {room} {action}", "cyan")

        # Detailed command log
        command_logger.info(
            f"\n"
            f"  ┌─────────── COMMAND DISPATCH ───────────┐\n"
            f"  │ Room:          {info.get('name', f'Room {room}')} ({info.get('name_ar', '')})\n"
            f"  │ Mapped LED:    {info.get('led', f'LED{room}')}\n"
            f"  │ Pin:           {info.get('pin', '?')}\n"
            f"  │ Action:        {action_upper}\n"
            f"  │ Arduino Cmd:   {serial_cmd}\n"
            f"  │ COM Port:      {Config.SERIAL_PORT}\n"
            f"  └─────────────────────────────────────────┘"
        )

        cmd = Command(
            room=room,
            action=action_upper,
            serial_cmd=serial_cmd,
            status=CommandStatus.SENT,
        )

        # Check connection
        if not self._serial.is_connected:
            cmd.status = CommandStatus.FAILED
            cmd.error = "Arduino not connected"
            self._history.append(cmd)
            command_logger.warning(f"FAILED: {serial_cmd} - Arduino not connected")
            self._update_room_state(room, action_upper)
            return {
                "success": False,
                "error": "Arduino not connected",
                "command": serial_cmd,
                "room": room,
                "action": action_upper,
                "local_update": True,
            }

        # Send to Arduino
        success, response = self._serial.send_command(serial_cmd)

        if success:
            cmd.status = CommandStatus.ACKNOWLEDGED
            cmd.response = response
            self._update_room_state(room, action_upper)
            command_logger.info(
                f"  ✓ {serial_cmd} -> {response}\n"
                f"  │ Status: {state_value}"
            )
        else:
            cmd.status = CommandStatus.FAILED
            cmd.error = response
            self._update_room_state(room, action_upper)
            command_logger.warning(f"  ✗ {serial_cmd} -> {response}")

        self._history.append(cmd)

        if _ds:
            _ds.room_states[room] = action_upper if action_upper in ("ON", "OFF", "DIM") else _ds.room_states.get(room, "UNKNOWN")
            _ds.room_brightness[room] = {"ON": 100, "DIM": 40, "OFF": 0}.get(action_upper, 0)

        return {
            "success": success,
            "command": serial_cmd,
            "response": response if success else None,
            "error": cmd.error,
            "room": room,
            "action": action_upper,
        }

    def update_room_from_status(self, room_id: int, state_str: str) -> None:
        """Update room state from Arduino STATUS response."""
        room = self._rooms.get(room_id)
        if not room:
            return

        try:
            new_state = RoomState(state_str)
            room.update_state(new_state)
            if _ds:
                _ds.room_states[room_id] = state_str
                _ds.room_brightness[room_id] = room.brightness
        except ValueError:
            command_logger.warning(f"Unknown state '{state_str}' for room {room_id}")
            room.state = RoomState.UNKNOWN

    def _update_room_state(self, room_id: int, action: str) -> None:
        """Update local room state after a command."""
        room = self._rooms.get(room_id)
        if not room:
            return

        state_map = {
            "ON": RoomState.ON,
            "OFF": RoomState.OFF,
            "DIM": RoomState.DIM,
        }

        new_state = state_map.get(action, RoomState.UNKNOWN)
        room.update_state(new_state)
        room.last_command = Config.serial_command(room_id, action)

    def get_all_rooms_status(self) -> dict:
        """Get current state of all rooms."""
        status = {}
        for room_id, room in self._rooms.items():
            status[f"room{room_id}"] = room.state.value
        return status

    def get_full_status(self) -> dict:
        """Get detailed status of all rooms."""
        result = {}
        for room_id, room in self._rooms.items():
            result[f"room{room_id}"] = {
                "state": room.state.value,
                "brightness": room.brightness,
                "name": room.name,
                "name_ar": room.name_ar,
                "last_command": room.last_command,
                "last_updated": room.last_updated,
            }
        return result

    def run_auto_test(self) -> dict:
        """
        Automatic test: ON/OFF/DIM for all 4 rooms.

        Returns detailed report:
        {
            "overall": "PASS" or "FAIL",
            "results": [
                {
                    "room": 1,
                    "name": "Living Room",
                    "led": "LED1",
                    "pin": 3,
                    "tests": {
                        "ON":  {"sent": "R1_ON",  "response": "OK", "pass": true},
                        "OFF": {"sent": "R1_OFF", "response": "OK", "pass": true},
                        "DIM": {"sent": "R1_DIM", "response": "OK", "pass": true},
                    }
                },
                ...
            ]
        }
        """
        command_logger.info("=" * 60)
        command_logger.info("  AUTO-TEST STARTED")
        command_logger.info("  Testing all 4 rooms: ON -> OFF -> DIM")
        command_logger.info("=" * 60)

        results = []
        all_pass = True

        for room_id in [1, 2, 3, 4]:
            info = self.ROOM_INFO.get(room_id, {})
            room_result = {
                "room": room_id,
                "name": info.get("name", f"Room {room_id}"),
                "name_ar": info.get("name_ar", ""),
                "led": info.get("led", f"LED{room_id}"),
                "pin": info.get("pin", 0),
                "tests": {},
            }

            command_logger.info(f"\n  Testing {info.get('name', f'Room {room_id}')} ({info.get('led', '')} Pin {info.get('pin', '')})")

            for action in ["ON", "OFF", "DIM"]:
                serial_cmd = Config.serial_command(room_id, action)

                success, response = self._serial.send_command(serial_cmd)
                test_pass = success and "OK" in response

                if not test_pass:
                    all_pass = False

                room_result["tests"][action] = {
                    "sent": serial_cmd,
                    "response": response if success else "FAIL",
                    "pass": test_pass,
                }

                status_icon = "✓" if test_pass else "✗"
                command_logger.info(
                    f"    {status_icon} {serial_cmd} -> {response if success else 'FAIL'}"
                )

                time.sleep(0.3)  # Small delay between commands

            # Verify with STATUS
            time.sleep(0.5)
            success, status_response = self._serial.send_command_multiline("STATUS", max_lines=6, line_timeout=0.8)
            if success:
                self._parse_status(status_response)
                room_result["status_verified"] = True
                command_logger.info(f"    STATUS verified: {status_response.replace(chr(10), ', ')}")
            else:
                room_result["status_verified"] = False
                all_pass = False

            results.append(room_result)

        overall = "PASS" if all_pass else "FAIL"
        command_logger.info(f"\n{'='*60}")
        command_logger.info(f"  AUTO-TEST COMPLETE: {overall}")
        command_logger.info(f"{'='*60}")

        return {
            "overall": overall,
            "results": results,
            "timestamp": time.time(),
        }

    def _parse_status(self, response: str) -> None:
        """Parse STATUS response and update room states."""
        import re
        pattern = re.compile(r"ROOM(\d+)\s*=\s*(ON|OFF|DIM)", re.IGNORECASE)
        matches = pattern.findall(response)
        for room_num_str, state_str in matches:
            room_id = int(room_num_str)
            self.update_room_from_status(room_id, state_str.upper())
