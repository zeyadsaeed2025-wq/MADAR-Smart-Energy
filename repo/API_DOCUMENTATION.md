# API Documentation - MADAR Smart Energy Platform

Complete reference for all REST API endpoints.

**Base URLs:**
- Express Backend: `http://localhost:3001`
- Python Control Service: `http://localhost:5000`

---

## Express Backend Endpoints (Port 3001)

### Meter Readings

#### GET /api/latest

Returns the most recent meter reading.

**Response:**
```json
{
  "id": 42,
  "meter_value": 15420.5,
  "room": "R1",
  "created_at": "2025-07-10T14:30:00Z"
}
```

---

#### GET /api/readings

Returns paginated meter readings.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Max results to return |
| `offset` | number | 0 | Pagination offset |

**Response:**
```json
{
  "readings": [
    {
      "id": 41,
      "meter_value": 15418.2,
      "room": "R2",
      "created_at": "2025-07-10T13:00:00Z"
    }
  ],
  "total": 150
}
```

---

#### POST /api/reading

Submits a new meter reading (used by OCR reader).

**Request Body:**
```json
{
  "meter_value": 15420.5,
  "room": "R1"
}
```

**Response:**
```json
{
  "success": true,
  "id": 43,
  "message": "Reading saved successfully"
}
```

---

### OCR Status

#### GET /api/ocr/status

Returns the current OCR system status.

**Response:**
```json
{
  "status": "connected",
  "last_capture": "2025-07-10T14:25:00Z",
  "esp32_ip": "192.168.1.57",
  "ocr_engine": "tesseract"
}
```

---

#### POST /api/ocr/status

Updates OCR system status (internal use).

**Request Body:**
```json
{
  "status": "connected",
  "last_capture": "2025-07-10T14:25:00Z"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Energy Planning

#### GET /api/daily-plan

Returns the current daily energy consumption plan.

**Response:**
```json
{
  "plan": {
    "date": "2025-07-10",
    "budget_kwh": 25.0,
    "current_kwh": 12.5,
    "schedule": [
      {
        "room": "R1",
        "start": "06:00",
        "end": "08:00",
        "brightness": 100
      },
      {
        "room": "R2",
        "start": "20:00",
        "end": "23:00",
        "brightness": 80
      }
    ]
  }
}
```

---

#### GET /api/automation

Returns the current automation rules and status.

**Response:**
```json
{
  "automation": {
    "enabled": true,
    "rules": [
      {
        "id": 1,
        "name": "Night Mode",
        "trigger": "time:22:00",
        "action": "dim_all_50"
      }
    ],
    "last_triggered": "2025-07-10T22:00:00Z"
  }
}
```

---

#### GET /api/timeline

Returns the event timeline.

**Response:**
```json
{
  "timeline": [
    {
      "id": 1,
      "event": "R1_ON",
      "room": "R1",
      "timestamp": "2025-07-10T14:30:00Z",
      "source": "manual"
    },
    {
      "id": 2,
      "event": "METER_READ",
      "value": 15420.5,
      "timestamp": "2025-07-10T14:25:00Z",
      "source": "ocr"
    }
  ]
}
```

---

### Hardware Control

#### GET /api/hardware/health

Returns overall hardware health status.

**Response:**
```json
{
  "arduino": "connected",
  "esp32_cam": "connected",
  "serial_port": "COM3",
  "uptime": 3600
}
```

---

#### GET /api/hardware/room-status

Returns current state of all rooms.

**Response:**
```json
{
  "rooms": {
    "R1": { "state": "on", "brightness": 100, "pin": 3 },
    "R2": { "state": "dim", "brightness": 50, "pin": 5 },
    "R3": { "state": "off", "brightness": 0, "pin": 9 },
    "R4": { "state": "on", "brightness": 100, "pin": 10 }
  }
}
```

---

#### GET /api/hardware/rooms

Returns room definitions and metadata.

**Response:**
```json
{
  "rooms": [
    { "id": "R1", "name": "غرفة المعيشة", "name_en": "Living Room", "pin": 3 },
    { "id": "R2", "name": "غرفة النوم", "name_en": "Bedroom", "pin": 5 },
    { "id": "R3", "name": "المطبخ", "name_en": "Kitchen", "pin": 9 },
    { "id": "R4", "name": "الحمام", "name_en": "Bathroom", "pin": 10 }
  ]
}
```

---

#### GET /api/hardware/connection

Returns serial connection details.

**Response:**
```json
{
  "connected": true,
  "port": "COM3",
  "baud_rate": 9600,
  "last_command": "R1_ON",
  "last_response": "OK"
}
```

---

#### GET /api/hardware/history

Returns command history.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Max entries |

**Response:**
```json
{
  "history": [
    {
      "command": "R1_ON",
      "response": "OK",
      "timestamp": "2025-07-10T14:30:00Z"
    }
  ]
}
```

---

#### GET /api/hardware/ports

Lists available serial ports.

**Response:**
```json
{
  "ports": [
    { "path": "COM3", "manufacturer": "Arduino" },
    { "path": "COM5", "manufacturer": "Microsoft" }
  ]
}
```

---

#### POST /api/hardware/control-room

Sends a control command to a room.

**Request Body:**
```json
{
  "room": "R1",
  "action": "on"
}
```

**Actions:** `on`, `off`, `dim`

**Response:**
```json
{
  "success": true,
  "command": "R1_ON",
  "response": "OK"
}
```

---

#### POST /api/hardware/reconnect

Reconnects to the Arduino serial port.

**Response:**
```json
{
  "success": true,
  "port": "COM3",
  "message": "Reconnected successfully"
}
```

---

#### POST /api/hardware/auto-test

Runs an automated test on all rooms.

**Response:**
```json
{
  "results": {
    "R1": { "on": true, "off": true, "dim": true },
    "R2": { "on": true, "off": true, "dim": true },
    "R3": { "on": true, "off": true, "dim": true },
    "R4": { "on": true, "off": true, "dim": true }
  },
  "all_passed": true
}
```

---

### Admin

#### GET /api/admin/system-status

Returns full system status overview.

**Response:**
```json
{
  "services": {
    "express": "running",
    "flask": "running",
    "vite": "running"
  },
  "hardware": {
    "arduino": "connected",
    "esp32_cam": "connected"
  },
  "database": {
    "supabase": "connected",
    "last_query_ms": 45
  },
  "uptime": 86400,
  "memory_usage_mb": 128
}
```

---

## Python Control Service Endpoints (Port 5000)

### GET /

Health check for the Flask service.

**Response:**
```json
{
  "service": "MADAR Control Service",
  "status": "running",
  "port": "COM3"
}
```

### POST /command

Sends a raw command to Arduino via serial.

**Request Body:**
```json
{
  "command": "R1_ON"
}
```

**Response:**
```json
{
  "success": true,
  "command": "R1_ON",
  "response": "OK",
  "timestamp": "2025-07-10T14:30:00Z"
}
```

### GET /status

Returns all room statuses from Arduino.

**Response:**
```json
{
  "R1": { "state": "ON", "brightness": 255 },
  "R2": { "state": "OFF", "brightness": 0 },
  "R3": { "state": "DIM", "brightness": 128 },
  "R4": { "state": "OFF", "brightness": 0 }
}
```

### POST /control

Room control with parsed action.

**Request Body:**
```json
{
  "room": "R1",
  "action": "dim"
}
```

**Response:**
```json
{
  "success": true,
  "room": "R1",
  "action": "DIM",
  "response": "OK"
}
```

### GET /ports

Lists available serial ports.

**Response:**
```json
{
  "ports": ["COM3", "COM5"],
  "active": "COM3"
}
```

### POST /reconnect

Reconnects to Arduino serial port.

**Response:**
```json
{
  "success": true,
  "port": "COM3",
  "message": "Reconnected"
}
```

---

## Error Responses

All endpoints follow this error format:

```json
{
  "success": false,
  "error": "Error description",
  "code": 400
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad request / invalid parameters |
| 404 | Endpoint not found |
| 500 | Internal server error |
| 503 | Service unavailable (hardware disconnected) |
