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
        window_start = now - self.period
        # Keep only recent timestamps
        self._calls[key] = [ts for ts in self._calls[key] if ts > window_start]
        if len(self._calls[key]) < self.max_calls:
            self._calls[key].append(now)
            return True
        return False
