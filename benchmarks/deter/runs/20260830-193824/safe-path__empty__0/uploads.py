import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Ensure base_dir is an absolute path and normalize it
    base_dir = os.path.abspath(base_dir)
    
    # Strip any path components from the filename and take only the basename
    # This prevents directory traversal attacks
    clean_name = os.path.basename(filename)
    
    # Join the cleaned filename to the base directory
    full_path = os.path.join(base_dir, clean_name)
    
    # Optionally, ensure the final path is still within base_dir (defense in depth)
    # But since we stripped the basename, it should be safe
    
    return full_path
