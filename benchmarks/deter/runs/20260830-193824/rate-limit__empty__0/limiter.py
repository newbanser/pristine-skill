import time
from collections import defaultdict

class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self._calls = defaultdict(list)

    def allow(self, key):
        now = time.time()
        cutoff = now - self.period
        # Filter out timestamps older than the period
        call_times = self._calls[key]
        # Remove expired entries from the front (assuming chronological order)
        while call_times and call_times[0] <= cutoff:
            call_times.pop(0)
        if len(call_times) >= self.max_calls:
            return False
        call_times.append(now)
        return True
