from collections import defaultdict
import time

class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self.calls = defaultdict(list)

    def allow(self, key):
        now = time.monotonic()
        window_start = now - self.period
        timestamps = self.calls[key]
        timestamps = [t for t in timestamps if t > window_start]
        self.calls[key] = timestamps
        if len(timestamps) < self.max_calls:
            timestamps.append(now)
            return True
        return False
