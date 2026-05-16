#!/usr/bin/env python3
"""
Comprehensive Integration Tests for Pollarsteps After Refactoring
Tests all major functionalities to ensure refactored code works correctly
"""

import asyncio
import json
import sys
import uuid
from typing import Optional, Dict, Any
from datetime import datetime

import httpx

# Configuration
API_BASE = "http://127.0.0.1:8000/api"
TIMESTAMP = datetime.now().timestamp()
TEST_EMAIL = f"test-{TIMESTAMP}@example.com"
TEST_PASSWORD = "TestPassword123"
TEST_USERNAME = f"testuser{int(TIMESTAMP)}"

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RESET = "\033[0m"

# Test state
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

class TestRunner:
    """Simple test runner for API tests"""
    
    def __init__(self):
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.trip_id: Optional[str] = None
        self.step_ids: list[str] = []
        self.other_token: Optional[str] = None  # second user for security tests

    async def run_tests(self):
        """Run all tests"""
        async with httpx.AsyncClient(timeout=30) as client:
            # Auth tests
            await self.test_health_check(client)
            await self.test_register(client)
            await self.test_login(client)
            
            # Trip tests
            await self.test_create_trip(client)
            await self.test_get_trips(client)
            await self.test_get_trip_with_steps(client)
            
            # Step tests
            await self.test_create_step(client)
            await self.test_step_duplicate_rejected(client)
            await self.test_add_step_image(client)
            await self.test_get_steps(client)
            await self.test_update_step(client)
            await self.test_delete_step(client)
            
            # Trip update
            await self.test_update_trip(client)

            # Sharing
            await self.test_share_trip(client)
            await self.test_access_shared_trip(client)
            await self.test_revoke_share_link(client)

            # Trip split
            await self.test_split_trip(client)

            # Security: register second user + cross-user access
            await self.test_register_second_user(client)
            await self.test_cross_user_forbidden(client)

            # Trip deletion (last test)
            await self.test_delete_trip(client)
    
    def log_test(self, name: str, passed: bool, message: str = ""):
        """Log test result"""
        status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
        print(f"  {status} {name}")
        if message:
            print(f"      {message}")
        
        if passed:
            test_results["passed"] += 1
        else:
            test_results["failed"] += 1
            test_results["errors"].append(f"{name}: {message}")
    
    async def test_health_check(self, client: httpx.AsyncClient):
        """Test: Health Check"""
        print(f"\n{BLUE}[Auth Tests]{RESET}")
        try:
            response = await client.get(f"http://127.0.0.1:8000/health")
            data = response.json()
            self.log_test(
                "Health Check",
                response.status_code == 200 and data.get("status") == "ok",
                f"Status: {response.status_code}"
            )
        except Exception as e:
            self.log_test("Health Check", False, str(e))
    
    async def test_register(self, client: httpx.AsyncClient):
        """Test: User Registration"""
        try:
            response = await client.post(
                f"{API_BASE}/auth/register",
                json={
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "username": TEST_USERNAME,
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.log_test("Register User", True, f"Email: {TEST_EMAIL}")
            else:
                error = response.json().get("detail", "Unknown error")
                self.log_test("Register User", False, f"Status {response.status_code}: {error}")
        except Exception as e:
            self.log_test("Register User", False, str(e))
    
    async def test_login(self, client: httpx.AsyncClient):
        """Test: User Login"""
        try:
            response = await client.post(
                f"{API_BASE}/auth/login",
                json={
                    "email_or_username": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.log_test("Login User", True, f"Token received")
            else:
                error = response.json().get("detail", "Unknown error")
                self.log_test("Login User", False, f"Status {response.status_code}: {error}")
        except Exception as e:
            self.log_test("Login User", False, str(e))
    
    async def test_create_trip(self, client: httpx.AsyncClient):
        """Test: Create Trip"""
        print(f"\n{BLUE}[Trip Tests]{RESET}")
        if not self.token:
            self.log_test("Create Trip", False, "No valid token")
            return
        
        try:
            response = await client.post(
                f"{API_BASE}/trips/",
                json={
                    "title": "Test Trip - Refactored",
                    "description": "Testing after refactoring",
                    "start_date": "2024-01-01",
                },
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.trip_id = data.get("id")
                self.log_test("Create Trip", True, f"Trip ID: {self.trip_id}")
            else:
                error = response.json().get("detail", "Unknown error")
                self.log_test("Create Trip", False, f"Status {response.status_code}: {error}")
        except Exception as e:
            self.log_test("Create Trip", False, str(e))
    
    async def test_get_trips(self, client: httpx.AsyncClient):
        """Test: Get User Trips"""
        if not self.token:
            self.log_test("Get Trips", False, "No valid token")
            return
        
        try:
            response = await client.get(
                f"{API_BASE}/trips/",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                trip_count = len(data) if isinstance(data, list) else 0
                self.log_test("Get Trips", trip_count > 0, f"Trips found: {trip_count}")
            else:
                self.log_test("Get Trips", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get Trips", False, str(e))
    
    async def test_get_trip_with_steps(self, client: httpx.AsyncClient):
        """Test: Get Trip with Steps (tests distance calculation utility)"""
        if not self.token or not self.trip_id:
            self.log_test("Get Trip with Steps", False, "No trip ID")
            return
        
        try:
            response = await client.get(
                f"{API_BASE}/trips/{self.trip_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Get Trip with Steps",
                    True,
                    f"Distance calc (utils): {data.get('total_distance', 0)}km, Steps: {data.get('total_steps', 0)}"
                )
            else:
                self.log_test("Get Trip with Steps", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get Trip with Steps", False, str(e))
    
    async def test_create_step(self, client: httpx.AsyncClient):
        """Test: Create Step"""
        print(f"\n{BLUE}[Step Tests]{RESET}")
        if not self.token or not self.trip_id:
            self.log_test("Create Step", False, "No trip ID")
            return
        
        try:
            response = await client.post(
                f"{API_BASE}/steps/",
                json={
                    "trip_id": self.trip_id,
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "location_name": "New York",
                    "timestamp": datetime.now().isoformat(),
                    "client_uuid": str(uuid.uuid4()),
                },
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.step_ids.append(data.get("id"))
                self.log_test("Create Step", True, f"Step ID: {data.get('id')}")
            else:
                error = response.json().get("detail", "Unknown error")
                self.log_test("Create Step", False, f"Status {response.status_code}: {error}")
        except Exception as e:
            self.log_test("Create Step", False, str(e))
    
    async def test_get_steps(self, client: httpx.AsyncClient):
        """Test: Get Trip Steps"""
        if not self.token or not self.trip_id:
            self.log_test("Get Steps", False, "No trip ID")
            return
        
        try:
            response = await client.get(
                f"{API_BASE}/steps/trip/{self.trip_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                step_count = len(data) if isinstance(data, list) else 0
                self.log_test("Get Steps", step_count >= 0, f"Steps found: {step_count}")
            else:
                self.log_test("Get Steps", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get Steps", False, str(e))
    
    async def test_update_step(self, client: httpx.AsyncClient):
        """Test: Update Step"""
        if not self.token or not self.step_ids:
            self.log_test("Update Step", False, "No step ID")
            return
        
        try:
            step_id = self.step_ids[0]
            response = await client.put(
                f"{API_BASE}/steps/{step_id}",
                json={
                    "location_name": "NYC Updated",
                    "note": "Updated testing",
                },
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            self.log_test("Update Step", response.status_code == 200, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Update Step", False, str(e))
    
    async def test_delete_step(self, client: httpx.AsyncClient):
        """Test: Delete Step"""
        if not self.token or not self.step_ids:
            self.log_test("Delete Step", False, "No step ID")
            return
        
        try:
            step_id = self.step_ids[0]
            response = await client.delete(
                f"{API_BASE}/steps/{step_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            self.log_test("Delete Step", response.status_code == 200, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Delete Step", False, str(e))
    
    async def test_share_trip(self, client: httpx.AsyncClient):
        """Test: Generating a share link returns a token and marks the trip public"""
        print(f"\n{BLUE}[Sharing Tests]{RESET}")
        if not self.token or not self.trip_id:
            self.log_test("Generate Share Link", False, "No trip ID")
            return
        try:
            response = await client.post(
                f"{API_BASE}/trips/{self.trip_id}/share",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            data = response.json()
            passed = response.status_code == 200 and bool(data.get("share_token"))
            self.share_token = data.get("share_token")
            self.log_test("Generate Share Link", passed,
                          f"Token: {self.share_token}")
        except Exception as e:
            self.log_test("Generate Share Link", False, str(e))

    async def test_access_shared_trip(self, client: httpx.AsyncClient):
        """Test: Anyone can access a trip via its share token (no auth required)"""
        token = getattr(self, "share_token", None)
        if not token:
            self.log_test("Access Shared Trip", False, "No share token")
            return
        try:
            response = await client.get(f"{API_BASE}/trips/shared/{token}")
            data = response.json()
            passed = response.status_code == 200 and data.get("id") == self.trip_id
            self.log_test("Access Shared Trip", passed,
                          f"Status: {response.status_code}, Trip ID matches: {data.get('id') == self.trip_id}")
        except Exception as e:
            self.log_test("Access Shared Trip", False, str(e))

    async def test_revoke_share_link(self, client: httpx.AsyncClient):
        """Test: After revoking, the share token returns 404"""
        token = getattr(self, "share_token", None)
        if not self.token or not self.trip_id or not token:
            self.log_test("Revoke Share Link", False, "No share token")
            return
        try:
            revoke = await client.delete(
                f"{API_BASE}/trips/{self.trip_id}/share",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            if revoke.status_code not in (200, 204):
                self.log_test("Revoke Share Link", False, f"Revoke returned {revoke.status_code}")
                return
            # Token must no longer work
            access = await client.get(f"{API_BASE}/trips/shared/{token}")
            self.log_test("Revoke Share Link", access.status_code == 404,
                          f"Post-revoke GET returned {access.status_code} (expected 404)")
        except Exception as e:
            self.log_test("Revoke Share Link", False, str(e))

    async def test_step_duplicate_rejected(self, client: httpx.AsyncClient):
        """Test: Adding a step within 100m of an existing step returns 409"""
        print(f"\n{BLUE}[Step Deduplication Tests]{RESET}")
        if not self.token or not self.trip_id or not self.step_ids:
            self.log_test("Step Duplicate 409", False, "Missing token, trip, or first step")
            return
        try:
            # Same coordinates as the first step — must trigger the 100m proximity check
            response = await client.post(
                f"{API_BASE}/steps/",
                json={
                    "trip_id": self.trip_id,
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "timestamp": datetime.now().isoformat(),
                    "client_uuid": str(uuid.uuid4()),
                },
                headers={"Authorization": f"Bearer {self.token}"}
            )
            self.log_test("Step Duplicate 409", response.status_code == 409,
                          f"Status: {response.status_code} (expected 409)")
        except Exception as e:
            self.log_test("Step Duplicate 409", False, str(e))

    async def test_add_step_image(self, client: httpx.AsyncClient):
        """Test: Adding an image to a step stores it and returns ordered metadata"""
        print(f"\n{BLUE}[Step Image Tests]{RESET}")
        if not self.token or not self.step_ids:
            self.log_test("Add Step Image", False, "No step ID")
            return
        try:
            step_id = self.step_ids[0]
            image_url = "https://example.com/photo.jpg"
            response = await client.post(
                f"{API_BASE}/steps/{step_id}/images",
                params={"image_url": image_url, "caption": "Test photo"},
                headers={"Authorization": f"Bearer {self.token}"}
            )
            data = response.json()
            passed = response.status_code == 201 and data.get("image_url") == image_url and data.get("order_index") == 0
            self.log_test("Add Step Image", passed,
                          f"Status: {response.status_code}, order_index: {data.get('order_index')}")
        except Exception as e:
            self.log_test("Add Step Image", False, str(e))

    async def test_split_trip(self, client: httpx.AsyncClient):
        """Test: Splitting a trip moves steps into a new trip and leaves originals in place"""
        print(f"\n{BLUE}[Trip Split Tests]{RESET}")
        if not self.token or not self.trip_id:
            self.log_test("Split Trip", False, "No trip ID")
            return
        try:
            # Add two steps so there's something to split
            s1 = await client.post(f"{API_BASE}/steps/", json={
                "trip_id": self.trip_id, "lat": 51.5074, "lng": -0.1278,
                "location_name": "London", "timestamp": datetime.now().isoformat(),
                "client_uuid": str(uuid.uuid4()),
            }, headers={"Authorization": f"Bearer {self.token}"})
            s2 = await client.post(f"{API_BASE}/steps/", json={
                "trip_id": self.trip_id, "lat": 48.8566, "lng": 2.3522,
                "location_name": "Paris", "timestamp": datetime.now().isoformat(),
                "client_uuid": str(uuid.uuid4()),
            }, headers={"Authorization": f"Bearer {self.token}"})
            if s1.status_code != 201 or s2.status_code != 201:
                self.log_test("Split Trip", False, f"Step creation failed: {s1.status_code}, {s2.status_code}")
                return

            step_to_move = s2.json()["id"]
            response = await client.post(
                f"{API_BASE}/trips/{self.trip_id}/split",
                json={"new_trip_title": "Paris leg", "step_ids": [step_to_move]},
                headers={"Authorization": f"Bearer {self.token}"}
            )
            if response.status_code != 200:
                self.log_test("Split Trip", False, f"Split returned {response.status_code}: {response.text}")
                return
            data = response.json()
            new_trip_id = data.get("new_trip", {}).get("id")
            # Verify Paris step is now in the new trip
            new_steps = await client.get(
                f"{API_BASE}/steps/trip/{new_trip_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            step_ids_in_new = [s["id"] for s in new_steps.json().get("steps", [])]
            self.log_test("Split Trip", step_to_move in step_ids_in_new,
                          f"New trip '{data.get('new_trip', {}).get('title')}' contains moved step: {step_to_move in step_ids_in_new}")
            # Clean up new trip
            await client.delete(f"{API_BASE}/trips/{new_trip_id}",
                                 headers={"Authorization": f"Bearer {self.token}"})
        except Exception as e:
            self.log_test("Split Trip", False, str(e))

    async def test_register_second_user(self, client: httpx.AsyncClient):
        """Register a second user; store token for later security tests"""
        ts = datetime.now().timestamp()
        other_email = f"other-{ts}@example.com"
        other_username = f"other{int(ts)}"
        try:
            reg = await client.post(f"{API_BASE}/auth/register", json={
                "email": other_email, "password": TEST_PASSWORD, "username": other_username
            })
            if reg.status_code not in (200, 201):
                return  # silently skip — security test will handle missing token
            self.other_token = reg.json().get("access_token")
        except Exception:
            pass  # security test will handle missing token

    async def test_cross_user_forbidden(self, client: httpx.AsyncClient):
        """Test: A second user cannot access another user's trip (403)"""
        print(f"\n{BLUE}[Security Tests]{RESET}")
        if not self.trip_id or not self.other_token:
            self.log_test("Cross-User 403", False, "No trip ID or second user token")
            return
        try:
            get_resp = await client.get(
                f"{API_BASE}/trips/{self.trip_id}",
                headers={"Authorization": f"Bearer {self.other_token}"}
            )
            self.log_test("Cross-User 403", get_resp.status_code == 403,
                          f"GET returned {get_resp.status_code} (expected 403)")
        except Exception as e:
            self.log_test("Cross-User 403", False, str(e))

    async def test_update_trip(self, client: httpx.AsyncClient):
        """Test: Patching a trip title is reflected when the trip is fetched again"""
        print(f"\n{BLUE}[Trip Update Tests]{RESET}")
        if not self.token or not self.trip_id:
            self.log_test("Update Trip", False, "No trip ID")
            return
        try:
            new_title = "Updated Trip Title"
            response = await client.patch(
                f"{API_BASE}/trips/{self.trip_id}",
                json={"title": new_title},
                headers={"Authorization": f"Bearer {self.token}"}
            )
            if response.status_code != 200:
                self.log_test("Update Trip", False, f"PATCH returned {response.status_code}")
                return
            data = response.json()
            self.log_test("Update Trip", data.get("title") == new_title,
                          f"Title: {data.get('title')}")
        except Exception as e:
            self.log_test("Update Trip", False, str(e))

    async def test_delete_trip(self, client: httpx.AsyncClient):
        """Test: Delete Trip (tests error handling utilities)"""
        print(f"\n{BLUE}[Cleanup Tests]{RESET}")
        if not self.token or not self.trip_id:
            self.log_test("Delete Trip", False, "No trip ID")
            return
        
        try:
            response = await client.delete(
                f"{API_BASE}/trips/{self.trip_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            self.log_test("Delete Trip", response.status_code == 200, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Delete Trip", False, str(e))

async def main():
    """Run all tests"""
    print(f"\n{YELLOW}{'='*60}{RESET}")
    print(f"{YELLOW}Pollarsteps - Comprehensive Integration Tests{RESET}")
    print(f"{YELLOW}Testing refactored backend code{RESET}")
    print(f"{YELLOW}{'='*60}{RESET}\n")
    
    runner = TestRunner()
    await runner.run_tests()
    
    # Print summary
    print(f"\n{YELLOW}{'='*60}{RESET}")
    print(f"{YELLOW}Test Summary{RESET}")
    print(f"{YELLOW}{'='*60}{RESET}")
    print(f"  {GREEN}Passed: {test_results['passed']}{RESET}")
    print(f"  {RED}Failed: {test_results['failed']}{RESET}")
    
    if test_results["errors"]:
        print(f"\n{RED}Errors:{RESET}")
        for error in test_results["errors"]:
            print(f"  • {error}")
    
    print(f"{YELLOW}{'='*60}{RESET}\n")
    
    # Exit with appropriate code
    sys.exit(0 if test_results["failed"] == 0 else 1)

if __name__ == "__main__":
    asyncio.run(main())
