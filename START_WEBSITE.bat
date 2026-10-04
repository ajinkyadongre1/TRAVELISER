@echo off
title Margify - Travel & Safety Network
echo ========================================================
echo   Launching Margify Web Platform (MMT / Goibibo Inspired)
echo   Localhost URL: http://localhost:8080/index.html
echo ========================================================
echo.
echo Opening browser...
start "" "http://localhost:8080/index.html"
echo.
echo Local server running on port 8080. Press Ctrl+C to stop.
python -m http.server 8080
pause
