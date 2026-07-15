@echo off
cd /d D:\desktop\MADAR\repo
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul
start "" cmd /c "cd /d D:\desktop\MADAR\repo & node server.js"
timeout /t 2 /nobreak >nul
start "" cmd /c "cd /d D:\desktop\MADAR\repo & npm run dev"
echo Both servers started!
