import pytest
import sys
import os

# Add the backend_app to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

pytest_plugins = ["pytest_asyncio"]
