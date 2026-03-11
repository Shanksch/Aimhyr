#!/bin/bash
# Quick start script for development

echo "🚀 AI Interview Simulator - Python Backend Setup"
echo "=================================================="

# Check Python version
python --version

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "✅ Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo "📚 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Download NLP model
echo "🧠 Downloading spaCy model..."
python -m spacy download en_core_web_sm

# Setup environment
echo "⚙️ Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file - please configure OPENAI_API_KEY"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your OpenAI API key"
echo "2. Run: python -m uvicorn app.main:app --reload"
echo "3. Visit: http://localhost:8000/docs"
echo ""
