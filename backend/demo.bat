@echo off
echo ===================================================
echo     Orbitr MVP - Production Ready Verification
echo ===================================================

echo [1/3] Initializing Database...
python -m src.scripts.init_db

echo.
echo [2/3] Starting Backend (Background)...
echo starting...
start /B python -m uvicorn src.main:app --port 8000 --log-level warning

echo.
echo Waiting for API to be ready...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Running Simulation (10 Events)...
:: Use -m flag to ensure imports work correctly
python -m scripts.simulate --count 10

echo.
echo ===================================================
echo     VERIFICATION COMPLETE
echo ===================================================
echo System is running at http://localhost:8000
echo Doc URL: http://localhost:8000/docs
echo Audit logs are saved to: orbitr.db
pause
taskkill /IM python.exe /F 2>nul
