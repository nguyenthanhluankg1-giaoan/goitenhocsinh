import * as THREE from 'three';

export interface UfoRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  saucerRim: THREE.Mesh;
  beaconMeshes: THREE.Mesh[];
  domeGlass: THREE.Mesh;
  alienHead: THREE.Group;
  thrusterGlow: THREE.Mesh;
  tractorBeamGroup: THREE.Group;
  tractorCone: THREE.Mesh;
  tractorRings: THREE.Mesh[];
  groundRadarRing: THREE.Mesh;
  decoyGroup: THREE.Group;
  starBurstInstanced: THREE.InstancedMesh;
  ufoSpotlight: THREE.PointLight;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

/**
 * Builds a composite 10-part Chibi Alien UFO in Three.js with varied PBR materials,
 * glowing cockpit dome, cute alien pilot, rotating neon rim, perimeter beacon lights,
 * tractor beam cone, radar rings, false-signal holographic decoy, and starburst particles.
 */
export function createUFOCharacter(isSoftwareGl: boolean): UfoRig {
  const root = new THREE.Group();
  root.position.set(0, 4.55, 1.2);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // 1. Primary Silhouette: Metallic Saucer Hull (LatheGeometry profile)
  const hullPoints = [
    new THREE.Vector2(0.0, -0.45),
    new THREE.Vector2(0.85, -0.42),
    new THREE.Vector2(1.65, -0.18),
    new THREE.Vector2(2.35, 0.08),
    new THREE.Vector2(1.9, 0.36),
    new THREE.Vector2(1.25, 0.52),
    new THREE.Vector2(0.0, 0.55),
  ];
  const hullGeo = new THREE.LatheGeometry(hullPoints, 32);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6, // Vibrant cosmic blue
    metalness: 0.78,
    roughness: 0.22,
  });
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.castShadow = !isSoftwareGl;
  hullMesh.receiveShadow = !isSoftwareGl;
  bodyGroup.add(hullMesh);

  // 2. Secondary Read: Outer Neon Rim Ring (TorusGeometry, contrasting roughness)
  const rimGeo = new THREE.TorusGeometry(2.22, 0.16, 16, 40);
  rimGeo.rotateX(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x9333ea,
    emissiveIntensity: 0.65,
    metalness: 0.35,
    roughness: 0.52,
  });
  const saucerRim = new THREE.Mesh(rimGeo, rimMat);
  saucerRim.position.y = 0.08;
  bodyGroup.add(saucerRim);

  // 3. Upper Golden Collar Trim
  const collarGeo = new THREE.TorusGeometry(1.28, 0.09, 12, 32);
  collarGeo.rotateX(Math.PI / 2);
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.35,
    metalness: 0.88,
    roughness: 0.18,
  });
  const collarMesh = new THREE.Mesh(collarGeo, collarMat);
  collarMesh.position.y = 0.48;
  bodyGroup.add(collarMesh);

  // 4. Cute Chibi Alien Pilot inside Cockpit
  const alienHead = new THREE.Group();
  alienHead.position.set(0, 0.68, 0);

  const alienSkinMat = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    roughness: 0.6,
    metalness: 0.05,
  });
  const headGeo = new THREE.SphereGeometry(0.46, 20, 20);
  headGeo.scale(1.15, 0.95, 1.0);
  const headMesh = new THREE.Mesh(headGeo, alienSkinMat);
  alienHead.add(headMesh);

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.2,
  });
  const eyeShineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeGeo = new THREE.SphereGeometry(0.11, 12, 12);
  const shineGeo = new THREE.SphereGeometry(0.038, 8, 8);

  [-0.18, 0.18].forEach((xOff) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(xOff, 0.06, 0.39);
    const shine = new THREE.Mesh(shineGeo, eyeShineMat);
    shine.position.set(xOff + 0.03, 0.1, 0.48);
    alienHead.add(eye);
    alienHead.add(shine);
  });

  // Alien Little Antenna
  const antStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.28, 8),
    alienSkinMat
  );
  antStem.position.set(0, 0.52, 0);
  const antBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xfde047 })
  );
  antBulb.position.set(0, 0.68, 0);
  alienHead.add(antStem, antBulb);
  bodyGroup.add(alienHead);

  // 5. Secondary Read: Translucent Glowing Cockpit Dome
  const domeGeo = new THREE.SphereGeometry(
    1.25,
    28,
    20,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.52
  );
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: 0x67e8f9,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.22,
    roughness: 0.12,
    metalness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.82,
    transparent: true,
    opacity: isSoftwareGl ? 0.42 : 0.88,
    depthWrite: false,
  });
  const domeGlass = new THREE.Mesh(domeGeo, domeMat);
  domeGlass.position.y = 0.42;
  domeGlass.renderOrder = 2;
  bodyGroup.add(domeGlass);

  // 6. Top Spire Antenna & Beacon Orb
  const spireGeo = new THREE.CylinderGeometry(0.03, 0.07, 0.55, 12);
  const spireMesh = new THREE.Mesh(spireGeo, collarMat);
  spireMesh.position.y = 1.82;
  const spireOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 14),
    new THREE.MeshBasicMaterial({ color: 0xf43f5e })
  );
  spireOrb.position.y = 2.15;
  bodyGroup.add(spireMesh, spireOrb);

  // 7. Accent Detail: 8 Colorful Perimeter Beacon Lights
  const beaconMeshes: THREE.Mesh[] = [];
  const beaconColors = [
    0x22d3ee, 0xf472b6, 0xfacc15, 0x4ade80,
    0x22d3ee, 0xf472b6, 0xfacc15, 0x4ade80,
  ];
  const beaconGeo = new THREE.SphereGeometry(0.16, 12, 12);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const bMat = new THREE.MeshBasicMaterial({ color: beaconColors[i] });
    const bMesh = new THREE.Mesh(beaconGeo, bMat);
    bMesh.position.set(Math.cos(angle) * 2.15, 0.1, Math.sin(angle) * 2.15);
    bodyGroup.add(bMesh);
    beaconMeshes.push(bMesh);
  }

  // 8. Bottom Plasma Thruster Core
  const thrusterGeo = new THREE.CylinderGeometry(0.75, 0.48, 0.25, 24);
  const thrusterMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  });
  const thrusterGlow = new THREE.Mesh(thrusterGeo, thrusterMat);
  thrusterGlow.position.y = -0.48;
  bodyGroup.add(thrusterGlow);

  // 9. Volumetric Tractor Beam Group (extends down to classroom floor)
  const tractorBeamGroup = new THREE.Group();
  tractorBeamGroup.position.set(0, -0.5, 0);
  tractorBeamGroup.visible = false;
  root.add(tractorBeamGroup);

  const coneHeight = 6.2;
  const coneGeo = new THREE.ConeGeometry(2.1, coneHeight, 28, 1, true);
  coneGeo.translate(0, -coneHeight / 2, 0);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const tractorCone = new THREE.Mesh(coneGeo, coneMat);
  tractorCone.renderOrder = 3;
  tractorBeamGroup.add(tractorCone);

  const tractorRings: THREE.Mesh[] = [];
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (let r = 0; r < 4; r++) {
    const rMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.6 + r * 0.35, 0.045, 8, 28),
      ringMat.clone()
    );
    rMesh.rotation.x = Math.PI / 2;
    rMesh.position.y = -1.0 - r * 1.3;
    rMesh.renderOrder = 4;
    tractorBeamGroup.add(rMesh);
    tractorRings.push(rMesh);
  }

  // Ground Radar Target Ring (sits just above floor Y = 0.03)
  const groundRadarGeo = new THREE.RingGeometry(1.1, 1.55, 32);
  groundRadarGeo.rotateX(-Math.PI / 2);
  const groundRadarMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const groundRadarRing = new THREE.Mesh(groundRadarGeo, groundRadarMat);
  groundRadarRing.position.set(0, 0.04, 0);
  groundRadarRing.visible = false;

  // 10. False Signal Holographic Decoy & Star Smoke
  const decoyGroup = new THREE.Group();
  decoyGroup.visible = false;
  const decoyPuffGeo = new THREE.DodecahedronGeometry(0.45, 1);
  const decoyPuffMat = new THREE.MeshStandardMaterial({
    color: 0xe879f9,
    emissive: 0xc026d3,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    transparent: true,
    opacity: 0.85,
  });
  for (let p = 0; p < 5; p++) {
    const puff = new THREE.Mesh(decoyPuffGeo, decoyPuffMat);
    const ang = (p / 5) * Math.PI * 2;
    puff.position.set(Math.cos(ang) * 0.45, 0.4 + (p % 2) * 0.3, Math.sin(ang) * 0.45);
    puff.scale.setScalar(0.6 + (p % 3) * 0.25);
    decoyGroup.add(puff);
  }

  // Celebration Starburst Particles (InstancedMesh, 36 stars)
  const starGeo = new THREE.OctahedronGeometry(0.18, 0);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  const starCount = 36;
  const starBurstInstanced = new THREE.InstancedMesh(starGeo, starMat, starCount);
  starBurstInstanced.frustumCulled = false;
  starBurstInstanced.visible = false;
  const palette = [0xfde047, 0x22d3ee, 0xf472b6, 0x4ade80, 0xa855f7];
  for (let i = 0; i < starCount; i++) {
    _dummy.position.set(0, 0, 0);
    _dummy.scale.setScalar(1);
    _dummy.updateMatrix();
    starBurstInstanced.setMatrixAt(i, _dummy.matrix);
    _color.setHex(palette[i % palette.length]);
    starBurstInstanced.setColorAt(i, _color);
  }
  starBurstInstanced.instanceMatrix.needsUpdate = true;
  if (starBurstInstanced.instanceColor) {
    starBurstInstanced.instanceColor.needsUpdate = true;
  }
  root.add(starBurstInstanced);

  // PointLight under UFO
  const ufoSpotlight = new THREE.PointLight(0x22d3ee, 2.5, 16, 1.5);
  ufoSpotlight.position.set(0, -0.6, 0);
  root.add(ufoSpotlight);

  return {
    root,
    bodyGroup,
    saucerRim,
    beaconMeshes,
    domeGlass,
    alienHead,
    thrusterGlow,
    tractorBeamGroup,
    tractorCone,
    tractorRings,
    groundRadarRing,
    decoyGroup,
    starBurstInstanced,
    ufoSpotlight,
  };
}
