import re

def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", s))
