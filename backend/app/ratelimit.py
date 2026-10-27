"""In-memory rate limiting for AI calls (per user, per IP, and a daily global cap).

Good enough for a single-process demo. A real deployment would use Redis or the
API gateway so limits survive restarts and work across several workers.
"""
import threading
import time
from collections import defaultdict, deque
from datetime import date

from .config import get_settings

WINDOW_SECONDS = 60


class AIRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._day = date.today()
        self._day_count = 0

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()
            self._day = date.today()
            self._day_count = 0

    def acquire(self, user: str, ip: str | None) -> str | None:
        """Record one AI call. Returns None if allowed, otherwise a short reason (call not recorded)."""
        s = get_settings()
        now = time.monotonic()
        keys = [f"user:{user}"] + ([f"ip:{ip}"] if ip else [])
        with self._lock:
            if date.today() != self._day:
                self._day, self._day_count = date.today(), 0
            if self._day_count >= s.ai_daily_cap:
                return "daily AI cap reached"
            for k in keys:
                q = self._hits[k]
                while q and now - q[0] >= WINDOW_SECONDS:
                    q.popleft()
                if len(q) >= s.ai_rate_per_minute:
                    return f"AI rate limit ({s.ai_rate_per_minute}/min) reached for {k.split(':')[0]}"
            for k in keys:
                self._hits[k].append(now)
            self._day_count += 1
            return None


limiter = AIRateLimiter()
