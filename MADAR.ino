#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

int reading = 123;

void setup() {
  lcd.init();
  lcd.backlight();

  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("METER"); // عنوان ثابت (اختياري)
}

void loop() {
  reading++;

  lcd.setCursor(0, 1);  // سطر واحد ثابت

  // طباعة رقم 6 خانات ثابت بدون clear
  if (reading < 10) lcd.print("00000");
  else if (reading < 100) lcd.print("0000");
  else if (reading < 1000) lcd.print("000");
  else if (reading < 10000) lcd.print("00");
  else if (reading < 100000) lcd.print("0");

  lcd.print(reading);

  delay(1000);
}