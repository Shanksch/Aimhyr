#!/bin/bash
# Quick Start - Run Frontend & Backend Together

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   AI Interview Simulator - Complete System                    ║"
echo "║   Frontend + Python Backend Integration                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -d "python-backend" ]; then
    echo "❌ Error: python-backend directory not found"
    echo "   Run this script from the project root"
    exit 1
fi

echo "📚 Step 1: Setup Python Backend"
echo "─────────────────────────────────────────────────────────────────"
cd python-backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit python-backend/.env and add your OPENAI_API_KEY"
fi

echo "Installing dependencies..."
pip install -q -r requirements.txt

echo "✅ Python backend ready"
echo ""

echo "📚 Step 2: Setup Next.js Frontend"
echo "─────────────────────────────────────────────────────────────────"
cd ..

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << 'EOF'
# Python Backend URL
PYTHON_API_URL=http://localhost:8000
EOF
    echo "✅ Created .env.local with Python backend URL"
fi

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

echo "✅ Next.js frontend ready"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Ready to Start!                                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📖 Next Steps:"
echo ""
echo "1. Start Python Backend (Terminal 1):"
echo "   cd python-backend"
echo "   python -m uvicorn app.main:app --reload"
echo ""
echo "2. Start Next.js Frontend (Terminal 2):"
echo "   npm run dev"
echo ""
echo "3. Open Browser:"
echo "   http://localhost:3000"
echo ""
echo "✨ Full integration configured!"
echo ""
