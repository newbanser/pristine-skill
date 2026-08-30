def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    import os
    # Ensure base_dir is absolute and normalized
    base_dir = os.path.abspath(base_dir)
    # Reject filenames containing path traversal or absolute paths
    if filename.startswith('/') or filename.startswith('\\'):
        raise ValueError("Invalid filename: absolute paths not allowed")
    if '..' in filename.split('/'):
        raise ValueError("Invalid filename: path traversal not allowed")
    if '..' in filename.split('\\'):
        raise ValueError("Invalid filename: path traversal not allowed")
    # Use os.path.join, which will handle separators correctly
    full_path = os.path.normpath(os.path.join(base_dir, filename))
    # Verify the final path is still within base_dir
    if not full_path.startswith(base_dir + os.sep):
        raise ValueError("Invalid filename: path escapes base directory")
    return full_path
