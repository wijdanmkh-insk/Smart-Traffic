/****************************
 * CONFIG & CONSTANTS
 ****************************/
const DIRECTIONS = ["north", "south", "east", "west"];

/****************************
 * DIRECTION DETECTION
 ****************************/
function detectDirection(filename) {
    const name = filename.toLowerCase();

    if (name.includes("north")) return "north";
    if (name.includes("south")) return "south";
    if (name.includes("east")) return "east";
    if (name.includes("west")) return "west";

    return null;
}

/****************************
 * UI HELPERS
 ****************************/
function showNoVideo(direction) {
    const video = document.getElementById(direction);
    const text = document.getElementById(`${direction}-text`);

    video.style.display = "none";
    text.style.display = "block";
}

function showVideo(direction, file) {
    const video = document.getElementById(direction);
    const text = document.getElementById(`${direction}-text`);

    video.src = URL.createObjectURL(file);
    video.style.display = "block";
    text.style.display = "none";

    // REQUIRED for autoplay
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    video.load();
    video.play().catch(() => {
        console.log("Autoplay blocked:", direction);
    });
}


function resetAllCells() {
    DIRECTIONS.forEach(dir => showNoVideo(dir));
}

function uploadVideos(files) {
    const formData = new FormData();

    for (const file of files) {
        formData.append("videos", file);
    }

    fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        showPopup("🎥 Videos uploaded");
        console.log(data);
    })
    .catch(() => showPopup("❌ Video upload failed", true));
}


/****************************
 * MAIN HANDLER
 ****************************/
function handleVideoUpload(event) {
    const files = event.target.files;

    resetAllCells();

    for (let file of files) {
        const direction = detectDirection(file.name);
        if (!direction) continue;

        showVideo(direction, file);
    }
}

/****************************
 * INIT
 ****************************/
function init() {
    const input = document.getElementById("videoInput");
    input.addEventListener("change", handleVideoUpload);
}

document.addEventListener("DOMContentLoaded", init);

/****************************
 * BACKEND HANDLING WITH FLASK
 ****************************/
let activeCanvas = null;
let roiPoints = {};

document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", e => {
        const cell = e.target.closest(".cell");
        const canvas = cell.querySelector(".roi-canvas");
        const dir = cell.dataset.direction;

        activeCanvas = canvas;
        roiPoints[dir] = [];

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        canvas.style.pointerEvents = "auto";

        canvas.onclick = ev => {
            const rect = canvas.getBoundingClientRect();
            const x = ev.clientX - rect.left;
            const y = ev.clientY - rect.top;

            roiPoints[dir].push([x, y]);
            drawROI(canvas, roiPoints[dir]);
        };
    });
});

function drawROI(canvas, points) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
        i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
    });
    ctx.closePath();
    ctx.stroke();
}

async function loadROI(direction, canvas) {
    try {
        const res = await fetch(`http://localhost:5000/api/roi/${direction}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!data.points || data.points.length === 0) return;

        drawROI(canvas, data.points);
        showPopup(`📐 ROI loaded for ${direction.toUpperCase()}`);
    } catch (err) {
        console.error(err);
        showPopup(`❌ Failed to load ROI for ${direction}`, true);
    }
}

document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", saveROI);
});

function saveROI(event) {
    const cell = event.target.closest(".cell");
    if (!cell) {
        alert("❌ Cannot determine direction cell");
        return;
    }

    const direction = cell.dataset.direction;

    if (!roiPoints[direction] || roiPoints[direction].length < 3) {
        alert("⚠️ ROI not defined yet");
        return;
    }

    fetch("http://localhost:5000/api/roi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            direction,
            points: roiPoints[direction]
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to save ROI");
        return res.json();
    })
    .then(() => {
        showPopup(`✅ ROI saved for ${direction.toUpperCase()}`);
    })
    .catch(err => {
        console.error(err);
        showPopup("❌ Failed to save ROI", true);
    });
}


function showPopup(message, isError = false) {
    const popup = document.getElementById("popup");

    popup.textContent = message;
    popup.classList.remove("hidden", "error");

    if (isError) popup.classList.add("error");

    setTimeout(() => {
        popup.classList.add("hidden");
    }, 2500);
}

