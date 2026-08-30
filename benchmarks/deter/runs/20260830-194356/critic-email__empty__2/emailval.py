def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    # Basic checks: must be a string, non-empty, and have exactly one @
    if not isinstance(s, str):
        return False
    if s.count('@') != 1:
        return False
    
    local, domain = s.rsplit('@', 1)
    
    # Local part validations
    if not local or len(local) > 64:
        return False
    # Local part: allowed characters (alphanumerics, dots, and common special chars)
    allowed_local = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-/=?^_`{|}~.")
    if not all(c in allowed_local for c in local):
        return False
    # Dot rules: no consecutive dots, no leading/trailing dot
    if '..' in local or local.startswith('.') or local.endswith('.'):
        return False
    
    # Domain part validations
    if not domain or len(domain) > 255:
        return False
    # Domain must contain at least one dot
    if '.' not in domain:
        return False
    # Only letters, digits, hyphens, and dots
    allowed_domain = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.")
    if not all(c in allowed_domain for c in domain):
        return False
    # No consecutive dots, no leading/trailing dot or hyphen in labels
    labels = domain.split('.')
    for label in labels:
        if not label or len(label) > 63:
            return False
        if label.startswith('-') or label.endswith('-'):
            return False
        if '..' in domain:
            return False
    # Total length of domain labels okay, already checked
    
    return True
