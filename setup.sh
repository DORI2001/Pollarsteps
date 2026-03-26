#!/bin/bash

# Polarsteps Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Polarsteps development environment..."

# Check dependencies
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed"
    exit 1
fi

echo "✅ Dependencies check passed"

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd backend_app

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Created .env from .env.example - UPDATE DATABASE_URL if not using Docker"
fi

# Create venv if it doesn't exist
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "✅ Created virtual environment"
fi

source .venv/bin/activate
pip install -r requirements.txt -q
echo "✅ Backend dependencies installed"

cd ..

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd frontend

if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "⚠️  Created .env.local - UPDATE NEXT_PUBLIC_MAPBOX_TOKEN"
fi

npm install -q
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update frontend/.env.local with your Mapbox token (get free one at https://account.mapbox.com)"
echo "   2. Update backend_app/.env with your database URL if needed"
echo "   3. Start the database: docker compose up -d db"
echo "   4. Run: make dev-backend (in another terminal)"
echo "   5. Run: make dev-frontend (in another terminal)"
echo ""
echo "Or run everything with: docker compose up --build"
