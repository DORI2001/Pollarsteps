# Pollarsteps - Complete Testing & Deployment Guide

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn
- SQLite3

### Step 1: Install Dependencies

**Backend**:
```bash
cd backend_app
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

**Frontend**:
```bash
cd frontend
npm install
```

### Step 2: Start Services

**Backend** (in one terminal):
```bash
cd backend_app
source ../.venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend** (in another terminal):
```bash
cd frontend
npm run dev
```

### Step 3: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)

---

## Manual Testing Checklist

### ✅ Authentication Tests

1. **User Registration**
   - Navigate to http://localhost:3000/signup
   - Enter email, password, confirm
   - Verify registration successful
   - Check user created in database

2. **User Login**
   - Navigate to http://localhost:3000/signin
   - Enter credentials
   - Verify redirected to main app
   - Check token in browser storage

3. **Session Persistence**
   - Refresh page
   - Verify still logged in
   - Check user profile visible

### ✅ Trip Management Tests

1. **Create Trip**
   - Click "New Trip" button
   - Enter: Title, Description, Start Date
   - Verify trip appears in list

2. **View Trip**
   - Click on trip in list
   - Verify map displays
   - Check trip details sidebar

3. **Edit Trip**
   - Click trip settings icon
   - Update title/description
   - Verify changes saved

4. **Delete Trip**
   ```bash
   # Frontend: Click delete button on trip
   # Verify: 
   # - Trip disappears from list immediately
   # - Refresh page - trip is GONE (not reappearing)
   # - Backend: DELETE /trips/{id} returns 200
   ```

### ✅ Step Management Tests

1. **Add Step**
   - Click on map to add location
   - Fill in: Note, Duration, Location Name
   - Upload optional image
   - Verify step appears on map as marker
   - Verify color correct (Green=start, Blue=middle, Red=end)

2. **View Step Details**
   - Click marker on map
   - Verify popup shows: Date, Time, Note, Duration, Location
   - Optional: verify image displays

3. **Edit Step**
   - Click "Edit" button in popup
   - Modify note, location, duration
   - Verify changes saved
   - Verify map updates

4. **Delete Step**
   - Click "Delete" button in popup
   - Verify step removed from map
   - Verify polyline updates if needed
   - Verify refreshes: step is gone

### ✅ Map Features Tests

1. **Map Rendering**
   - Verify OpenStreetMap renders
   - Verify zoom/pan works

2. **Markers**
   - Add 3+ steps
   - Verify all markers visible
   - Verify correct colors applied
   - Verify clickable

3. **Polyline (Route)**
   - Add 2+ steps
   - Verify dashed line connects steps
   - Verify line order matches steps

4. **Geocoding**
   - Add step
   - Verify location name appears in popup (takes moment)

### ✅ Statistics Tests

1. **Trip Stats Bar**
   - Verify: Total Distance displayed (km)
   - Verify: Total Steps count
   - Verify: Trip dates

2. **Statistics Panel**
   - Verify: Average distance between steps
   - Verify: Total duration
   - Verify: Step count

3. **Enhanced Statistics**
   - Navigate to Stats tab
   - Verify: Charts display
   - Verify: Data accurate

### ✅ Data Persistence Tests

1. **Add Step → Refresh**
   ```bash
   1. Add step with note "Test Persistence"
   2. Refresh browser (F5)
   3. Verify: Step still there
   4. Verify: Note still visible
   ```

2. **Delete Trip → Refresh**
   ```bash
   1. Create trip "Delete Test"
   2. Add step
   3. Delete trip
   4. Refresh browser
   5. Verify: Trip DOES NOT reappear
   ```

3. **Multiple Trips**
   ```bash
   1. Create 3 trips with different steps
   2. Switch between trips
   3. Refresh page
   4. Verify: All data intact
   5. Verify: Correct trip loaded
   ```

### ✅ Export Tests

1. **JSON Export**
   - Click Export → JSON
   - Verify: File downloads
   - Open file: check trip data

2. **CSV Export**
   - Click Export → CSV
   - Verify: File downloads
   - Open in Excel: check columns

3. **GeoJSON Export**
   - Click Export → GeoJSON
   - Verify: File downloads
   - Open: check coordinates

4. **GPX Export**
   - Click Export → GPX
   - Verify: File downloads
   - Open: check waypoints

---

## API Testing (curl/Postman)

### 1. Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

### 2. Register User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
# Expected: {"access_token": "...", "refresh_token": "...", "token_type": "bearer"}
```

### 3. Login User
```bash
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"
```

### 4. Get Current User
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Create Trip
```bash
curl -X POST http://localhost:8000/trips \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Trip",
    "description": "Test trip",
    "start_date": "2026-03-24"
  }'
```

### 6. Get All Trips
```bash
curl http://localhost:8000/trips \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Add Step
```bash
curl -X POST http://localhost:8000/steps \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": "TRIP_ID_HERE",
    "lat": 40.7128,
    "lng": -74.0060,
    "note": "Visited NYC",
    "location_name": "New York City",
    "client_uuid": "step-1",
    "duration_days": 3
  }'
```

### 8. Delete Trip
```bash
curl -X DELETE http://localhost:8000/trips/TRIP_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 9. Get Trip with Steps
```bash
curl "http://localhost:8000/steps/trip/TRIP_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Database Testing

### Check Database State
```bash
cd backend_app
sqlite3 pollarsteps.db

# In sqlite3 prompt:
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as trip_count FROM trips;
SELECT COUNT(*) as step_count FROM steps;

# View specific data:
SELECT id, email, username FROM users LIMIT 5;
SELECT id, title, user_id FROM trips LIMIT 5;
SELECT id, trip_id, lat, lng, note FROM steps LIMIT 5;

# Verify no orphaned steps:
SELECT s.id FROM steps s 
WHERE s.trip_id NOT IN (SELECT id FROM trips);
# Expected: (empty result)

# List trip with all steps:
SELECT t.id, t.title, COUNT(s.id) as step_count
FROM trips t
LEFT JOIN steps s ON t.id = s.trip_id
GROUP BY t.id;
```

### Reset Database
```bash
cd backend_app
rm pollarsteps.db
# Database will be recreated on next backend start
```

---

## Performance Testing

### Load Time Tests
```bash
# Backend startup:
time python -m uvicorn app.main:app --port 8000

# Frontend build:
cd frontend
time npm run build
```

### Query Performance
```python
import time
import requests

TOKEN = "your_token"

# Test list trips (with 10+ trips)
start = time.time()
response = requests.get(
    "http://localhost:8000/trips",
    headers={"Authorization": f"Bearer {TOKEN}"}
)
elapsed = time.time() - start
print(f"List trips: {elapsed*1000:.1f}ms")

# Test get trip with steps (with 10+ steps)
start = time.time()
response = requests.get(
    f"http://localhost:8000/trips/{trip_id}",
    headers={"Authorization": f"Bearer {TOKEN}"}
)
elapsed = time.time() - start
print(f"Get trip with steps: {elapsed*1000:.1f}ms")
```

### Memory Usage
```bash
# Monitor backend memory:
watch 'ps -eo pid,comm,rss | grep uvicorn'

# Monitor frontend memory:
# Open DevTools → Memory tab, take heap snapshots
```

---

## Troubleshooting

### Issue: Backend won't start
```bash
# Check if port 8000 is in use:
lsof -i :8000

# Kill existing process:
pkill -f "uvicorn.*8000"

# Verify dependencies:
pip install -r requirements.txt --upgrade
```

### Issue: Frontend won't start
```bash
# Check if port 3000 is in use:
lsof -i :3000

# Kill existing process:
pkill -f "next dev"

# Clear cache:
rm -rf .next node_modules
npm install
npm run dev
```

### Issue: Database locked
```bash
# SQLite file lock - restart backend:
pkill -f "uvicorn"
sleep 2
# Start backend again

# If still locked, check for processes:
lsof backend_app/pollarsteps.db
```

### Issue: "Can't connect to backend"
```bash
# Verify backend is running:
curl http://localhost:8000/health

# Check CORS settings in backend_app/app/main.py
# Verify http://localhost:3000 is in allow_origins

# Check API_BASE in frontend/.env.local:
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

### Issue: Map not rendering
```bash
# Check browser console for errors (F12)
# Verify Leaflet CSS and JS loaded
# Check OpenStreetMap tiles loading

# If stuck on loading spinner, try:
1. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear browser cache
3. Check network tab for failed requests
```

### Issue: Image upload fails
```bash
# Check uploads directory exists:
ls -la backend_app/app/uploads/

# Verify permissions:
chmod 755 backend_app/app/uploads/

# Check file size limit in frontend/lib/api.ts
# Default: no limit (consider adding 5MB max)
```

---

## Production Deployment Checklist

### Before Deployment
- [ ] Change JWT_SECRET_KEY in .env
- [ ] Set DATABASE_URL to PostgreSQL (not SQLite)
- [ ] Configure SMTP for email notifications
- [ ] Set up AWS S3 or similar for image storage
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up error tracking (Sentry)
- [ ] Set up monitoring/logging (ELK Stack, DataDog, etc.)
- [ ] Enable rate limiting
- [ ] Enable CSRF protection if needed
- [ ] Test on staging environment first

### Environment Variables Production
```bash
# Backend .env
DATABASE_URL=postgresql://user:pass@host:5432/pollarsteps
JWT_SECRET_KEY=<generate-strong-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend .env.production
NEXT_PUBLIC_API_BASE=https://api.pollarsteps.com
```

### Docker Deployment
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Support & Documentation

- **Backend Docs**: http://localhost:8000/docs
- **System Audit**: See SYSTEM_AUDIT_REPORT.md
- **Code Structure**: See PROJECT_COMPLETION_SUMMARY.md
- **Issues Tracker**: GitHub Issues

---

**Last Updated**: March 24, 2026  
**Status**: Production Ready
