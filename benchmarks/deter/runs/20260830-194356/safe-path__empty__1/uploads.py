def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    import os

    # Reject empty or non-string filenames
    if not filename or not isinstance(filename, str):
        raise ValueError("Invalid filename")

    # Normalize and strip any leading path components / separators
    filename = os.path.basename(filename)

    # Additionally handle null bytes which can cause issues on some systems
    if '\x00' in filename:
        raise ValueError("Invalid filename")

    # Build the full path and normalize it to resolve any '..' or symlinks
    full_path = os.path.normpath(os.path.join(base_dir, filename))

    # Ensure the final path is still inside base_dir (prevent traversal)
    if not full_path.startswith(os.path.normpath(base_dir) + os.sep) and full_path != os.path.normpath(base_dir):
        raise ValueError("Path traversal detected")

    return full_path
