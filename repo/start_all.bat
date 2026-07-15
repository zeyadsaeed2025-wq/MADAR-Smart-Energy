@echo off
echo Starting Madar Electric IoT System...
echo.

echo [1/3] Starting Backend Server...
start "Madar Backend" cmd /k "node server.js"
timeout /t 3 >nul

echo [2/3] Starting Frontend Dashboard...
start "Madar Frontend" cmd /k "npx vite --port 5173"
timeout /t 5 >nul

echo [3/3] Testing Backend API...
curl -s -X POST http://localhost:3001/api/reading -H "Content-Type: application/json" -d "{\"value\":\"4523\"}"
echo.
echo.

echo ========================================
echo   System Running!
echo   Dashboard: http://localhost:5173
echo   Backend:   http://localhost:3001
echo ========================================
echo.
echo To start OCR reader: python ocr_reader.py
pause
