import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return a safe path.

    The returned path is guaranteed to be inside base_dir, preventing
    directory traversal and other path escape attacks.
    """
    # Normalize to an absolute path and resolve symlinks.
    base_abs = os.path.realpath(base_dir)
    # Reject empty filenames and path separators at the start.
    if not filename or filename.startswith(('/', os.sep)):
        raise ValueError("Invalid filename")
    # Expand any remaining traversal and build the candidate path.
    candidate = os.path.realpath(os.path.join(base_abs, filename))
    # Ensure the result stays within base_dir.
    if candidate != base_abs and not candidate.startswith(base_abs + os.sep):
        raise ValueError("Path escapes base directory")
    return candidate
