=== emailval.py ===
def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    if not isinstance(s, str) or not s or len(s) > 254:
        return False
    
    # Split into local and domain parts
    at_count = s.count('@')
    if at_count != 1:
        return False
    
    local, domain = s.rsplit('@', 1)
    
    # Validate local part
    if not local or len(local) > 64:
        return False
    
    # Local part rules (RFC 5322 simplified)
    if local.startswith('.') or local.endswith('.'):
        return False
    if '..' in local:
        return False
    
    # Allowed characters in local part
    allowed_local = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    allowed_special = set('!#$%&\'*+-/=?^_`{|}~.')
    
    for char in local:
        if char not in allowed_local and char not in allowed_special:
            return False
    
    # Validate domain part
    if not domain or len(domain) > 253:
        return False
    
    # Domain must have at least one dot
    if '.' not in domain:
        return False
    
    # Domain labels
    labels = domain.split('.')
    if len(labels) < 2:
        return False
    
    for label in labels:
        # Each label must be 1-63 characters
        if not label or len(label) > 63:
            return False
        
        # Must start and end with alphanumeric
        if not label[0].isalnum() or not label[-1].isalnum():
            return False
        
        # Only letters, digits, and hyphens allowed
        for char in label:
            if not (char.isalnum() or char == '-'):
                return False
    
    # TLD must be between 2 and 63 characters and consist only of letters
    tld = labels[-1]
    if len(tld) < 2:
        return False
    if not tld.isalpha():
        return False
    
    # Additional checks
    if any(char.isspace() for char in s):
        return False
    
    return True
