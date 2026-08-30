class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self.calls = {}  # key -> list of timestamps

    def allow(self, key):
        import time
        now = time.time()
        # Get the list of timestamps for this key, or create an empty one
        timestamps = self.calls.setdefault(key, [])
        
        # Remove timestamps that are older than the period
        cutoff = now - self.period
        while timestamps and timestamps[0] <= cutoff:
            timestamps.pop(0)
        
        # Check if we are under the limit
        if len(timestamps) < self.max_calls:
            timestamps.append(now)
            return True
        else:
            return False
