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
