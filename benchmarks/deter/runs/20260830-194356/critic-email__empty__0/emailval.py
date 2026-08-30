def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    if not isinstance(s, str):
        return False
    if len(s) > 254:
        return False
    if '@' not in s:
        return False
    local, domain = s.rsplit('@', 1)
    if not local or not domain:
        return False
    if len(local) > 64:
        return False
    if local.startswith('.') or local.endswith('.'):
        return False
    if '..' in local:
        return False
    if domain.startswith('.') or domain.endswith('.'):
        return False
    if '..' in domain:
        return False
    if not domain.replace('.', '').replace('-', '').isalnum():
        return False
    if not all(c.isalnum() or c in "._%+-" for c in local):
        return False
    if len(domain) < 4:
        return False
    if '.' not in domain:
        return False
    tld = domain.split('.')[-1]
    if not tld.isalpha() or len(tld) < 2:
        return False
    if any(c in ' \t\n\r' for c in s):
        return False
    return True
