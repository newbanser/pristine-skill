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
        cutoff = now - self.period
        calls = self._calls[key]
        while calls and calls[0] <= cutoff:
            calls.pop(0)
        if len(calls) >= self.max_calls:
            return False
        calls.append(now)
        return True
