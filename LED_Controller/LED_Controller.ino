/*
 * MADAR LED Controller v2.0
 *
 * Hardware: Arduino UNO + LCD 16x2 I2C + 4 PWM LEDs
 *
 * Pin Mapping (DO NOT CHANGE):
 *   Living Room (R1) -> Pin 3  (PWM)
 *   Bedroom     (R2) -> Pin 5  (PWM)
 *   Kitchen     (R3) -> Pin 9  (PWM)
 *   Bathroom    (R4) -> Pin 10 (PWM)
 *
 * Serial: 9600 baud, \n terminated commands
 *
 * Commands:
 *   R1_ON / R1_OFF / R1_DIM
 *   R2_ON / R2_OFF / R2_DIM
 *   R3_ON / R3_OFF / R3_DIM
 *   R4_ON / R4_OFF / R4_DIM
 *   STATUS   -> ROOM1=ON\nROOM2=OFF\nROOM3=DIM\nROOM4=ON
 *
 * Responses:
 *   OK   -> command executed successfully
 *   ERR  -> invalid command
 *
 * LCD shows current status on line 0 and last command on line 1.
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ============================================================
// PIN MAPPING - EXACT HARDWARE WIRING
// ============================================================
#define PIN_ROOM1  3    // Living Room LED
#define PIN_ROOM2  5    // Bedroom LED
#define PIN_ROOM3  9    // Kitchen LED
#define PIN_ROOM4  10   // Bathroom LED

// ============================================================
// BRIGHTNESS LEVELS
// ============================================================
#define BRIGHTNESS_ON   255
#define BRIGHTNESS_DIM  102   // ~40% of 255
#define BRIGHTNESS_OFF  0

// ============================================================
// ROOM STATE
// ============================================================
enum LedState { ST_ON, ST_OFF, ST_DIM };

struct Room {
  uint8_t pin;
  LedState state;
  int brightness;
  const char* name;
};

Room rooms[4] = {
  { PIN_ROOM1, ST_OFF, BRIGHTNESS_OFF, "Living" },
  { PIN_ROOM2, ST_OFF, BRIGHTNESS_OFF, "Bedroom" },
  { PIN_ROOM3, ST_OFF, BRIGHTNESS_OFF, "Kitchen" },
  { PIN_ROOM4, ST_OFF, BRIGHTNESS_OFF, "Bath" },
};

// ============================================================
// SERIAL INPUT BUFFER
// ============================================================
#define CMD_BUFFER_SIZE 32
char cmdBuffer[CMD_BUFFER_SIZE];
uint8_t cmdIndex = 0;

// ============================================================
// LCD (I2C address 0x27, 16 cols, 2 rows)
// ============================================================
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ============================================================
// SIMULATED ELECTRICITY METER
// ============================================================
float meterKwh = 1254.00;                    // Starting reading (kWh)
unsigned long lastMeterUpdate = 0;           // millis() timestamp
const unsigned long METER_INTERVAL = 1000;   // Update every 1 second

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(9600);

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MADAR LED v2.0");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");

  // Initialize all LED pins as OUTPUT, start OFF
  for (int i = 0; i < 4; i++) {
    pinMode(rooms[i].pin, OUTPUT);
    analogWrite(rooms[i].pin, BRIGHTNESS_OFF);
    rooms[i].state = ST_OFF;
    rooms[i].brightness = BRIGHTNESS_OFF;
  }

  // Startup message
  Serial.println("MADAR LED Controller v2.0");
  Serial.println("Pins: R1=3 R2=5 R3=9 R4=10");
  Serial.println("READY");

  // Startup message on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Energy Meter");
  lcd.setCursor(0, 1);
  lcd.print("kWh: ");
  lcd.print(meterKwh, 2);

  cmdIndex = 0;
  lastMeterUpdate = millis();
}

// ============================================================
// MAIN LOOP
// ============================================================
void loop() {
  // Handle serial commands
  while (Serial.available() > 0) {
    char c = Serial.read();

    if (c == '\n' || c == '\r') {
      if (cmdIndex > 0) {
        cmdBuffer[cmdIndex] = '\0';
        processCommand(cmdBuffer);
        cmdIndex = 0;
      }
    } else {
      if (cmdIndex < CMD_BUFFER_SIZE - 1) {
        cmdBuffer[cmdIndex++] = c;
      } else {
        cmdIndex = 0;
      }
    }
  }

  // Update LCD meter every 1 second (non-blocking)
  if (millis() - lastMeterUpdate >= METER_INTERVAL) {
    lastMeterUpdate += METER_INTERVAL;
    meterKwh += 0.01;
    updateLCD();
  }
}

// ============================================================
// COMMAND PROCESSOR
// ============================================================
void processCommand(const char* cmd) {
  // STATUS command
  if (strcmp(cmd, "STATUS") == 0) {
    sendStatus();
    return;
  }

  // Parse R{N}_{ACTION} format
  // Minimum valid command: "R1_ON" = 5 chars
  if (strlen(cmd) < 5 || cmd[0] != 'R') {
    Serial.println("ERR");
    return;
  }

  // Extract room number (1-4)
  int roomNum = cmd[1] - '1';
  if (roomNum < 0 || roomNum > 3) {
    Serial.println("ERR");
    return;
  }

  // Must have underscore at position 2
  if (cmd[2] != '_') {
    Serial.println("ERR");
    return;
  }

  // Extract action
  const char* action = cmd + 3;

  if (strcmp(action, "ON") == 0) {
    rooms[roomNum].state = ST_ON;
    rooms[roomNum].brightness = BRIGHTNESS_ON;
    analogWrite(rooms[roomNum].pin, BRIGHTNESS_ON);
    Serial.println("OK");
  }
  else if (strcmp(action, "OFF") == 0) {
    rooms[roomNum].state = ST_OFF;
    rooms[roomNum].brightness = BRIGHTNESS_OFF;
    analogWrite(rooms[roomNum].pin, BRIGHTNESS_OFF);
    Serial.println("OK");
  }
  else if (strcmp(action, "DIM") == 0) {
    rooms[roomNum].state = ST_DIM;
    rooms[roomNum].brightness = BRIGHTNESS_DIM;
    analogWrite(rooms[roomNum].pin, BRIGHTNESS_DIM);
    Serial.println("OK");
  }
  else {
    Serial.println("ERR");
  }
}

// ============================================================
// STATUS RESPONSE - All 4 rooms on separate lines
// ============================================================
void sendStatus() {
  const char* stateNames[] = {"ON", "OFF", "DIM"};

  for (int i = 0; i < 4; i++) {
    Serial.print("ROOM");
    Serial.print(i + 1);
    Serial.print("=");
    Serial.println(stateNames[rooms[i].state]);
  }
}

// ============================================================
// LCD UPDATE - Simulated electricity meter
// ============================================================
void updateLCD() {
  // Line 0: Fixed header
  lcd.setCursor(0, 0);
  lcd.print("Energy Meter    ");

  // Line 1: kWh value
  lcd.setCursor(0, 1);
  lcd.print("kWh: ");
  lcd.print(meterKwh, 2);
  lcd.print("    ");  // Clear trailing chars
}
