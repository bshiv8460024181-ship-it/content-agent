@echo off
cd /d C:\Users\Supreme\content-agent
set OWN_POSTS_LIMIT=300
echo ===== Crystra Diam Content Agent — Weekly Cycle =====
echo Pulling fresh Instagram data (this can take a few minutes)...
node scripts\fetch-data.js
if errorlevel 1 (
  echo Data pull failed — stopping before sending digest.
  exit /b 1
)
echo.
echo Sending Telegram digest...
node scripts\send-digest.js
echo.
echo Cycle complete.
