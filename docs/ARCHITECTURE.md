# System Architecture - Pollarsteps

## Overview

Pollarsteps is a modern travel tracking platform with a clear separation between frontend and backend, enabling scalability and maintainability.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                   │
│              React + TypeScript + Tailwind CSS              │
└────────────────────────┬────────────────────────────────────┘
                         │ REST / JSON
┌────────────────────────▼────────────────────────────────────┐
│                   Backend (FastAPI)                         │
│            Async Python Web Framework                       │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌──────────────┼──────────────┐
         │              │              │
      ┌──▼──┐    ┌─────▼────┐  ┌─────▼─────┐
      │SQLite│    │Gemini API│  │Travel Intel│
      │ ORM  │    │(AI)      │  │Service    │
      └──────┘    └──────────┘  └───────────┘
```

---

## Backend Architecture

### Layer Pattern

```
API Routes (routes/)
    ↓ Handles HTTP requests
Services (services/)
    ↓ Business logic & orchestration
Models (models/)
    ↓ Data representation
Database (SQLite with SQLAlchemy)
    ↓ Persistent storage
```

### Core Modules

#### **1. Authentication & Security** (`core/security.py`)
- JWT token generation & validation
- Bcrypt password hashing
- OAuth2 bearer scheme
- Token expiration handling

#### **2. Database Layer** (`core/db.py`)
- Async SQLAlchemy configuration
- SQLite connection with aiosqlite
- Session management
- Connection pooling

#### **3. Models** (`models/`)
- **Trip:** Travel journey with metadata
- **Step:** Individual location entry
- **Story:** Shareable reel/narrative
- **StorySlide:** Individual slide in story
- **User:** Authentication & profile

#### **4. Schemas** (`schemas/`)
- **Purpose:** Pydantic request/response validation
- **Benefits:** Type safety, automatic OpenAPI docs
- Separate models for create/read/update operations

#### **5. Services** (`services/`)
**Trip Service:**
- Create, read, update, delete trips
- Calculate distances using Haversine formula
- Generate GeoJSON routes
- Manage trip sharing & public links

**Step Service:**
- Add/update/delete location entries
- Idempotent creation (prevents duplicates)
- Duration tracking per location
- Photo & note management

**Stories Service:**
- Generate story reels from trip steps
- Smart slide selection (photos first)
- Music metadata storage
- Share token generation

**Recommendations Service:**
- Query Gemini API for location recommendations
- Filter by budget & recommendation type
- Handle user questions
- Fallback to mock data

**AI Chronicler Service:**
- Generate poetic journal entries
- Call external AI endpoint
- Store enriched content

#### **6. Utils** (`utils/`) ⭐ NEW
**distance.py:**
- `calculate_haversine_distance()` - Haversine formula
- `calculate_total_distance()` - Aggregate trip distance

**errors.py:**
- `AppException` base class
- `NotFoundError`, `ForbiddenError`, `ValidationError` subclasses
- `check_ownership()` utility for access control

**config.py:**
- `load_env_variable()` - Consistent environment loading
- `load_from_env_file()` - Reliable .env file reading
- Fallback chain: settings → env var → .env file

#### **7. API Routes** (`api/routes/`)
- RESTful endpoints with FastAPI
- Dependency injection for database & auth
- Proper HTTP status codes
- Error handling via custom exceptions

---

## Frontend Architecture

### Component Hierarchy

```
App (page.tsx)
├── ProtectedRoute
├── TripToolbar (trip selection & creation)
├── TripViewer (map display)
│   └── TripViewerLeaflet (Leaflet integration)
├── TripStatistics (trip metrics)
├── TripSeparation (location grouping)
├── PhotoGallery (photo slideshow)
├── StepModal (add location)
├── EditStepModal (edit location)
├── StoryReelModal (create reel)
├── RecommendationPanel (AI suggestions)
└── EnhancedStatistics (advanced metrics)
```

### Module Organization

#### **lib/types.ts** ⭐ NEW
- Complete TypeScript interfaces
- Eliminates need for `any` types
- Provides IDE autocomplete
- Documents data structures

#### **lib/api.ts**
- Centralized API client
- Token & session management
- Automatic error extraction
- Request/response serialization

#### **lib/errors.ts** ⭐ NEW
- Unified error extraction
- Error formatting for UI
- Structured logging
- Development debugging support

#### **lib/stats.ts** ⭐ NEW
- Trip duration calculations
- Destination analysis
- Distance aggregation
- Event frequency analysis

#### **lib/distance.ts**
- Geographic calculations
- Haversine formula implementation
- Type-safe coordinate handling

#### **lib/theme.ts**
- Dark/light color schemes
- Consistent styling
- Theme switching logic

#### **lib/search.ts**
- Filter & search utilities
- Advanced trip filtering
- Location search

#### **lib/export.ts**
- Data export formats
- CSV generation
- Print-friendly views

---

## Data Flow

### Trip Creation Flow

```
1. User clicks "Create Trip"
   ↓
2. Frontend: POST /api/trips { title, description }
   ↓
3. Backend Route: verify JWT token
   ↓
4. Service: create_trip() 
   ├─ Insert Trip record
   ├─ Generate UUID
   ├─ Store user_id
   └─ Commit transaction
   ↓
5. Backend Response: TripRead schema
   ↓
6. Frontend: Update trips list
   ↓
7. UI: Navigate to trip editor
```

### Location Step Creation Flow

```
1. User clicks map to add location
   ↓
2. Frontend: StepModal opens with coordinates
   ↓
3. User submits location details
   ↓
4. Frontend: POST /api/steps { trip_id, lat, lng, ... }
   ↓
5. Backend Service: add_step()
   ├─ Check trip exists & belongs to user
   ├─ Verify coordinates validity
   ├─ Check for duplicate (client_uuid)
   ├─ Insert Step record
   └─ Handle idempotency
   ↓
6. Backend: Refresh trip with new distance calc
   ↓
7. Frontend: Update map markers & distance display
```

### Trip Sharing Flow

```
1. User clicks "Share" on trip
   ↓
2. Frontend: POST /api/trips/{trip_id}/share
   ↓
3. Backend: 
   ├─ Verify ownership
   ├─ Generate secure token (32-char URL-safe)
   ├─ Set is_public = true
   └─ Return share link
   ↓
4. Frontend: Display share URL
   ↓
5. User shares link publicly
   ↓
6. Visitor: GET /api/trips/shared/{share_token}
   ↓
7. Backend: No auth required, return trip + steps
   ↓
8. Frontend: Display read-only trip view
```

---

## Database Schema

### Core Tables

**users**
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255),
  hashed_password VARCHAR(255) NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
);
```

**trips**
```sql
CREATE TABLE trips (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_public BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(64) UNIQUE,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**steps**
```sql
CREATE TABLE steps (
  id VARCHAR(36) PRIMARY KEY,
  trip_id VARCHAR(36) NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  altitude FLOAT,
  timestamp DATETIME NOT NULL,
  note TEXT,
  image_url VARCHAR(255),
  location_name VARCHAR(255),
  client_uuid VARCHAR(36),
  duration_days INTEGER,
  created_at DATETIME,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);
```

**stories**
```sql
CREATE TABLE stories (
  id VARCHAR(36) PRIMARY KEY,
  trip_id VARCHAR(36) NOT NULL,
  status VARCHAR(50),
  is_public BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(64) UNIQUE,
  song_provider VARCHAR(50),
  song_id VARCHAR(255),
  song_title VARCHAR(255),
  song_thumbnail VARCHAR(255),
  song_start_time INTEGER,
  song_duration INTEGER,
  created_at DATETIME,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);
```

**story_slides**
```sql
CREATE TABLE story_slides (
  id VARCHAR(36) PRIMARY KEY,
  story_id VARCHAR(36) NOT NULL,
  order_index INTEGER NOT NULL,
  image_url VARCHAR(255),
  caption TEXT,
  map_tile_url VARCHAR(255),
  duration_ms INTEGER,
  FOREIGN KEY (story_id) REFERENCES stories(id)
);
```

---

## Authentication Flow

```
Frontend                       Backend
   │                              │
   ├─ POST /auth/login ────────→ │
   │   (email, password)       │
   │                              │
   │   ← (access_token,        ←─│
   │     refresh_token)           │
   │                              │
   │  [Store in session]          │
   │                              │
   ├─ GET /trips ────────────→  │
   │  (Bearer: access_token)    │
   │                              │
   │   ← [Trips data] ─────────←─│
   │
   ... (token expires after 1 hour)
   │
   ├─ POST /auth/refresh ───→  │
   │   (refresh_token)         │
   │                              │
   │   ← (new_access_token)   ←─│
   │                              │
   └─ Ready to continue
```

---

## Error Handling Strategy

### Backend Custom Exceptions

```python
AppException (base)
├─ NotFoundError (404)
│  └─ Trip not found, Step not found
├─ ForbiddenError (403)
│  └─ Ownership verification failed
└─ ValidationError (422)
   └─ Invalid coordinates, missing fields
```

### Frontend Error Extract

```typescript
extractErrorMessage(error) → string

Handles:
- HTTP response bodies (detail, message, errors)
- Error thrown during API call
- Network errors
- Timeout errors
- JSON parsing errors
```

---

## Performance Considerations

### Backend Optimizations
- ✅ Async/await throughout (non-blocking I/O)
- ✅ Database connection pooling
- ✅ Efficient distance calculations (vectorized)
- ✅ Indexed database queries
- ✅ Lazy loading prevention

### Frontend Optimizations
- ✅ Code splitting with Next.js dynamic imports
- ✅ Memoized components (React.memo)
- ✅ Debounced API calls
- ✅ CSS-in-JS minimization
- ✅ Image lazy loading

### Database Optimizations
- ✅ Composite indexes on (user_id, created_at)
- ✅ Foreign key constraints
- ✅ VARCHAR(36) for UUIDs stored as strings

---

## Security Measures

1. **Authentication:** JWT tokens with 1-hour expiration
2. **Password:** Bcrypt hashing (rounds = 10)
3. **Authorization:** Ownership checks on all trips/steps
4. **CORS:** Whitelist allowed origins
5. **HTTPS:** Enforced in production
6. **SQL Injection:** Protected by SQLAlchemy ORM
7. **XSS:** Pydantic validation + React escaping
8. **CSRF:** Stateless JWT (no session cookies)

---

## Deployment Architecture

```
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │          │
┌───▼──┐  ┌───▼──┐
│Back 1│  │Back 2│  (Scaled replicas)
└───┬──┘  └───┬──┘
    │         │
    └────┬────┘
         │
    ┌────▼────────┐
    │  PostgreSQL  │ (Production database)
    └─────────────┘
    
┌─────────────────────┐
│  CDN (Static Files) │
└─────────────────────┘
    │
    │
┌───▼────────────┐
│ Next.js Frontend│
└────────────────┘
```

---

## Future Enhancements

- [ ] WebSocket real-time trip updates
- [ ] Offline mode with sync
- [ ] Mobile native apps (React Native)
- [ ] Advanced filtering & search
- [ ] Trip export (PDF, CSV)
- [ ] Social features (following, feeds)
- [ ] Multi-user trips collaboration
- [ ] ML-based recommendations
