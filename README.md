# 🗺️ Pollarsteps

Modern travel tracking built with FastAPI, Next.js, PostgreSQL/PostGIS, Mapbox, and offline-first IndexedDB.

**Highlights:** interactive map, offline sync, JWT auth, geospatial queries, TypeScript frontend.

---

## ✨ Features

- Interactive Mapbox journey view
- Offline-first logging with auto-sync
- JWT auth with bcrypt hashing
- PostGIS-powered geospatial queries
- Responsive UI with smooth animations

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+** (with venv support)
- **Node.js 18+** with npm
- **Docker & Docker Compose** (for local Postgres)

### Option 1: Run Everything with Docker (Easiest)

```bash
cd /Users/doralagem/Documents/Pollarsteps

# Create .env with your Mapbox token
echo "NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_TOKEN_HERE" > frontend/.env.local

# Start all services
docker compose up --build

# Visit http://localhost:3000
```

### Option 2: Local Development

#### Backend

```bash
cd backend_app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env

# Start PostgreSQL (via Docker or local)
docker run -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pollarsteps -p 5432:5432 postgis/postgis:16-3.4

# Run the backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# Edit to add your Mapbox token

npm run dev

# Visit http://localhost:3000
```

#### Run Tests

```bash
cd backend_app
python -m pytest tests/test_core.py -v

# Expected: 7 passed, 3 skipped
```

---

## 📁 Project Structure

```
backend_app/          # FastAPI backend
├── app/
│   ├── main.py       # Entry point
│   ├── core/         # Config, DB, security
│   ├── models/       # SQLAlchemy ORM
│   ├── schemas/      # Pydantic schemas
│   ├── api/          # Routes
│   └── services/     # Business logic
├── tests/            # Pytest suite
└── requirements.txt

frontend/             # Next.js frontend
├── app/              # Next.js pages
├── components/       # React components
├── lib/              # Utilities (IndexedDB)
└── package.json

docker-compose.yml    # Multi-service setup
Makefile              # Dev shortcuts
setup.sh              # Initialization script
```

---

## 🔌 API Endpoints (auth required unless public)

### Authentication

```bash
POST /auth/register
{
  "email": "user@example.com",
  "username": "username",
  "password": "password"
}

POST /auth/login
{
  "email_or_username": "username",
  "password": "password"
}

GET /auth/me
Authorization: Bearer {access_token}
```

### Trips

```bash
POST /trips
Authorization: Bearer {token}
{
  "title": "My Trip",
  "description": "Description",
  "start_date": "2026-06-01",
  "is_public": false
}

GET /trips/{trip_id}
Authorization: Bearer {token}
```

### Steps

```bash
POST /steps
Authorization: Bearer {token}
{
  "trip_id": "uuid",
  "lat": 48.8566,
  "lng": 2.3522,
  "altitude": 35,
  "client_uuid": "uuid",
  "note": "Eiffel Tower"
}

GET /steps/trip/{trip_id}
Authorization: Bearer {token}
```

---
## 🧪 Testing

```bash
cd backend_app

# Run all tests
python -m pytest tests/test_core.py -v

# With coverage
python -m pytest tests/test_core.py --cov=app

# Watch mode
python -m pytest tests/test_core.py --watch
```

**Test Coverage:**
- ✅ JWT token creation & validation
- ✅ Module imports and dependencies
- ✅ Schema validation
- ✅ API route functionality

---

## 🔧 Configuration

### Backend (.env)

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/pollarsteps
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=10080
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_from_mapbox_com
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

---

## 🚢 Deployment

### Docker Compose

```bash
docker compose up --build

# Services will start on:
# - PostgreSQL: localhost:5432
# - Backend: http://localhost:8000
# - Frontend: http://localhost:3000
```

### Production Checklist

- [ ] Set strong `JWT_SECRET_KEY`
- [ ] Use real Mapbox token with rate limiting
- [ ] Configure CORS properly for your domain
- [ ] Set `DATABASE_URL` to production Postgres
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and logging

---

## 🐛 Troubleshooting

**Map not rendering?**
- Check `NEXT_PUBLIC_MAPBOX_TOKEN` in `frontend/.env.local`
- Restart Next.js dev server after setting token
- Token must start with `pk.`

**Backend won't start?**
- Verify database URL in `.env`
- Ensure Postgres is running: `docker ps`
- Check Python version: `python --version` (must be 3.9+)

**Offline sync not working?**
- Check browser console for errors
- Verify `NEXT_PUBLIC_API_BASE` points to correct backend URL
- Open DevTools → Application → IndexedDB to debug

---

## 📄 License

MIT

Built with ❤️ for travelers everywhere 🌍✈️
