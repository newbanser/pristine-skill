import time
from collections import defaultdict

class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self.calls = defaultdict(list)

    def allow(self, key):
        now = time.time()
        # Remove calls that are older than the period
        self.calls[key] = [t for t in self.calls[key] if t > now - self.period]
        
        if len(self.calls[key]) < self.max_calls:
            self.calls[key].append(now)
            return True
        return False
