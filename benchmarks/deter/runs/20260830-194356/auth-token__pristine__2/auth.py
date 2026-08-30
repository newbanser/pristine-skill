import hmac, hashlib

def make_token(user_id, secret):
    """Create a signed token of the form 'user_id.signature'."""
    sig = hmac.new(secret.encode(), str(user_id).encode(), hashlib.sha256).hexdigest()
    return f'{user_id}.{sig}'

def verify_token(token, secret):
    """Return the user_id if the token signature is valid, else None."""
    if not token or not isinstance(token, str):
        return None
    if '.' not in token:
        return None
    user_id_part, sig_part = token.rsplit('.', 1)
    if not user_id_part:
        return None
    expected_sig = hmac.new(secret.encode(), user_id_part.encode(), hashlib.sha256).hexdigest()
    if hmac.compare_digest(expected_sig, sig_part):
        return user_id_part
    return None
