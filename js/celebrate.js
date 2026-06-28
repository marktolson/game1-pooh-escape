import * as THREE from "three";
import { createPoo } from "./poo.js";

// A big, silly, joyful ocean-freedom celebration scene.
export function createCelebration() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7ec8ef);

  const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, -50, 50);
  camera.position.set(0, 0, 20);

  const WATER = -0.4;

  const circle = (r, color, seg = 32) =>
    new THREE.Mesh(new THREE.CircleGeometry(r, seg), new THREE.MeshBasicMaterial({ color }));

  // ---------- sky ----------
  {
    const c = document.createElement("canvas");
    c.width = 8; c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#3fa9e6");
    grad.addColorStop(0.55, "#8fd4f2");
    grad.addColorStop(1, "#d8f3ff");
    g.fillStyle = grad; g.fillRect(0, 0, 8, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshBasicMaterial({ map: tex }));
    sky.position.set(0, 2, -5);
    scene.add(sky);
  }

  // ---------- sun with spinning rays ----------
  const sun = new THREE.Group();
  sun.position.set(-5.4, 3.4, -4);
  scene.add(sun);
  const rays = new THREE.Group();
  sun.add(rays);
  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const ray = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 2.2),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.7 })
    );
    ray.position.y = 1.4;
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / rayCount) * Math.PI * 2;
    pivot.add(ray);
    rays.add(pivot);
  }
  sun.add(circle(1.0, 0xffd83a, 40));
  sun.add(circle(0.82, 0xffe680, 40)).position.z = 0.01;

  // ---------- clouds ----------
  const cloud = (cx, cy, s) => {
    const g = new THREE.Group();
    g.position.set(cx, cy, -4.5);
    g.scale.setScalar(s);
    [[-0.5, 0, 0.45], [0.5, 0, 0.45], [0, 0.18, 0.55]].forEach(([x, y, r]) => {
      const m = circle(r, 0xffffff, 18);
      m.position.set(x, y, 0);
      g.add(m);
    });
    scene.add(g);
    return g;
  };
  const clouds = [cloud(3.5, 3.6, 1), cloud(-1.5, 4.0, 0.7), cloud(6, 2.6, 0.85)];

  // ---------- rainbow arc ----------
  {
    const colors = [0xff5d5d, 0xffa53a, 0xffe24a, 0x46d36b, 0x42c0ff, 0xb06bff];
    colors.forEach((col, i) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3.0 + i * 0.28, 3.28 + i * 0.28, 48, 1, Math.PI, Math.PI),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 })
      );
      ring.position.set(0.5, WATER, -4.2);
      scene.add(ring);
    });
  }

  // ---------- ocean (animated waves) ----------
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), new THREE.MeshBasicMaterial({ color: 0x1f6fae }));
  deep.position.set(0, WATER - 5, -1);
  scene.add(deep);

  const waveLayers = [];
  function makeWave(yTop, color, amp, freq, speed, z, opacity = 1) {
    const W = 30, Hh = 8, seg = 60;
    const geo = new THREE.PlaneGeometry(W, Hh, seg, 1);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, yTop - Hh / 2, z);
    scene.add(mesh);
    const pos = geo.attributes.position;
    const topIdx = [];
    const baseX = [];
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0) { topIdx.push(i); baseX.push(pos.getX(i)); }
    }
    waveLayers.push({ pos, topIdx, baseX, amp, freq, speed, top: Hh / 2 });
  }
  makeWave(WATER + 0.05, 0x2f93cf, 0.18, 0.9, 1.6, -0.5);
  makeWave(WATER - 0.05, 0x46b0e6, 0.24, 0.7, 1.1, 0.0);
  makeWave(WATER + 0.22, 0xbfeaff, 0.16, 1.2, 2.2, 0.4, 0.85);

  // ---------- bubbles ----------
  const bubbles = [];
  for (let i = 0; i < 24; i++) {
    const b = circle(0.05 + Math.random() * 0.08, 0xcdeeff, 8);
    b.material.transparent = true; b.material.opacity = 0.5;
    b.position.set((Math.random() - 0.5) * 16, WATER - Math.random() * 4, 0.3);
    scene.add(b);
    bubbles.push({ mesh: b, speed: 0.5 + Math.random() * 1.2, x: b.position.x, sway: Math.random() * 6 });
  }

  // ---------- rubber duck (because why not) ----------
  const duck = new THREE.Group();
  duck.position.set(4.6, WATER, 0.5);
  scene.add(duck);
  duck.add(circle(0.45, 0xffd21f, 24));
  const dhead = circle(0.28, 0xffe14d, 20); dhead.position.set(0.3, 0.4, 0.01); duck.add(dhead);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 3), new THREE.MeshBasicMaterial({ color: 0xff8c1a }));
  beak.rotation.z = -Math.PI / 2; beak.position.set(0.62, 0.4, 0.02); duck.add(beak);
  const deye = circle(0.05, 0x111111, 10); deye.position.set(0.36, 0.48, 0.03); duck.add(deye);

  // ---------- cheering mini poos ----------
  const minis = [];
  [-5.5, -3.8, 5.8].forEach((mx, i) => {
    const p = createPoo(0.34);
    p.position.set(mx, WATER + 0.1, 0.6);
    scene.add(p);
    minis.push({ mesh: p, phase: i * 1.3, x: mx });
  });

  // ---------- hero poo with sunglasses, doing dolphin jumps ----------
  const heroR = 0.62;
  const hero = createPoo(heroR);
  hero.position.set(-3, WATER, 1);
  scene.add(hero);
  // sunglasses over the baked-in eyes
  const glasses = new THREE.Group();
  const eyeY = -0.634 * heroR;
  const eyeX = 0.317 * heroR;
  const lensMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
  const lensGeo = new THREE.CircleGeometry(0.26 * heroR, 18);
  const lL = new THREE.Mesh(lensGeo, lensMat); lL.position.set(-eyeX, eyeY, 0.05);
  const lR = new THREE.Mesh(lensGeo, lensMat); lR.position.set(eyeX, eyeY, 0.05);
  lL.scale.set(1.2, 1, 1); lR.scale.set(1.2, 1, 1);
  const bridge = new THREE.Mesh(new THREE.PlaneGeometry(eyeX * 1.2, 0.06 * heroR), lensMat);
  bridge.position.set(0, eyeY + 0.04 * heroR, 0.05);
  // shine on lens
  const shine = (x) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.07 * heroR, 0.14 * heroR),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    s.position.set(x - 0.07 * heroR, eyeY + 0.05 * heroR, 0.06);
    s.rotation.z = 0.4;
    return s;
  };
  glasses.add(lL, lR, bridge, shine(-eyeX), shine(eyeX));
  hero.add(glasses);

  // jump state
  const jump = { x: -4.5, vx: 3.0, y: WATER, vy: 0, airborne: false, t: 0, spin: 0 };

  // ---------- splash particles ----------
  const splashes = [];
  for (let i = 0; i < 30; i++) {
    const s = circle(0.06 + Math.random() * 0.08, 0xddf4ff, 8);
    s.visible = false; s.position.z = 1.2;
    scene.add(s);
    splashes.push({ mesh: s, vx: 0, vy: 0, life: 0 });
  }
  function splash(x) {
    let spawned = 0;
    for (const s of splashes) {
      if (s.life > 0) continue;
      s.mesh.visible = true;
      s.mesh.position.set(x + (Math.random() - 0.5) * 0.4, WATER, 1.2);
      s.vx = (Math.random() - 0.5) * 5;
      s.vy = 2 + Math.random() * 4.5;
      s.life = 0.8 + Math.random() * 0.4;
      if (++spawned > 12) break;
    }
  }

  // ---------- confetti ----------
  const confColors = [0xff5d5d, 0xffd24a, 0x46d36b, 0x42c0ff, 0xb06bff, 0xff8cd0, 0xffffff];
  const confetti = [];
  const confGeo = new THREE.PlaneGeometry(0.16, 0.24);
  for (let i = 0; i < 140; i++) {
    const m = new THREE.Mesh(confGeo, new THREE.MeshBasicMaterial({
      color: confColors[(Math.random() * confColors.length) | 0],
      side: THREE.DoubleSide,
    }));
    resetConfetti(m, true);
    m.position.z = 2 + Math.random();
    scene.add(m);
    confetti.push({
      mesh: m,
      vy: 1.2 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 1.2,
      spin: (Math.random() - 0.5) * 8,
      flip: 2 + Math.random() * 6,
    });
  }
  function resetConfetti(m, initial) {
    m.position.x = (Math.random() - 0.5) * 18;
    m.position.y = initial ? Math.random() * 11 - 1 : 6 + Math.random() * 2;
    m.rotation.z = Math.random() * Math.PI;
  }

  let time = 0;
  function update(dt) {
    time += dt;

    rays.rotation.z += dt * 0.4;
    sun.children[1] && (sun.scale.setScalar(1 + Math.sin(time * 2) * 0.02));

    clouds.forEach((c, i) => {
      c.position.x += dt * (0.2 + i * 0.05);
      if (c.position.x > 9) c.position.x = -9;
    });

    // waves
    for (const w of waveLayers) {
      for (let k = 0; k < w.topIdx.length; k++) {
        const bx = w.baseX[k];
        w.pos.setY(w.topIdx[k], w.top + w.amp * Math.sin(w.freq * bx + time * w.speed));
      }
      w.pos.needsUpdate = true;
    }

    // bubbles rise
    for (const b of bubbles) {
      b.mesh.position.y += b.speed * dt;
      b.mesh.position.x = b.x + Math.sin(time * 1.5 + b.sway) * 0.15;
      if (b.mesh.position.y > WATER) {
        b.mesh.position.y = WATER - 4 - Math.random();
        b.x = (Math.random() - 0.5) * 16;
      }
    }

    // duck bob
    duck.position.y = WATER + Math.sin(time * 2) * 0.12;
    duck.rotation.z = Math.sin(time * 2 + 1) * 0.12;

    // mini poos cheer
    for (const m of minis) {
      const hop = Math.abs(Math.sin(time * 4 + m.phase));
      m.mesh.position.y = WATER + 0.1 + hop * 0.5;
      m.mesh.rotation.z = Math.sin(time * 8 + m.phase) * 0.25;
      m.mesh.scale.setScalar(1 + hop * 0.1);
    }

    // hero dolphin jumps
    jump.t += dt;
    if (!jump.airborne) {
      // launch
      jump.airborne = true;
      jump.vy = 7.2 + Math.random() * 1.5;
      splash(jump.x);
    }
    jump.vy -= 16 * dt;
    jump.y += jump.vy * dt;
    jump.x += jump.vx * dt;
    jump.spin += dt * (jump.vx > 0 ? 4.5 : -4.5);
    if (jump.x > 6) { jump.vx = -Math.abs(jump.vx); }
    if (jump.x < -6) { jump.vx = Math.abs(jump.vx); }
    if (jump.y <= WATER && jump.vy < 0) {
      jump.y = WATER;
      jump.airborne = false;
      jump.spin = 0;
      splash(jump.x);
    }
    hero.position.set(jump.x, jump.y, 1);
    // lean in travel direction, plus a fun spin at the top of the arc
    hero.rotation.z = (jump.vx > 0 ? -0.25 : 0.25) + Math.sin(jump.spin) * 0.15;
    const sq = 1 + Math.sin(time * 14) * 0.04;
    hero.scale.set(1 / sq, sq, 1);

    // splashes
    for (const s of splashes) {
      if (s.life <= 0) continue;
      s.life -= dt;
      s.vy -= 14 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      if (s.life <= 0) s.mesh.visible = false;
    }

    // confetti
    for (const c of confetti) {
      c.mesh.position.y -= c.vy * dt;
      c.mesh.position.x += c.vx * dt + Math.sin(time * 2 + c.mesh.position.y) * dt * 0.4;
      c.mesh.rotation.z += c.spin * dt;
      c.mesh.scale.x = Math.cos(time * c.flip + c.mesh.position.x); // fluttering flip
      if (c.mesh.position.y < -5.5) resetConfetti(c.mesh, false);
    }

    return false;
  }

  function resize(aspect) {
    const halfH = 5;
    camera.top = halfH; camera.bottom = -halfH;
    camera.left = -halfH * aspect; camera.right = halfH * aspect;
    camera.updateProjectionMatrix();
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

  return { scene, camera, update, resize, dispose };
}

// A triumphant little fanfare that ends on a cheeky parp.
let audioCtx = null;
export function playWinFanfare() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    // ascending triumph: C5 E5 G5 C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t0 = now + i * 0.12;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.25);
    });

    // the cheeky victory parp
    const t1 = now + 0.62;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 900;
    o.type = "sawtooth";
    o.frequency.setValueAtTime(150, t1);
    o.frequency.linearRampToValueAtTime(70, t1 + 0.45);
    // wobble for comedic effect
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 18; lfoG.gain.value = 25;
    lfo.connect(lfoG).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t1);
    g.gain.exponentialRampToValueAtTime(0.32, t1 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.5);
    o.connect(lp).connect(g).connect(ctx.destination);
    o.start(t1); lfo.start(t1);
    o.stop(t1 + 0.52); lfo.stop(t1 + 0.52);
  } catch (e) {
    /* audio not critical */
  }
}
