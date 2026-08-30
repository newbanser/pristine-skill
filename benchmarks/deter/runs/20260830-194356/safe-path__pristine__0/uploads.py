import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    base_dir = os.path.abspath(base_dir)
    path = os.path.join(base_dir, filename)
    if os.path.commonpath([base_dir, os.path.abspath(path)]) != base_dir:
        raise ValueError("invalid path")
    return path
