import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    if not isinstance(base_dir, str) or not isinstance(filename, str):
        raise TypeError("base_dir and filename must be strings")
    if not base_dir or not filename:
        raise ValueError("base_dir and filename must not be empty")
    if filename.startswith(('/', os.sep)) or '..' in filename.split('/'):
        raise ValueError("filename must be a relative path within base_dir")
    return os.path.join(base_dir, filename)
