import * as THREE from "three";

// Builds a glossy, shaded top-down poo as a THREE.Group, roughly `radius` wide.
// Faces +Y by default; rotate the group's z to "look" toward movement.
export function createPoo(radius = 0.32) {
  const group = new THREE.Group();

  const tex = makePooTexture();
  const size = radius * 2.9;

  // soft contact shadow under the poo
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 1.15, 28),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32 })
  );
  shadow.scale.set(1.05, 0.95, 1);
  shadow.position.set(0, 0, -0.02);
  group.add(shadow);

  const body = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  body.position.z = 0.01;
  group.add(body);

  return group;
}

function makePooTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");

  // one soft-serve "dollop" tier with rich brown shading
  const dollop = (cx, cy, rx, ry) => {
    x.save();
    x.translate(cx, cy);
    x.scale(rx, ry);
    const g = x.createRadialGradient(-0.32, -0.42, 0.05, 0, 0, 1.08);
    g.addColorStop(0, "#6b401d");
    g.addColorStop(0.45, "#4d2d13");
    g.addColorStop(0.8, "#33200e");
    g.addColorStop(1, "#1d1107");
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, 1, 0, Math.PI * 2); x.fill();
    x.restore();
  };
  // ridge: bright top edge + dark bottom lip, clipped within the tier
  const ridge = (cx, cy, rx, ry) => {
    x.save();
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.clip();
    x.filter = "blur(7px)";
    x.fillStyle = "rgba(170,130,88,0.32)";
    x.beginPath(); x.ellipse(cx - rx * 0.18, cy - ry * 0.58, rx * 0.7, ry * 0.34, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(18,11,4,0.5)";
    x.beginPath(); x.ellipse(cx, cy + ry * 0.72, rx * 0.98, ry * 0.46, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  };

  // grounding shadow
  x.save();
  x.filter = "blur(7px)";
  x.fillStyle = "rgba(30,18,7,0.55)";
  x.beginPath(); x.ellipse(128, 224, 86, 26, 0, 0, Math.PI * 2); x.fill();
  x.restore();

  // classic stacked coil (back -> front), alternating offset for the swirl look
  const tiers = [
    [142, 40, 16, 15],   // curl tip
    [130, 62, 30, 26],   // small swirl
    [118, 98, 56, 42],   // top tier
    [138, 146, 74, 50],  // middle tier
    [128, 196, 92, 58],  // base tier (front, holds the face)
  ];
  for (const [cx, cy, rx, ry] of tiers) {
    dollop(cx, cy, rx, ry);
    ridge(cx, cy, rx, ry);
  }

  // glossy specular highlights
  x.fillStyle = "rgba(255,248,232,0.85)";
  x.beginPath(); x.arc(120, 50, 4, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(98, 96, 4, 0, Math.PI * 2); x.fill();

  // rosy cheeks
  x.save();
  x.filter = "blur(6px)";
  x.fillStyle = "rgba(255,130,110,0.45)";
  x.beginPath(); x.arc(84, 198, 15, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(172, 198, 15, 0, Math.PI * 2); x.fill();
  x.restore();

  // big cute eyes (on the base tier)
  const eye = (ex) => {
    x.fillStyle = "#ffffff";
    x.beginPath(); x.ellipse(ex, 184, 22, 25, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#1c130b";
    x.beginPath(); x.ellipse(ex + 2, 190, 12, 14, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(255,255,255,0.95)";
    x.beginPath(); x.arc(ex - 3, 183, 5, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(ex + 6, 194, 2.5, 0, Math.PI * 2); x.fill();
  };
  eye(100);
  eye(156);

  // happy smile
  x.strokeStyle = "#241407";
  x.lineWidth = 6;
  x.lineCap = "round";
  x.beginPath();
  x.arc(128, 210, 24, 0.16 * Math.PI, 0.84 * Math.PI);
  x.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}
