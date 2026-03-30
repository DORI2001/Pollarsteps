#!/bin/bash
# clean.sh - Clean up build artifacts and cache

echo "🧹 Cleaning up Pollarsteps..."
echo "=============================="
echo ""

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Backend cleanup
echo "Cleaning backend..."
cd backend_app
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete
rm -f pollarsteps.db
rm -rf .venv
echo -e "${YELLOW}✓ Backend cleaned${NC}"

# Frontend cleanup
cd ../frontend
echo "Cleaning frontend..."
rm -rf .next node_modules
echo -e "${YELLOW}✓ Frontend cleaned${NC}"

# Root cleanup
cd ..
rm -f .DS_Store
find . -name ".DS_Store" -delete

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "To rebuild:"
echo "  bash scripts/setup.sh"
echo ""
