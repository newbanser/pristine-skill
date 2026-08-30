def get_user(conn, username):
    """Return the users-table row matching username (or None). conn is a sqlite3
    connection; the users table has columns (id, username, email)."""
    cur = conn.execute(
        "SELECT id, username, email FROM users WHERE username = ?",
        (username,)
    )
    return cur.fetchone()
