import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Normalize base_dir to ensure consistent path comparisons
    base_dir = os.path.realpath(base_dir)
    
    # Reject absolute paths and any path traversal attempts
    # os.path.basename strips directory components and returns just the filename
    safe_name = os.path.basename(filename)
    
    # Reject empty filenames or filenames that resolve to nothing
    if not safe_name or safe_name in ('.', '..'):
        raise ValueError("Invalid filename")
    
    # Join and return the safe path
    return os.path.join(base_dir, safe_name)
