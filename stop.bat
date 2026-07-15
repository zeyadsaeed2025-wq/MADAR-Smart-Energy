@echo off
echo ==========================================
echo   MADAR - Stopping All Services
echo ==========================================
echo.

echo Killing Python Control Service...
taskkill /FI "WindowTitle eq MADAR-Python*" /T /F >nul 2>&1

echo Killing OCR Reader...
taskkill /FI "WindowTitle eq MADAR-OCR*" /T /F >nul 2>&1

echo Killing Express Backend...
taskkill /FI "WindowTitle eq MADAR-Express*" /T /F >nul 2>&1

echo Killing Website Dev Server...
taskkill /FI "WindowTitle eq MADAR-Website*" /T /F >nul 2>&1

:: Also kill any orphan processes on our ports
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001.*LISTENING" 2^>nul') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5000.*LISTENING" 2^>nul') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173.*LISTENING" 2^>nul') do taskkill /PID %%p /F >nul 2>&1

timeout /t 2 /nobreak >nul
echo.
echo All services stopped.
echo.
pause
