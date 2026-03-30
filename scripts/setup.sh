#!/bin/bash
# setup.sh - Initial project setup script

set -e

echo "🚀 Pollarsteps Setup Script"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo -e "${BLUE}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found$(python3 --version)${NC}"
echo ""

# Setup Backend
echo -e "${BLUE}Setting up backend...${NC}"
cd backend_app

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate
echo "Installing backend dependencies..."
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Backend ready${NC}"
echo ""

# Setup Frontend
echo -e "${BLUE}Setting up frontend...${NC}"
cd ../frontend

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install -q
fi

echo -e "${GREEN}✓ Frontend ready${NC}"
echo ""

# Create .env files if they don't exist
cd ..

if [ ! -f "backend_app/.env" ]; then
    echo "Creating backend .env file..."
    cat > backend_app/.env << 'EOF'
DATABASE_URL=sqlite+aiosqlite:///./pollarsteps.db
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600
GEMINI_API_KEY=
AI_CHRONICLER_URL=
SMTP_SERVER=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
EOF
    echo -e "${YELLOW}⚠ backend_app/.env created - add your API keys${NC}"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend .env.local file..."
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_THEME=light
EOF
    echo -e "${YELLOW}⚠ frontend/.env.local created - add your Mapbox token${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Add your API keys to backend_app/.env"
echo "2. Add your Mapbox token to frontend/.env.local"
echo "3. Run: bash scripts/dev.sh"
echo ""
