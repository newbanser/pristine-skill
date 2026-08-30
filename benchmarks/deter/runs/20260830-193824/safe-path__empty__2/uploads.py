def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    import os

    # Normalize the filename to prevent directory traversal
    # Strip any leading slashes or drive letters
    filename = filename.lstrip("/\\")
    filename = filename.replace("\\", "/")

    # If the filename is empty or resolves to a directory, reject it
    if not filename or filename in (".", ".."):
        raise ValueError("Invalid filename")

    # Use os.path.join which will handle path joining safely
    # Then normalize and check the result stays within base_dir
    full_path = os.path.normpath(os.path.join(base_dir, filename))

    # Ensure the final path is within base_dir
    base_abs = os.path.abspath(base_dir)
    full_abs = os.path.abspath(full_path)

    if not full_abs.startswith(base_abs + os.sep) and full_abs != base_abs:
        raise ValueError("Invalid path")

    return full_path
