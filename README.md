# Pollarsteps

Track your travels on an interactive map with AI-powered recommendations, trip analytics, and shareable stories.

---

## Screenshots

| Sign In | Sign Up |
|---------|---------|
| ![Sign In](screenshots/01-signin-page.png) | ![Sign Up](screenshots/02-signup-page.png) |

| Map View | Create Trip |
|----------|-------------|
| ![Map](screenshots/03-platform.png) | ![Create Trip](screenshots/04-create-trip.png) |

---

## Quick Start

**Prerequisites:** Python 3.9+, Node.js 18+

```bash
# Backend
cd backend_app
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend && npm install
```

**Run:**

```bash
# Terminal 1
cd backend_app
PYTHONPATH=. uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2
cd frontend && npm run dev
```

→ App: http://localhost:3000 · API docs: http://127.0.0.1:8000/docs

---

## Features

- **Maps** — Interactive Leaflet map, click to add locations, route visualization
- **Trips** — Create and manage trips, public/private visibility, shareable links
- **AI** — Location recommendations, AI-generated journal entries (Gemini)
- **Stories** — Create shareable reels with photos and music
- **Analytics** — Distance, duration, stats per trip
- **Auth** — JWT authentication with refresh tokens

---

## Tech Stack

| | |
|---|---|
| **Backend** | FastAPI, SQLite, SQLAlchemy async, Pydantic v2 |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Leaflet |
| **AI** | Gemini API |
| **DevOps** | Docker Compose |

---

## Config

**`backend_app/.env`**
```env
DATABASE_URL=sqlite+aiosqlite:///./pollarsteps.db
JWT_SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key
CORS_ORIGINS=http://localhost:3000
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token
```

---

## Scripts

```bash
bash scripts/setup.sh   # one-time setup
bash scripts/dev.sh     # start both servers
bash scripts/test.sh    # run tests
```

---

## Docs

See [`docs/`](docs/) for architecture, API reference, and developer guide.

---

MIT License
