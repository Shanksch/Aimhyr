@echo off
REM Quick start script for Windows development

echo 🚀 AI Interview Simulator - Python Backend Setup
echo ==================================================

REM Check Python version
python --version

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo ✅ Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Download NLP model
echo 🧠 Downloading spaCy model...
python -m spacy download en_core_web_sm

REM Setup environment
echo ⚙️  Setting up environment...
if not exist .env (
    copy .env.example .env
    echo 📝 Created .env file - please configure OPENAI_API_KEY
)

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Edit .env and add your OpenAI API key
echo 2. Run: python -m uvicorn app.main:app --reload
echo 3. Visit: http://localhost:8000/docs
echo.
pause
