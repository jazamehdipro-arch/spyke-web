@echo off
cd /d "%~dp0game"
git pull
npx expo start --tunnel
pause
