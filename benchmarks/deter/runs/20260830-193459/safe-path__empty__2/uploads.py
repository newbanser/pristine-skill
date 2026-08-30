=== uploads.py ===
import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Normalize the filename to remove any path traversal attempts
    # and ensure we only get the base name (no directory components)
    clean_filename = os.path.basename(filename)
    
    # Join the clean filename onto base_dir
    full_path = os.path.join(base_dir, clean_filename)
    
    # Normalize the path to resolve any '..' or '.' components
    full_path = os.path.normpath(full_path)
    
    # Verify the final path is still within base_dir (defense in depth)
    base_dir_abs = os.path.abspath(base_dir)
    full_path_abs = os.path.abspath(full_path)
    
    if not full_path_abs.startswith(base_dir_abs + os.sep):
        # If the path escapes base_dir, fall back to a safe filename
        full_path = os.path.join(base_dir, "upload.txt")
    
    return full_path
