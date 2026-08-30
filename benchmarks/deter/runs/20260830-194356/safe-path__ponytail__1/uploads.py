import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    return os.path.join(base_dir, os.path.basename(filename))
