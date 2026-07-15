# Installation Guide - MADAR Smart Energy Platform

Step-by-step installation for the MADAR project. Follow each section in order.

---

## Prerequisites

Install the following before starting:

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.12 | https://python.org |
| Arduino IDE | 2.x | https://arduino.cc |
| Git | Latest | https://git-scm.com |
| Supabase Account | — | https://supabase.com |

Verify installations:

```bash
node --version      # Should show v18+
python --version    # Should show Python 3.12
git --version       # Any recent version
```

## Step 1: Clone the Repository

```bash
git clone https://github.com/zeyad-saeed/MADAR.git
cd MADAR
```

## Step 2: Install Frontend & Express Backend

```bash
cd repo
npm install
```

This installs React, Vite, Express, and all frontend dependencies.

## Step 3: Install Python Dependencies

```bash
cd ../Python_Control_Service
pip install -r requirements.txt
```

Key packages: Flask, Flask-CORS, PySerial, requests.

## Step 4: Set Up Supabase

1. Create a free project at https://supabase.com
2. Go to **SQL Editor** and create the required tables:

```sql
CREATE TABLE meter_readings (
  id SERIAL PRIMARY KEY,
  meter_value NUMERIC NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_status (
  room_id TEXT PRIMARY KEY,
  state TEXT DEFAULT 'off',
  brightness INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_plan (
  id SERIAL PRIMARY KEY,
  schedule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automation_log (
  id SERIAL PRIMARY KEY,
  action TEXT,
  room_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Go to **Settings → API** and copy:
   - **Project URL**
   - **Anon (public) key**
   - **Service role key**

## Step 5: Configure Environment Variables

```bash
cd ../
cp .env.example .env
```

Open `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SERIAL_PORT=COM3
BAUD_RATE=9600
EXPRESS_PORT=3001
FLASK_PORT=5000
ESP32_CAM_IP=192.168.1.57
```

## Step 6: Connect Hardware

### Arduino UNO
1. Connect Arduino UNO via USB cable
2. Note the COM port (check Device Manager for COM3)
3. Wire LEDs per [ARDUINO_SETUP.md](./ARDUINO_SETUP.md)

### ESP32-CAM
1. Flash the ESP32-CAM with camera web server firmware
2. Connect to WiFi network
3. Note the IP address (default: 192.168.1.57)
4. Test: open `http://192.168.1.57/capture` in browser

### Wiring Summary
```
Arduino Pin 3  → LED Room 1 (Living Room) + 220Ω resistor → GND
Arduino Pin 5  → LED Room 2 (Bedroom)     + 220Ω resistor → GND
Arduino Pin 9  → LED Room 3 (Kitchen)     + 220Ω resistor → GND
Arduino Pin 10 → LED Room 4 (Bathroom)    + 220Ω resistor → GND
LCD SDA → A4, LCD SCL → A5
```

## Step 7: Upload Arduino Sketch

```bash
# Using Arduino IDE:
# 1. Open LED_Controller/LED_Controller.ino
# 2. Select Board → Arduino UNO
# 3. Select Port → COM3
# 4. Click Upload

# OR using arduino-cli:
D:\desktop\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe compile --fqbn arduino:avr:uno LED_Controller/LED_Controller.ino
D:\desktop\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe upload -p COM3 --fqbn arduino:avr:uno LED_Controller/LED_Controller.ino
```

## Step 8: Start the Platform

### Option A: Start All Services (Recommended)

From the project root:

```bash
start.bat
```

This launches:
- Vite dev server (port 5173)
- Express backend (port 3001)
- Python Flask service (port 5000)

### Option B: Start Services Individually

```bash
# Terminal 1 — Frontend
cd repo
npm run dev

# Terminal 2 — Express Backend
cd repo
node server.js

# Terminal 3 — Python Control Service
cd Python_Control_Service
python app.py
```

## Step 9: Verify Installation

1. Open **http://localhost:5173** — Dashboard should load
2. Check **http://localhost:3001/api/hardware/health** — Should return JSON status
3. Check **http://localhost:5000/** — Flask service health endpoint
4. If ESP32-CAM is online: **http://localhost:3001/api/ocr/status** should show connected

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Arduino Not Detected
- Check Device Manager for correct COM port
- Ensure USB cable supports data (not charge-only)
- Try different USB port
- Press Arduino reset button

### ESP32-CAM Not Responding
- Ensure ESP32-CAM and computer are on the same WiFi network
- Ping: `ping 192.168.1.57`
- Power cycle the ESP32-CAM

### Python Serial Error
- Close other serial monitors (Arduino IDE Serial Monitor, PuTTY)
- Verify COM port in `config.py` or `.env`
- Ensure `pyserial` is installed: `pip install pyserial`

### Supabase Connection Error
- Verify URL and keys in `.env`
- Check Supabase project is not paused (free tier)
- Ensure tables are created via SQL Editor
