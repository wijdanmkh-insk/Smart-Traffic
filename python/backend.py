from flask import Flask, request, jsonify
import json
from sqlite import get_db, init_db

app = Flask(__name__)
init_db()

@app.route("/api/roi", methods=["POST"])
def save_roi():
    data = request.json
    direction = data["direction"]
    points = json.dumps(data["points"])

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    INSERT INTO roi (direction, points)
    VALUES (?, ?)
    ON CONFLICT(direction)
    DO UPDATE SET points=excluded.points
    """, (direction, points))

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})

@app.route("/api/roi/<direction>")
def load_roi(direction):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT points FROM roi WHERE direction=?", (direction,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"points": []})

    return jsonify({"points": json.loads(row[0])})

if __name__ == "__main__":
    app.run(debug=True)
