import hmac, hashlib
from functools import hmac as hmac_compare

def make_token(user_id, secret):
    """Create a signed token of the form 'user_id.signature'."""
    sig = hmac.new(secret.encode(), str(user_id).encode(), hashlib.sha256).hexdigest()
    return f'{user_id}.{sig}'

def verify_token(token, secret):
    """Return the user_id if the token signature is valid, else None."""
    try:
        user_id, sig = token.rsplit('.', 1)
    except (ValueError, AttributeError):
        return None
    
    expected = hmac.new(secret.encode(), user_id.encode(), hashlib.sha256).hexdigest()
    if not hmac_compare.compare_digest(expected, sig):
        return None
    return user_id
