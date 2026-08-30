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
        self._calls[key] = [t for t in self._calls[key] if now - t < self.period]
        if len(self._calls[key]) < self.max_calls:
            self._calls[key].append(now)
            return True
        return False
