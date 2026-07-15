# MADAR Arduino Control Service

Professional Python bridge between the MADAR Smart Energy web platform and Arduino UNO LED prototype.

## Architecture

```
Website (React)
    ↓  HTTP REST API
Python Control Service (Flask :5000)
    ↓  USB Serial (9600 baud)
Arduino UNO
    ↓  Digital Pins (PWM)
4x White LEDs (Room 1-4)
```

The website communicates ONLY with Python.
Python communicates ONLY with Arduino.
No direct website-to-Arduino communication.

## Project Structure

```
Python_Control_Service/
├── app.py                 # Main entry point, Flask server setup
├── routes.py              # REST API endpoint definitions
├── serial_manager.py      # USB serial connection with auto-reconnect
├── command_handler.py     # Command validation, dispatch, room state
├── status_monitor.py      # Background thread polling Arduino status
├── config.py              # All configuration (env vars supported)
├── models.py              # Data models (Room, Command, Connection)
├── logger.py              # Structured logging to console + file
├── requirements.txt       # Python dependencies
└── README.md              # This file
```

## Installation

```bash
# Python 3.11+ required
cd Python_Control_Service
pip install -r requirements.txt
```

## Usage

```bash
# Default: COM3, 9600 baud, port 5000
python app.py

# Custom port
python app.py --port COM5

# Custom baud rate and Flask port
python app.py --port COM3 --baud 9600 --flask-port 5000

# List available serial ports
python app.py --list-ports

# Debug mode
python app.py --debug
```

## Configuration

All settings can be overridden via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SERIAL_PORT` | `COM3` | Arduino serial port |
| `SERIAL_BAUD_RATE` | `9600` | Serial baud rate |
| `SERIAL_TIMEOUT` | `2.0` | Serial read timeout (seconds) |
| `SERIAL_RECONNECT_DELAY` | `3.0` | Delay between reconnect attempts |
| `STATUS_POLL_INTERVAL` | `1.0` | Status polling interval (seconds) |
| `FLASK_PORT` | `5000` | Flask server port |
| `FLASK_HOST` | `0.0.0.0` | Flask server host |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins |
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FILE` | `control_service.log` | Log file path |

## Arduino Wiring

```
Arduino UNO Digital Pins:
  Pin 9  (PWM) → Room 1 LED (Living Room)
  Pin 10 (PWM) → Room 2 LED (Bedroom)
  Pin 11 (PWM) → Room 3 LED (Kitchen)
  Pin 12 (PWM) → Room 4 LED (Bathroom)
  GND          → LED common ground (via resistors)
```

Use 220Ω resistors in series with each LED.

## Serial Protocol

Python sends commands as text lines terminated by `\n`:

| Command | Description |
|---------|-------------|
| `R1_ON` | Turn ON Room 1 LED (100% brightness) |
| `R1_OFF` | Turn OFF Room 1 LED |
| `R1_DIM` | Dim Room 1 LED (40% brightness via PWM) |
| `R2_ON` | Turn ON Room 2 LED |
| `R2_OFF` | Turn OFF Room 2 LED |
| `R2_DIM` | Dim Room 2 LED |
| `R3_ON` | Turn ON Room 3 LED |
| `R3_OFF` | Turn OFF Room 3 LED |
| `R3_DIM` | Dim Room 3 LED |
| `R4_ON` | Turn ON Room 4 LED |
| `R4_OFF` | Turn OFF Room 4 LED |
| `R4_DIM` | Dim Room 4 LED |
| `STATUS` | Request all room states |

Arduino responds with `OK\n` for commands, or multi-line status for STATUS:

```
ROOM1=ON
ROOM2=OFF
ROOM3=DIM
ROOM4=ON
```

## API Documentation

### GET /api/room-status

Returns current state of all rooms.

```json
{
  "success": true,
  "rooms": {
    "room1": "ON",
    "room2": "OFF",
    "room3": "DIM",
    "room4": "ON"
  },
  "connected": true,
  "timestamp": 1721000000.0
}
```

### POST /api/control-room

Send a command to control a room.

**Request:**
```json
{
  "room": 2,
  "action": "OFF"
}
```

**Response (success):**
```json
{
  "success": true,
  "command": "R2_OFF",
  "response": "OK",
  "room": 2,
  "action": "OFF"
}
```

**Response (failure):**
```json
{
  "success": false,
  "error": "Arduino not connected",
  "command": "R2_OFF",
  "room": 2,
  "action": "OFF",
  "local_update": true
}
```

### GET /api/rooms

Detailed room information.

### GET /api/connection

Serial connection status.

### GET /api/command-history?limit=20

Recent command history.

### GET /api/available-ports

List serial ports on the system.

### POST /api/reconnect

Force reconnection attempt.

### GET /api/health

Service health check.

## Error Handling

- **USB disconnected**: Automatic reconnection with configurable delay
- **Arduino restart**: Auto-reconnect after 2 second reset period
- **Timeout**: Configurable per-command timeout
- **Invalid commands**: Validated before sending, returns clear error
- **COM port busy**: Caught and logged, retries on reconnect
- **All errors logged** with timestamps to `control_service.log`

## Logging

Every event is logged with timestamps:

```
2026-07-14 12:00:00 | INFO     | app                  | MADAR Arduino Control Service Starting
2026-07-14 12:00:02 | INFO     | serial_manager       | Connected to Arduino on COM3 at 9600 baud
2026-07-14 12:00:02 | INFO     | status_monitor       | Status monitor started (interval: 1.0s)
2026-07-14 12:00:05 | INFO     | command_handler      | Executing: R2_OFF (Room 2, Action: OFF)
2026-07-14 12:00:05 | INFO     | command_handler      | Command R2_OFF acknowledged: OK
```

Log file rotates at 10MB with 5 backups.

## Website Integration

The website calls these endpoints every 2 seconds:

```javascript
// Control a room
fetch("http://localhost:5000/api/control-room", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ room: 2, action: "OFF" })
});

// Get room status
fetch("http://localhost:5000/api/room-status")
  .then(res => res.json())
  .then(data => console.log(data.rooms));
```

## Future Expansion

The architecture supports adding:
- Relay modules (replace LEDs with appliance control)
- Temperature/humidity sensors (DHT22)
- Current sensors (ACS712)
- Additional rooms (extend Config.ROOMS)
- MQTT integration
- WebSocket real-time updates
- Node.js integration via HTTP bridge to existing server
