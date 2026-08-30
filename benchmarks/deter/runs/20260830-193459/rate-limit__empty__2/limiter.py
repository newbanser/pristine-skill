import time
from collections import defaultdict, deque

class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        # Dictionary mapping each key to a deque of timestamps
        # for the allowed calls within the current time window
        self.calls = defaultdict(deque)
        
    def allow(self, key):
        """Return True if the call is allowed, False otherwise."""
        current_time = time.time()
        
        # Get the deque of timestamps for this key
        # If key doesn't exist, create an empty deque
        timestamps = self.calls[key]
        
        # Remove any timestamps that are older than the current period window
        # This keeps only the timestamps within the last 'period' seconds
        while timestamps and current_time - timestamps[0] >= self.period:
            timestamps.popleft()
        
        # Check if the number of calls within the window is still below the limit
        if len(timestamps) >= self.max_calls:
            # Call is not allowed - limit has been reached
            return False
        
        # Call is allowed - record the current timestamp
        timestamps.append(current_time)
        return True
    
    def _cleanup(self):
        """Optional cleanup method to remove entries for keys that haven't been used recently.
        This prevents memory leaks in production use, but isn't required for basic functionality."""
        current_time = time.time()
        # Remove keys that have no timestamps within the current period
        for key in list(self.calls.keys()):
            # Clean up old timestamps
            while self.calls[key] and current_time - self.calls[key][0] >= self.period:
                self.calls[key].popleft()
            # Remove the key entirely if its deque is empty
            if not self.calls[key]:
                del self.calls[key]
