class RateLimiter:
    """Allow at most max_calls requests per period seconds, per key."""
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        # Dictionary to store call timestamps for each key
        self.calls = {}
    
    def allow(self, key):
        import time
        
        current_time = time.time()
        
        # Initialize key if not exists
        if key not in self.calls:
            self.calls[key] = []
        
        # Remove timestamps that are outside the current window
        # Keep only timestamps within the period window
        self.calls[key] = [t for t in self.calls[key] 
                          if current_time - t < self.period]
        
        # Check if we're at the limit
        if len(self.calls[key]) >= self.max_calls:
            return False
        
        # Allow the call and record the timestamp
        self.calls[key].append(current_time)
        return True
