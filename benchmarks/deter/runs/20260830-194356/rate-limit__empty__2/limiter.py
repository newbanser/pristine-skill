class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self._calls = {}

    def allow(self, key):
        import time
        now = time.time()
        if key not in self._calls:
            self._calls[key] = []
        timestamps = self._calls[key]

        # Remove timestamps older than the period
        while timestamps and timestamps[0] <= now - self.period:
            timestamps.pop(0)

        if len(timestamps) < self.max_calls:
            timestamps.append(now)
            return True
        else:
            return False
