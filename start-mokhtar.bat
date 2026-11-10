@echo off
rem Starts the Mokhtar Forms web app on this PC and opens it in the browser.
rem Double-click this file. Keep the black window open while the app is in use;
rem closing it stops the app.
setlocal
cd /d "%~dp0"
title Mokhtar Forms
if "%PORT%"=="" set PORT=3000

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

if not exist ".env.local" (
  echo The file .env.local is missing. Copy .env.example to .env.local and put the PostgreSQL password in it.
  pause
  exit /b 1
)

if not exist "node_modules\next" (
  echo Installing the app's packages ^(first run only, needs internet^)...
  call npm install
  if errorlevel 1 goto failed
)

if not exist ".next\BUILD_ID" (
  echo Building the app ^(first run only^)...
  call npm run build
  if errorlevel 1 goto failed
)

echo.
echo Mokhtar Forms is starting on http://localhost:%PORT%
echo From a phone on the same Wi-Fi, open the address shown as "Network" below.
echo.
rem Open the browser a few seconds after the server starts.
start "" /min cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:%PORT%"
call npx next start -H 0.0.0.0 -p %PORT%
goto :eof

:failed
echo.
echo Something went wrong. Read the messages above.
pause
exit /b 1
