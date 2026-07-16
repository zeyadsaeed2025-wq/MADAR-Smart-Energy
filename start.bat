@echo off
echo ==========================================
echo   MADAR Smart Energy Platform - Startup
echo   (Local + Cloud via ngrok)
echo ==========================================
echo.

set PYTHON=C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe

:: Check Python
%PYTHON% --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found at %PYTHON%
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    pause
    exit /b 1
)

:: Kill any existing processes on our ports
echo [0/5] Cleaning up old processes...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001.*LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5000.*LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173.*LISTENING"') do taskkill /PID %%p /F >nul 2>&1
taskkill /FI "WindowTitle eq ngrok*" /T /F >nul 2>&1
timeout /t 2 /nobreak >nul

echo [1/5] Starting Python Control Service (COM3, port 5000)...
start "MADAR-Python" cmd /c "cd /d D:\desktop\MADAR\Python_Control_Service && "%PYTHON%" app.py --port COM3 --flask-port 5000"
timeout /t 3 /nobreak >nul

echo [2/5] Starting Express Backend (port 3001)...
start "MADAR-Express" cmd /c "cd /d D:\desktop\MADAR\repo && node server.js"
timeout /t 2 /nobreak >nul

echo [3/5] Starting Website Dev Server (port 5173)...
start "MADAR-Website" cmd /c "cd /d D:\desktop\MADAR\repo && npm run dev"
timeout /t 3 /nobreak >nul

echo [4/5] Starting OCR Reader...
start "MADAR-OCR" cmd /c "cd /d D:\desktop\MADAR\repo && "%PYTHON%" ocr_reader.py"
timeout /t 2 /nobreak >nul

echo [5/5] Starting ngrok tunnel (port 5000 -> cloud)...
start "MADAR-ngrok" cmd /c "ngrok http 5000"
timeout /t 5 /nobreak >nul

:: Get ngrok URL
for /f "tokens=*" %%u in ('curl -s http://localhost:4040/api/tunnels ^| findstr /o "https://.*ngrok"') do set NGROK_URL=%%u

echo.
echo ==========================================
echo   All services started!
echo.
echo   Website:    http://localhost:5173
echo   Admin:      http://localhost:5173/admin/simulation
echo   Backend:    http://localhost:3001
echo   Python HW:  http://localhost:5000
echo   OCR:        Running
echo   Cloud:      https://madar-smart-energy.vercel.app
echo   ngrok:      Check http://localhost:4040
echo.
echo   Pin Mapping:
echo     R1 Living Room - Pin 3
echo     R2 Bedroom     - Pin 5
echo     R3 Kitchen     - Pin 9
echo     R4 Bathroom    - Pin 10
echo ==========================================
echo.
echo Press any key to stop all services...
pause >nul

echo Stopping services...
taskkill /FI "WindowTitle eq MADAR-Python*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq MADAR-Express*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq MADAR-Website*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq MADAR-OCR*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq MADAR-ngrok*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq ngrok*" /T /F >nul 2>&1
echo All services stopped.
timeout /t 2 /nobreak >nul
