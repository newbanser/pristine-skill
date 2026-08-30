import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Reject absolute paths and path traversal
    if os.path.isabs(filename):
        raise ValueError("filename must be relative")
    
    # Normalize and ensure the joined path stays within base_dir
    full_path = os.path.normpath(os.path.join(base_dir, filename))
    
    # Verify the final path is inside base_dir (prevent ../ escapes)
    if not full_path.startswith(os.path.normpath(base_dir)):
        raise ValueError("filename escapes base_dir")
    
    return full_path
