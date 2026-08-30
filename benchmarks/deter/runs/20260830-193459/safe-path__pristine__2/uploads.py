import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir securely.

    Prevents path traversal by rejecting filenames containing path
    separators or parent directory references. Normalizes the result
    and verifies it stays within base_dir.
    """
    # Reject separators and parent references
    if os.sep in filename or (os.altsep and os.altsep in filename):
        raise ValueError("Invalid filename")
    if filename in ('.', '..') or filename.startswith('..'):
        raise ValueError("Invalid filename")

    # Normalize and verify the result stays within base_dir
    base_dir = os.path.abspath(base_dir)
    full_path = os.path.abspath(os.path.join(base_dir, filename))
    if not full_path.startswith(base_dir):
        raise ValueError("Path escapes base directory")

    return full_path
