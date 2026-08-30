def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    # Basic structural checks
    if not isinstance(s, str):
        return False
    if len(s) > 254:
        return False
    if s.count('@') != 1:
        return False
    
    local, domain = s.rsplit('@', 1)
    
    # Local part checks
    if not local or len(local) > 64:
        return False
    if local.startswith('.') or local.endswith('.'):
        return False
    if '..' in local:
        return False
    
    # Allowed characters in local part
    allowed_local = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-/=?^_`{|}~.")
    if any(c not in allowed_local for c in local):
        return False
    
    # Domain checks
    if not domain or len(domain) > 253:
        return False
    if domain.startswith('-') or domain.endswith('-'):
        return False
    if '..' in domain:
        return False
    
    # Must have at least one dot in the domain (simple heuristic, not RFC strict)
    if '.' not in domain:
        return False
    
    # Domain labels
    labels = domain.split('.')
    if len(labels) < 2:
        return False
    for label in labels:
        if not label:
            return False
        if len(label) > 63:
            return False
        if not all(c.isalnum() or c == '-' for c in label):
            return False
    
    # Reject if the last label is all numeric (invalid TLD)
    tld = labels[-1]
    if tld.isdigit():
        return False
    
    return True
