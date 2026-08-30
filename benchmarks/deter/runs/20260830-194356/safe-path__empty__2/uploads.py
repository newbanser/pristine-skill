def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    import os

    # Reject empty or non-string filenames
    if not isinstance(filename, str) or filename == '':
        raise ValueError("Invalid filename")

    # Normalize the filename to prevent path traversal
    # Strip any leading slashes or drive letters
    clean_filename = os.path.basename(filename)

    # Ensure the cleaned filename is not empty after stripping
    if clean_filename in ('', '.', '..'):
        raise ValueError("Invalid filename")

    # Join and normalize the final path
    full_path = os.path.join(base_dir, clean_filename)

    # Verify that the final path is still within base_dir (defense in depth)
    base_real = os.path.realpath(base_dir)
    full_real = os.path.realpath(full_path)

    if not full_real.startswith(base_real + os.sep) and full_real != base_real:
        raise ValueError("Path traversal detected")

    return full_path
