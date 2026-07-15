"""
Main Application Entry Point.

Initializes all components and starts the Flask server:
    SerialManager -> CommandHandler -> StatusMonitor -> Flask App

Usage:
    python app.py
    python app.py --port COM5
    python app.py --port COM3 --baud 9600 --flask-port 5000
"""
from __future__ import annotations

import argparse
import signal
import sys
import time

from flask import Flask
from flask_cors import CORS

from config import Config
from logger import app_logger
from serial_manager import SerialManager
from command_handler import CommandHandler
from status_monitor import StatusMonitor
from routes import create_routes


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="MADAR Arduino Control Service",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python app.py                          Use defaults (COM3, 9600, port 5000)
    python app.py --port COM5              Use COM5
    python app.py --port COM3 --baud 115200
    python app.py --flask-port 8080        Run on port 8080
        """,
    )
    parser.add_argument("--port", default=Config.SERIAL_PORT, help=f"Serial port (default: {Config.SERIAL_PORT})")
    parser.add_argument("--baud", type=int, default=Config.SERIAL_BAUD_RATE, help=f"Baud rate (default: {Config.SERIAL_BAUD_RATE})")
    parser.add_argument("--flask-port", type=int, default=Config.FLASK_PORT, help=f"Flask port (default: {Config.FLASK_PORT})")
    parser.add_argument("--flask-host", default=Config.FLASK_HOST, help=f"Flask host (default: {Config.FLASK_HOST})")
    parser.add_argument("--debug", action="store_true", default=Config.FLASK_DEBUG, help="Enable debug mode")
    parser.add_argument("--list-ports", action="store_true", help="List available serial ports and exit")
    parser.add_argument("--console", action="store_true", help="Show debug console alongside Flask server")
    parser.add_argument("--console-only", action="store_true", help="Show debug console only (no Flask server)")
    return parser.parse_args()


def main() -> None:
    """Main entry point."""
    args = parse_args()

    # Override config with CLI args
    Config.SERIAL_PORT = args.port
    Config.SERIAL_BAUD_RATE = args.baud
    Config.FLASK_PORT = args.flask_port
    Config.FLASK_HOST = args.flask_host
    Config.FLASK_DEBUG = args.debug

    app_logger.info("=" * 60)
    app_logger.info("MADAR Arduino Control Service Starting")
    app_logger.info("=" * 60)
    app_logger.info(f"Serial Port: {Config.SERIAL_PORT}")
    app_logger.info(f"Baud Rate: {Config.SERIAL_BAUD_RATE}")
    app_logger.info(f"Flask: {Config.FLASK_HOST}:{Config.FLASK_PORT}")
    app_logger.info(f"Status Poll Interval: {Config.STATUS_POLL_INTERVAL}s")

    # --- List ports mode ---
    if args.list_ports:
        sm = SerialManager()
        ports = sm.list_available_ports()
        if ports:
            print("\nAvailable serial ports:")
            for p in ports:
                print(f"  {p['port']} - {p['description']}")
        else:
            print("\nNo serial ports detected.")
        return

    # --- Initialize components ---
    serial_mgr = SerialManager()
    cmd_handler = CommandHandler(serial_mgr)
    status_mon = StatusMonitor(serial_mgr, cmd_handler)

    # --- Try connecting to Arduino ---
    app_logger.info("Attempting to connect to Arduino...")
    connected = serial_mgr.connect()

    if connected:
        app_logger.info("Arduino connected successfully")
        status_mon.start()
    else:
        app_logger.warning(
            "Arduino not found. Service will run in offline mode. "
            "Use POST /api/reconnect to try connecting later."
        )

    # --- Create Flask app ---
    flask_app = Flask(__name__)
    CORS(flask_app, origins=Config.CORS_ORIGINS)

    api_blueprint = create_routes(serial_mgr, cmd_handler, status_mon)
    flask_app.register_blueprint(api_blueprint)

    # Root route
    @flask_app.route("/")
    def index():
        return {
            "service": "MADAR Arduino Control Service",
            "version": "1.0.0",
            "status": "running",
            "connected": serial_mgr.is_connected,
            "port": Config.SERIAL_PORT,
            "endpoints": {
                "room_status": "/api/room-status",
                "control_room": "/api/control-room",
                "rooms": "/api/rooms",
                "connection": "/api/connection",
                "command_history": "/api/command-history",
                "available_ports": "/api/available-ports",
                "reconnect": "/api/reconnect",
                "health": "/api/health",
            },
        }

    # --- Graceful shutdown ---
    def shutdown_handler(signum, frame):
        app_logger.info("Shutdown signal received. Cleaning up...")
        status_mon.stop()
        serial_mgr.disconnect()
        app_logger.info("Service stopped cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    # --- Start Flask ---
    app_logger.info(f"Starting Flask server on {Config.FLASK_HOST}:{Config.FLASK_PORT}")
    app_logger.info("=" * 60)

    # --- Start Debug Console if requested ---
    console_stop = None
    if args.console or args.console_only:
        try:
            from debug_console import start_debug_console, debug_state
            debug_state.port = Config.SERIAL_PORT
            debug_state.baud_rate = Config.SERIAL_BAUD_RATE
            debug_state.connected = serial_mgr.is_connected
            debug_state.monitor_running = status_mon.is_running
            console_stop = start_debug_console()
            app_logger.info("Debug console started")
        except ImportError:
            app_logger.warning("rich library not installed. Install with: pip install rich")

    if args.console_only:
        # Run without Flask — console only
        app_logger.info("Running in console-only mode (no Flask server)")
        try:
            signal.pause() if hasattr(signal, "pause") else input("Press Enter to stop...\n")
        except (KeyboardInterrupt, EOFError):
            pass
        finally:
            if console_stop:
                console_stop.set()
            status_mon.stop()
            serial_mgr.disconnect()
            app_logger.info("Service stopped.")
        return

    try:
        flask_app.run(
            host=Config.FLASK_HOST,
            port=Config.FLASK_PORT,
            debug=Config.FLASK_DEBUG,
            use_reloader=False,
        )
    except KeyboardInterrupt:
        pass
    finally:
        if console_stop:
            console_stop.set()
        status_mon.stop()
        serial_mgr.disconnect()
        app_logger.info("Service stopped.")


if __name__ == "__main__":
    main()
