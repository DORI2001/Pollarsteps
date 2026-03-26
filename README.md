# 🗺️ Polarsteps - Travel Experience Logger

A beautiful, modern travel tracking app inspired by Polarsteps. Built with FastAPI (Python), Next.js (React), PostgreSQL+PostGIS, Mapbox, and IndexedDB for offline-first functionality.

**Apple-inspired design** | **Full-stack production ready** | **Offline sync** | **Geospatial queries**

---

## ✨ Features

- 🗺️ **Interactive Map** - View your trip journey with Mapbox GL JS
- 📱 **Responsive Design** - Beautiful Apple-style UI with smooth animations
- 🛜 **Offline First** - Log locations offline, auto-sync when online
- 🔐 **Secure Authentication** - JWT-based auth with bcrypt hashing
- 📍 **Geospatial Queries** - PostGIS integration for location-based features
- 🎨 **Modern Stack** - FastAPI async, Next.js 14, TypeScript

---

## � Screenshots & UI

### Authentication & Onboarding
Beautiful sign-up and login flow with Apple-inspired design:

![Sign Up Page](screenshots/01-signup.png)

Create an account with email, username, and password fields. Seamless authentication flow with form validation and error handling.

### Trip Management
Create your first adventure with an intuitive trip creation interface:

![Add Trip Page](screenshots/02-add-trip.png)

Start exploring the world. Pin locations on your map, add stories and memories to each place you visit.

### Dashboard & Map View
The main interface features a full-screen Mapbox GL JS map with your trip journey displayed as a beautiful route. Each step is marked with numbered markers showing the timeline of your travel.

![Trip Dashboard](screenshots/03-trip-dashboard.png)

**Features visible:**
- Interactive map with custom styled markers and location details
- Trip statistics dashboard with distance, location count, and duration analytics
- Online/Offline status indicator at top
- Real-time location tracking and memory notes
- Numbered step markers showing travel progression
- Edit and delete controls for each location

### Step Details & Logging
Log each moment of your journey with:
- Current location (lat/lng)
- Optional notes and descriptions
- Altitude information
- Timestamp
- Offline support - syncs when back online

### Design System
The app follows Apple's Human Interface Guidelines:
- **Color**: iOS Blue (`#007AFF`) for primary actions
- **Typography**: System font stack for perfect rendering
- **Animations**: 0.2-0.3s cubic-bezier transitions
- **Spacing**: 8pt grid for consistent layout
- **Components**: Glass-morphism cards with hover elevation

### Responsive Layouts
- **Desktop**: Full-width map with sidebar controls
- **Tablet**: Optimized touch interactions
- **Mobile**: Bottom sheet for controls, full-screen map

---

## �🚀 Quick Start

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

#### Setup Backend

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

#### Setup Frontend

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

## 🔌 API Endpoints

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

## 🎨 Design Features

### Apple-Inspired Design System

- **Primary Color**: `#007AFF` (iOS Blue)
- **Background**: `#F5F5F7` (Light Gray)
- **Text**: `#1D1D1D` (Dark Gray)
- **Subtle Shadows & Blur**: Glass-morphism effects
- **Smooth Animations**: 0.2-0.3s cubic-bezier transitions
- **Rounded Corners**: 12-20px border radius throughout

### UI Components

- **Full-Screen Map** with custom numbered markers
- **Glass-morphism Step Cards** with hover elevation
- **Online/Offline Status Indicator** with pulse animation
- **Loading Spinner** with elegant backdrop blur
- **Responsive Typography** with system font stack

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
- ✅ API route functionality (planned)

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

## 📚 Development Guide

### Adding a new route

1. Create schema: `backend_app/app/schemas/new_feature.py`
2. Add service: `backend_app/app/services/new_feature.py`
3. Create route: `backend_app/app/api/routes/new_feature.py`
4. Include in main: `backend_app/app/main.py`
5. Add tests: `backend_app/tests/test_core.py`

### Frontend updates

1. Create component: `frontend/components/NewComponent.tsx`
2. Use in page: `frontend/app/page.tsx`
3. Follow Apple design system for styling
4. Test on mobile and desktop

---

## 📄 License

MIT

---

Built with ❤️ for travelers everywhere 🌍✈️
