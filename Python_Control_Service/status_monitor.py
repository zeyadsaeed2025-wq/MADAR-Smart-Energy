"""
Status Monitor - Background thread that polls Arduino for room states.

Responsibilities:
- Send STATUS command every N seconds
- Parse Arduino response (ROOM1=ON, ROOM2=OFF, etc.)
- Update room states in CommandHandler
- Handle connection loss gracefully
"""
from __future__ import annotations

import re
import threading
import time
from typing import Optional

from config import Config
from logger import status_logger
from command_handler import CommandHandler
from serial_manager import SerialManager

try:
    from debug_console import debug_state as _ds
except ImportError:
    _ds = None


class StatusMonitor:
    """
    Background thread that continuously polls Arduino for room status.

    Sends "STATUS" command at configured interval.
    Parses response and updates room states.
    """

    # Pattern: ROOM1=ON  or  room1=off  (case-insensitive)
    ROOM_PATTERN = re.compile(r"ROOM(\d+)\s*=\s*(ON|OFF|DIM)", re.IGNORECASE)

    def __init__(
        self,
        serial_manager: SerialManager,
        command_handler: CommandHandler,
        poll_interval: Optional[float] = None,
    ) -> None:
        self._serial = serial_manager
        self._handler = command_handler
        self._poll_interval = poll_interval or Config.STATUS_POLL_INTERVAL
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._last_poll_time: Optional[float] = None
        self._consecutive_failures = 0
        self._max_failures_before_reconnect = 5

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    @property
    def last_poll_time(self) -> Optional[float]:
        return self._last_poll_time

    def start(self) -> None:
        """Start the background polling thread."""
        if self.is_running:
            status_logger.warning("Status monitor already running")
            return

        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._poll_loop,
            name="StatusMonitor",
            daemon=True,
        )
        self._thread.start()
        status_logger.info(f"Status monitor started (interval: {self._poll_interval}s)")
        if _ds:
            _ds.monitor_running = True
            _ds.add_event("MON", "Status monitor started", "magenta")

    def stop(self) -> None:
        """Stop the background polling thread."""
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5.0)
            self._thread = None
        status_logger.info("Status monitor stopped")

    def _poll_loop(self) -> None:
        """Main polling loop running in background thread."""
        status_logger.info("Polling loop started")

        while not self._stop_event.is_set():
            try:
                self._poll_once()
            except Exception as e:
                status_logger.error(f"Unexpected error in poll loop: {e}")

            # Wait for next poll or stop signal
            self._stop_event.wait(timeout=self._poll_interval)

        status_logger.info("Polling loop exited")

    def _poll_once(self) -> None:
        """Execute a single status poll."""
        if not self._serial.is_connected:
            self._consecutive_failures += 1
            if _ds:
                _ds.status_poll_failures = self._consecutive_failures
            if self._consecutive_failures >= self._max_failures_before_reconnect:
                status_logger.warning(
                    f"Connection lost ({self._consecutive_failures} consecutive failures). "
                    "Attempting reconnect..."
                )
                self._try_reconnect()
            return

        try:
            # Send STATUS command and read all 4 lines
            success, response = self._serial.send_command_multiline(
                "STATUS",
                max_lines=6,
                line_timeout=0.8,
            )

            if success and response:
                self._parse_status_response(response)
                self._consecutive_failures = 0
                self._last_poll_time = time.time()
                if _ds:
                    _ds.last_status_poll = time.time()
                    _ds.status_poll_failures = 0
            else:
                self._consecutive_failures += 1
                if _ds:
                    _ds.status_poll_failures = self._consecutive_failures
                if self._consecutive_failures % 10 == 0:
                    status_logger.warning(
                        f"Status poll failed {self._consecutive_failures} times"
                    )

        except Exception as e:
            self._consecutive_failures += 1
            status_logger.error(f"Error during status poll: {e}")

    def _parse_status_response(self, response: str) -> None:
        """
        Parse Arduino status response.

        Expected format:
            ROOM1=ON
            ROOM2=OFF
            ROOM3=DIM
            ROOM4=ON

        Also handles single-line or multi-line responses.
        """
        matches = self.ROOM_PATTERN.findall(response)

        if not matches:
            # Try parsing as single line with semicolons
            for part in response.replace(";", "\n").split("\n"):
                part = part.strip()
                single_match = self.ROOM_PATTERN.findall(part)
                matches.extend(single_match)

        for room_num_str, state_str in matches:
            room_id = int(room_num_str)
            state_upper = state_str.upper()
            self._handler.update_room_from_status(room_id, state_upper)

        if matches:
            status_logger.debug(
                f"STATUS poll: {', '.join(f'R{k}={v}' for k, v in matches)}"
            )

    def _try_reconnect(self) -> None:
        """Attempt to reconnect serial connection."""
        try:
            self._serial.reconnect()
            self._consecutive_failures = 0
            status_logger.info("Reconnection successful")
        except Exception as e:
            status_logger.error(f"Reconnection failed: {e}")
