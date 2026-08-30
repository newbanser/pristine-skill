def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    from pathlib import Path
    safe_name = Path(filename).name
    return str(Path(base_dir) / safe_name)
