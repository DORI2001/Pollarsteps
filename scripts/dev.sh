#!/bin/bash
# dev.sh - Start development servers

set -e

echo "🚀 Starting Pollarsteps Development Servers"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup EXIT INT

# Start Backend
echo -e "${BLUE}Starting backend on port 8000...${NC}"
cd backend_app
export PYTHONPATH=.:$PYTHONPATH
source ../.venv/bin/activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
sleep 2

# Start Frontend
echo -e "${BLUE}Starting frontend on port 3000...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!
sleep 3

echo ""
echo -e "${GREEN}✅ Servers running:${NC}"
echo "   📱 Frontend: http://localhost:3000"
echo "   🔌 Backend:  http://127.0.0.1:8000"
echo "   📚 API Docs: http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Wait for both to complete
wait
