import sqlite3

def get_user(conn, username):
    cur = conn.execute("SELECT * FROM users WHERE username = ?", (username,))
    return cur.fetchone()
