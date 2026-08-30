cache = {}
_calls = 0
def compute(n):
    """Expensive pure function; called repeatedly with the same arguments. A bottleneck."""
    global _calls
    if n in cache:
        return cache[n]
    _calls += 1
    total = 0
    for i in range(n):
        total += i * i
    cache[n] = total
    return total
