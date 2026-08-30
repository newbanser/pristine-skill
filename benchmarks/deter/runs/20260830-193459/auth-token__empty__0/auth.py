import hmac, hashlib

def make_token(user_id, secret):
    """Create a signed token of the form 'user_id.signature'."""
    sig = hmac.new(secret.encode(), str(user_id).encode(), hashlib.sha256).hexdigest()
    return f'{user_id}.{sig}'

def verify_token(token, secret):
    """Return the user_id if the token signature is valid, else None."""
    try:
        # Split token into user_id and signature parts
        user_id_str, provided_sig = token.rsplit('.', 1)
        
        # Recompute the expected signature
        expected_sig = hmac.new(secret.encode(), user_id_str.encode(), hashlib.sha256).hexdigest()
        
        # Use hmac.compare_digest for constant-time comparison to prevent timing attacks
        if hmac.compare_digest(provided_sig, expected_sig):
            # Validate that user_id is actually an integer
            user_id = int(user_id_str)
            return user_id
        else:
            return None
    except (ValueError, AttributeError, TypeError):
        # Handle malformed tokens (missing '.', non-integer user_id, or invalid types)
        return None
