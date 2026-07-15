import cv2
import numpy as np
import pytesseract
import requests
import time
import re
import sys

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

BACKEND_URL = "http://localhost:3001/api/reading"
OCR_STATUS_URL = "http://localhost:3001/api/ocr/status"
CAMERA_URL = "http://192.168.1.57/capture"
last_sent_value = None
camera_was_connected = False


def send_ocr_status(camera_connected, error=None):
    global camera_was_connected
    try:
        if camera_connected != camera_was_connected or error:
            payload = {"cameraConnected": camera_connected}
            if error:
                payload["error"] = error
            requests.post(OCR_STATUS_URL, json=payload, timeout=3)
            camera_was_connected = camera_connected
    except Exception:
        pass


def fetch_image(url, retries=3):
    for attempt in range(retries):
        try:
            resp = requests.get(url, timeout=8)
            resp.raise_for_status()
            arr = np.asarray(bytearray(resp.content), dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is not None:
                send_ocr_status(True)
                return img
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
    return None


def preprocess(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    return cleaned


def extract_numbers(img):
    results = []
    configs = [
        "--psm 7 -c tessedit_char_whitelist=0123456789.-",
        "--psm 8 -c tessedit_char_whitelist=0123456789.-",
        "--psm 6 -c tessedit_char_whitelist=0123456789.-",
    ]
    for config in configs:
        text = pytesseract.image_to_string(img, config=config)
        matches = re.findall(r"\d+\.?\d*", text)
        for m in matches:
            m = m.strip()
            if m and m not in results:
                results.append(m)

    if not results:
        inverted = cv2.bitwise_not(img)
        for config in configs:
            text = pytesseract.image_to_string(inverted, config=config)
            matches = re.findall(r"\d+\.?\d*", text)
            for m in matches:
                m = m.strip()
                if m and m not in results:
                    results.append(m)

    return results


def send_to_backend(value):
    global last_sent_value
    try:
        if value == last_sent_value:
            print(f"Skipping duplicate value: {value}")
            sys.stdout.flush()
            return False
        payload = {"value": value}
        resp = requests.post(BACKEND_URL, json=payload, timeout=5)
        if resp.status_code == 200:
            last_sent_value = value
            print(f"Sent to backend: {value}")
            sys.stdout.flush()
            return True
        else:
            print(f"Backend error: {resp.status_code}")
            sys.stdout.flush()
            return False
    except requests.exceptions.ConnectionError:
        print(f"Backend offline (skipped: {value})")
        sys.stdout.flush()
        return False
    except Exception as e:
        print(f"Failed to send: {e}")
        sys.stdout.flush()
        return False


def main():
    global camera_was_connected
    print("Starting OCR reader... (Ctrl+C to stop)")
    sys.stdout.flush()

    while True:
        img = fetch_image(CAMERA_URL)
        if img is None:
            print("No valid reading")
            send_ocr_status(False, error="Camera offline")
            sys.stdout.flush()
            time.sleep(3)
            continue

        processed = preprocess(img)
        values = extract_numbers(processed)

        if values:
            for v in values:
                print(f"Detected value: {v}")
                sys.stdout.flush()
                send_to_backend(v)
        else:
            print("No valid reading")

        time.sleep(3)


if __name__ == "__main__":
    main()
