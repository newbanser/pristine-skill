_calls = 0
_cache = {}
def compute(n):
    """Expensive pure function; called repeatedly with the same arguments. A bottleneck."""
    global _calls, _cache
    if n in _cache:
        return _cache[n]
    _calls += 1
    total = 0
    for i in range(n):
        total += i * i
    _cache[n] = total
    return total
