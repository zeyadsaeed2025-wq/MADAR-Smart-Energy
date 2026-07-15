"""
Logging configuration for the control service.
Provides structured, timestamped logging to both console and file.
"""
import logging
import logging.handlers
import sys
from pathlib import Path

from config import Config


def setup_logger(name: str = "control_service") -> logging.Logger:
    """
    Create and configure a logger with console and rotating file handlers.

    Args:
        name: Logger name, typically the module name.

    Returns:
        Configured logging.Logger instance.
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO))

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Rotating file handler
    try:
        log_path = Path(Config.LOG_FILE)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.handlers.RotatingFileHandler(
            filename=str(log_path),
            maxBytes=Config.LOG_MAX_BYTES,
            backupCount=Config.LOG_BACKUP_COUNT,
            encoding="utf-8",
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except (OSError, PermissionError) as e:
        logger.warning(f"Could not create log file '{Config.LOG_FILE}': {e}. Console logging only.")

    return logger


# Module-level loggers for each component
app_logger = setup_logger("app")
serial_logger = setup_logger("serial_manager")
command_logger = setup_logger("command_handler")
status_logger = setup_logger("status_monitor")
routes_logger = setup_logger("routes")
