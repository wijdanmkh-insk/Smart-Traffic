import json
from sqlite import get_db

def save_roi(direction: str, points: list):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    INSERT INTO roi (direction, points)
    VALUES (?, ?)
    ON CONFLICT(direction)
    DO UPDATE SET points=excluded.points
    """, (direction, json.dumps(points)))

    conn.commit()
    conn.close()
