def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    # Basic structure checks
    if not isinstance(s, str):
        return False
    if len(s) > 254:
        return False
    if s.count('@') != 1:
        return False
    
    local, domain = s.rsplit('@', 1)
    
    # Local part checks
    if len(local) == 0 or len(local) > 64:
        return False
    if local.startswith('.') or local.endswith('.'):
        return False
    if '..' in local:
        return False
    
    allowed_special = "!#$%&'*+-/=?^_`{|}~"
    for char in local:
        if not (char.isalnum() or char in allowed_special or char == '.'):
            return False
    
    # Domain part checks
    if len(domain) == 0 or len(domain) > 255:
        return False
    if domain.startswith('-') or domain.endswith('-'):
        return False
    if domain.startswith('.') or domain.endswith('.'):
        return False
    if '..' in domain:
        return False
    
    # Domain must have at least one dot (except localhost)
    if '.' not in domain:
        if domain != 'localhost':
            return False
    
    # Validate domain labels
    for label in domain.split('.'):
        if len(label) == 0:
            return False
        if len(label) > 63:
            return False
        if label.startswith('-') or label.endswith('-'):
            return False
        for char in label:
            if not (char.isalnum() or char == '-'):
                return False
    
    # Simple check for consecutive dots in local part (already handled)
    # All checks passed
    return True
