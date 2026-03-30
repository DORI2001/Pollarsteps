#!/bin/bash
# test.sh - Run integration tests

echo "🧪 Running Pollarsteps Integration Tests"
echo "========================================"
echo ""

set -e

# Activate venv
cd backend_app
source ../.venv/bin/activate
cd ..

# Run tests
python test_integration.py

echo ""
echo "✅ Tests completed!"
