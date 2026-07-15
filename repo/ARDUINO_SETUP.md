# Arduino Hardware Setup - MADAR Platform

Hardware wiring guide for the MADAR Smart Energy Management system.

---

## Components Required

| Component | Quantity | Notes |
|-----------|----------|-------|
| Arduino UNO | 1 | Original or clone |
| LED (any color) | 4 | One per room |
| 220Ω Resistor | 4 | One per LED |
| LCD 16x2 I2C | 1 | I2C backpack (SDA/SCL) |
| Breadboard | 1 | Standard size |
| Jumper wires | ~20 | Male-to-male |
| USB Cable | 1 | Type A to B |
| ESP32-CAM | 1 | Pre-flashed with camera firmware |

---

## Pin Mapping

| Room | LED | Arduino Pin | PWM Capable |
|------|-----|-------------|-------------|
| R1 - غرفة المعيشة (Living Room) | LED 1 | Pin 3 | Yes (Timer2) |
| R2 - غرفة النوم (Bedroom) | LED 2 | Pin 5 | Yes (Timer0) |
| R3 - المطبخ (Kitchen) | LED 3 | Pin 9 | Yes (Timer1) |
| R4 - الحمام (Bathroom) | LED 4 | Pin 10 | Yes (Timer1) |

> **Note**: All four pins support PWM (analogWrite), enabling dimming control.

---

## Wiring Diagram

```
Arduino UNO
┌─────────────────────────┐
│                         │
│  5V ────────────────────┤──→ LCD VCC
│  GND ───────────────────┤──→ LCD GND
│  A4 (SDA) ──────────────┤──→ LCD SDA
│  A5 (SCL) ──────────────┤──→ LCD SCL
│                         │
│  Pin 3 ──[220Ω]──LED1──┤──→ GND  (R1 Living)
│  Pin 5 ──[220Ω]──LED2──┤──→ GND  (R2 Bedroom)
│  Pin 9 ──[220Ω]──LED3──┤──→ GND  (R3 Kitchen)
│  Pin 10──[220Ω]──LED4──┤──→ GND  (R4 Bathroom)
│                         │
│  USB ───────────────────┤──→ Computer (COM3)
│                         │
└─────────────────────────┘
```

### Detailed LED Circuit (per room)

```
Arduino Pin 3  ──── [220Ω Resistor] ──── [LED Anode (+)]
                                          [LED Cathode (-)] ──── GND
```

### LCD I2C Wiring

```
LCD I2C Header    Arduino UNO
─────────────     ───────────
VCC          →    5V
GND          →    GND
SDA          →    A4
SCL          →    A5
```

---

## Step-by-Step Setup

### 1. Prepare the Breadboard

1. Place the Arduino UNO next to the breadboard
2. Connect the 5V rail and GND rail on the breadboard to Arduino 5V and GND

### 2. Wire the LEDs

For each room (repeat 4 times):

1. Insert LED into breadboard (long leg = anode = positive)
2. Connect Arduino pin to the anode (long leg) via 220Ω resistor
3. Connect cathode (short leg) to GND rail

**Resistor color code**: Red-Red-Brown-Gold = 220Ω ±5%

### 3. Wire the LCD

1. Connect LCD I2C module to breadboard
2. Wire VCC → 5V, GND → GND, SDA → A4, SCL → A5
3. If the display is blank, adjust the contrast potentiometer on the I2C backpack

### 4. Connect Arduino to Computer

1. Plug USB cable from Arduino to computer
2. Open Arduino IDE
3. Go to **Tools → Board → Arduino UNO**
4. Go to **Tools → Port → COM3** (check Device Manager)

### 5. Upload the Sketch

**Using Arduino IDE:**
1. Open `LED_Controller/LED_Controller.ino`
2. Click **Upload** (→ arrow button)
3. Wait for "Done uploading" message

**Using arduino-cli:**

```bash
D:\desktop\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe compile --fqbn arduino:avr:uno LED_Controller/LED_Controller.ino
D:\desktop\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe upload -p COM3 --fqbn arduino:avr:uno LED_Controller/LED_Controller.ino
```

### 6. Test the LEDs

Open Serial Monitor (Tools → Serial Monitor, baud 9600) and type:

```
R1_ON
```

LED 1 should turn on. Try all commands:

```
R1_ON       → R1 turns on (full brightness)
R1_DIM      → R1 dims to 50%
R1_OFF      → R1 turns off
STATUS      → Returns current state of all rooms
```

---

## Arduino Commands Reference

| Command | Action |
|---------|--------|
| `R1_ON` | Turn on Room 1 (Living) at full brightness |
| `R1_OFF` | Turn off Room 1 |
| `R1_DIM` | Dim Room 1 to 50% brightness |
| `R2_ON` | Turn on Room 2 (Bedroom) |
| `R2_OFF` | Turn off Room 2 |
| `R2_DIM` | Dim Room 2 to 50% |
| `R3_ON` | Turn on Room 3 (Kitchen) |
| `R3_OFF` | Turn off Room 3 |
| `R3_DIM` | Dim Room 3 to 50% |
| `R4_ON` | Turn on Room 4 (Bathroom) |
| `R4_OFF` | Turn off Room 4 |
| `R4_DIM` | Dim Room 4 to 50% |
| `STATUS` | Query all room states |

---

## ESP32-CAM Setup

### Flashing the Camera Firmware

1. Download the ESP32-CAM example from Arduino IDE:
   - **Examples → ESP32 → Camera → CameraWebServer**
2. Select board: **AI Thinker ESP32-CAM**
3. Set camera model: `#define CAMERA_MODEL_AI_THINKER`
4. Upload via FTDI adapter (GPIO0 → GND during flash)

### Connecting to WiFi

1. In the sketch, set your WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
2. Upload and open Serial Monitor (115200 baud)
3. Note the assigned IP address
4. Update `ESP32_CAM_IP` in `.env` with this IP

### Testing

```
http://192.168.1.57/capture    → Returns JPEG image
http://192.168.1.57/           → Camera web interface
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| LED not lighting | Check polarity (long leg = anode). Check resistor value |
| LED very dim | Ensure using 220Ω, not 2.2kΩ or 22kΩ |
| LCD blank | Adjust I2C contrast pot. Check SDA/SCL not swapped |
| Arduino not detected | Try different USB cable (data, not charge). Check drivers |
| COM3 not showing | Install CH340 or FTDI driver. Check Device Manager |
| Upload fails | Close Serial Monitor before uploading. Press reset button |
| ESP32-CAM not found | Same WiFi network? Correct IP? Power cycle ESP32 |
| PWM flickering | Normal at low duty cycles. Use Timer-based PWM library |

---

## ESP32-CAM + OCR Workflow

```
1. Python ocr_reader.py sends HTTP request to ESP32-CAM
2. ESP32-CAM returns captured JPEG image
3. OCR script processes image (Tesseract or built-in)
4. Extracted meter value is POSTed to Express /api/reading
5. Express stores reading in Supabase
6. Dashboard displays updated consumption data
```
