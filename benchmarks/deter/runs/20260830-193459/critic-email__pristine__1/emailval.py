import re

def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    # Replace the NotImplentedError with a complete email validation
    # Uses a pragmatic regex that covers most real-world addresses
    # The pattern prevents common security issues like header injection
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    # Reject input that is too long (RFC 5321 maximum is 254 chars)
    if len(s) > 254:
        return False
    return bool(re.match(pattern, s))
