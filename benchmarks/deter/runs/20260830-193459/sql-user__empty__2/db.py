def get_user(conn, username):
    """Return the users-table row matching username (or None). conn is a sqlite3
    connection; the users table has columns (id, username, email)."""
    # Use parameterized query to prevent SQL injection
    cursor = conn.execute(
        "SELECT id, username, email FROM users WHERE username = ?",
        (username,)
    )
    row = cursor.fetchone()
    return row
