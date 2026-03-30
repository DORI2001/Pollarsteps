# API Reference - Pollarsteps

Complete REST API endpoint documentation with examples.

**Base URL:** `http://localhost:8000/api`

**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)

---

## Authentication Endpoints

### Register User
Create a new user account.

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `400` - Email already registered
- `422` - Validation error (weak password)

---

### Login
Authenticate with email and password.

```http
POST /auth/login
Content-Type: application/json

{
  "email_or_username": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errors:**
- `401` - Invalid credentials
- `404` - User not found

---

### Refresh Token
Get a new access token using refresh token.

```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

## Trip Endpoints

### Create Trip
Add a new trip to user's collection.

```http
POST /trips
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Europe 2026",
  "description": "5-week backpacking adventure",
  "start_date": "2026-06-01",
  "end_date": "2026-07-05"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Europe 2026",
  "description": "5-week backpacking adventure",
  "start_date": "2026-06-01",
  "end_date": "2026-07-05",
  "is_public": false,
  "share_token": null,
  "total_distance": 0,
  "total_steps": 0,
  "created_at": "2026-03-30T10:00:00",
  "updated_at": "2026-03-30T10:00:00"
}
```

**Errors:**
- `401` - Not authenticated
- `422` - Invalid date format or validation error

---

### Get All User Trips
Retrieve all trips for authenticated user.

```http
GET /trips
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Europe 2026",
    "total_distance": 2453.5,
    "total_steps": 12,
    "start_date": "2026-06-01",
    "end_date": "2026-07-05",
    "is_public": false,
    "created_at": "2026-03-30T10:00:00"
  }
]
```

---

### Get Trip with Steps
Get a specific trip with all location steps.

```http
GET /trips/{trip_id}
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `trip_id` (UUID) - Trip identifier

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Europe 2026",
  "description": "5-week backpacking adventure",
  "total_distance": 2453.5,
  "total_steps": 3,
  "route_geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [[13.405, 52.52], [2.3522, 48.8566], [-0.1278, 51.5074]]
        },
        "properties": {"step_count": 3}
      }
    ]
  },
  "steps": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "trip_id": "550e8400-e29b-41d4-a716-446655440000",
      "lat": 52.52,
      "lng": 13.405,
      "altitude": 34,
      "timestamp": "2026-06-01T09:00:00",
      "location_name": "Berlin, Germany",
      "note": "Started our adventure!",
      "image_url": "https://example.com/berlin.jpg",
      "duration_days": 3
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Trip doesn't belong to you
- `404` - Trip not found

---

### Delete Trip
Remove a trip permanently.

```http
DELETE /trips/{trip_id}
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Trip deleted successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not trip owner
- `404` - Trip not found

---

### Generate Share Link
Create a shareable public link for a trip.

```http
POST /trips/{trip_id}/share
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "share_token": "50X_o0-R8l5ZLq1vWx8j3Kg9pQ4xN7mY",
  "share_url": "/shared/50X_o0-R8l5ZLq1vWx8j3Kg9pQ4xN7mY"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not trip owner
- `404` - Trip not found

---

### Revoke Share Link
Remove public access to trip.

```http
DELETE /trips/{trip_id}/share
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Share link revoked"
}
```

---

### View Public Trip
Access a shared trip without authentication.

```http
GET /trips/shared/{share_token}
```

**URL Parameters:**
- `share_token` - Public share token

**Response (200):**
Same as "Get Trip with Steps" response

**Errors:**
- `404` - Share link expired or invalid

---

## Step (Location) Endpoints

### Add Location Step
Add a new location to a trip.

```http
POST /steps
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "lat": 52.52,
  "lng": 13.405,
  "altitude": 34,
  "location_name": "Berlin, Germany",
  "note": "Started our adventure!",
  "image_url": "https://example.com/berlin.jpg",
  "duration_days": 3,
  "timestamp": "2026-06-01T09:00:00",
  "client_uuid": "550e8400-e29b-41d4-a716-446655440100"
}
```

**Field Details:**
- `trip_id` *required* - Parent trip UUID
- `lat`, `lng` *required* - Coordinates
- `altitude` *optional* - Elevation in meters
- `location_name` *optional* - Place name
- `note` *optional* - Personal note or caption
- `image_url` *optional* - Photo URL
- `duration_days` *optional* - Days spent at location
- `timestamp` *optional* - When step was taken (defaults to now)
- `client_uuid` *optional* - Client-generated UUID for idempotency

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "lat": 52.52,
  "lng": 13.405,
  "altitude": 34,
  "timestamp": "2026-06-01T09:00:00",
  "location_name": "Berlin, Germany",
  "note": "Started our adventure!",
  "image_url": "https://example.com/berlin.jpg",
  "duration_days": 3,
  "created_at": "2026-03-30T10:00:00"
}
```

**Errors:**
- `400` - Invalid coordinates
- `401` - Not authenticated
- `404` - Trip not found
- `422` - Validation error

---

### Update Step
Modify a location entry.

```http
PUT /steps/{step_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "location_name": "Berlin, Germany Updated",
  "note": "Amazing city!",
  "duration_days": 4
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "lat": 52.52,
  "lng": 13.405,
  "location_name": "Berlin, Germany Updated",
  "note": "Amazing city!",
  "duration_days": 4
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not trip owner
- `404` - Step not found

---

### Delete Step
Remove a location from trip.

```http
DELETE /steps/{step_id}
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Step deleted successfully"
}
```

---

### List Trip Steps
Get all steps in a trip.

```http
GET /steps/trip/{trip_id}
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Europe 2026",
  "steps": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "lat": 52.52,
      "lng": 13.405,
      "location_name": "Berlin"
    }
  ]
}
```

---

## Story/Reel Endpoints

### Create Story
Generate a story reel from trip photos.

```http
POST /stories
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "song_provider": "youtube",
  "song_id": "dQw4w9WgXcQ",
  "song_title": "Never Gonna Give You Up",
  "song_thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
  "song_start_time": 0,
  "song_duration": 15,
  "max_slides": 10,
  "shareable": true,
  "include_map": true
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440020",
  "trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ready",
  "is_public": true,
  "share_token": "abc123def456ghi789jkl012mno345pq",
  "song_title": "Never Gonna Give You Up",
  "song_duration": 15,
  "slides": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440021",
      "order_index": 0,
      "image_url": "https://example.com/photo1.jpg",
      "caption": "Berlin memories",
      "duration_ms": 4000
    }
  ],
  "created_at": "2026-03-30T10:00:00"
}
```

**Errors:**
- `401` - Not authenticated
- `400` - Trip has no photos
- `403` - Not trip owner
- `404` - Trip not found

---

### Get Story
Retrieve a specific story (private).

```http
GET /stories/{story_id}
Authorization: Bearer <access_token>
```

**Response (200):** Story object (see Create Story response)

---

### Get Public Story
View a public shared story.

```http
GET /stories/public/{share_token}
```

**Response (200):** Story object

---

## Recommendations Endpoints

### Get Location Recommendations
Get AI-powered suggestions for a location.

```http
GET /recommendations/location?location=Berlin&lat=52.52&lon=13.405&rec_type=restaurants&budget=moderate&question=Where%20can%20I%20find%20good%20vegetarian%20food%3F
```

**Query Parameters:**
- `location` *required* - Location name
- `lat` *required* - Latitude
- `lon` *required* - Longitude
- `rec_type` *optional* - "all", "restaurants", "attractions", "activities" (default: "all")
- `budget` *optional* - "budget", "moderate", "luxury" (default: "moderate")
- `question` *optional* - Custom question for AI

**Response (200):**
```json
{
  "location": "Berlin",
  "recommendations": [
    {
      "title": "Café V",
      "type": "restaurant",
      "description": "Cozy vegan café in Kreuzberg",
      "why_recommended": "Perfect for vegetarian visitors seeking authentic Berlin food",
      "estimated_time": "1-2 hours"
    }
  ],
  "summary": "Berlin offers excellent vegetarian options..."
}
```

**Errors:**
- `422` - Missing required parameters
- `500` - Gemini API error (falls back to mock data)

---

## Analytics Endpoints

### Get Trip Statistics
Retrieve comprehensive trip analytics.

```http
GET /analytics/trip/{trip_id}
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Europe 2026",
  "total_distance": 2453.5,
  "total_steps": 12,
  "unique_countries": 3,
  "avg_stay_per_location": 3.5,
  "trip_duration_days": 35,
  "start_date": "2026-06-01",
  "end_date": "2026-07-05"
}
```

---

## AI Chronicler Endpoint

### Generate Poetic Entry
Create an enriched journal entry with AI.

```http
POST /ai/chronicler
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "location_name": "Berlin, Germany",
  "latitude": 52.52,
  "longitude": 13.405,
  "user_note": "Explored the Brandenburg Gate",
  "mood": "inspired",
  "weather": "sunny"
}
```

**Response (200):**
```json
{
  "poetic_journal": "At the heart of Berlin, beneath the watchful gaze of the Brandenburg Gate, history whispered its secrets..."
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "detail": "Error description or [{'loc': ['field'], 'msg': 'error', 'type': 'value_error'}]"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad request (client error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `422` - Validation error
- `500` - Server error

---

## Rate Limiting

Currently no rate limiting. Production deployments should implement:

```
- 100 requests / 15 minutes per IP
- 1000 requests / 1 hour per authenticated user
- 10 requests / second for /recommendations
```

---

## Pagination

Currently not implemented. For large datasets, consider:

```
GET /trips?skip=0&limit=20
```

---

## Filtering & Sorting

Enhancement proposal:

```
GET /trips?sort=-created_at&filter[is_public]=true
```

---

## Versioning

Current API version: **v1**

Future versions will be prefixed: `/api/v2/...`

---

**Last Updated:** March 30, 2026  
**Specification Version:** 1.0
