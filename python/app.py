from flask import Flask, request, jsonify, render_template
from sqlite import init_db
from edit_area import save_roi
from load_roi import load_roi
from flask_cors import CORS
import os

app = Flask(__name__)
init_db()
CORS(app)

UPLOAD_DIR = "python/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.route("/api/upload", methods=["POST"])
def upload_videos():
    saved = []

    for file in request.files.getlist("videos"):
        filename = file.filename
        save_path = os.path.join(UPLOAD_DIR, filename)
        file.save(save_path)
        saved.append(save_path)

    return {"saved": saved}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/roi", methods=["POST"])
def api_save_roi():
    data = request.json
    save_roi(data["direction"], data["points"])

    return jsonify({
        "status": "success",
        "direction": data["direction"],
        "points_count": len(data["points"])
    })


@app.route("/api/roi/<direction>")
def api_get_roi(direction):
    try:
        return jsonify({"points": load_roi(direction)})
    except ValueError:
        return jsonify({"points": []}), 404
    


if __name__ == "__main__":
    app.run(debug=True)
