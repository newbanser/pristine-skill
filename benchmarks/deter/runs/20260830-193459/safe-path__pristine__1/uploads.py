import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Prevents path traversal by rejecting absolute paths and any filename
    containing path separators or '..' components. The filename must be
    a plain name; the full path is constructed entirely within base_dir.
    """
    if os.path.isabs(filename):
        raise ValueError("filename must be a relative path")
    if ".." in filename.split(os.sep):
        raise ValueError("filename must not contain '..' components")
    if os.sep in filename or (os.altsep and os.altsep in filename):
        raise ValueError("filename must not contain path separators")
    return os.path.join(base_dir, filename)
