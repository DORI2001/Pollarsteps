#!/usr/bin/env python3
"""Test deletion with detailed database inspection"""
import requests
import sqlite3
import time

API = "http://localhost:8000"
DB_PATH = "backend_app/pollarsteps.db"

def count_trips_in_db(trip_id):
    """Count trips in database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM trips WHERE id = ?", (trip_id,))
        count = cursor.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        return f"Error: {e}"

def get_trips_from_db():
    """Get all trips from database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM trips")
        count = cursor.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        return f"Error: {e}"

print("=" * 60)
print("Trip Deletion Test with Database Inspection")
print("=" * 60)

# Setup
email = f"deltest{int(time.time())%100000}@test.com"
username = f"deltest{int(time.time())%100000}"
headers = {"Authorization": ""}

# 1. Register
print("\n1.  Registering...")
resp = requests.post(f"{API}/auth/register", json={
    "email": email,
    "username": username,
    "password": "test123"
})
token = resp.json()["access_token"]
headers["Authorization"] = f"Bearer {token}"
print("✅ Registered")

# 2. Create trip
print("\n2. Creating trip...")
resp = requests.post(f"{API}/trips", headers=headers, json={
    "title": f"DELETE_TEST_{int(time.time())}",
    "description": "Test"
})
trip_id = resp.json()["id"]
print(f"✅ Created trip: {trip_id}")

# 3. Check in database
count = count_trips_in_db(trip_id)
print(f"   Database shows: {count} instance(s) of this trip")
total_trips = get_trips_from_db()
print(f"   Total trips in DB: {total_trips}")

# 4. Delete trip
print(f"\n3. Deleting trip...")
resp = requests.delete(f"{API}/trips/{trip_id}", headers=headers)
print(f"   Delete response: {resp.status_code} - {resp.json()}")

# 5. Immediately check database
time.sleep(0.5)
count_after = count_trips_in_db(trip_id)
print(f"\n4. Checking database immediately after delete:")
print(f"   Database shows: {count_after} instance(s) of this trip")
if count_after == 0:
    print("   ✅ Trip successfully deleted from database")
else:
    print("   ❌ Trip still in database!")

# 6. Check via API
resp = requests.get(f"{API}/trips", headers=headers)
api_trips = {t["id"] for t in resp.json()}
print(f"\n5. Checking API response:")
print(f"   API returns: {len(api_trips)} trips")
if trip_id in api_trips:
    print("   ❌ Trip still in API response!")
else:
    print("   ✅ Trip removed from API")

print("\n" + "=" * 60)
