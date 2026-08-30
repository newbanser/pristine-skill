import sqlite3

# Existing imports/globals remain unchanged.
# (Only get_user is shown here; other parts of db.py must be preserved.)

def get_user(conn, username):
    """Return the users-table row matching username (or None). conn is a sqlite3
    connection; the users table has columns (id, username, email)."""
    if not isinstance(conn, sqlite3.Connection):
        raise TypeError("conn must be a sqlite3.Connection")
    if not isinstance(username, str):
        raise TypeError("username must be a str")
    cur = conn.execute(
        "SELECT id, username, email FROM users WHERE username = ?",
        (username,)
    )
    return cur.fetchone()
