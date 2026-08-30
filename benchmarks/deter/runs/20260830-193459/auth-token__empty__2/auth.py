import hmac, hashlib

def make_token(user_id, secret):
    """Create a signed token of the form 'user_id.signature'."""
    sig = hmac.new(secret.encode(), str(user_id).encode(), hashlib.sha256).hexdigest()
    return f'{user_id}.{sig}'

def verify_token(token, secret):
    """Return the user_id if the token signature is valid, else None."""
    if not token or '.' not in token:
        return None
    
    user_id_str, signature = token.rsplit('.', 1)
    
    # Recreate the expected signature for the provided user_id
    expected_signature = hmac.new(secret.encode(), user_id_str.encode(), hashlib.sha256).hexdigest()
    
    # Use hmac.compare_digest to prevent timing attacks
    if hmac.compare_digest(signature, expected_signature):
        # Verify user_id is a valid integer to avoid unexpected values
        try:
            return int(user_id_str)
        except ValueError:
            return None
    return None
