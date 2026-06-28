import * as THREE from "three";
import { createIntro } from "./intro.js";
import { createGame } from "./game.js";

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const fog = document.getElementById("fog");
const hud = document.getElementById("hud");
const titleEl = document.getElementById("title");
const endEl = document.getElementById("end");
const loadingEl = document.getElementById("loading");
const healthEl = document.getElementById("health");
const healthVal = document.getElementById("health-val");
const speedVal = document.getElementById("speed-val");
const timerVal = document.getElementById("timer-val");
const endTitle = document.getElementById("end-title");
const endMsg = document.getElementById("end-msg");
const minimap = document.getElementById("minimap");
const mmCanvas = document.getElementById("minimap-canvas");
const mmCtx = mmCanvas.getContext("2d");
const mmDist = document.getElementById("mm-dist");

// ---------- input ----------
const keys = {};
const keyMap = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};
addEventListener("keydown", (e) => { if (keyMap[e.code]) { keys[keyMap[e.code]] = true; e.preventDefault(); } });
addEventListener("keyup", (e) => { if (keyMap[e.code]) keys[keyMap[e.code]] = false; });

function readInput() {
  let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let y = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
  if (x !== 0 && y !== 0) { const inv = 1 / Math.SQRT2; x *= inv; y *= inv; }
  return { x, y };
}

// ---------- mode management ----------
let mode = "title"; // title | intro | play | end
let intro = null;
let game = null;
let active = null; // {scene, camera}

function sizeRenderer() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  const aspect = w / h;
  if (intro) {
    const halfH = 5;
    intro.camera.top = halfH; intro.camera.bottom = -halfH;
    intro.camera.left = -halfH * aspect; intro.camera.right = halfH * aspect;
    intro.camera.updateProjectionMatrix();
  }
  if (game) game.resize(aspect);
}
addEventListener("resize", sizeRenderer);

function startIntro() {
  titleEl.classList.add("hidden");
  endEl.classList.add("hidden");
  if (game) { game.dispose(); game = null; }
  intro = createIntro();
  active = intro;
  mode = "intro";
  sizeRenderer();
}

function startGame() {
  if (intro) { intro.dispose(); intro = null; }
  game = createGame();
  active = game;
  hud.classList.remove("hidden");
  fog.classList.remove("hidden");
  minimap.classList.remove("hidden");
  mode = "play";
  sizeRenderer();
}

function endGame(won) {
  mode = "end";
  hud.classList.add("hidden");
  fog.classList.add("hidden");
  minimap.classList.add("hidden");
  const t = game ? game.state.time.toFixed(1) : "0";
  if (won) {
    endTitle.textContent = "🌊 You reached the ocean!";
    endMsg.textContent = `Freedom at last. Escape time: ${t}s. You are one heroic poo.`;
  } else {
    endTitle.textContent = "💀 Flushed out…";
    endMsg.textContent = `The sewer got you after ${t}s. Wanna give it another go?`;
  }
  endEl.classList.remove("hidden");
}

document.getElementById("start-btn").addEventListener("click", startIntro);
document.getElementById("restart-btn").addEventListener("click", startIntro);

// ---------- HUD ----------
function updateHud() {
  if (!game) return;
  const s = game.state;
  healthVal.textContent = Math.ceil(s.health);
  speedVal.textContent = s.speedLabel;
  timerVal.textContent = s.time.toFixed(1);
  if (s.hurt) {
    healthEl.classList.remove("hurt");
    void healthEl.offsetWidth; // restart animation
    healthEl.classList.add("hurt");
  }
}

function drawMinimap() {
  if (!game) return;
  const info = game.mapInfo;
  const s = game.state;
  const W = mmCanvas.width;
  const H = mmCanvas.height;
  const pad = 16;
  const spanX = info.maxX - info.minX;
  const spanY = info.maxY - info.minY;
  const toCanvas = (wx, wy) => [
    pad + ((wx - info.minX) / spanX) * (W - 2 * pad),
    pad + ((info.maxY - wy) / spanY) * (H - 2 * pad),
  ];

  mmCtx.clearRect(0, 0, W, H);

  // maze area frame
  mmCtx.strokeStyle = "rgba(120,200,240,0.25)";
  mmCtx.lineWidth = 2;
  mmCtx.strokeRect(pad - 6, pad - 6, W - 2 * (pad - 6), H - 2 * (pad - 6));

  const [px, py] = toCanvas(s.px, s.py);
  const [ox, oy] = toCanvas(info.ocean.x, info.ocean.y);
  const t = performance.now() / 1000;

  // heading line player -> ocean
  mmCtx.strokeStyle = "rgba(255,210,74,0.55)";
  mmCtx.lineWidth = 2;
  mmCtx.setLineDash([4, 4]);
  mmCtx.beginPath();
  mmCtx.moveTo(px, py);
  mmCtx.lineTo(ox, oy);
  mmCtx.stroke();
  mmCtx.setLineDash([]);

  // ocean marker (pulsing)
  const pulse = 6 + Math.sin(t * 3) * 2;
  mmCtx.beginPath();
  mmCtx.arc(ox, oy, pulse + 4, 0, Math.PI * 2);
  mmCtx.fillStyle = "rgba(42,166,224,0.25)";
  mmCtx.fill();
  mmCtx.beginPath();
  mmCtx.arc(ox, oy, 5, 0, Math.PI * 2);
  mmCtx.fillStyle = "#2aa6e0";
  mmCtx.fill();
  mmCtx.fillStyle = "#dff4ff";
  mmCtx.font = "9px sans-serif";
  mmCtx.textAlign = "center";
  mmCtx.fillText("🌊", ox, oy - 9);

  // player marker + heading arrow
  const ang = Math.atan2(oy - py, ox - px);
  mmCtx.save();
  mmCtx.translate(px, py);
  mmCtx.rotate(ang);
  mmCtx.fillStyle = "#ffd24a";
  mmCtx.beginPath();
  mmCtx.moveTo(11, 0);
  mmCtx.lineTo(3, -5);
  mmCtx.lineTo(3, 5);
  mmCtx.closePath();
  mmCtx.fill();
  mmCtx.restore();

  mmCtx.beginPath();
  mmCtx.arc(px, py, 5, 0, Math.PI * 2);
  mmCtx.fillStyle = "#6e4420";
  mmCtx.fill();
  mmCtx.lineWidth = 2;
  mmCtx.strokeStyle = "#caa06a";
  mmCtx.stroke();

  const d = Math.hypot(info.ocean.x - s.px, info.ocean.y - s.py);
  mmDist.textContent = `~${Math.round(d)} away`;
}

// ---------- loop ----------
let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05; // clamp big frame gaps

  if (mode === "intro" && intro) {
    const done = intro.update(dt);
    renderer.render(intro.scene, intro.camera);
    if (done) startGame();
  } else if (mode === "play" && game) {
    const status = game.update(dt, readInput());
    renderer.render(game.scene, game.camera);
    updateHud();
    drawMinimap();
    if (status === "win") endGame(true);
    else if (status === "lose") endGame(false);
  } else if (active) {
    renderer.render(active.scene, active.camera);
  }

  requestAnimationFrame(loop);
}

// boot
sizeRenderer();
loadingEl.classList.add("hidden");
requestAnimationFrame(loop);
