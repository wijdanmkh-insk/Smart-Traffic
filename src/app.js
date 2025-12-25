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

    attachROIOnVideo(video, direction);
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

    // resetAllCells();

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

/****************************
 * LOAD ROI
 ****************************/
function syncCanvasToVideo(video, canvas) {
    const rect = video.getBoundingClientRect();

    canvas.width  = rect.width;
    canvas.height = rect.height;

    canvas.style.width  = rect.width + "px";
    canvas.style.height = rect.height + "px";
}


function loadROI(direction, videoEl, canvas) {
    fetch(`http://localhost:5000/api/roi/${direction}`)
        .then(res => {
            if (!res.ok) throw new Error("ROI not found");
            return res.json();
        })
        .then(data => {
            if (!data.points || data.points.length === 0) return;

            drawROIonCanvas(videoEl, canvas, data.points);
        })
        .catch(() => {
            console.log(`No ROI for ${direction}`);
        });
}

function drawROIonCanvas(video, canvas, points) {
    const ctx = canvas.getContext("2d");

    // 🔥 CRITICAL
    syncCanvasToVideo(video, canvas);

    const scaleX = canvas.width  / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    ctx.beginPath();
    points.forEach((p, i) => {
        const x = p[0] * scaleX;
        const y = p[1] * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    console.log({
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height
});

}


function attachROIOnVideo(videoEl, direction) {
    const canvas = videoEl.closest(".cell").querySelector(".roi-canvas");

    videoEl.addEventListener("loadedmetadata", () => {
        loadROI(direction, videoEl, canvas);
    });
}




/****************************
 * SAVE ROI
 ****************************/
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
    const video = cell.querySelector("video");
    const canvas = cell.querySelector(".roi-canvas");

    if (!roiPoints[direction] || roiPoints[direction].length < 3) {
        alert("⚠️ ROI not defined yet");
        return;
    }

    // 🔥 CRITICAL: Convert canvas coords to video coords
    const scaleX = video.videoWidth / canvas.width;
    const scaleY = video.videoHeight / canvas.height;
    
    const scaledPoints = roiPoints[direction].map(p => [
        Math.round(p[0] * scaleX),
        Math.round(p[1] * scaleY)
    ]);

    fetch("http://localhost:5000/api/roi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            direction,
            points: scaledPoints  // 🔥 Save VIDEO coordinates, not canvas
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

