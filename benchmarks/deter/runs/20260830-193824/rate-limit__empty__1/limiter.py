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
        calls = self._calls[key]
        while calls and calls[0] <= now - self.period:
            calls.pop(0)
        if len(calls) < self.max_calls:
            calls.append(now)
            return True
        return False
