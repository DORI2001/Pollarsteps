#!/usr/bin/env python3
"""Test trip deletion persistence issue"""
import requests
import json
import time
import sqlite3

API = "http://localhost:8000"
DB_PATH = "backend_app/pollarsteps.db"

print("=" * 60)
print("Testing Trip Deletion Persistence")
print("=" * 60)

# 1. Register new user
email = f"deletetest{int(time.time())%100000}@example.com"
password = "password123"
username = f"deletetest{int(time.time())%100000}"

print("\n1. Registering new user...")
resp = requests.post(f"{API}/auth/register", json={
    "email": email,
    "username": username,
    "password": password
})
if resp.status_code != 200:
    print(f"❌ Register failed: {resp.status_code}")
    print(resp.text)
    exit(1)

token = resp.json()["access_token"]
print(f"✅ Registered: {email}")

# 2. Create a trip
print("\n2. Creating test trip...")
headers = {"Authorization": f"Bearer {token}"}
trip_title = f"DELETE TEST {int(time.time())}"
resp = requests.post(f"{API}/trips", headers=headers, json={
    "title": trip_title,
    "description": "This trip will be deleted"
})
if resp.status_code != 201:
    print(f"❌ Create failed: {resp.status_code}")
    print(resp.text)
    exit(1)

trip = resp.json()
trip_id = trip["id"]
print(f"✅ Trip created: {trip_id}")

# 3. Verify trip in list
print("\n3. Verifying trip in list...")
resp = requests.get(f"{API}/trips", headers=headers)
trips_before = [t for t in resp.json()]
found = any(t["id"] == trip_id for t in trips_before)
if not found:
    print(f"❌ Trip NOT found in list")
    exit(1)
print(f"✅ Trip found in list ({len(trips_before)} total)")

# 4. Delete trip
print(f"\n4. Deleting trip...")
resp = requests.delete(f"{API}/trips/{trip_id}", headers=headers)
if resp.status_code != 200:
    print(f"❌ Delete failed: {resp.status_code}")
    print(resp.text)
    exit(1)
print(f"✅ Delete endpoint returned 200 OK")

# 5. Check immediately after
print(f"\n5. Getting trips immediately after delete...")
resp = requests.get(f"{API}/trips", headers=headers)
trips_after = [t for t in resp.json()]
found = any(t["id"] == trip_id for t in trips_after)
if found:
    print(f"❌ PROBLEM: Trip still in API response immediately after delete!")
else:
    print(f"✅ Trip removed from list ({len(trips_after)} total)")

# 6. Fresh request (simulate refresh)
print(f"\n6. Fresh GET request (simulate refresh)...")
resp = requests.get(f"{API}/trips", headers=headers)
trips_refresh = [t for t in resp.json()]
found = any(t["id"] == trip_id for t in trips_refresh)
if found:
    print(f"❌ BUG CONFIRMED: Trip reappeared after refresh!")
else:
    print(f"✅ Trip stays deleted after refresh ({len(trips_refresh)} total)")

# 7. Check database directly
print(f"\n7. Checking database directly...")
try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM trips WHERE id = ?", (trip_id,))
    count = cursor.fetchone()[0]
    conn.close()
    
    if count > 0:
        print(f"❌ CRITICAL: Trip still in database!")
    else:
        print(f"✅ Trip confirmed deleted from database")
except Exception as e:
    print(f"❌ Database check failed: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
