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
CAMERA_CONTROL = "http://192.168.1.57/control"
last_sent_value = None
camera_was_connected = False
camera_settings_sent = False


def send_ocr_status(camera_connected, error=None, value=None):
    global camera_was_connected
    try:
        if camera_connected != camera_was_connected or error or value:
            payload = {"cameraConnected": camera_connected}
            if error:
                payload["error"] = error
            if value:
                payload["lastReading"] = str(value)
            requests.post(OCR_STATUS_URL, json=payload, timeout=3)
            camera_was_connected = camera_connected
    except Exception:
        pass


def init_camera():
    global camera_settings_sent
    settings = [
        ("framesize", "8"),
        ("quality", "4"),
        ("brightness", "2"),
        ("contrast", "2"),
        ("sharpness", "2"),
        ("saturation", "0"),
        ("whiteb", "1"),
        ("awb_gain", "1"),
        ("aec", "1"),
        ("aec2", "1"),
        ("agc", "1"),
        ("bpc", "1"),
        ("wpc", "1"),
        ("lenc", "1"),
    ]
    for var, val in settings:
        try:
            requests.get(f"{CAMERA_CONTROL}?var={var}&val={val}", timeout=3)
        except Exception:
            pass
    camera_settings_sent = True
    print("Camera settings applied (VGA, brightness+2, contrast+2, sharpness+2)")
    sys.stdout.flush()


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
        except Exception:
            if attempt < retries - 1:
                time.sleep(1)
    return None


def preprocess(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    roi = gray[int(h * 0.50):int(h * 0.80), int(w * 0.05):int(w * 0.95)]

    gamma = 2.5
    lut = np.array([((i / 255.0) ** (1.0 / gamma)) * 255 for i in range(256)]).astype("uint8")
    brightened = cv2.LUT(roi, lut)

    inv = cv2.bitwise_not(brightened)

    clahe = cv2.createCLAHE(clipLimit=8.0, tileGridSize=(4, 4))
    enhanced = clahe.apply(inv)

    kernel_sharp = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
    sharp = cv2.filter2D(enhanced, -1, kernel_sharp)

    big = cv2.resize(sharp, (sharp.shape[1] * 4, sharp.shape[0] * 4), interpolation=cv2.INTER_CUBIC)

    variants = []

    _, bw_otsu = cv2.threshold(big, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants.append(bw_otsu)
    variants.append(cv2.bitwise_not(bw_otsu))

    adaptive = cv2.adaptiveThreshold(big, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 5)
    variants.append(adaptive)

    b, g, r = cv2.split(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    blue_roi = b[int(h * 0.50):int(h * 0.80), int(w * 0.05):int(w * 0.95)]
    inv_blue = cv2.bitwise_not(blue_roi)
    big_blue = cv2.resize(inv_blue, (inv_blue.shape[1] * 4, inv_blue.shape[0] * 4), interpolation=cv2.INTER_CUBIC)
    _, bw_blue = cv2.threshold(big_blue, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants.append(bw_blue)

    return variants


def extract_numbers(variants):
    results = []
    configs = [
        "--psm 6 -c tessedit_char_whitelist=0123456789.-",
        "--psm 7 -c tessedit_char_whitelist=0123456789.-",
        "--psm 11 -c tessedit_char_whitelist=0123456789.-",
    ]

    for variant in variants:
        for config in configs:
            try:
                text = pytesseract.image_to_string(variant, config=config)
                nums = re.findall(r"\d+\.?\d*", text)
                for m in nums:
                    m = m.strip()
                    if m and m not in results:
                        results.append(m)
            except Exception:
                pass
            if results:
                return results

    return results


def validate_number(value_str):
    try:
        v = float(value_str)
        if v <= 0 or v > 999999:
            return None
        return str(v)
    except ValueError:
        return None


def send_to_backend(value):
    global last_sent_value
    try:
        if value == last_sent_value:
            print(f"Skipping duplicate: {value}")
            sys.stdout.flush()
            return False
        payload = {"value": value}
        resp = requests.post(BACKEND_URL, json=payload, timeout=5)
        if resp.status_code == 200:
            last_sent_value = value
            print(f"Sent: {value}")
            sys.stdout.flush()
            send_ocr_status(True, value=value)
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
        print(f"Failed: {e}")
        sys.stdout.flush()
        return False


def main():
    global camera_was_connected
    print("Starting OCR reader... (Ctrl+C to stop)")
    sys.stdout.flush()

    if not camera_settings_sent:
        init_camera()
        time.sleep(2)

    while True:
        img = fetch_image(CAMERA_URL)
        if img is None:
            print("Camera offline")
            send_ocr_status(False, error="Camera offline")
            sys.stdout.flush()
            time.sleep(3)
            continue

        variants = preprocess(img)
        values = extract_numbers(variants)

        valid = []
        for v in values:
            validated = validate_number(v)
            if validated and validated not in valid:
                valid.append(validated)

        if valid:
            best = valid[0]
            print(f"Detected: {best} (candidates: {', '.join(valid[:5])})")
            sys.stdout.flush()
            send_to_backend(best)
        else:
            print(f"No valid reading (raw candidates: {', '.join(values[:5]) if values else 'none'})")
            sys.stdout.flush()

        time.sleep(3)


if __name__ == "__main__":
    main()
