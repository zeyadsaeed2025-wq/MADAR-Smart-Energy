"""
Data models for the control service.
Defines room state, command, and response structures.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class RoomState(Enum):
    """Possible states for a room's LED."""
    ON = "ON"
    OFF = "OFF"
    DIM = "DIM"
    UNKNOWN = "UNKNOWN"


class CommandStatus(Enum):
    """Status of a sent command."""
    PENDING = "pending"
    SENT = "sent"
    ACKNOWLEDGED = "acknowledged"
    FAILED = "failed"
    TIMEOUT = "timeout"


class ConnectionStatus(Enum):
    """Serial connection status."""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    RECONNECTING = "reconnecting"
    ERROR = "error"


@dataclass
class Room:
    """Represents a single room's LED state."""
    room_id: int
    name: str
    name_ar: str
    pin_prefix: str
    state: RoomState = RoomState.UNKNOWN
    brightness: int = 100
    last_updated: float = field(default_factory=time.time)
    last_command: Optional[str] = None

    def update_state(self, new_state: RoomState, brightness: Optional[int] = None) -> None:
        """Update room state and timestamp."""
        self.state = new_state
        if brightness is not None:
            self.brightness = brightness
        elif new_state == RoomState.ON:
            self.brightness = 100
        elif new_state == RoomState.DIM:
            self.brightness = 40
        elif new_state == RoomState.OFF:
            self.brightness = 0
        self.last_updated = time.time()

    def to_dict(self) -> dict:
        """Serialize to dictionary for API responses."""
        return {
            f"room{self.room_id}": self.state.value,
            f"room{self.room_id}_brightness": self.brightness,
            f"room{self.room_id}_name": self.name,
            f"room{self.room_id}_name_ar": self.name_ar,
            f"room{self.room_id}_last_updated": self.last_updated,
        }

    def to_compact(self) -> dict:
        """Minimal serialization for status endpoint."""
        return {
            f"room{self.room_id}": self.state.value,
            "brightness": self.brightness,
            "name": self.name,
            "name_ar": self.name_ar,
        }


@dataclass
class Command:
    """Represents a command to send to Arduino."""
    room: int
    action: str
    serial_cmd: str
    status: CommandStatus = CommandStatus.PENDING
    timestamp: float = field(default_factory=time.time)
    response: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "room": self.room,
            "action": self.action,
            "serial_cmd": self.serial_cmd,
            "status": self.status.value,
            "timestamp": self.timestamp,
            "response": self.response,
            "error": self.error,
        }


@dataclass
class ConnectionInfo:
    """Tracks serial connection state."""
    status: ConnectionStatus = ConnectionStatus.DISCONNECTED
    port: str = ""
    baud_rate: int = 9600
    connected_at: Optional[float] = None
    disconnected_at: Optional[float] = None
    reconnect_attempts: int = 0
    last_error: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "status": self.status.value,
            "port": self.port,
            "baud_rate": self.baud_rate,
            "connected_at": self.connected_at,
            "disconnected_at": self.disconnected_at,
            "reconnect_attempts": self.reconnect_attempts,
            "last_error": self.last_error,
        }


@dataclass
class ServiceStatus:
    """Overall service health status."""
    connection: ConnectionInfo
    rooms: dict[int, Room]
    commands_sent: int = 0
    commands_failed: int = 0
    uptime_start: float = field(default_factory=time.time)
    last_status_poll: Optional[float] = None

    @property
    def uptime(self) -> float:
        return time.time() - self.uptime_start

    def to_dict(self) -> dict:
        return {
            "connection": self.connection.to_dict(),
            "rooms": {f"room{k}": v.to_compact() for k, v in self.rooms.items()},
            "commands_sent": self.commands_sent,
            "commands_failed": self.commands_failed,
            "uptime_seconds": round(self.uptime, 1),
            "last_status_poll": self.last_status_poll,
        }
