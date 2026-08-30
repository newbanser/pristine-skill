class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self._calls = {}

    def allow(self, key):
        import time
        now = time.time()
        history = self._calls.setdefault(key, [])
        history[:] = [t for t in history if now - t < self.period]
        if len(history) >= self.max_calls:
            return False
        history.append(now)
        return True
