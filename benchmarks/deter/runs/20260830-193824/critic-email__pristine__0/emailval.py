def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    # Simple but practical validation for web form input:
    # - non-empty, single '@', split into local and domain
    # - local part: 1+ chars, no spaces, no leading/trailing dots, no consecutive dots
    # - domain: 1+ chars, contains at least one dot (not just TLD), no leading/trailing dot
    if not s or '@' not in s:
        return False

    local, sep, domain = s.rpartition('@')
    if not sep or not local or not domain:
        return False

    # no spaces anywhere
    if ' ' in local or ' ' in domain:
        return False

    # local part rules
    if local.startswith('.') or local.endswith('.') or '..' in local:
        return False

    # domain must have at least one dot, not start/end with dot, no consecutive dots
    if '.' not in domain or domain.startswith('.') or domain.endswith('.') or '..' in domain:
        return False

    return True
