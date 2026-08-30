def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    import os
    
    # Clean the filename to prevent path traversal attacks
    # Remove any directory components and only keep the basename
    clean_filename = os.path.basename(filename)
    
    # Ensure we don't allow empty filenames or path traversal
    if not clean_filename or clean_filename in ('.', '..'):
        raise ValueError("Invalid filename")
    
    # Join the base directory with the clean filename
    return os.path.join(base_dir, clean_filename)
