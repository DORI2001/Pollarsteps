"""Simple in-memory rate limiter for expensive endpoints."""
import time
from collections import defaultdict
from threading import Lock
from fastapi import Request, HTTPException, status


class RateLimiter:
    def __init__(self, max_calls: int, window_seconds: int):
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self._calls: dict = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            self._calls[key] = [t for t in self._calls[key] if now - t < self.window_seconds]
            if len(self._calls[key]) >= self.max_calls:
                return False
            self._calls[key].append(now)
            return True


# 10 calls per minute per IP for AI recommendation endpoints
recommendations_limiter = RateLimiter(max_calls=10, window_seconds=60)

# 5 story creations per 10 minutes per IP
stories_limiter = RateLimiter(max_calls=5, window_seconds=600)

# Auth: 10 login/register attempts per minute per IP
auth_limiter = RateLimiter(max_calls=10, window_seconds=60)


def get_client_ip(request: Request) -> str:
    # Only trust X-Forwarded-For when the direct peer is a private/loopback address
    # (i.e. the app is sitting behind a reverse proxy on the same host or LAN).
    # Without this guard, any client can spoof an arbitrary IP to bypass rate limiting.
    direct_host = request.client.host if request.client else ""
    _private_prefixes = ("127.", "10.", "172.", "192.168.", "::1", "")
    behind_proxy = any(direct_host.startswith(p) for p in _private_prefixes)

    if behind_proxy:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

    return direct_host or "unknown"


def check_recommendations_limit(request: Request):
    ip = get_client_ip(request)
    if not recommendations_limiter.is_allowed(ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait a minute before trying again.",
        )


def check_stories_limit(request: Request):
    ip = get_client_ip(request)
    if not stories_limiter.is_allowed(ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many story creations. Please wait before trying again.",
        )


def check_auth_limit(request: Request):
    ip = get_client_ip(request)
    if not auth_limiter.is_allowed(ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please wait a minute.",
        )
