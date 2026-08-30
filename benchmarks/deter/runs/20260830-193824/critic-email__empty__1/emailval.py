def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    # Check for basic structure: local@domain
    if not isinstance(s, str):
        return False
    if s.count('@') != 1:
        return False
    local, domain = s.split('@')
    
    # Local part validation
    if not local or len(local) > 64:
        return False
    if local.startswith('.') or local.endswith('.'):
        return False
    if '..' in local:
        return False
    
    # Allowed characters in local part
    allowed_local = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-/=?^_`{|}~.")
    for ch in local:
        if ch not in allowed_local:
            return False
    
    # Domain part validation
    if not domain or len(domain) > 255:
        return False
    if domain.startswith('.') or domain.endswith('.'):
        return False
    if '..' in domain:
        return False
    
    # Domain labels validation
    labels = domain.split('.')
    if len(labels) < 2:
        return False
    
    allowed_domain = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-")
    for label in labels:
        if not label or len(label) > 63:
            return False
        if label.startswith('-') or label.endswith('-'):
            return False
        for ch in label:
            if ch not in allowed_domain:
                return False
    
    return True
