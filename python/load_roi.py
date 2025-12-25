import json
from sqlite import get_db

def load_roi(direction):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT points FROM roi WHERE direction=?", (direction,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise ValueError(f"No ROI for {direction}")

    return json.loads(row[0])
