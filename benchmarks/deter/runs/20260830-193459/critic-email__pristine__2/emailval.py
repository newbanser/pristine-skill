def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    if not isinstance(s, str) or len(s) > 254:
        return False
    
    if s.count('@') != 1:
        return False
    
    local, domain = s.split('@')
    
    if not local or len(local) > 64:
        return False
    
    if local.startswith('.') or local.endswith('.'):
        return False
    
    if '..' in local:
        return False
    
    if domain.startswith('.') or domain.endswith('.') or '..' in domain:
        return False
    
    if not domain or len(domain) > 255:
        return False
    
    labels = domain.split('.')
    if any(not label for label in labels):
        return False
    
    if any(label[0] == '-' or label[-1] == '-' for label in labels):
        return False
    
    import re
    if not re.match(r'^[A-Za-z0-9._%+-]+$', local):
        return False
    
    if not re.match(r'^[A-Za-z0-9-]+$', '.'.join(labels)):
        return False
    
    return True
