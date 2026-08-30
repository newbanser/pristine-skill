=== emailval.py ===
import re

def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    if not isinstance(s, str) or len(s) > 254:  # RFC 5321 maximum length
        return False
    
    # Must have exactly one @ symbol
    if s.count('@') != 1:
        return False
    
    local_part, domain_part = s.split('@')
    
    # Local part validation (RFC 5321/5322 rules simplified for practical use)
    if not local_part or len(local_part) > 64:
        return False
    
    # Reject leading/trailing dots in local part
    if local_part.startswith('.') or local_part.endswith('.'):
        return False
    
    # Reject consecutive dots in local part
    if '..' in local_part:
        return False
    
    # Allowed characters in local part (practical subset)
    local_chars = re.compile(r'^[A-Za-z0-9!#$%&\'*+/=?^_`{|}~.-]+$')
    if not local_chars.match(local_part):
        return False
    
    # Domain part validation
    if not domain_part or len(domain_part) > 255:
        return False
    
    # Must contain at least one dot for a proper domain
    if '.' not in domain_part:
        return False
    
    # Reject leading/trailing dots and consecutive dots in domain
    if domain_part.startswith('.') or domain_part.endswith('.') or '..' in domain_part:
        return False
    
    # Split domain into labels and validate each
    labels = domain_part.split('.')
    
    # Check each label for valid characters and length
    domain_label_chars = re.compile(r'^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$')
    for label in labels:
        if not label or len(label) > 63:
            return False
        if not domain_label_chars.match(label):
            return False
    
    # Check TLD constraints (must be alphabetic and at least 2 characters)
    tld = labels[-1]
    if len(tld) < 2 or not tld.isalpha():
        return False
    
    # Basic character requirement (at least one letter in whole address)
    if not any(c.isalpha() for c in s):
        return False
    
    return True
