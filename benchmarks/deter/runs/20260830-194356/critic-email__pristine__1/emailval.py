def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    import re
    pattern = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    return bool(pattern.match(s))
