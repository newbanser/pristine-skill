import hmac, hashlib

def make_token(user_id, secret):
    """Create a signed token of the form 'user_id.signature'."""
    sig = hmac.new(secret.encode(), str(user_id).encode(), hashlib.sha256).hexdigest()
    return f'{user_id}.{sig}'

def verify_token(token, secret):
    """Return the user_id if the token signature is valid, else None."""
    if not token or '.' not in token:
        return None
    
    user_id, signature = token.rsplit('.', 1)
    
    # Validate that user_id is a valid integer (or any expected format)
    if not user_id.isdigit():
        return None
    
    # Recompute the expected signature
    expected_sig = hmac.new(secret.encode(), user_id.encode(), hashlib.sha256).hexdigest()
    
    # Use hmac.compare_digest for constant-time comparison to prevent timing attacks
    if hmac.compare_digest(signature, expected_sig):
        return user_id
    return None
