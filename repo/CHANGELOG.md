# Changelog - MADAR Smart Energy Platform

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

---

## [1.0.0] - 2025-07-01

### Initial Release

First stable release of the MADAR Smart Energy Management Platform.

#### Added

**Frontend (React + Vite)**
- Arabic (RTL) dashboard with dark futuristic/neon aesthetic
- Glassmorphism UI components (GlassCard, StatusIndicator)
- Real-time meter reading display with animated counter
- 4-room LED control panel (ON / OFF / DIM per room)
- Brightness dimming with PWM percentage display
- Energy consumption charts using Recharts
- Daily energy plan viewer
- Event timeline with action history
- Admin simulation panel for system testing
- Responsive layout with Tailwind CSS

**Backend (Express.js)**
- REST API for meter readings (CRUD)
- Hardware control endpoints (room control, reconnect, auto-test)
- OCR status tracking and proxy
- Daily plan API
- Automation rules API
- System health and admin status endpoints
- Supabase PostgreSQL integration
- CORS configuration for development

**Python Control Service (Flask)**
- Serial port manager for Arduino UNO communication
- Command handler for room control (R1-R4 ON/OFF/DIM)
- Status monitor with periodic polling
- Debug console for manual testing
- Auto-reconnect on serial disconnect
- Configurable COM port and baud rate

**Arduino Firmware**
- LED_Controller sketch supporting 4 PWM rooms
- Pin mapping: R1=3, R2=5, R3=9, R4=10
- Serial command parser (13 commands + STATUS)
- LCD 16x2 I2C display with Arabic/English room names
- Brightness control via PWM (0-255)

**Hardware Integration**
- ESP32-CAM OCR for electricity meter reading
- Auto-capture and OCR processing pipeline
- Meter value extraction and storage

**Infrastructure**
- `start.bat` / `stop.bat` service management
- Environment variable configuration via `.env`
- Arduino CLI integration for sketch upload
- Vercel deployment support (frontend)

#### Hardware Support
- Arduino UNO (ATmega328P)
- ESP32-CAM (AI Thinker module)
- LCD 16x2 with I2C backpack
- 4x LEDs with 220Ω resistors
- Serial: COM3 @ 9600 baud

#### API Endpoints
- 20+ REST endpoints across Express and Flask services
- Full room control API (ON/OFF/DIM)
- Hardware health monitoring
- Serial port detection and management
- Command history and logging
