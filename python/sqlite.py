import sqlite3
from pathlib import Path

DB_PATH = Path("python/db/traffic.db")

def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS roi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        direction TEXT UNIQUE,
        points TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS counts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        direction TEXT,
        count INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()
