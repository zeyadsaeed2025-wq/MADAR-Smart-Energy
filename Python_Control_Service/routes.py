"""
Flask Routes - REST API for the control service.

Endpoints:
    GET  /api/room-status       - Get all room states
    POST /api/control-room      - Control a room (ON/OFF/DIM)
    GET  /api/connection        - Get serial connection status
    GET  /api/rooms             - Get detailed room info
    GET  /api/command-history   - Get recent command history
    GET  /api/available-ports   - List available serial ports
    POST /api/reconnect         - Force reconnection attempt
    GET  /api/health            - Service health check
"""
from __future__ import annotations

import time

from flask import Blueprint, jsonify, request

from logger import routes_logger
from command_handler import CommandHandler
from serial_manager import SerialManager
from status_monitor import StatusMonitor


def create_routes(
    serial_manager: SerialManager,
    command_handler: CommandHandler,
    status_monitor: StatusMonitor,
) -> Blueprint:
    """
    Create and configure all API routes.

    Args:
        serial_manager: Serial connection manager.
        command_handler: Command processor.
        status_monitor: Background status poller.

    Returns:
        Flask Blueprint with all routes registered.
    """
    api = Blueprint("api", __name__, url_prefix="/api")

    # ------------------------------------------------------------------
    # GET /api/room-status
    # ------------------------------------------------------------------
    @api.route("/room-status", methods=["GET"])
    def get_room_status():
        """Return current state of all rooms from Arduino."""
        status = command_handler.get_all_rooms_status()
        return jsonify({
            "success": True,
            "rooms": status,
            "connected": serial_manager.is_connected,
            "timestamp": time.time(),
        })

    # ------------------------------------------------------------------
    # POST /api/control-room
    # ------------------------------------------------------------------
    @api.route("/control-room", methods=["POST"])
    def control_room():
        """
        Send a command to control a room's LED.

        Request body:
            { "room": 2, "action": "OFF" }

        Supported actions: ON, OFF, DIM
        Supported rooms: 1, 2, 3, 4
        """
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "error": "Request body must be JSON"}), 400

        room = data.get("room")
        action = data.get("action", "").upper() if data.get("action") else ""

        if room is None:
            return jsonify({"success": False, "error": "Missing 'room' field"}), 400

        if not action:
            return jsonify({"success": False, "error": "Missing 'action' field"}), 400

        try:
            room = int(room)
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": "'room' must be an integer"}), 400

        routes_logger.info(f"API request: control room {room} -> {action}")
        result = command_handler.process_command(room, action)

        status_code = 200 if result.get("success") else 503
        return jsonify(result), status_code

    # ------------------------------------------------------------------
    # GET /api/rooms
    # ------------------------------------------------------------------
    @api.route("/rooms", methods=["GET"])
    def get_rooms():
        """Return detailed information about all rooms."""
        rooms = command_handler.get_full_status()
        return jsonify({
            "success": True,
            "rooms": rooms,
            "connected": serial_manager.is_connected,
        })

    # ------------------------------------------------------------------
    # GET /api/connection
    # ------------------------------------------------------------------
    @api.route("/connection", methods=["GET"])
    def get_connection():
        """Return serial connection status."""
        return jsonify({
            "success": True,
            "connection": serial_manager.connection_info.to_dict(),
        })

    # ------------------------------------------------------------------
    # GET /api/command-history
    # ------------------------------------------------------------------
    @api.route("/command-history", methods=["GET"])
    def get_command_history():
        """Return recent command history."""
        limit = request.args.get("limit", 20, type=int)
        history = command_handler.history[-limit:]
        return jsonify({
            "success": True,
            "commands": [cmd.to_dict() for cmd in history],
            "total": len(command_handler.history),
        })

    # ------------------------------------------------------------------
    # GET /api/available-ports
    # ------------------------------------------------------------------
    @api.route("/available-ports", methods=["GET"])
    def get_available_ports():
        """List all serial ports detected on the system."""
        ports = serial_manager.list_available_ports()
        return jsonify({
            "success": True,
            "ports": ports,
            "current_port": serial_manager.connection_info.port,
        })

    # ------------------------------------------------------------------
    # POST /api/reconnect
    # ------------------------------------------------------------------
    @api.route("/reconnect", methods=["POST"])
    def reconnect():
        """Force a reconnection attempt to Arduino."""
        routes_logger.info("Manual reconnection requested")
        success = serial_manager.reconnect()

        if success:
            status_monitor.start()
            return jsonify({"success": True, "message": "Reconnected successfully"})
        else:
            return jsonify({"success": False, "message": "Reconnection failed"}), 503

    # ------------------------------------------------------------------
    # GET /api/health
    # ------------------------------------------------------------------
    @api.route("/health", methods=["GET"])
    def health():
        """Service health check endpoint."""
        return jsonify({
            "status": "healthy" if serial_manager.is_connected else "degraded",
            "connected": serial_manager.is_connected,
            "monitor_running": status_monitor.is_running,
            "uptime": round(time.time() - command_handler.start_time, 1),
            "timestamp": time.time(),
        })

    # ------------------------------------------------------------------
    # POST /api/auto-test
    # ------------------------------------------------------------------
    @api.route("/auto-test", methods=["POST"])
    def auto_test():
        """
        Run automatic test of all 4 rooms: ON -> OFF -> DIM.

        Returns detailed pass/fail report for each room.
        This tests the complete flow: Python -> COM3 -> Arduino -> LED -> Response -> Python.
        """
        if not serial_manager.is_connected:
            return jsonify({
                "success": False,
                "error": "Arduino not connected. Cannot run auto-test.",
            }), 503

        routes_logger.info("Auto-test requested")
        report = command_handler.run_auto_test()
        report["connected"] = True
        report["port"] = serial_manager.connection_info.port

        return jsonify({
            "success": report["overall"] == "PASS",
            "report": report,
        })

    # ------------------------------------------------------------------
    # Error handlers
    # ------------------------------------------------------------------
    @api.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @api.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "error": "Method not allowed"}), 405

    @api.errorhandler(500)
    def internal_error(e):
        routes_logger.error(f"Internal server error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return api
