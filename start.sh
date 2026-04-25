#!/bin/bash
echo "🛡️  Starting PhishGuard..."
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "❌ Python 3 not found. Please install Python 3.10+"
  exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 18+"
  exit 1
fi

# Backend setup
cd backend
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✅ Created .env from template"
fi

if [ ! -f "phishguard.db" ]; then
  echo "📦 Installing backend dependencies..."
  pip install -r requirements.txt -q
  echo "🌱 Seeding database..."
  python seed.py
fi

echo ""
echo "🚀 Starting backend on http://localhost:8000"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd ../frontend

if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install --silent
fi

echo "🚀 Starting frontend on http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PhishGuard is running!"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/api/docs"
echo ""
echo "  Login: superadmin@phishguard.io / Admin@123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
