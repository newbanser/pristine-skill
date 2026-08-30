class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self._calls = {}  # key -> list of timestamps

    def allow(self, key):
        import time
        now = time.time()
        if key not in self._calls:
            self._calls[key] = []
        # Keep only timestamps within the current period
        self._calls[key] = [t for t in self._calls[key] if t > now - self.period]
        if len(self._calls[key]) >= self.max_calls:
            return False
        self._calls[key].append(now)
        return True
