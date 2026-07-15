"""
Configuration module for Python Control Service.
All settings are centralized here and can be overridden via environment variables.
"""
import os


class Config:
    """Central configuration for the control service."""

    # Serial Communication
    SERIAL_PORT: str = os.getenv("SERIAL_PORT", "COM3")
    SERIAL_BAUD_RATE: int = int(os.getenv("SERIAL_BAUD_RATE", "9600"))
    SERIAL_TIMEOUT: float = float(os.getenv("SERIAL_TIMEOUT", "2.0"))
    SERIAL_RECONNECT_DELAY: float = float(os.getenv("SERIAL_RECONNECT_DELAY", "3.0"))
    SERIAL_MAX_RECONNECT_ATTEMPTS: int = int(os.getenv("SERIAL_MAX_RECONNECT_ATTEMPTS", "0"))

    # Status Monitor
    STATUS_POLL_INTERVAL: float = float(os.getenv("STATUS_POLL_INTERVAL", "1.0"))
    STATUS_RESPONSE_TIMEOUT: float = float(os.getenv("STATUS_RESPONSE_TIMEOUT", "3.0"))
    STATUS_PARSE_TIMEOUT: float = float(os.getenv("STATUS_PARSE_TIMEOUT", "5.0"))

    # Flask Server
    FLASK_HOST: str = os.getenv("FLASK_HOST", "0.0.0.0")
    FLASK_PORT: int = int(os.getenv("FLASK_PORT", "5000"))
    FLASK_DEBUG: bool = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # CORS - allowed origins for website integration
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

    # Command Protocol
    COMMAND_TERMINATOR: str = "\n"
    RESPONSE_TERMINATOR: str = "\n"
    COMMAND_TIMEOUT: float = float(os.getenv("COMMAND_TIMEOUT", "3.0"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "control_service.log")
    LOG_MAX_BYTES: int = int(os.getenv("LOG_MAX_BYTES", str(10 * 1024 * 1024)))
    LOG_BACKUP_COUNT: int = int(os.getenv("LOG_BACKUP_COUNT", "5"))

    # Room Definitions (PIN MAPPING - DO NOT CHANGE)
    #   R1 (Living Room) -> Pin 3
    #   R2 (Bedroom)     -> Pin 5
    #   R3 (Kitchen)     -> Pin 9
    #   R4 (Bathroom)    -> Pin 10
    ROOMS = {
        1: {"name": "Living Room", "name_ar": "غرفة المعيشة", "pin_prefix": "R1", "pin": 3},
        2: {"name": "Bedroom",     "name_ar": "غرفة النوم",    "pin_prefix": "R2", "pin": 5},
        3: {"name": "Kitchen",     "name_ar": "المطبخ",        "pin_prefix": "R3", "pin": 9},
        4: {"name": "Bathroom",    "name_ar": "الحمام",        "pin_prefix": "R4", "pin": 10},
    }

    VALID_ACTIONS = ["ON", "OFF", "DIM"]
    VALID_ROOMS = [1, 2, 3, 4]

    @classmethod
    def serial_command(cls, room: int, action: str) -> str:
        """Build Arduino serial command string. Example: R2_OFF"""
        return f"R{room}_{action}"

    @classmethod
    def validate_room_action(cls, room: int, action: str) -> tuple[bool, str]:
        """Validate room number and action. Returns (is_valid, error_message)."""
        if room not in cls.VALID_ROOMS:
            return False, f"Invalid room {room}. Must be one of {cls.VALID_ROOMS}"
        if action not in cls.VALID_ACTIONS:
            return False, f"Invalid action '{action}'. Must be one of {cls.VALID_ACTIONS}"
        return True, ""
