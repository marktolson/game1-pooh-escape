import * as THREE from "three";

// Builds a cute top-down poo as a THREE.Group, roughly `radius` wide.
// Faces +Y by default; rotate the group's z to "look" toward movement.
export function createPoo(radius = 0.32) {
  const group = new THREE.Group();

  const brown = 0x6e4420;
  const brownLight = 0x8a5a2c;

  // Body: a few overlapping blobs for a lumpy poo silhouette.
  const blobMat = new THREE.MeshBasicMaterial({ color: brown });
  const blobLightMat = new THREE.MeshBasicMaterial({ color: brownLight });

  const main = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), blobMat);
  main.position.z = 0.01;
  group.add(main);

  const bump = (r, x, y, mat) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 18), mat);
    m.position.set(x, y, 0.011);
    group.add(m);
    return m;
  };
  bump(radius * 0.7, -radius * 0.55, -radius * 0.45, blobMat);
  bump(radius * 0.7, radius * 0.55, -radius * 0.45, blobMat);
  bump(radius * 0.55, 0, radius * 0.55, blobMat);

  // Highlight swirl
  bump(radius * 0.34, 0, radius * 0.2, blobLightMat).position.z = 0.013;

  // Eyes
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const eyeR = radius * 0.26;
  const pupilR = radius * 0.12;
  const makeEye = (x) => {
    const white = new THREE.Mesh(new THREE.CircleGeometry(eyeR, 16), eyeWhiteMat);
    white.position.set(x, radius * 0.28, 0.02);
    group.add(white);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(pupilR, 12), pupilMat);
    pupil.position.set(x, radius * 0.24, 0.021);
    group.add(pupil);
  };
  makeEye(-radius * 0.32);
  makeEye(radius * 0.32);

  return group;
}
