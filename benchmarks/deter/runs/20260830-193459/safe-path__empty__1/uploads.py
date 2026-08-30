=== uploads.py ===
def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    import os
    
    # Normalize the filename by removing any path components
    # This prevents path traversal attacks (e.g., "../etc/passwd" or "/etc/passwd")
    clean_filename = os.path.basename(filename)
    
    # Join the clean filename with base_dir
    full_path = os.path.join(base_dir, clean_filename)
    
    # Normalize the final path to resolve any remaining ".." or "." components
    normalized_path = os.path.normpath(full_path)
    
    # Double-check that the normalized path is still within base_dir
    # This is a final safety check against any edge cases
    if not normalized_path.startswith(os.path.abspath(base_dir)):
        # If somehow the path escapes base_dir, fall back to just the basename in base_dir
        normalized_path = os.path.join(base_dir, clean_filename)
    
    return normalized_path
