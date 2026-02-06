@echo off
echo ========================================
echo Starting Orbiter Frontend
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

echo.
echo ========================================
echo Frontend starting on http://localhost:3000
echo ========================================
echo.

REM Start the development server
call npm run dev
