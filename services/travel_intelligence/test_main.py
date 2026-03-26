"""
Tests for Travel Intelligence Microservice
"""
import pytest
from fastapi.testclient import TestClient
from main import app, haversine_distance, identify_country, get_continent, LocationPoint, TripData


client = TestClient(app)


class TestHealth:
    def test_health_check(self):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Travel Intelligence"


class TestUtilities:
    def test_haversine_distance_paris_london(self):
        """Test distance calculation between Paris and London"""
        # Paris: 48.8566, 2.3522
        # London: 51.5074, -0.1278
        distance = haversine_distance(48.8566, 2.3522, 51.5074, -0.1278)
        # Expected distance is approximately 344 km
        assert 340 < distance < 350

    def test_haversine_distance_zero(self):
        """Test distance between same point is zero"""
        distance = haversine_distance(48.8566, 2.3522, 48.8566, 2.3522)
        assert distance < 1

    def test_identify_country_paris(self):
        """Test country identification for Paris"""
        country = identify_country(48.8566, 2.3522)
        assert country == "France"

    def test_identify_country_tokyo(self):
        """Test country identification for Tokyo"""
        country = identify_country(35.6762, 139.6503)
        assert country == "Japan"

    def test_get_continent_europe(self):
        """Test continent identification for European country"""
        assert get_continent("France") == "Europe"
        assert get_continent("Germany") == "Europe"

    def test_get_continent_asia(self):
        """Test continent identification for Asian country"""
        assert get_continent("Japan") == "Asia"
        assert get_continent("Thailand") == "Asia"


class TestTripoAnalytics:
    def test_analyze_trip_basic(self):
        """Test basic trip analysis"""
        trip = TripData(
            trip_id="test-trip-1",
            title="Europe Tour",
            start_date="2026-03-15T00:00:00Z",
            steps=[
                LocationPoint(
                    lat=48.8566,
                    lng=2.3522,
                    timestamp="2026-03-15T10:00:00Z",
                    note="Paris",
                    altitude=35,
                ),
                LocationPoint(
                    lat=51.5074,
                    lng=-0.1278,
                    timestamp="2026-03-18T14:00:00Z",
                    note="London",
                    altitude=11,
                ),
            ],
        )

        response = client.post("/analyze/trip", json=trip.model_dump())
        assert response.status_code == 200
        data = response.json()

        assert data["trip_id"] == "test-trip-1"
        assert data["total_steps"] == 2
        assert data["countries_visited"] >= 1
        assert 340 < data["total_distance_km"] < 350
        assert data["duration_days"] >= 3

    def test_analyze_trip_multiple_countries(self):
        """Test trip with multiple countries"""
        trip = TripData(
            trip_id="test-trip-2",
            title="World Tour",
            start_date="2026-01-01T00:00:00Z",
            steps=[
                LocationPoint(lat=48.8566, lng=2.3522, note="Paris", altitude=35),
                LocationPoint(lat=51.5074, lng=-0.1278, note="London", altitude=11),
                LocationPoint(lat=35.6762, lng=139.6503, note="Tokyo", altitude=40),
                LocationPoint(lat=40.7128, lng=-74.0060, note="NYC", altitude=10),
            ],
        )

        response = client.post("/analyze/trip", json=trip.model_dump())
        assert response.status_code == 200
        data = response.json()

        assert data["total_steps"] == 4
        assert data["countries_visited"] >= 3

    def test_analyze_trip_insufficient_steps(self):
        """Test that trip with less than 2 steps fails"""
        trip = TripData(
            trip_id="test-trip-3",
            title="Too Short",
            steps=[LocationPoint(lat=48.8566, lng=2.3522, note="Paris")],
        )

        response = client.post("/analyze/trip", json=trip.model_dump())
        assert response.status_code == 400


class TestLocationInsights:
    def test_location_insight_paris(self):
        """Test location insight for Paris"""
        response = client.get("/insights/location?lat=48.8566&lng=2.3522")
        assert response.status_code == 200
        data = response.json()

        assert data["country"] == "France"
        assert data["continent"] == "Europe"
        assert len(data["fun_fact"]) > 0
        assert len(data["must_see"]) > 0

    def test_location_insight_tokyo(self):
        """Test location insight for Tokyo"""
        response = client.get("/insights/location?lat=35.6762&lng=139.6503")
        assert response.status_code == 200
        data = response.json()

        assert data["country"] == "Japan"
        assert data["continent"] == "Asia"


class TestRecommendations:
    def test_default_recommendations(self):
        """Test default recommendations when no trip data provided"""
        response = client.get("/recommend")
        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) > 0
        assert all("recommendation" in rec for rec in data)


class TestTripSummary:
    def test_generate_trip_summary(self):
        """Test trip summary generation"""
        trip = TripData(
            trip_id="test-trip-4",
            title="Mediterranean Adventure",
            start_date="2026-03-01T00:00:00Z",
            steps=[
                LocationPoint(
                    lat=48.8566,
                    lng=2.3522,
                    timestamp="2026-03-01T10:00:00Z",
                    note="Paris",
                    altitude=35,
                ),
                LocationPoint(
                    lat=41.9028,
                    lng=12.4964,
                    timestamp="2026-03-05T14:00:00Z",
                    note="Rome",
                    altitude=20,
                ),
                LocationPoint(
                    lat=40.4168,
                    lng=-3.7038,
                    timestamp="2026-03-10T09:00:00Z",
                    note="Madrid",
                    altitude=650,
                ),
            ],
        )

        response = client.post("/generate/summary", json=trip.model_dump())
        assert response.status_code == 200
        data = response.json()

        assert data["trip_id"] == "test-trip-4"
        assert data["title"] == "Mediterranean Adventure"
        assert "summary" in data
        assert "stats" in data
        assert len(data["summary"]) > 0


class TestBatchEnrich:
    def test_batch_enrich_locations(self):
        """Test batch location enrichment"""
        locations = [
            LocationPoint(lat=48.8566, lng=2.3522, note="Paris"),
            LocationPoint(lat=51.5074, lng=-0.1278, note="London"),
            LocationPoint(lat=35.6762, lng=139.6503, note="Tokyo"),
        ]

        response = client.post("/batch/enrich", json=[loc.model_dump() for loc in locations])
        assert response.status_code == 200
        data = response.json()

        assert len(data) == 3
        assert all("country" in loc for loc in data)
        assert all("continent" in loc for loc in data)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
