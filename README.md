# Pollarsteps

Track your travels on an interactive map. Add locations as you go, attach photos, get AI-powered recommendations, and share your trips with friends.

---

## Screenshots

| Sign In | Sign Up |
|---------|---------|
| ![Sign In](screenshots/01-signin-page.png) | ![Sign Up](screenshots/02-signup-page.png) |

| Map View | Create Trip |
|----------|-------------|
| ![Map](screenshots/03-platform.png) | ![Create Trip](screenshots/04-create-trip.png) |

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+

### 1. Install dependencies

```bash
# Backend
cd backend_app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Copy and fill in the env files:

```bash
cp backend_app/.env.example backend_app/.env
cp frontend/.env.example frontend/.env.local
```

Key values to set:

| File | Variable | Description |
|------|----------|-------------|
| `backend_app/.env` | `JWT_SECRET_KEY` | Any long random string |
| `backend_app/.env` | `GEMINI_API_KEY` | For AI features (optional) |
| `frontend/.env.local` | `NEXT_PUBLIC_MAPBOX_TOKEN` | For map tiles (optional) |

### 3. Run

```bash
# Terminal 1 — Backend
cd backend_app
PYTHONPATH=. uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:3000** · API docs at **http://127.0.0.1:8000/docs**

---

## Features

| | |
|---|---|
| 🗺️ **Interactive Map** | Click anywhere to add a location, visualize your route |
| ✈️ **Trip Management** | Create trips, set dates, share publicly or keep private |
| 📍 **Location Steps** | Add notes and photos at each stop |
| 🤖 **AI Recommendations** | Get suggestions for restaurants, activities, and attractions |
| 📖 **Stories** | Turn trips into shareable reels with photos and music |
| 📊 **Analytics** | Distance traveled, days at each destination, trip stats |
| 🌓 **Dark / Light mode** | |

---

## Project Structure

```
Pollarsteps/
├── backend_app/        # FastAPI backend
│   └── app/
│       ├── api/        # Route handlers
│       ├── models/     # SQLAlchemy ORM models
│       ├── schemas/    # Pydantic validation
│       ├── services/   # Business logic
│       └── core/       # DB, auth, config
├── frontend/           # Next.js 14 frontend
│   ├── app/            # Pages
│   ├── components/     # React components
│   └── lib/            # API client, utilities
├── services/
│   └── travel_intelligence/  # Analytics microservice
├── tests/              # Integration tests
├── docs/               # Architecture & API reference
└── scripts/            # Dev helper scripts
```

---

## Scripts

```bash
bash scripts/setup.sh   # First-time setup
bash scripts/dev.sh     # Start both servers
bash scripts/test.sh    # Run tests
bash scripts/clean.sh   # Clean build artifacts
```

---

## Tech Stack

**Backend:** FastAPI · SQLite · SQLAlchemy (async) · Pydantic v2 · JWT auth

**Frontend:** Next.js 14 · TypeScript · Tailwind CSS · Leaflet maps

**AI:** Gemini API for recommendations and journal entries

---

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)

---

MIT License
