import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    base_abs = os.path.abspath(base_dir)
    path = os.path.join(base_abs, filename)
    path_abs = os.path.abspath(path)
    if not path_abs.startswith(base_abs + os.sep):
        raise ValueError("Filename escapes base directory")
    return path_abs
