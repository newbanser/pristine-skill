import time
from collections import defaultdict
from collections import deque

class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self.calls = defaultdict(deque)  # key -> deque of timestamps
    
    def allow(self, key):
        """Check if a request is allowed for the given key."""
        current_time = time.time()
        
        # Get the call history for this key
        call_history = self.calls[key]
        
        # Remove timestamps that are outside the current period window
        while call_history and current_time - call_history[0] >= self.period:
            call_history.popleft()
        
        # Check if we're at the limit
        if len(call_history) >= self.max_calls:
            return False
        
        # Allow the call and record it
        call_history.append(current_time)
        return True
