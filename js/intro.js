import * as THREE from "three";

// Intro: a soft-shaded butt floats directly over the toilet, squeezes out a poo
// that drops STRAIGHT DOWN into the bowl. Splash, sink, done.
export function createIntro() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc2e4ee);

  const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, -50, 50);
  camera.position.set(0, 0, 10);

  // ---------- helpers ----------
  const circle = (r, color, seg = 32) =>
    new THREE.Mesh(new THREE.CircleGeometry(r, seg), new THREE.MeshBasicMaterial({ color }));
  const ellipse = (rx, ry, color, seg = 40) => {
    const m = circle(1, color, seg);
    m.scale.set(rx, ry, 1);
    return m;
  };
  const plane = (w, h, color) =>
    new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));

  function texPlane(canvas, w, h, z) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    tex.minFilter = THREE.LinearFilter;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    m.position.z = z;
    return m;
  }

  // ---------- bathroom background ----------
  {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, "#e4f3f7");
    grad.addColorStop(0.42, "#c2e4ee");
    grad.addColorStop(0.6, "#a6d2de");
    grad.addColorStop(0.6, "#8cb9c6");
    grad.addColorStop(1.0, "#6f9fae");
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 256);
    const bg = texPlane(c, 40, 12, -3);
    scene.add(bg);
    // tile grout lines on the wall (separate thin planes so they don't stretch)
    for (let x = -9; x <= 9; x += 1.8) {
      const ln = plane(0.025, 7, 0xb7dbe6);
      ln.position.set(x, 2.0, -2.9);
      ln.material.transparent = true;
      ln.material.opacity = 0.5;
      scene.add(ln);
    }
    const horizon = plane(40, 0.05, 0x6f9fae);
    horizon.position.set(0, -1.4, -2.8);
    scene.add(horizon);
  }

  // ---------- toilet (centered, bowl opening faces up) ----------
  const WATER_Y = -1.35;
  const toilet = new THREE.Group();
  scene.add(toilet);
  {
    const white = 0xf3f5f6;
    const whiteShade = 0xdbe2e5;

    // tank (behind, low) with a flush button
    const tank = plane(2.0, 1.15, white);
    tank.position.set(0, -0.35, 0.0);
    toilet.add(tank);
    const tankTop = plane(2.1, 0.18, whiteShade);
    tankTop.position.set(0, 0.18, 0.005);
    toilet.add(tankTop);
    const btn = circle(0.1, 0x9fb3bd, 20);
    btn.position.set(0, 0.0, 0.01);
    toilet.add(btn);

    // pedestal
    const ped = plane(1.5, 2.4, white);
    ped.position.set(0, -2.7, 0.05);
    toilet.add(ped);
    const pedShade = plane(0.5, 2.4, whiteShade);
    pedShade.position.set(0.45, -2.7, 0.051);
    toilet.add(pedShade);

    // bowl rim (white ellipse) + outer seat ring
    const seat = ellipse(1.75, 1.0, whiteShade);
    seat.position.set(0, -1.1, 0.1);
    toilet.add(seat);
    const rim = ellipse(1.55, 0.88, white);
    rim.position.set(0, -1.12, 0.11);
    toilet.add(rim);
    // inner bowl shadow
    const innerShadow = ellipse(1.18, 0.66, 0xc6d2d6);
    innerShadow.position.set(0, -1.18, 0.12);
    toilet.add(innerShadow);
    // water
    const water = ellipse(1.05, 0.58, 0x4fb3e0);
    water.position.set(0, WATER_Y, 0.13);
    toilet.add(water);
    const water2 = ellipse(0.75, 0.4, 0x6cc6ec);
    water2.position.set(0, WATER_Y + 0.02, 0.14);
    toilet.add(water2);
    const glint = ellipse(0.22, 0.1, 0xd6f1fb);
    glint.position.set(-0.35, WATER_Y + 0.12, 0.15);
    toilet.add(glint);
  }

  // ---------- the butt (canvas texture, soft shading) ----------
  function makeButtTexture() {
    const c = document.createElement("canvas");
    c.width = 400; c.height = 400;
    const x = c.getContext("2d");

    // thighs (behind cheeks)
    x.save();
    x.filter = "blur(5px)";
    const tg = x.createLinearGradient(0, 280, 0, 400);
    tg.addColorStop(0, "#dca684");
    tg.addColorStop(1, "#c1855f");
    x.fillStyle = tg;
    x.beginPath(); x.ellipse(108, 360, 96, 82, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(292, 360, 96, 82, 0, 0, Math.PI * 2); x.fill();
    x.restore();

    // cheeks with radial gradient (light upper-left, shadow lower)
    const cheek = (cx, cy) => {
      const r = 100;
      const g = x.createRadialGradient(cx - 28, cy - 38, 8, cx, cy + 12, r * 1.2);
      g.addColorStop(0, "#f8d8bf");
      g.addColorStop(0.55, "#eab690");
      g.addColorStop(1, "#cf9270");
      x.fillStyle = g;
      x.beginPath(); x.ellipse(cx, cy, r, r * 1.08, 0, 0, Math.PI * 2); x.fill();
    };
    cheek(146, 168);
    cheek(254, 168);

    // crack shadow (soft, vertical, narrows to the anus)
    x.save();
    x.filter = "blur(6px)";
    const cg = x.createLinearGradient(200, 80, 200, 300);
    cg.addColorStop(0, "rgba(150,95,65,0)");
    cg.addColorStop(0.45, "rgba(120,72,46,0.85)");
    cg.addColorStop(1, "rgba(95,55,33,0.95)");
    x.fillStyle = cg;
    x.beginPath(); x.ellipse(200, 198, 15, 108, 0, 0, Math.PI * 2); x.fill();
    x.restore();

    // under-cheek shadows
    x.save();
    x.filter = "blur(11px)";
    x.fillStyle = "rgba(150,92,62,0.5)";
    x.beginPath(); x.ellipse(146, 255, 82, 42, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(254, 255, 82, 42, 0, 0, Math.PI * 2); x.fill();
    x.restore();

    // highlights
    x.save();
    x.filter = "blur(9px)";
    x.fillStyle = "rgba(255,238,221,0.65)";
    x.beginPath(); x.ellipse(126, 122, 40, 30, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(274, 122, 40, 30, 0, 0, Math.PI * 2); x.fill();
    x.restore();

    // anus hint
    x.save();
    x.filter = "blur(2px)";
    x.fillStyle = "#7c4b30";
    x.beginPath(); x.ellipse(200, 286, 10, 7, 0, 0, Math.PI * 2); x.fill();
    x.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    return tex;
  }

  const BUTT_SIZE = 3.4;
  const butt = new THREE.Mesh(
    new THREE.PlaneGeometry(BUTT_SIZE, BUTT_SIZE),
    new THREE.MeshBasicMaterial({ map: makeButtTexture(), transparent: true })
  );
  // anus in canvas at (200,286) -> world offset from plane center
  const ANUS_OFFSET_Y = -((286 / 400) - 0.5) * BUTT_SIZE; // ≈ -0.73
  const BUTT_Y = 1.55;
  butt.position.set(0, BUTT_Y, 0.4);
  scene.add(butt);
  const anusY = BUTT_Y + ANUS_OFFSET_Y; // ≈ 0.82

  // ---------- the poo (side-view swirl) ----------
  const poo = new THREE.Group();
  poo.position.set(0, anusY, 0.6);
  scene.add(poo);
  {
    const brown = 0x6e4420;
    const brownL = 0x8a5a2c;
    const swirl = [
      [0, -0.7, 0.95],
      [0, 0.0, 0.75],
      [0, 0.55, 0.55],
      [0, 1.0, 0.36],
      [0, 1.3, 0.2],
    ];
    swirl.forEach(([px, py, r], i) => {
      const m = circle(r, i % 2 ? brownL : brown);
      m.position.set(px, py, 0.01 * i);
      poo.add(m);
    });
    const eL = circle(0.22, 0xffffff); eL.position.set(-0.25, 0.0, 0.3); poo.add(eL);
    const eR = circle(0.22, 0xffffff); eR.position.set(0.25, 0.0, 0.3); poo.add(eR);
    const pL = circle(0.1, 0x111111); pL.position.set(-0.23, -0.02, 0.31); poo.add(pL);
    const pR = circle(0.1, 0x111111); pR.position.set(0.27, -0.02, 0.31); poo.add(pR);
  }
  const POO_BASE = 0.6;
  poo.scale.setScalar(0.001);

  // ---------- splash droplets ----------
  const droplets = [];
  for (let i = 0; i < 12; i++) {
    const d = circle(0.08 + Math.random() * 0.1, 0x9ad6f0, 10);
    d.visible = false;
    d.position.set(0, WATER_Y, 0.5);
    scene.add(d);
    droplets.push({ mesh: d, vx: 0, vy: 0 });
  }

  // ---------- animation ----------
  let t = 0;
  let vy = 0;
  let landed = false;
  let done = false;
  const GRAV = 17;

  function update(dt) {
    t += dt;

    // butt clench / wobble while pushing
    if (t < 1.6) {
      const push = Math.max(0, Math.sin(Math.min(t, 1.5) * 3.0));
      const s = 0.05 * push;
      butt.scale.set(1 + s, 1 - s, 1);
    } else {
      butt.scale.set(1, 1, 1);
    }

    // emerge straight down from the crack
    if (t >= 0.6 && !landed && t < 1.7) {
      const k = THREE.MathUtils.clamp((t - 0.6) / 1.0, 0, 1);
      const stretch = 1 + 0.35 * Math.sin(k * Math.PI); // squeeze stretch
      poo.scale.set(POO_BASE * k, POO_BASE * k * stretch, 1);
      poo.position.y = anusY - k * 0.25;
    }

    // drop straight down (x stays 0)
    if (t >= 1.7 && !landed) {
      vy -= GRAV * dt;
      poo.position.y += vy * dt;
      poo.rotation.z += dt * 1.2;
      if (poo.position.y <= WATER_Y) {
        poo.position.y = WATER_Y;
        landed = true;
        for (const d of droplets) {
          d.mesh.visible = true;
          d.mesh.position.set((Math.random() - 0.5) * 0.4, WATER_Y, 0.5);
          d.vx = (Math.random() - 0.5) * 6;
          d.vy = 2.5 + Math.random() * 5;
        }
      }
    }

    // splash + sink
    if (landed) {
      for (const d of droplets) {
        d.vy -= 18 * dt;
        d.mesh.position.x += d.vx * dt;
        d.mesh.position.y += d.vy * dt;
        if (d.mesh.position.y < WATER_Y - 0.15) d.mesh.visible = false;
      }
      poo.position.y -= dt * 0.4;
      poo.scale.multiplyScalar(1 - dt * 0.5);
      poo.rotation.z += dt * 2.5;
      if (t > 4.1) done = true;
    }

    return done;
  }

  function dispose() {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
  }

  return { scene, camera, update, dispose };
}
