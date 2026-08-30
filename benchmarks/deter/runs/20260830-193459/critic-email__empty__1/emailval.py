=== emailval.py ===
import re

def is_valid_email(s):
    """Return True if s is a valid email address, else False."""
    if not isinstance(s, str):
        return False
    
    # Strip whitespace
    s = s.strip()
    
    # Basic length check (email should not be empty or too long)
    if not s or len(s) > 254:
        return False
    
    # Email structure: local@domain
    if '@' not in s:
        return False
    
    local_part, domain = s.rsplit('@', 1)
    
    # Check local part
    if not local_part or len(local_part) > 64:
        return False
    
    # Check domain
    if not domain or len(domain) > 255:
        return False
    
    # Validate local part (allowed characters)
    local_regex = re.compile(r"^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$")
    if not local_regex.match(local_part):
        return False
    
    # Check for consecutive dots in local part
    if '..' in local_part:
        return False
    
    # Local part cannot start or end with a dot
    if local_part.startswith('.') or local_part.endswith('.'):
        return False
    
    # Validate domain
    domain_regex = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*$")
    if not domain_regex.match(domain):
        return False
    
    # Check for consecutive dots in domain
    if '..' in domain:
        return False
    
    # Check TLD has at least 2 characters (common standard)
    tld = domain.split('.')
    if len(tld) < 2 or len(tld[-1]) < 2:
        return False
    
    # Optional: check for IP address format in domain (IPv4 in brackets)
    if domain.startswith('[') and domain.endswith(']'):
        ip = domain[1:-1]
        if not re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', ip):
            return False
        # Validate IP octets
        for octet in ip.split('.'):
            if not 0 <= int(octet) <= 255:
                return False
    
    return True
