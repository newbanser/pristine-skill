def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    # Basic structure check
    if not isinstance(s, str) or len(s) > 254:
        return False
    if '@' not in s:
        return False
    local, domain = s.rsplit('@', 1)
    
    # Local part validation
    if not local or len(local) > 64:
        return False
    if local.startswith('.') or local.endswith('.'):
        return False
    if '..' in local:
        return False
    
    # Domain validation
    if not domain or len(domain) > 255:
        return False
    if domain.startswith('-') or domain.endswith('-'):
        return False
    if '.' not in domain:
        return False
    
    # Label validation
    labels = domain.split('.')
    if any(not label or len(label) > 63 for label in labels):
        return False
    if any(label.startswith('-') or label.endswith('-') for label in labels):
        return False
    
    # Character validation
    import re
    local_re = r"^[A-Za-z0-9!#$%&'*+/=?^_`{|}~\-\.]+$"
    domain_re = r"^[A-Za-z0-9\-\.]+$"
    
    if not re.match(local_re, local):
        return False
    if not re.match(domain_re, domain):
        return False
    
    # No consecutive dots in domain
    if '..' in domain:
        return False
    
    return True
