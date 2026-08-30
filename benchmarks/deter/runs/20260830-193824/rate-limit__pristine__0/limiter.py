from collections import defaultdict
import time

class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self._hits = defaultdict(list)

    def allow(self, key):
        now = time.monotonic()
        timestamps = self._hits[key]
        while timestamps and timestamps[0] <= now - self.period:
            timestamps.pop(0)
        if len(timestamps) >= self.max_calls:
            return False
        timestamps.append(now)
        return True
