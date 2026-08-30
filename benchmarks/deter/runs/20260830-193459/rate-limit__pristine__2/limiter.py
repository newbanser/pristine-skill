class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self._calls = {}  # key -> list of timestamps

    def allow(self, key):
        from time import time

        now = time()
        timestamps = self._calls.setdefault(key, [])

        # Remove timestamps older than the period
        cutoff = now - self.period
        timestamps[:] = [ts for ts in timestamps if ts > cutoff]

        if len(timestamps) < self.max_calls:
            timestamps.append(now)
            return True
        return False
