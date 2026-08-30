import time
from collections import defaultdict, deque

class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self._hits = defaultdict(deque)  # SOURCE: key -> deque of timestamps

    def allow(self, key):
        now = time.time()
        window_start = now - self.period
        timestamps = self._hits[key]

        # Drop timestamps outside the current window
        while timestamps and timestamps[0] <= window_start:
            timestamps.popleft()

        if len(timestamps) >= self.max_calls:
            return False

        timestamps.append(now)
        return True
