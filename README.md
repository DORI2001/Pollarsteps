# 🗺️ Pollarsteps - AI-Powered Travel Tracking Platform

A modern, feature-rich travel tracking app with interactive maps, AI-powered recommendations, story creation, and comprehensive trip analytics.

**Status:** ✅ Production-Ready | **Tests:** ✅ 11/11 Passing | **Code:** ✅ Refactored & Type-Safe | **Frontend:** ✅ Full TypeScript

---

## 📸 Screenshots

| Sign In | Sign Up |
|---------|---------|
| ![Sign In](screenshots/01-signin-page.png) | ![Sign Up](screenshots/02-signup-page.png) |

| Platform / Map | Create Trip |
|----------------|-------------|
| ![Platform](screenshots/03-platform.png) | ![Create Trip](screenshots/04-create-trip.png) |

---

## 🎯 Quick Start

### Prerequisites
- Python 3.9+ 
- Node.js 18+

### Setup (2 minutes)

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

### Run

**Terminal 1 - Backend:**
```bash
cd backend_app
export PYTHONPATH=.:$PYTHONPATH
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit **http://localhost:3000** | API Docs: **http://127.0.0.1:8000/docs**

---

## ✨ Complete Feature Set

### 🔐 Authentication & Users
- User registration with email
- Secure JWT authentication & refresh tokens
- Password validation (min 6 chars)
- Session management

### ✈️ Trip Management
- Create, read, update, delete trips
- Set trip dates and descriptions
- Public/private trip visibility
- Trip sharing with secure tokens
- View shared trips without authentication
- Automatic distance calculations

### 📍 Location Tracking
- Add location steps with coordinates
- Capture photos at each location
- Store location names & notes
- Duration tracking per location
- Timestamp management
- Idempotent step creation (no duplicates)

### 📖 Story & Reel Creation
- Create shareable story reels from trips
- Music integration (YouTube/Spotify-ready)
- Custom clip duration (15-30 seconds)
- Photo slideshow with transitions
- Map tiles embedded in stories
- Public/private story sharing
- Share via secure tokens

### 🤖 AI-Powered Features
- **AI Recommendations:** Get suggestions for restaurants, attractions, activities
- **Budget Levels:** Budget, moderate, luxury recommendations
- **AI Chronicler:** Generate poetic journal entries for each location
- User questions influence recommendations
- Powered by Gemini API (Anthropic-ready)

### 📊 Analytics & Statistics
- Trip duration calculations
- Total distance traveled (Haversine formula)
- Days at each destination
- Average stay duration
- Unique location count
- Trip-specific analytics from Travel Intelligence service

### 🗺️ Interactive Maps
- Real-time map display with Leaflet
- Mapbox integration for rich maps
- Route visualization (GeoJSON LineString)
- Click-to-add locations
- Pinpoint coordinates
- Drag-to-pan, scroll-to-zoom

### 🎨 Photo Management
- Photo gallery view
- Multi-image slideshow
- Lightbox modal viewer
- Image carousel navigation
- Location-tagged photos

### 🎯 UI/UX Features
- 🌓 Dark/Light theme toggle
- Responsive design (mobile-first)
- Real-time error feedback
- Loading states
- Smooth animations
- Tailwind CSS styling
- Accessible components

---

## 🧪 Testing

```bash
cd / && python test_integration.py
```

**Result:** ✅ 11/11 Integration Tests Passing

Tests cover:
- User registration & login
- Trip CRUD operations
- Location step management
- Distance calculations
- Error handling (403, 404, validation)
- Trip deletion & cleanup

---

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Create new user
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh JWT token

### Trips
- `POST /trips` - Create trip
- `GET /trips` - Get all user trips
- `GET /trips/{trip_id}` - Get trip with steps
- `DELETE /trips/{trip_id}` - Delete trip
- `POST /trips/{trip_id}/share` - Generate share link
- `DELETE /trips/{trip_id}/share` - Revoke share link
- `GET /trips/shared/{share_token}` - View shared trip (public)

### Steps/Locations
- `POST /steps` - Add location to trip
- `PUT /steps/{step_id}` - Update location
- `DELETE /steps/{step_id}` - Delete location
- `GET /steps/trip/{trip_id}` - Get all steps in trip

### Stories & Reels
- `POST /stories` - Create story reel
- `GET /stories/{story_id}` - Get user's story
- `GET /stories/public/{share_token}` - View public story

### AI & Recommendations
- `POST /ai/chronicler` - Generate poetic entry
- `GET /recommendations/location` - Get location recommendations
  - Query params: `location`, `lat`, `lon`, `rec_type`, `budget`, `question`

### Analytics
- `GET /analytics/trip/{trip_id}/stats` - Get trip statistics

---

## 📁 Project Structure

```
pollarsteps/
├── backend_app/                    # FastAPI backend
│   └── app/
│       ├── api/routes/             # REST endpoints
│       │   ├── auth.py
│       │   ├── trips.py
│       │   ├── steps.py
│       │   ├── stories.py
│       │   ├── recommendations.py
│       │   ├── analytics.py
│       │   └── ai_chronicler.py
│       ├── services/               # Business logic
│       │   ├── trips.py
│       │   ├── steps.py
│       │   ├── stories.py
│       │   ├── recommendations.py
│       │   ├── ai_chronicler.py
│       │   ├── auth.py
│       │   └── email.py
│       ├── models/                 # SQLAlchemy ORM
│       │   ├── user.py
│       │   ├── trip.py
│       │   ├── step.py
│       │   ├── story.py
│       │   └── story_slide.py
│       ├── schemas/                # Pydantic validation
│       │   ├── user.py
│       │   ├── trip.py
│       │   ├── step.py
│       │   ├── story.py
│       │   └── ai.py
│       ├── utils/                  # Shared utilities ⭐ NEW
│       │   ├── distance.py         # Haversine calculations
│       │   ├── errors.py           # Custom exceptions
│       │   └── config.py           # Environment loading
│       ├── core/
│       │   ├── config.py           # App configuration
│       │   ├── db.py               # Database setup
│       │   └── security.py         # JWT & auth
│       └── main.py                 # App entry
│
├── frontend/                       # Next.js 14 frontend
│   ├── app/
│   │   ├── page.tsx                # Main dashboard
│   │   ├── signin/page.tsx         # Login page
│   │   ├── signup/page.tsx         # Register page
│   │   └── shared/[token]/page.tsx # Public trip viewer
│   ├── components/                 # React components
│   │   ├── TripViewer.tsx
│   │   ├── TripViewerLeaflet.tsx
│   │   ├── TripStatistics.tsx
│   │   ├── EnhancedStatistics.tsx
│   │   ├── PhotoGallery.tsx
│   │   ├── StepModal.tsx
│   │   ├── EditStepModal.tsx
│   │   ├── StoryReelModal.tsx
│   │   ├── RecommendationPanel.tsx
│   │   ├── TripToolbar.tsx
│   │   ├── TripSeparation.tsx
│   │   ├── LocationSearch.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── ProtectedRoute.tsx
│   ├── lib/                        # Utilities
│   │   ├── api.ts                  # API client
│   │   ├── distance.ts             # Distance calculations
│   │   ├── types.ts                # TypeScript types ⭐ NEW
│   │   ├── errors.ts               # Error handling ⭐ NEW
│   │   ├── stats.ts                # Statistics ⭐ NEW
│   │   ├── search.ts               # Search/filter
│   │   ├── export.ts               # Data export
│   │   └── theme.ts                # Theme colors
│   ├── providers/
│   │   └── ThemeProvider.tsx
│   └── globals.css
│
├── services/                       # Microservices
│   └── travel_intelligence/        # Analytics service
│
├── config/                         # Configuration
│   └── Makefile
│
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   └── [other docs]
│
├── tests/                          # Test files
│   ├── test_integration.py         # Main integration tests
│   └── [other tests]
│
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## ⚙️ Configuration

### Backend `.env`
```env
DATABASE_URL=sqlite+aiosqlite:///./pollarsteps.db
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

GEMINI_API_KEY=your-gemini-api-key
AI_CHRONICLER_URL=http://localhost:8001/chronicler

SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
NEXT_PUBLIC_THEME=light
```

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (async Python web framework)
- **Database:** SQLite with SQLAlchemy async ORM
- **Auth:** JWT tokens with bcrypt hashing
- **Validation:** Pydantic v2
- **API:** RESTful with OpenAPI/Swagger docs
- **AI:** Gemini API for recommendations & poetic entries

### Frontend
- **Framework:** Next.js 14.2.3 (React 18)
- **Language:** TypeScript 5.4.5 (strict mode)
- **Styling:** Tailwind CSS 4.2.2
- **Maps:** Leaflet + Mapbox
- **Client:** HTTP client with error handling
- **State:** React hooks

### DevOps
- **Docker:** Docker & Docker Compose
- **Package Managers:** pip (Python), npm (Node.js)
- **Testing:** pytest (backend), integration tests
- **Version Control:** Git

---

## 📚 Documentation

Comprehensive documentation for all aspects of the project:

- **[ORGANIZATION.md](./ORGANIZATION.md)** - Complete project structure & file organization
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design, layers, data flows
- **[API_REFERENCE.md](./docs/API_REFERENCE.md)** - All endpoints with request/response examples
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Code patterns, utilities, best practices
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - 50%+ code improvements made
- **[COMMIT_SUMMARY.md](./COMMIT_SUMMARY.md)** - Git history & changes

---

## 🚀 Quick Commands

```bash
# One-time setup
bash scripts/setup.sh

# Start development servers
bash scripts/dev.sh

# Run all tests
bash scripts/test.sh

# Clean up build artifacts
bash scripts/clean.sh
```

---

## 🚀 Performance & Quality

✅ **Code Quality**
- 50-67% code duplication reduction via utilities
- Full TypeScript type safety (no `any` types)
- Centralized error handling
- Consistent API patterns

✅ **Testing**
- 11/11 integration tests passing
- End-to-end workflow coverage
- Error scenario validation
- Distance calculation verification

✅ **Architecture**
- Utility modules for reuse (distance, errors, config)
- Service layer separation
- Async/await throughout
- Proper error handling with custom exceptions

---

## 🐛 Troubleshooting

**Backend won't start?**
```bash
# Set Python path correctly
export PYTHONPATH=backend_app:$PYTHONPATH

# Verify imports
python -c "from app.utils import calculate_total_distance; print('✅ OK')"

# Kill stuck processes
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Frontend build error?**
```bash
# Clear Next.js cache
rm -rf frontend/.next

# Reinstall dependencies
cd frontend && npm install

# Restart dev server
npm run dev
```

**Map not showing?**
- ✅ Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `frontend/.env.local`
- ✅ Token must start with `pk.`
- ✅ Restart frontend server
- ✅ Check browser DevTools console for errors

**Database issues?**
```bash
# Reset database
rm backend_app/pollarsteps.db

# Restart backend (will recreate)
python -m uvicorn app.main:app --reload
```

---

## 📄 License

MIT

---

**Last Updated:** March 30, 2026  
**Version:** 2.0.0  
**Status:** Production Ready ✅
