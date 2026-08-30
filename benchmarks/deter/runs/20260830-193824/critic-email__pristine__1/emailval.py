import re


def is_valid_email(s):
    if not isinstance(s, str) or len(s) > 254:
        return False
    if "@" not in s:
        return False
    local, _, domain = s.rpartition("@")
    if not local or not domain or len(local) > 64:
        return False
    if domain.startswith("-") or domain.endswith("-") or ".." in domain:
        return False
    domain_re = re.compile(r"^(?!-)[A-Za-z0-9-]+(?<!-)(\.[A-Za-z0-9-]+(?<!-))*$")
    if not domain_re.match(domain):
        return False
    if local.startswith(".") or local.endswith(".") or ".." in local:
        return False
    local_re = re.compile(r"^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$")
    return bool(local_re.match(local))
