import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Ensure base_dir is absolute and normalized
    base_abs = os.path.abspath(base_dir)
    
    # Strip any path components from filename, keep only the base name
    safe_name = os.path.basename(filename)
    
    # Join and normalize
    full_path = os.path.join(base_abs, safe_name)
    
    # Final safety check: ensure the result is still inside base_dir
    if os.path.commonpath([base_abs, os.path.abspath(full_path)]) != base_abs:
        raise ValueError("Invalid upload path")
    
    return full_path
