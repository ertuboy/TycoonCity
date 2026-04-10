
const map = document.getElementById("map");

// ================= GAME STATE =================
let money = 100;
let population = 0;
let energy = 0;
let happiness = 50;
let level = 1;

let mode = null;
let zone = "residential";

let zoom = 1;

// ================= MAP SIZE =================
const width = 25;
const height = 80;

let cells = [];

// ================= INIT MAP =================
function initMap() {

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            const cell = document.createElement("div");
            cell.classList.add("cell");

            cell.dataset.type = "empty";
            cell.dataset.zone = "residential";
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.dataset.people = 0;

            cell.addEventListener("click", () => handleClick(cell));

            map.appendChild(cell);
            cells.push(cell);
        }
    }
}

initMap();

// ================= 🚧 MAIN ROAD (3 LANES VERTICAL) =================
function createMainRoad() {

    const left = Math.floor(width / 2) - 1;

    cells.forEach(cell => {

        const x = +cell.dataset.x;

        if (x === left) cell.classList.add("road-left");
        if (x === left + 1) cell.classList.add("road-center");
        if (x === left + 2) cell.classList.add("road-right");

        if (x >= left && x <= left + 2) {
            cell.dataset.type = "road";
        }
    });
}

createMainRoad();

// ================= CLICK =================
function handleClick(cell) {

    // 🚫 нельзя строить на дороге
    if (cell.dataset.type === "road" && mode !== "destroy") return;

    if (mode === "destroy") {
        destroy(cell);
        update();
        return;
    }

    if (mode === "road") {
        buildRoad(cell);
        update();
        return;
    }

    if (cell.dataset.type !== "empty") {
        upgrade(cell);
        update();
        return;
    }

    if (!mode) return;

    switch (mode) {

        case "house":
            build(cell, "house", "🏠", 10, 2, 0, 1);
            break;

        case "apartment":
            build(cell, "apartment", "🏢", 25, 5, 1, 2);
            break;

        case "shop":
            build(cell, "shop", "🏪", 40, 8, 2, 2);
            break;

        case "factory":
            build(cell, "factory", "🏭", 60, 15, 5, -2);
            break;

        case "park":
            build(cell, "park", "🌳", 15, 0, -2, 5);
            break;
    }

    update();
}

// ================= BUILD =================
function build(cell, type, emoji, cost, pop, en, happ) {

    if (money < cost) return;

    money -= cost;

    cell.textContent = emoji;
    cell.dataset.type = type;
    cell.dataset.people = 1;
    cell.dataset.zone = zone;

    population += pop;
    energy += en;
    happiness += happ;

    updatePeople(cell);
}

// ================= ROAD BUILD =================
function buildRoad(cell) {

    if (money < 5) return;

    money -= 5;

    cell.dataset.type = "road";
    cell.textContent = "";

    cell.classList.remove("road-left", "road-center", "road-right");
}

// ================= UPGRADE =================
function upgrade(cell) {

    let lvl = Number(cell.dataset.level || 0);
    if (lvl >= 5) return;

    const cost = (lvl + 1) * 20;
    if (money < cost) return;

    money -= cost;
    cell.dataset.level = lvl + 1;

    let people = Number(cell.dataset.people || 0);
    people += 1;
    cell.dataset.people = people;

    updatePeople(cell);
}

// ================= DESTROY =================
function destroy(cell) {

    if (cell.dataset.type === "empty") return;

    population -= Number(cell.dataset.people || 0);

    cell.dataset.type = "empty";
    cell.dataset.level = 0;
    cell.dataset.people = 0;
    cell.textContent = "";

    cell.className = "cell";
}

// ================= 👤 PEOPLE DISPLAY =================
function updatePeople(cell) {

    let people = Number(cell.dataset.people || 0);

    if (people > 0) {
        cell.innerHTML = `${cell.textContent}<div class="people">👤 x${people}</div>`;
    }
}

// ================= 🚶 NPC SYSTEM =================
function moveNPC() {

    cells.forEach(cell => {

        if (cell.dataset.type !== "road") return;

        // шанс появления NPC
        if (Math.random() < 0.02) {

            const direction = Math.random() > 0.5 ? "up" : "down";

            const x = +cell.dataset.x;
            const y = +cell.dataset.y;

            const index = y * width + x;

            let targetIndex = direction === "up"
                ? index - width
                : index + width;

            let target = cells[targetIndex];

            if (target && target.dataset.type === "road") {
                target.textContent = "🚶";
                setTimeout(() => {
                    target.textContent = "";
                }, 800);
            }
        }
    });
}

// ================= ECONOMY =================
setInterval(() => {

    let income = 0;

    cells.forEach(c => {

        let t = c.dataset.type;
        let lvl = Number(c.dataset.level || 0);

        if (t === "house") income += 2 * lvl;
        if (t === "apartment") income += 4 * lvl;
        if (t === "shop") income += 6 * lvl;
        if (t === "factory") income += 10 * lvl;
    });

    money += income;

    if (energy < population) {
        happiness -= 2;
        money -= 5;
    }

    happiness = Math.max(0, Math.min(100, happiness));

    level = Math.floor(population / 20) + 1;

    update();

}, 2000);

// ================= NPC LOOP =================
setInterval(moveNPC, 300);

// ================= ZONE SYSTEM =================
function setZone(z) {
    zone = z;
}

// ================= ZOOM =================
function zoomIn() {
    zoom += 0.1;
    map.style.transform = `scale(${zoom})`;
}

function zoomOut() {
    zoom -= 0.1;
    if (zoom < 0.5) zoom = 0.5;
    map.style.transform = `scale(${zoom})`;
}

// ================= SAVE / LOAD =================
function saveGame() {

    const data = cells.map(c => ({
        t: c.dataset.type,
        z: c.dataset.zone,
        l: c.dataset.level,
        p: c.dataset.people,
        html: c.innerHTML
    }));

    localStorage.setItem("city_v4", JSON.stringify({
        money,
        population,
        energy,
        happiness,
        level,
        zoom,
        data
    }));

    alert("💾 Saved");
}

function loadGame() {

    const save = JSON.parse(localStorage.getItem("city_v4"));
    if (!save) return;

    money = save.money;
    population = save.population;
    energy = save.energy;
    happiness = save.happiness;
    level = save.level;
    zoom = save.zoom || 1;

    map.style.transform = `scale(${zoom})`;

    save.data.forEach((c, i) => {

        let cell = cells[i];

        cell.dataset.type = c.t;
        cell.dataset.zone = c.z;
        cell.dataset.level = c.l;
        cell.dataset.people = c.p;
        cell.innerHTML = c.html || "";

    });

    update();
}

// ================= MODE =================
function setMode(m) {
    mode = m;
}

// ================= UI UPDATE =================
function update() {

    document.getElementById("money").textContent = money;
    document.getElementById("population").textContent = population;
    document.getElementById("energy").textContent = energy;
    document.getElementById("happiness").textContent = happiness;
    document.getElementById("level").textContent = level;
}

update();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
        .then(() => console.log("PWA Service Worker registered"))
        .catch(err => console.log("SW error", err));
}