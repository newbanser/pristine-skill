from collections import defaultdict
import time

class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self._calls = defaultdict(list)

    def allow(self, key):
        now = time.time()
        recent = [t for t in self._calls[key] if t > now - self.period]
        if len(recent) >= self.max_calls:
            self._calls[key] = recent
            return False
        recent.append(now)
        self._calls[key] = recent
        return True
