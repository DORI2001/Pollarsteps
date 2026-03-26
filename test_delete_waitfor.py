#!/usr/bin/env python3
"""Test deletion with staggered database queries"""
import requests
import sqlite3
import time

API = "http://localhost:8000"
DB_PATH = "/Users/doralagem/Documents/Pollarsteps/backend_app/pollarsteps.db"

def query_db(query, params=()):
    """Execute a query and return result"""
    # Close any existing connections first
    conn = sqlite3.connect(DB_PATH, timeout=2)
    conn.isolation_level = None  # Auto-commit mode
    conn.execute("PRAGMA synchronous = FULL")  # Force disk sync
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        result = cursor.fetchone()
        conn.commit()
        conn.close()
        return result
    except Exception as e:
        conn.close()
        return None

print("=" * 60)
print("Testing deletion with database sync verification")
print("=" * 60)

# Setup
email = f"deltest{int(time.time())%100000}@test.com"
username = f"deltest{int(time.time())%100000}"

# Register
print("\n1. Registering...")
resp = requests.post(f"{API}/auth/register", json={
    "email": email,
    "username": username,
    "password": "test123"
})
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Registered")

# Create trip
print("\n2. Creating trip...")
resp = requests.post(f"{API}/trips", headers=headers, json={
    "title": f"DELETE_TEST_{int(time.time())}",
    "description": "Test"
})
trip_id = resp.json()["id"]
print(f"✅ Created: {trip_id}")

# Verify in DB
result = query_db("SELECT COUNT(*) FROM trips WHERE id = ?", (trip_id,))
count = result[0] if result else 0
print(f"   DB before delete: {count}")

# Delete
print(f"\n3. Calling DELETE endpoint...")
resp = requests.delete(f"{API}/trips/{trip_id}", headers=headers)
print(f"   Status: {resp.status_code}")
print(f"   Response: {resp.json()}")

# Query with different delays
print(f"\n4. Checking database at different intervals after delete:")
for delay in [0.1, 0.5, 1.0, 2.0]:
    time.sleep(delay)
    result = query_db("SELECT COUNT(*) FROM trips WHERE id = ?", (trip_id,))
    count = result[0] if result else 0
    status = "✅" if count == 0 else "❌"
    print(f"   {status} After {delay}s: {count} instance(s)")
    if count == 0:
        print("      Trip successfully deleted!")
        break

# Final check
print(f"\n5. API response:")
resp = requests.get(f"{API}/trips", headers=headers)
trips = resp.json()
trip_in_api = any(t["id"] == trip_id for t in trips)
print(f"   Trip in API: {'❌ YES' if trip_in_api else '✅ NO'}")
print(f"   API returns {len(trips)} trips")

print("\n" + "=" * 60)
