# Project Structure - MADAR Smart Energy Platform

Detailed breakdown of every file and directory.

---

## Root: `D:\desktop\MADAR\`

```
MADAR/
├── .env.example                  # Environment variables template
├── start.bat                     # Launches all services (Vite + Express + Flask)
├── stop.bat                      # Stops all running services
├── MADAR.ino                     # Original Arduino sketch (LCD counter, legacy)
│
├── repo/                         # Website + Express backend
│   ├── package.json              # Node.js dependencies and scripts
│   ├── server.js                 # Express backend server (port 3001)
│   ├── ocr_reader.py             # OCR script - reads ESP32-CAM meter images
│   ├── vercel.json               # Vercel deployment config (optional)
│   │
│   ├── src/                      # React frontend source
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Root App component
│   │   ├── index.css             # Global styles, RTL config, neon theme
│   │   ├── vite-env.d.ts         # Vite type declarations
│   │   │
│   │   ├── app/                  # Application layer
│   │   │   ├── routes.tsx        # React Router configuration
│   │   │   │
│   │   │   ├── pages/            # Page-level components
│   │   │   │   ├── Dashboard.tsx        # Main dashboard (meter, rooms, charts)
│   │   │   │   └── AdminSimulation.tsx  # Admin panel (system status, simulation)
│   │   │   │
│   │   │   └── components/       # Reusable UI components
│   │   │       ├── GlassCard.tsx        # Glassmorphism card container
│   │   │       ├── StatusIndicator.tsx  # Connection/device status display
│   │   │       ├── RoomControl.tsx      # Individual room on/off/dim control
│   │   │       ├── MeterDisplay.tsx     # Electricity meter value display
│   │   │       ├── ConsumptionChart.tsx # Energy consumption Recharts graph
│   │   │       ├── DailyPlan.tsx        # Daily energy plan widget
│   │   │       ├── Timeline.tsx         # Event timeline display
│   │   │       ├── Header.tsx           # Top navigation bar (Arabic title)
│   │   │       └── Sidebar.tsx          # Navigation sidebar
│   │   │
│   │   ├── lib/                  # Utility and service modules
│   │   │   ├── supabase.ts       # Supabase client configuration
│   │   │   ├── api.ts            # Express API client functions
│   │   │   └── types.ts          # TypeScript type definitions
│   │   │
│   │   └── hooks/                # Custom React hooks
│   │       ├── useRoomControl.ts # Room control state and API calls
│   │       └── useMeterReading.ts # Meter reading polling/hooks
│   │
│   ├── public/                   # Static assets
│   │   └── favicon.svg           # MADAR logo/icon
│   │
│   ├── index.html                # HTML entry point
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS config
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vite.config.ts            # Vite configuration
│   └── package.json              # Frontend dependencies
│
├── Python_Control_Service/       # Python Flask bridge (port 5000)
│   ├── app.py                    # Flask application entry point, routes
│   ├── config.py                 # Configuration (serial port, baud rate)
│   ├── serial_manager.py         # Serial port management (open/close/read/write)
│   ├── command_handler.py        # Parse and dispatch Arduino commands
│   ├── status_monitor.py         # Poll Arduino for room status
│   ├── routes.py                 # Flask API route definitions
│   ├── models.py                 # Data models (Room, Command, Status)
│   ├── logger.py                 # Logging configuration
│   ├── debug_console.py          # Interactive debug console for testing
│   └── requirements.txt          # Python dependencies
│
├── LED_Controller/               # Arduino UNO firmware
│   └── LED_Controller.ino        # Main sketch (serial commands, PWM, LCD, 4 rooms)
│
├── repo/README.md                # This file (project overview)
├── repo/INSTALL.md               # Installation guide
├── repo/DEPLOYMENT.md            # Deployment guide
├── repo/ARDUINO_SETUP.md         # Hardware setup guide
├── repo/API_DOCUMENTATION.md     # API reference
├── repo/PROJECT_STRUCTURE.md     # This file
├── repo/CHANGELOG.md             # Version history
└── repo/LICENSE                  # MIT License
```

---

## File Descriptions

### Root Files

| File | Purpose |
|------|---------|
| `start.bat` | One-click launcher for all three services (Vite, Express, Flask) |
| `stop.bat` | Kills all running service processes |
| `MADAR.ino` | Legacy Arduino sketch — LCD counter only, replaced by LED_Controller |
| `.env.example` | Template for environment variables |

### `repo/` — Website & Backend

| File | Purpose |
|------|---------|
| `server.js` | Express server handling all `/api/*` routes, Supabase integration, OCR proxy |
| `ocr_reader.py` | Connects to ESP32-CAM, captures meter image, runs OCR, posts result to Express |
| `package.json` | Node.js dependencies, scripts (`dev`, `build`, `start`) |

### `repo/src/app/pages/` — Pages

| File | Description |
|------|-------------|
| `Dashboard.tsx` | Main page: meter reading, 4 room controls, consumption chart, daily plan, timeline |
| `AdminSimulation.tsx` | Admin page: system health, hardware test, manual simulation, serial monitor |

### `repo/src/app/components/` — UI Components

| Component | Description |
|-----------|-------------|
| `GlassCard.tsx` | Reusable glassmorphism card with blur backdrop and neon border |
| `StatusIndicator.tsx` | Shows connection status (Arduino, ESP32, Supabase) with colored dots |
| `RoomControl.tsx` | Room control card with ON/OFF/DIM buttons, brightness slider |
| `MeterDisplay.tsx` | Displays latest electricity meter reading with animation |
| `ConsumptionChart.tsx` | Recharts line/bar chart for energy consumption over time |
| `DailyPlan.tsx` | Daily energy budget and schedule display |
| `Timeline.tsx` | Scrollable event log showing recent actions and readings |
| `Header.tsx` | Top bar with Arabic title "مادر - منصة إدارة الطاقة" |
| `Sidebar.tsx` | Navigation menu (Dashboard, Admin) |

### `repo/src/lib/` — Utilities

| File | Purpose |
|------|---------|
| `supabase.ts` | Initializes Supabase client with env credentials |
| `api.ts` | Fetch wrapper for all Express API calls |
| `types.ts` | TypeScript interfaces: Room, Reading, Plan, Timeline, etc. |

### `repo/src/hooks/` — React Hooks

| Hook | Purpose |
|------|---------|
| `useRoomControl.ts` | Manages room state, sends control commands, polls status |
| `useMeterReading.ts` | Fetches latest reading, handles polling/refresh |

### `Python_Control_Service/` — Python Bridge

| File | Purpose |
|------|---------|
| `app.py` | Flask application entry point, initializes serial manager |
| `config.py` | Configuration constants (COM3, 9600 baud, timeout) |
| `serial_manager.py` | Opens/closes serial port, send/receive bytes to Arduino |
| `command_handler.py` | Validates commands (R1_ON, etc.), sends to serial, logs result |
| `status_monitor.py` | Periodically sends STATUS command, updates room state cache |
| `routes.py` | Flask route definitions (maps to Express API expectations) |
| `models.py` | Data classes for Room, Command, SerialResponse |
| `logger.py` | Configures file and console logging with rotation |
| `debug_console.py` | CLI tool for manual serial testing without the web interface |
| `requirements.txt` | Flask, Flask-CORS, pyserial, requests |

### `LED_Controller/` — Arduino Firmware

| File | Purpose |
|------|---------|
| `LED_Controller.ino` | Main sketch: reads serial commands, sets PWM on pins 3/5/9/10, drives LCD 16x2 I2C, responds with OK/STATUS |

---

## Data Flow

```
┌──────────┐    HTTP     ┌──────────┐    Serial    ┌──────────┐
│  React   │ ─────────→  │ Express  │              │          │
│ Dashboard│ ←─────────  │ Backend  │              │          │
└──────────┘             └──────────┘              │          │
                           │      │                 │          │
                           │      │    HTTP         │ Arduino  │
                           │      └──────────────→ │ UNO      │
                           │      Flask Bridge     │          │
                           │                       └──────────┘
                           │ HTTP
                           ▼
                      ┌──────────┐
                      │ Supabase │
                      │   DB     │
                      └──────────┘
```
