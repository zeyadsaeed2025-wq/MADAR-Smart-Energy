"""
Serial Manager - Persistent USB serial connection to Arduino UNO.

Fixes applied:
  1. Single persistent connection - never reopen unless reconnect
  2. Thread-safe with threading.Lock
  3. Input buffer cleared only before write (not between reads)
  4. Multiline read for STATUS responses (4 lines)
  5. Detailed debug logging for every command
  6. Graceful error handling - never crashes
"""
from __future__ import annotations

import threading
import time
from typing import Optional

import serial
import serial.tools.list_ports

from config import Config
from logger import serial_logger
from models import ConnectionInfo, ConnectionStatus

try:
    from debug_console import debug_state as _ds
except ImportError:
    _ds = None

# Room metadata for debug logging
ROOM_META = {
    1: {"name": "Living Room", "name_ar": "غرفة المعيشة", "led": "LED1", "pin": 3},
    2: {"name": "Bedroom",     "name_ar": "غرفة النوم",    "led": "LED2", "pin": 5},
    3: {"name": "Kitchen",     "name_ar": "المطبخ",        "led": "LED3", "pin": 9},
    4: {"name": "Bathroom",    "name_ar": "الحمام",        "led": "LED4", "pin": 10},
}


class SerialManager:
    """
    Manages a SINGLE persistent serial connection to Arduino UNO.

    Thread-safe. Never creates duplicate connections.
    All errors caught and logged - never crashes.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._serial: Optional[serial.Serial] = None
        self._connection_info = ConnectionInfo(
            port=Config.SERIAL_PORT,
            baud_rate=Config.SERIAL_BAUD_RATE,
        )
        self._running = False

    @property
    def is_connected(self) -> bool:
        with self._lock:
            return self._serial is not None and self._serial.is_open

    @property
    def connection_info(self) -> ConnectionInfo:
        return self._connection_info

    def list_available_ports(self) -> list[dict]:
        ports = []
        for port in serial.tools.list_ports.comports():
            ports.append({
                "port": port.device,
                "description": port.description,
                "hwid": port.hwid,
            })
        return ports

    def connect(self) -> bool:
        """Open ONE persistent serial connection. Wait for Arduino reset."""
        with self._lock:
            try:
                # Close any existing connection first
                if self._serial and self._serial.is_open:
                    self._serial.close()
                    self._serial = None

                self._serial = serial.Serial(
                    port=Config.SERIAL_PORT,
                    baudrate=Config.SERIAL_BAUD_RATE,
                    timeout=Config.SERIAL_TIMEOUT,
                    write_timeout=Config.SERIAL_TIMEOUT,
                )

                # Arduino resets on serial open - wait for bootloader + sketch
                time.sleep(3.0)

                # Flush any startup noise
                self._serial.reset_input_buffer()
                self._serial.reset_output_buffer()

                self._connection_info.status = ConnectionStatus.CONNECTED
                self._connection_info.connected_at = time.time()
                self._connection_info.disconnected_at = None
                self._connection_info.reconnect_attempts = 0
                self._connection_info.last_error = None

                serial_logger.info(
                    f"Connected to Arduino on {Config.SERIAL_PORT} "
                    f"at {Config.SERIAL_BAUD_RATE} baud"
                )
                if _ds:
                    _ds.connected = True
                    _ds.port = Config.SERIAL_PORT
                    _ds.baud_rate = Config.SERIAL_BAUD_RATE
                    _ds.connected_at = time.time()
                    _ds.last_error = None
                    _ds.add_event("SYS", f"Connected to Arduino on {Config.SERIAL_PORT}", "green")
                return True

            except serial.SerialException as e:
                self._connection_info.status = ConnectionStatus.DISCONNECTED
                self._connection_info.last_error = str(e)
                serial_logger.warning(f"Failed to connect to {Config.SERIAL_PORT}: {e}")
                if _ds:
                    _ds.connected = False
                    _ds.last_error = str(e)[:80]
                    _ds.add_event("ERR", f"Connection failed: {str(e)[:60]}", "red")
                return False

            except Exception as e:
                self._connection_info.status = ConnectionStatus.ERROR
                self._connection_info.last_error = str(e)
                serial_logger.error(f"Unexpected error during connection: {e}")
                if _ds:
                    _ds.connected = False
                    _ds.last_error = str(e)[:80]
                return False

    def disconnect(self) -> None:
        with self._lock:
            try:
                if self._serial and self._serial.is_open:
                    self._serial.close()
                    serial_logger.info("Serial connection closed")
            except Exception as e:
                serial_logger.warning(f"Error during disconnect: {e}")
            finally:
                self._serial = None
                self._connection_info.status = ConnectionStatus.DISCONNECTED
                self._connection_info.disconnected_at = time.time()
                if _ds:
                    _ds.connected = False
                    _ds.add_event("SYS", "Serial disconnected", "yellow")

    def send_command(self, command: str, timeout: Optional[float] = None) -> tuple[bool, str]:
        """
        Send a single command and read ONE line response.
        Used for ON/OFF/DIM commands which return a single "OK" or "ERR".

        Detailed debug log:
          Room: Living Room
          Mapped LED: LED1
          Arduino Command: R1_ON
          COM Port: COM3
          Arduino Response: OK
          Current Status: ON
        """
        if timeout is None:
            timeout = Config.COMMAND_TIMEOUT

        with self._lock:
            if not self._serial or not self._serial.is_open:
                serial_logger.warning(f"Cannot send command '{command}': not connected")
                return False, "NOT_CONNECTED"

            try:
                # Clear only output buffer before write; keep input clean
                self._serial.reset_output_buffer()

                # Send command with terminator
                cmd_bytes = (command + Config.COMMAND_TERMINATOR).encode("utf-8")
                t0 = time.time()
                self._serial.write(cmd_bytes)
                self._serial.flush()
                serial_logger.debug(f"TX: {command}")

                if _ds:
                    _ds.last_arduino_cmd = command
                    _ds.last_arduino_time = time.time()

                # Read single line response
                response = self._read_line(timeout=timeout)
                elapsed_ms = (time.time() - t0) * 1000

                if _ds:
                    _ds.last_arduino_response = response or "TIMEOUT"
                    _ds.record_latency(elapsed_ms)

                if response:
                    serial_logger.debug(f"RX: {response} ({elapsed_ms:.0f}ms)")
                    if _ds:
                        _ds.add_event(
                            "TX", f"{command} -> {response} ({elapsed_ms:.0f}ms)",
                            "green" if "OK" in response else "yellow"
                        )
                    # Detailed debug log for room commands
                    self._log_room_command(command, response)
                    return True, response
                else:
                    serial_logger.warning(f"TIMEOUT for '{command}' after {elapsed_ms:.0f}ms")
                    if _ds:
                        _ds.add_event("TX", f"{command} -> TIMEOUT ({elapsed_ms:.0f}ms)", "red")
                    return False, "TIMEOUT"

            except serial.SerialException as e:
                serial_logger.error(f"Serial error sending '{command}': {e}")
                self._connection_info.status = ConnectionStatus.DISCONNECTED
                self._connection_info.last_error = str(e)
                self._force_close()
                return False, f"SERIAL_ERROR: {e}"

            except Exception as e:
                serial_logger.error(f"Unexpected error sending '{command}': {e}")
                return False, f"ERROR: {e}"

    def send_command_multiline(self, command: str, max_lines: int = 10, line_timeout: float = 0.8) -> tuple[bool, str]:
        """
        Send command and read MULTIPLE lines until silence.
        Used for STATUS which returns 4 lines (ROOM1=ON, ROOM2=OFF, etc.)

        Reads lines until no data arrives within line_timeout.
        """
        with self._lock:
            if not self._serial or not self._serial.is_open:
                return False, "NOT_CONNECTED"

            try:
                # Clear output buffer before write
                self._serial.reset_output_buffer()

                cmd_bytes = (command + Config.COMMAND_TERMINATOR).encode("utf-8")
                t0 = time.time()
                self._serial.write(cmd_bytes)
                self._serial.flush()

                if _ds:
                    _ds.last_arduino_cmd = command
                    _ds.last_arduino_time = time.time()

                # Read multiple lines
                lines = []
                old_timeout = self._serial.timeout
                self._serial.timeout = line_timeout

                for _ in range(max_lines):
                    raw_line = self._serial.readline()
                    if raw_line:
                        decoded = raw_line.decode("utf-8", errors="replace").strip()
                        if decoded:
                            lines.append(decoded)
                    else:
                        # No more data within timeout
                        break

                self._serial.timeout = old_timeout
                elapsed_ms = (time.time() - t0) * 1000

                full_response = "\n".join(lines) if lines else ""

                if _ds:
                    _ds.last_arduino_response = full_response or "TIMEOUT"
                    _ds.record_latency(elapsed_ms)

                if lines:
                    serial_logger.debug(f"Multiline TX: {command} -> {len(lines)} lines ({elapsed_ms:.0f}ms)")
                    for line in lines:
                        serial_logger.debug(f"  -> {line}")
                    if _ds:
                        _ds.add_event("TX", f"{command} -> {len(lines)} lines ({elapsed_ms:.0f}ms)", "green")
                    return True, full_response
                else:
                    serial_logger.warning(f"Multiline TIMEOUT for '{command}' ({elapsed_ms:.0f}ms)")
                    if _ds:
                        _ds.add_event("TX", f"{command} -> TIMEOUT ({elapsed_ms:.0f}ms)", "red")
                    return False, "TIMEOUT"

            except serial.SerialException as e:
                serial_logger.error(f"Serial error in multiline '{command}': {e}")
                self._connection_info.status = ConnectionStatus.DISCONNECTED
                self._connection_info.last_error = str(e)
                self._force_close()
                return False, f"SERIAL_ERROR: {e}"

            except Exception as e:
                serial_logger.error(f"Unexpected error in multiline '{command}': {e}")
                return False, f"ERROR: {e}"

    def _read_line(self, timeout: Optional[float] = None) -> Optional[str]:
        """Internal single-line reader. Called while lock is held."""
        if not self._serial or not self._serial.is_open:
            return None

        try:
            old_timeout = self._serial.timeout
            if timeout is not None:
                self._serial.timeout = timeout

            line = self._serial.readline()

            if timeout is not None:
                self._serial.timeout = old_timeout

            if line:
                decoded = line.decode("utf-8", errors="replace").strip()
                return decoded if decoded else None
            return None

        except serial.SerialException:
            raise
        except Exception:
            return None

    def read_line(self, timeout: Optional[float] = None) -> Optional[str]:
        """Thread-safe single line read."""
        with self._lock:
            return self._read_line(timeout)

    def flush_buffers(self) -> None:
        with self._lock:
            if self._serial and self._serial.is_open:
                try:
                    self._serial.reset_input_buffer()
                    self._serial.reset_output_buffer()
                except Exception as e:
                    serial_logger.warning(f"Error flushing buffers: {e}")

    def reconnect(self) -> bool:
        """Disconnect, wait, reconnect. Thread-safe."""
        serial_logger.info("Attempting reconnection...")
        self._connection_info.status = ConnectionStatus.RECONNECTING
        self._connection_info.reconnect_attempts += 1

        if _ds:
            _ds.reconnect_attempts = self._connection_info.reconnect_attempts
            _ds.last_reconnect = time.time()
            _ds.connected = False
            _ds.add_event("SYS", f"Reconnect attempt #{self._connection_info.reconnect_attempts}", "yellow")

        self.disconnect()
        time.sleep(Config.SERIAL_RECONNECT_DELAY)
        result = self.connect()
        if _ds and result:
            _ds.add_event("SYS", "Reconnected successfully", "green")
        return result

    def health_check(self) -> bool:
        with self._lock:
            if not self._serial or not self._serial.is_open:
                return False
            try:
                return self._serial.is_open
            except Exception:
                return False

    def _force_close(self) -> None:
        """Force close the serial port on error. Called while lock is held."""
        try:
            if self._serial:
                self._serial.close()
        except Exception:
            pass
        self._serial = None
        self._connection_info.status = ConnectionStatus.DISCONNECTED
        self._connection_info.disconnected_at = time.time()
        if _ds:
            _ds.connected = False
            _ds.add_event("ERR", "Serial port force-closed after error", "red")
        serial_logger.warning("Serial port force-closed")

    def _log_room_command(self, command: str, response: str) -> None:
        """
        Detailed debug log for room commands.

        Format:
          Room: Living Room
          Mapped LED: LED1
          Arduino Command: R1_ON
          COM Port: COM3
          Arduino Response: OK
          Current Status: ON
        """
        if not command.startswith("R"):
            return

        try:
            parts = command.split("_")
            if len(parts) != 2:
                return

            room_num = int(parts[0][1])
            action = parts[1]

            meta = ROOM_META.get(room_num)
            if not meta:
                return

            status = "ON" if action == "ON" else ("OFF" if action == "OFF" else "DIM")

            serial_logger.info(
                f"\n"
                f"  {'='*44}\n"
                f"  Room:          {meta['name']} ({meta['name_ar']})\n"
                f"  Mapped LED:    {meta['led']}\n"
                f"  Arduino Cmd:   {command}\n"
                f"  COM Port:      {Config.SERIAL_PORT}\n"
                f"  Arduino Resp:  {response}\n"
                f"  Current State: {status}\n"
                f"  {'='*44}"
            )
        except (ValueError, IndexError):
            pass
