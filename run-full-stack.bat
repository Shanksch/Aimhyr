@echo off
REM Quick Start - Run Frontend & Backend Together (Windows)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   AI Interview Simulator - Complete System                    ║
echo ║   Frontend + Python Backend Integration                       ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if python-backend directory exists
if not exist "python-backend" (
    echo ❌ Error: python-backend directory not found
    echo    Run this script from the project root
    pause
    exit /b 1
)

echo 📚 Step 1: Setup Python Backend
echo ─────────────────────────────────────────────────────────────────
cd python-backend

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo ⚠️  Please edit python-backend\.env and add your OPENAI_API_KEY
)

echo Installing dependencies...
pip install -q -r requirements.txt >nul 2>&1

echo ✅ Python backend ready
echo.

echo 📚 Step 2: Setup Next.js Frontend
echo ─────────────────────────────────────────────────────────────────
cd ..

if not exist ".env.local" (
    echo Creating .env.local file...
    (
        echo # Python Backend URL
        echo PYTHON_API_URL=http://localhost:8000
    ) > .env.local
    echo ✅ Created .env.local with Python backend URL
)

if not exist "node_modules" (
    echo Installing Node dependencies...
    call npm install --silent
)

echo ✅ Next.js frontend ready
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║   Ready to Start!                                             ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📖 Next Steps:
echo.
echo 1. Start Python Backend (Terminal 1):
echo    cd python-backend
echo    python -m uvicorn app.main:app --reload
echo.
echo 2. Start Next.js Frontend (Terminal 2):
echo    npm run dev
echo.
echo 3. Open Browser:
echo    http://localhost:3000
echo.
echo ✨ Full integration configured!
echo.
pause
