import * as THREE from "three";
import { generateMaze, openTiles } from "./maze.js";
import { createPoo } from "./poo.js";

// World mapping: tile (tx, ty) -> world (tx, -ty). Tile spans 1x1, centered on integer.
const T = 1;
const PLAYER_R = 0.3;

export function createGame() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1410);

  const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, -100, 100);
  camera.position.z = 10;

  const cols = 16;
  const rows = 12;
  const maze = generateMaze(cols, rows);
  const { solid, W, H } = maze;

  // ---------- collision ----------
  function isSolidTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
    return solid[ty][tx];
  }
  function circleHitsWall(wx, wy, r) {
    const txlo = Math.floor(wx - r + 0.5);
    const txhi = Math.floor(wx + r + 0.5);
    const tylo = Math.floor(-(wy + r) + 0.5);
    const tyhi = Math.floor(-(wy - r) + 0.5);
    for (let ty = tylo; ty <= tyhi; ty++) {
      for (let tx = txlo; tx <= txhi; tx++) {
        if (!isSolidTile(tx, ty)) continue;
        const cx = tx;
        const cy = -ty;
        const nx = Math.max(cx - 0.5, Math.min(wx, cx + 0.5));
        const ny = Math.max(cy - 0.5, Math.min(wy, cy + 0.5));
        const dx = wx - nx;
        const dy = wy - ny;
        if (dx * dx + dy * dy < r * r) return true;
      }
    }
    return false;
  }

  // ---------- sewer textures ----------
  // Grimy, wet sewer floor tile (tileable; one cell == one world tile).
  function makeFloorTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "#1d2a23";
    x.fillRect(0, 0, 128, 128);
    // mottled sludge stains
    for (let i = 0; i < 26; i++) {
      const r = 6 + Math.random() * 28;
      const px = Math.random() * 128;
      const py = Math.random() * 128;
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      const tint = Math.random() < 0.5 ? "38,55,40" : "30,40,30";
      g.addColorStop(0, `rgba(${tint},0.45)`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
    }
    // fine speckle grime
    for (let i = 0; i < 400; i++) {
      x.fillStyle = Math.random() < 0.5 ? "rgba(10,16,12,0.5)" : "rgba(70,90,72,0.25)";
      x.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
    }
    // grout border (tile seams) — darker recessed edge
    x.strokeStyle = "rgba(8,12,9,0.85)";
    x.lineWidth = 5;
    x.strokeRect(0, 0, 128, 128);
    x.strokeStyle = "rgba(60,80,62,0.18)";
    x.lineWidth = 1.5;
    x.strokeRect(4, 4, 120, 120);
    // wet sheen
    const sh = x.createLinearGradient(0, 0, 128, 128);
    sh.addColorStop(0, "rgba(120,160,150,0.07)");
    sh.addColorStop(0.5, "rgba(0,0,0,0)");
    x.fillStyle = sh;
    x.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  // Mossy sewer brick block with a beveled, raised look.
  function makeWallTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    // mortar base
    x.fillStyle = "#19241b";
    x.fillRect(0, 0, 128, 128);
    // brick courses
    const bh = 21;
    let row = 0;
    for (let by = -bh; by < 128; by += bh) {
      const offset = row % 2 ? 32 : 0;
      for (let bx = -64 + offset; bx < 128; bx += 64) {
        const shade = 0.82 + Math.random() * 0.36;
        const base = new THREE.Color(0x40624a).multiplyScalar(shade);
        x.fillStyle = `rgb(${(base.r * 255) | 0},${(base.g * 255) | 0},${(base.b * 255) | 0})`;
        const px = bx + 3, py = by + 3, pw = 64 - 6, ph = bh - 6;
        x.fillRect(px, py, pw, ph);
        // bevel: lighter top/left, darker bottom/right
        x.fillStyle = "rgba(150,180,150,0.28)";
        x.fillRect(px, py, pw, 3);
        x.fillRect(px, py, 3, ph);
        x.fillStyle = "rgba(0,0,0,0.4)";
        x.fillRect(px, py + ph - 3, pw, 3);
        x.fillRect(px + pw - 3, py, 3, ph);
      }
      row++;
    }
    // moss/grime patches
    for (let i = 0; i < 14; i++) {
      const r = 8 + Math.random() * 22;
      const px = Math.random() * 128;
      const py = Math.random() * 128;
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, "rgba(46,74,40,0.5)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
    }
    // dark drip streaks
    for (let i = 0; i < 6; i++) {
      x.fillStyle = "rgba(8,14,9,0.4)";
      x.fillRect(Math.random() * 128, 0, 2 + Math.random() * 3, 128);
    }
    // outer recessed edge so blocks read as raised
    x.strokeStyle = "rgba(6,10,7,0.9)";
    x.lineWidth = 4;
    x.strokeRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  // ---------- floor ----------
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshBasicMaterial({ color: 0x0a120d })
  );
  backdrop.position.set(W / 2 - 0.5, -(H / 2 - 0.5), -1.3);
  scene.add(backdrop);

  const floorTex = makeFloorTexture();
  floorTex.repeat.set(W, H);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: floorTex })
  );
  floor.position.set(W / 2 - 0.5, -(H / 2 - 0.5), -1);
  scene.add(floor);

  // ---------- walls (instanced, mossy brick) ----------
  const wallTiles = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (solid[y][x]) wallTiles.push([x, y]);

  const wallGeo = new THREE.PlaneGeometry(1, 1);
  const wallMat = new THREE.MeshBasicMaterial({ map: makeWallTexture() });
  const walls = new THREE.InstancedMesh(wallGeo, wallMat, wallTiles.length);
  const dummy = new THREE.Object3D();
  const wallTint = new THREE.Color();
  wallTiles.forEach(([x, y], i) => {
    dummy.position.set(x, -y, 0);
    dummy.updateMatrix();
    walls.setMatrixAt(i, dummy.matrix);
    const shade = 0.82 + Math.random() * 0.32;
    walls.setColorAt(i, wallTint.setRGB(shade, shade, shade));
  });
  walls.instanceColor.needsUpdate = true;
  scene.add(walls);

  // ---------- helpers to pick tiles ----------
  const floors = openTiles(maze);
  const startTile = floors.reduce((a, b) =>
    a[0] + a[1] < b[0] + b[1] ? a : b
  ); // closest to top-left
  const exitTile = floors.reduce((a, b) =>
    a[0] + a[1] > b[0] + b[1] ? a : b
  ); // closest to bottom-right

  const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const usable = floors.filter(
    (t) => dist2(t, startTile) > 9 && dist2(t, exitTile) > 4
  );
  function takeTiles(n) {
    const out = [];
    for (let i = 0; i < n && usable.length; i++) {
      const idx = (Math.random() * usable.length) | 0;
      out.push(usable.splice(idx, 1)[0]);
    }
    return out;
  }

  const tileToWorld = (t) => new THREE.Vector2(t[0], -t[1]);

  // ---------- ocean exit ----------
  const ocean = new THREE.Group();
  const ow = tileToWorld(exitTile);
  ocean.position.set(ow.x, ow.y, 0.05);
  const oceanDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.65, 28),
    new THREE.MeshBasicMaterial({ color: 0x2aa6e0 })
  );
  ocean.add(oceanDisc);
  const oceanRing = new THREE.Mesh(
    new THREE.RingGeometry(0.66, 0.85, 28),
    new THREE.MeshBasicMaterial({ color: 0x7fe0ff, transparent: true, opacity: 0.6 })
  );
  ocean.add(oceanRing);
  scene.add(ocean);
  const oceanPos = ow.clone();

  // ---------- hazards ----------
  const tps = []; // toilet paper
  takeTiles(10).forEach((t) => {
    const w = tileToWorld(t);
    const g = new THREE.Group();
    g.position.set(w.x, w.y, 0.1);
    const roll = new THREE.Mesh(new THREE.CircleGeometry(0.34, 18),
      new THREE.MeshBasicMaterial({ color: 0xf4f0e6 }));
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14),
      new THREE.MeshBasicMaterial({ color: 0xcfc6b3 }));
    hole.position.z = 0.01;
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    sheet.position.set(0.3, -0.25, -0.01);
    g.add(roll, hole, sheet);
    scene.add(g);
    tps.push({ mesh: g, pos: w });
  });

  const pumps = []; // {pos, type:'up'|'down', mesh, cooldown}
  const mkPump = (t, type) => {
    const w = tileToWorld(t);
    const g = new THREE.Group();
    g.position.set(w.x, w.y, 0.08);
    const base = new THREE.Mesh(new THREE.CircleGeometry(0.4, 6),
      new THREE.MeshBasicMaterial({ color: type === "up" ? 0x1e7a3a : 0x7a1e1e }));
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.36, 3),
      new THREE.MeshBasicMaterial({ color: type === "up" ? 0x46d36b : 0xe0483a }));
    arrow.position.z = 0.01;
    arrow.rotation.z = type === "up" ? 0 : Math.PI;
    g.add(base, arrow);
    scene.add(g);
    pumps.push({ pos: w, type, mesh: g, cooldown: 0, base });
  };
  takeTiles(5).forEach((t) => mkPump(t, "up"));
  takeTiles(5).forEach((t) => mkPump(t, "down"));

  const fans = []; // {pos, mesh, blades}
  takeTiles(6).forEach((t) => {
    const w = tileToWorld(t);
    const g = new THREE.Group();
    g.position.set(w.x, w.y, 0.12);
    const hub = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12),
      new THREE.MeshBasicMaterial({ color: 0x8a929b }));
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0xc3ccd6 });
    const b1 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.16), bladeMat);
    const b2 = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.9), bladeMat);
    const blades = new THREE.Group();
    blades.add(b1, b2);
    g.add(blades, hub);
    scene.add(g);
    fans.push({ pos: w, mesh: g, blades, spin: Math.random() * Math.PI });
  });

  const critters = []; // {pos, vel, mesh, dir, retarget}
  takeTiles(6).forEach((t) => {
    const w = tileToWorld(t);
    const g = createCritter();
    g.position.set(w.x, w.y, 0.13);
    scene.add(g);
    critters.push({
      pos: w.clone(),
      mesh: g,
      dir: new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize(),
      retarget: 0,
    });
  });

  function createCritter() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CircleGeometry(0.28, 18),
      new THREE.MeshBasicMaterial({ color: 0x9b59b6 }));
    g.add(body);
    const eye = (x) => {
      const e = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      e.position.set(x, 0.08, 0.01);
      g.add(e);
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.04, 8),
        new THREE.MeshBasicMaterial({ color: 0x000000 }));
      p.position.set(x, 0.06, 0.02);
      g.add(p);
    };
    eye(-0.1); eye(0.1);
    return g;
  }

  // ---------- player ----------
  const player = createPoo(PLAYER_R);
  const sw = tileToWorld(startTile);
  const playerPos = sw.clone();
  player.position.set(sw.x, sw.y, 0.2);
  scene.add(player);

  // ---------- state ----------
  const state = {
    health: 100,
    status: "play", // play | win | lose
    time: 0,
    boost: 0,
    slow: 0,
    tangle: 0,
    iframe: 0,
    hurt: false,
    speedLabel: "Normal",
  };

  const baseSpeed = 4.2;

  function damage(amount) {
    if (state.iframe > 0) return;
    state.health = Math.max(0, state.health - amount);
    state.iframe = 0.6;
    state.hurt = true;
    if (state.health <= 0) state.status = "lose";
  }

  function update(dt, input) {
    if (state.status !== "play") return state.status;
    state.time += dt;
    state.hurt = false;
    if (state.iframe > 0) state.iframe -= dt;

    // status timers
    if (state.boost > 0) state.boost -= dt;
    if (state.slow > 0) state.slow -= dt;

    let speedMul = 1;
    state.speedLabel = "Normal";
    if (state.boost > 0) { speedMul *= 1.8; state.speedLabel = "FAST!"; }
    if (state.slow > 0) { speedMul *= 0.45; state.speedLabel = "Slow…"; }

    // tangle (toilet paper) — struggle by moving
    const moving = input.x !== 0 || input.y !== 0;
    if (state.tangle > 0) {
      speedMul *= 0.25;
      state.speedLabel = "Tangled!";
      state.tangle -= dt * (moving ? 2.2 : 0.6);
      state.health = Math.max(0, state.health - dt * 3);
      if (state.health <= 0) state.status = "lose";
    }

    // movement with axis separation
    const speed = baseSpeed * speedMul;
    let nx = playerPos.x + input.x * speed * dt;
    if (!circleHitsWall(nx, playerPos.y, PLAYER_R)) playerPos.x = nx;
    let ny = playerPos.y + input.y * speed * dt;
    if (!circleHitsWall(playerPos.x, ny, PLAYER_R)) playerPos.y = ny;

    player.position.set(playerPos.x, playerPos.y, 0.2);
    // stay upright (classic poo look); just lean slightly into horizontal movement
    const targetLean = -input.x * 0.18;
    player.rotation.z += (targetLean - player.rotation.z) * Math.min(1, dt * 10);
    // little squash bob
    const bob = 1 + Math.sin(state.time * 12) * (moving ? 0.06 : 0.02);
    player.scale.set(1 / bob, bob, 1);

    // camera follows
    camera.position.x = playerPos.x;
    camera.position.y = playerPos.y;
    state.px = playerPos.x;
    state.py = playerPos.y;

    // ---- hazard interactions ----
    // toilet paper
    for (const tp of tps) {
      if (playerPos.distanceTo(tp.pos) < 0.5) {
        state.tangle = Math.max(state.tangle, 1.6);
      }
    }
    // pumps
    for (const p of pumps) {
      if (p.cooldown > 0) { p.cooldown -= dt; p.base.material.opacity = 0.4; p.base.material.transparent = true; }
      else { p.base.material.opacity = 1; }
      p.mesh.rotation.z += dt * 0.5;
      if (p.cooldown <= 0 && playerPos.distanceTo(p.pos) < 0.42) {
        if (p.type === "up") { state.boost = 3.2; state.slow = 0; }
        else { state.slow = 3.0; state.boost = 0; }
        p.cooldown = 2.5;
      }
    }
    // fans
    for (const f of fans) {
      f.spin += dt * 7;
      f.blades.rotation.z = f.spin;
      if (playerPos.distanceTo(f.pos) < 0.5) damage(34 * dt + 4);
    }
    // critters
    for (const c of critters) {
      c.retarget -= dt;
      const toPlayer = playerPos.clone().sub(c.pos);
      const seeDist = toPlayer.length();
      let dir;
      if (seeDist < 4.5) {
        dir = toPlayer.normalize();
      } else {
        if (c.retarget <= 0) {
          c.dir = new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
          c.retarget = 1 + Math.random() * 1.5;
        }
        dir = c.dir;
      }
      const cspeed = (seeDist < 4.5 ? 2.6 : 1.6);
      let cnx = c.pos.x + dir.x * cspeed * dt;
      let cny = c.pos.y + dir.y * cspeed * dt;
      if (!circleHitsWall(cnx, c.pos.y, 0.28)) c.pos.x = cnx; else c.retarget = 0;
      if (!circleHitsWall(c.pos.x, cny, 0.28)) c.pos.y = cny; else c.retarget = 0;
      c.mesh.position.set(c.pos.x, c.pos.y, 0.13);
      const wob = 1 + Math.sin(state.time * 10 + c.pos.x) * 0.08;
      c.mesh.scale.set(wob, 1 / wob, 1);
      if (playerPos.distanceTo(c.pos) < 0.55) damage(30 * dt + 3);
    }

    // ocean animation + win check
    const pulse = 1 + Math.sin(state.time * 3) * 0.08;
    oceanRing.scale.set(pulse, pulse, 1);
    oceanRing.material.opacity = 0.4 + Math.sin(state.time * 3) * 0.2;
    if (playerPos.distanceTo(oceanPos) < 0.6) state.status = "win";

    return state.status;
  }

  function resize(aspect) {
    const viewH = 15; // tiles visible vertically -> small view = fog of war
    const half = viewH / 2;
    camera.top = half;
    camera.bottom = -half;
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }

  // Minimap bounds + ocean location (world coords). Walls are intentionally
  // NOT exposed so the map only gives a bearing, not the solution.
  const mapInfo = {
    minX: -0.5,
    maxX: W - 0.5,
    minY: -(H - 0.5),
    maxY: 0.5,
    ocean: { x: oceanPos.x, y: oceanPos.y },
  };

  state.px = sw.x;
  state.py = sw.y;

  return { scene, camera, update, resize, dispose, state, mapInfo };
}
