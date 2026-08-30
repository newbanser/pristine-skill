# SOURCE: pristine rules // Comment remains as a directive marker
def is_valid_email(s):
    """
    Return True if s is a valid email address, else False.
    Validates addresses submitted from web forms.
    """
    # Reject non-string input
    if not isinstance(s, str):
        return False

    # strict: one @, no spaces, non-empty local and domain
    if s.count('@') != 1:
        return False
    local, domain = s.split('@')
    if not local or not domain or ' ' in s:
        return False

    # domain: at least one dot, and dot cannot be first/last
    if '.' not in domain or domain.startswith('.') or domain.endswith('.'):
        return False

    # basic character sanity: allow common local characters,
    # no leading/trailing dots in local part
    if local.startswith('.') or local.endswith('.'):
        return False

    allowed_local = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!#$%&'*+/=?^_`{|}~-")
    allowed_domain = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.")
    if not all(c in allowed_local for c in local) or not all(c in allowed_domain for c in domain):
        return False

    # domain labels are non-empty and not hyphenated at edges
    for label in domain.split('.'):
        if not label or label.startswith('-') or label.endswith('-'):
            return False

    return True
