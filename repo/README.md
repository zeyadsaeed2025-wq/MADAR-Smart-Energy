# MADAR - منصة إدارة الطاقة الذكية

# Smart Energy Management Platform

<div align="center">

**Version 1.0.0** | **July 2025**

A Smart Energy IoT Dashboard built as a graduation project, featuring an Arabic (RTL) UI with a dark futuristic/neon aesthetic. Uses ESP32-CAM OCR to read electricity meters and Arduino UNO to control 4 LED rooms via a Python Control Service.

</div>

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (RTL)                           │
│                   React 18 + Vite (5173)                       │
│              Dashboard · Admin · Dark Neon UI                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                     EXPRESS BACKEND (3001)                      │
│              API · Reading Storage · OCR Proxy                  │
│                    Supabase Database                            │
└───────┬──────────────┬───────────────────────┬──────────────────┘
        │              │                       │
        ▼              ▼                       ▼
┌──────────────┐ ┌──────────────────┐ ┌─────────────────────────┐
│  OCR Reader  │ │  Python Flask    │ │       Supabase          │
│  (ESP32-CAM) │ │  Control (5000)  │ │    (PostgreSQL)         │
│              │ │                  │ └─────────────────────────┘
│  ESP32-CAM   │ │  Serial Manager  │
│  192.168.1.57│ │  COM3 @ 9600     │
│  /capture    │ └────────┬─────────┘
│  /ocr        │          │ Serial
└──────────────┘          ▼
                  ┌──────────────────┐
                  │  Arduino UNO     │
                  │  LED_Controller  │
                  │                  │
                  │  R1 → Pin 3  💡  │
                  │  R2 → Pin 5  💡  │
                  │  R3 → Pin 9  💡  │
                  │  R4 → Pin 10 💡  │
                  │  LCD 16x2 I2C    │
                  └──────────────────┘
```

## Features

- **Meter OCR Reading** — ESP32-CAM captures electricity meter images, OCR extracts consumption data
- **Room LED Control** — 4 individually controllable rooms (Living, Bedroom, Kitchen, Bathroom)
- **Dimming Support** — PWM-based brightness control per room
- **Daily Energy Plan** — Automated scheduling and consumption tracking
- **Real-time Dashboard** — Live hardware status, consumption charts, and timeline
- **Admin Simulation** — System administration and manual override panel
- **RTL Arabic UI** — Full right-to-left Arabic interface with dark neon aesthetic
- **Glassmorphism Design** — Futuristic card-based UI with blur effects and neon accents
- **Hardware Health Monitoring** — Serial connection status, port detection, auto-reconnect

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Recharts |
| Backend | Express.js (Node.js) |
| Database | Supabase (PostgreSQL) |
| Python Bridge | Flask, PySerial |
| Microcontroller | Arduino UNO (C++), ESP32-CAM |
| OCR | Tesseract / ESP32-CAM built-in OCR |

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/zeyad-saeed/MADAR.git
cd MADAR

# 2. Install dependencies
cd repo && npm install
cd ../Python_Control_Service && pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase keys

# 4. Upload Arduino sketch
# Open LED_Controller/LED_Controller.ino in Arduino IDE
# Select board: Arduino UNO, Port: COM3, Upload

# 5. Connect hardware
# ESP32-CAM on WiFi at 192.168.1.57
# Arduino UNO via USB (COM3)

# 6. Start all services
start.bat
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Express API**: http://localhost:3001
- **Python Control**: http://localhost:5000

## Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for the detailed breakdown.

```
MADAR/
├── repo/                      # Website + Express backend
│   ├── src/app/pages/         # Dashboard, Admin pages
│   ├── src/app/components/    # UI components
│   ├── server.js              # Express backend (3001)
│   └── ocr_reader.py          # OCR script (ESP32-CAM)
├── Python_Control_Service/    # Python Flask bridge (5000)
├── LED_Controller/            # Arduino UNO sketch
├── MADAR.ino                  # Original Arduino sketch (LCD counter)
├── start.bat                  # Launch all services
├── stop.bat                   # Stop all services
└── .env.example               # Environment template
```

## Documentation

| Document | Description |
|----------|-------------|
| [INSTALL.md](./INSTALL.md) | Step-by-step installation guide |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide (Vercel + manual) |
| [ARDUINO_SETUP.md](./ARDUINO_SETUP.md) | Hardware wiring and Arduino setup |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API reference |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Detailed folder structure |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [LICENSE](./LICENSE) | MIT License |

## Author

**Zeyad Saeed** — 2025 Graduation Project

## License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) for details.
