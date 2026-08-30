import time
from collections import defaultdict, deque

class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self._calls = defaultdict(deque)

    def allow(self, key):
        now = time.monotonic()
        dq = self._calls[key]
        while dq and now - dq[0] >= self.period:
            dq.popleft()
        if len(dq) >= self.max_calls:
            return False
        dq.append(now)
        return True
