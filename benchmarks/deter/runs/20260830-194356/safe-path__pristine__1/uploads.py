import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    base_dir = os.path.abspath(base_dir)
    full_path = os.path.abspath(os.path.join(base_dir, filename))
    if not full_path.startswith(base_dir + os.sep) and full_path != base_dir:
        raise ValueError("filename escapes base_dir")
    return full_path
