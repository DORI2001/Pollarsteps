# Developer Guide - Refactored Pollarsteps

## Quick Start

### Backend Setup
```bash
cd backend_app
export PYTHONPATH=.:$PYTHONPATH
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Run Tests
```bash
cd /
python test_integration.py
```

---

## Backend - Using New Utilities

### Distance Calculations
```python
from app.utils.distance import calculate_total_distance, calculate_haversine_distance

# Calculate distance between two points
distance = calculate_haversine_distance(lat1, lng1, lat2, lng2)  # Returns float (km)

# Calculate total trip distance
total_distance = calculate_total_distance(steps)  # Steps list with lat/lng
```

### Error Handling
```python
from app.utils.errors import NotFoundError, ForbiddenError, ValidationError, check_ownership

# Raise specific errors
raise NotFoundError("Trip")  # Returns 404
raise ForbiddenError("You don't have access")  # Returns 403
raise ValidationError("Invalid email format")  # Returns 422

# Check ownership with automatic type conversion
check_ownership(resource.user_id, current_user.id, "Trip")
```

### Configuration
```python
from app.utils.config import load_env_variable, load_from_env_file

# Load environment variable with logging
api_key = load_env_variable("GEMINI_API_KEY", required=True)

# Load from .env file
secret = load_from_env_file("/path/to/.env", "SECRET_KEY")
```

---

## Frontend - Using New Types

### Import Types
```typescript
import {
  Trip,
  Step,
  User,
  Recommendation,
  LocationRecommendations,
  APIError,
} from "@/lib/types";

// Now your components have full type safety
const handleTrip = (trip: Trip) => {
  console.log(trip.title, trip.total_distance);
};
```

### Error Handling
```typescript
import { extractErrorMessage, logError, formatErrorForUser } from "@/lib/errors";

try {
  // ... API call
} catch (error) {
  // Get error message consistently
  const message = extractErrorMessage(error);
  
  // Log with context
  logError("TripCreation", error, { tripTitle: "My Trip" });
  
  // Format for user display
  alert(formatErrorForUser(error));
}
```

### Statistics Calculations
```typescript
import {
  calculateTotalDays,
  calculateTripDuration,
  calculateAverageDays,
  getTripStatistics,
} from "@/lib/stats";

const trip: Trip = { /* ... */ };
const stats = getTripStatistics(trip);

console.log(stats.totalDistance);           // Total km traveled
console.log(stats.numberOfLocations);      // Number of steps
console.log(stats.daysAtDestinations);     // Total days at destinations
console.log(stats.averageDaysPerDestination); // Average stay
```

### Distance Calculations
```typescript
import { calculateDistance, calculateTotalDistance } from "@/lib/distance";

// Distance between two points
const dist = calculateDistance(lat1, lon1, lat2, lon2); // km

// Total distance for trip
const total = calculateTotalDistance(steps);
```

### Search and Filtering
```typescript
import { filterTrips, type AdvancedTripFilter } from "@/lib/search";

const filters: AdvancedTripFilter = {
  searchText: "Paris",
  minDistance: 100,
  maxLocations: 50,
  sortBy: "distance",
  sortOrder: "desc",
};

const filtered = filterTrips(trips, filters);
```

---

## API Client - Proper Error Handling

```typescript
import { api } from "@/lib/api";
import { extractErrorMessage, formatErrorForUser } from "@/lib/errors";

try {
  const trips = await api.getTrips(token);
} catch (error) {
  // The API client now returns typed errors
  const userMessage = formatErrorForUser(error);
  console.error("Failed to fetch trips:", extractErrorMessage(error));
}
```

---

## New File Structure

```
backend_app/
├── app/
│   ├── utils/              ← NEW: Utility modules
│   │   ├── __init__.py
│   │   ├── distance.py     (Distance calculations)
│   │   ├── errors.py       (Error handling)
│   │   └── config.py       (Configuration)
│   ├── api/
│   │   └── routes/         (Uses error utilities)
│   ├── services/           (Uses distance utilities)
│   └── models/

frontend/
├── lib/                    ← ENHANCED: Utility modules
│   ├── types.ts           (Complete type definitions)
│   ├── errors.ts          (NEW: Error utilities)
│   ├── stats.ts           (NEW: Statistics calculations)
│   ├── distance.ts        (Enhanced with types)
│   ├── search.ts          (Enhanced with types)
│   ├── api.ts             (Improved types)
│   └── export.ts
└── components/
```

---

## Common Patterns

### Backend - Service Function
```python
from app.utils.distance import calculate_total_distance
from app.utils.errors import NotFoundError, check_ownership

async def get_trip_with_steps(trip_id: UUID, session: AsyncSession) -> Trip:
    trip = await session.get(Trip, str(trip_id))
    if not trip:
        raise NotFoundError("Trip")
    
    steps = await get_steps(session, trip_id)
    trip.total_distance = calculate_total_distance(steps)
    return trip
```

### Backend - API Route
```python
from app.utils.errors import check_ownership

@router.delete("/{trip_id}")
async def delete_trip(
    trip_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    trip = get_trip(session, trip_id)
    check_ownership(trip.user_id, current_user.id, "Trip")
    # ... deletion logic
```

### Frontend - Component
```typescript
import { Trip, APIError } from "@/lib/types";
import { extractErrorMessage, formatErrorForUser } from "@/lib/errors";
import { getTripStatistics } from "@/lib/stats";

export function TripCard({ trip }: { trip: Trip }) {
  const stats = getTripStatistics(trip);
  
  return (
    <div>
      <h3>{trip.title}</h3>
      <p>Distance: {stats.totalDistance}km</p>
      <p>Locations: {stats.numberOfLocations}</p>
    </div>
  );
}
```

---

## Testing

### Run All Tests
```bash
python test_integration.py
```

### Expected Output
```
[Auth Tests]
  ✓ PASS Health Check
  ✓ PASS Register User
  ✓ PASS Login User

[Trip Tests]
  ✓ PASS Create Trip
  ✓ PASS Get Trips
  ✓ PASS Get Trip with Steps

[Step Tests]
  ✓ PASS Create Step
  ✓ PASS Get Steps
  ✓ PASS Update Step
  ✓ PASS Delete Step

[Cleanup Tests]
  ✓ PASS Delete Trip

============================================================
Test Summary
============================================================
  Passed: 11
  Failed: 0
```

---

## Best Practices Going Forward

### ✅ DO:
- Use utilities instead of duplicating code
- Use typed imports from `lib/types.ts`
- Use error utilities for consistent error handling
- Use stats utilities for calculations
- Import from centralized utility modules

### ❌ DON'T:
- Use `any` types in frontend
- Duplicate error handling logic
- Copy-paste calculation functions
- Manual type definitions when types exist
- Use print() instead of logging

---

## Troubleshooting

### Backend Won't Start
```bash
# Check Python path
export PYTHONPATH=backend_app:$PYTHONPATH

# Check environment
cat backend_app/.env

# Verify imports
python -c "from app.utils import calculate_total_distance; print('OK')"
```

### Frontend Type Errors
```bash
# Ensure types are exported from lib/types.ts
# Make sure to import from correct path

import { Trip } from "@/lib/types";  # ✓ Correct
import type { Trip } from "@/lib/types";  // Also works for types
```

### Tests Failing
```bash
# Make sure backend is running on port 8000
lsof -i :8000

# Check test output for specific error
python test_integration.py
```

---

## Next Steps

1. ✅ All refactoring complete
2. ✅ All tests passing
3. 📦 Ready for deployment
4. 📊 Monitor performance in production
5. 🔄 Continue using utilities for new features

---

## Questions?

Refer to:
- `REFACTORING_SUMMARY.md` - High-level overview
- `backend_app/app/utils/` - Backend utility code
- `frontend/lib/` - Frontend utility code
- Test file: `test_integration.py` - Testing examples
