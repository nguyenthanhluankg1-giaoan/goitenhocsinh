import * as THREE from 'three';
import { Student } from '../types/game';

export interface ChibiStudentNode {
  studentId: string;
  studentName: string;
  calledInCycle: boolean;
  group: THREE.Group;
  characterGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  deskGroup: THREE.Group;
  nameSprite: THREE.Sprite;
  normalNameTex: THREE.CanvasTexture;
  activeNameTex: THREE.CanvasTexture;
  isHighlighted: boolean;
  homePosition: THREE.Vector3;
  dodgeOffset: number;
}

const SHIRT_COLORS = [
  0x38bdf8, // Sky blue
  0xf472b6, // Pink
  0xfacc15, // Sunny yellow
  0x4ade80, // Mint green
  0xa855f7, // Purple
  0xfb923c, // Orange
  0x2dd4bf, // Teal
  0xf87171, // Coral
];

const HAIR_COLORS = [
  0x1e293b,
  0x451a03,
  0x78350f,
  0x312e81,
  0x831843,
];

function drawRoundedBadgeWithPointer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  pointerW: number,
  pointerH: number
) {
  const cx = x + w / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  // Bottom edge with downward pointer triangle pointing at student's head
  ctx.lineTo(cx + pointerW / 2, y + h);
  ctx.lineTo(cx, y + h + pointerH);
  ctx.lineTo(cx - pointerW / 2, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generates a crisp overhead 3D billboard CanvasTexture displaying the student's name above their head.
 */
function createStudentNameTagTexture(
  renderer: THREE.WebGLRenderer,
  studentName: string,
  calledInCycle: boolean,
  highlighted: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext('2d')!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const renderLabel = () => {
    ctx.clearRect(0, 0, 512, 144);

    const padX = 14;
    const padY = 10;
    const boxW = 512 - padX * 2;
    const boxH = 104;

    drawRoundedBadgeWithPointer(ctx, padX, padY, boxW, boxH, 24, 28, 22);

    if (highlighted) {
      const grad = ctx.createLinearGradient(0, padY, 0, padY + boxH);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#d97706');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();
    } else if (calledInCycle) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.65)';
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(11, 19, 43, 0.92)';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
    }

    // Format student name cleanly so even long Vietnamese names fit legibly
    const displayLabel = calledInCycle ? `✓ ${studentName}` : studentName;
    let fontSize = displayLabel.length > 18 ? 34 : displayLabel.length > 14 ? 38 : 42;
    ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Baloo 2", sans-serif`;
    while (ctx.measureText(displayLabel).width > boxW - 36 && fontSize > 24) {
      fontSize -= 2;
      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Baloo 2", sans-serif`;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (highlighted) {
      ctx.fillStyle = '#090d16';
      ctx.fillText(displayLabel, 256, padY + boxH / 2 + 2);
    } else if (calledInCycle) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(displayLabel, 256, padY + boxH / 2 + 1);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(displayLabel, 256, padY + boxH / 2 + 1);
    }

    tex.needsUpdate = true;
  };

  renderLabel();
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(() => {
      renderLabel();
    });
  }

  return tex;
}

/**
 * Generates a cute smiling Chibi face CanvasTexture.
 */
function createChibiFaceTexture(
  renderer: THREE.WebGLRenderer,
  expressionIndex: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Warm peach chibi skin tone
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(0, 0, 256, 256);

  // Rosy cheeks
  ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
  ctx.beginPath();
  ctx.arc(68, 152, 20, 0, Math.PI * 2);
  ctx.arc(188, 152, 20, 0, Math.PI * 2);
  ctx.fill();

  // Big anime/chibi eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(85, 122, 18, 0, Math.PI * 2);
  ctx.arc(171, 122, 18, 0, Math.PI * 2);
  ctx.fill();

  // White eye sparkles
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(79, 115, 6, 0, Math.PI * 2);
  ctx.arc(165, 115, 6, 0, Math.PI * 2);
  ctx.fill();

  // Cute smile or excited open mouth
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (expressionIndex % 3 === 0) {
    // Big cheerful grin
    ctx.fillStyle = '#f43f5e';
    ctx.arc(128, 154, 16, 0, Math.PI, false);
    ctx.fill();
    ctx.stroke();
  } else {
    // Happy curved smile
    ctx.arc(128, 150, 14, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

/**
 * Builds the classroom desks and cute 3D Chibi Student characters arranged in rows.
 * Supports any student count from 1 to 50+ dynamically.
 */
export function buildStudentCharacters(
  students: Student[],
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): { container: THREE.Group; nodes: ChibiStudentNode[] } {
  const container = new THREE.Group();
  const nodes: ChibiStudentNode[] = [];

  if (!students || students.length === 0) {
    return { container, nodes };
  }

  // Shared geometries & materials for performance
  const deskTopGeo = new THREE.BoxGeometry(1.35, 0.1, 0.85);
  const deskLegGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.65, 8);
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.58, 14);
  const headGeo = new THREE.SphereGeometry(0.36, 18, 18);
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.26, 4, 8);
  const hairCapGeo = new THREE.SphereGeometry(
    0.38,
    16,
    14,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.58
  );
  const bunGeo = new THREE.SphereGeometry(0.14, 10, 10);
  const shadowDiscGeo = new THREE.CircleGeometry(0.55, 18);
  shadowDiscGeo.rotateX(-Math.PI / 2);

  const deskWoodMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.55,
    metalness: 0.1,
  });
  const deskLegMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.4,
    metalness: 0.6,
  });
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x020617,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  const faceTextures = [
    createChibiFaceTexture(renderer, 0),
    createChibiFaceTexture(renderer, 1),
    createChibiFaceTexture(renderer, 2),
  ];

  const total = students.length;
  // Determine grid layout nicely within the classroom island (-9..9 X, -3.6..4.6 Z)
  const cols = total <= 6 ? Math.max(1, total) : total <= 18 ? 6 : total <= 32 ? 8 : 10;
  const rows = Math.ceil(total / cols);
  const spacingX = cols <= 6 ? 2.6 : cols <= 8 ? 2.15 : 1.8;
  const spacingZ = rows <= 3 ? 2.3 : rows <= 4 ? 1.95 : 1.65;

  students.forEach((student, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const colsInThisRow = row === rows - 1 ? total - row * cols : cols;

    const x = (col - (colsInThisRow - 1) / 2) * spacingX;
    const z = (row - (rows - 1) / 2) * spacingZ + 0.5;

    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Contact shadow disc at Y = 0.025
    const contactShadow = new THREE.Mesh(shadowDiscGeo, shadowMat);
    contactShadow.position.y = 0.025;
    group.add(contactShadow);

    // Desk group
    const deskGroup = new THREE.Group();
    const deskTop = new THREE.Mesh(deskTopGeo, deskWoodMat);
    deskTop.position.set(0, 0.65, 0.25);
    deskTop.castShadow = !isSoftwareGl;
    deskTop.receiveShadow = !isSoftwareGl;
    deskGroup.add(deskTop);

    [-0.52, 0.52].forEach((lx) => {
      const leg = new THREE.Mesh(deskLegGeo, deskLegMat);
      leg.position.set(lx, 0.325, 0.25);
      deskGroup.add(leg);
    });
    group.add(deskGroup);

    // Chibi Character Group (can be lifted into the UFO beam!)
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, 0, -0.1);

    const shirtColor = student.calledInCycle
      ? 0x64748b // Muted slate if already called in this cycle
      : SHIRT_COLORS[idx % SHIRT_COLORS.length];
    const shirtMat = new THREE.MeshStandardMaterial({
      color: shirtColor,
      roughness: 0.65,
      metalness: 0.08,
    });

    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 0.48;
    torso.castShadow = !isSoftwareGl;
    characterGroup.add(torso);

    // Arms
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(-0.32, 0.58, 0);
    leftArm.rotation.z = 0.35;

    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(0.32, 0.58, 0);
    rightArm.rotation.z = -0.35;
    characterGroup.add(leftArm, rightArm);

    // Chibi Head + Hair
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.08, 0);

    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: faceTextures[idx % faceTextures.length],
      roughness: 0.5,
      metalness: 0.05,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    // Rotate sphere so texture center faces +Z camera
    headMesh.rotation.y = -Math.PI / 2;
    headGroup.add(headMesh);

    const hairMat = new THREE.MeshStandardMaterial({
      color: HAIR_COLORS[idx % HAIR_COLORS.length],
      roughness: 0.75,
      metalness: 0.05,
    });
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.y = 0.04;
    hairCap.rotation.x = -0.18;
    headGroup.add(hairCap);

    // Cute twin buns for half the chibi students
    if (idx % 2 === 0) {
      [-0.3, 0.3].forEach((bx) => {
        const bun = new THREE.Mesh(bunGeo, hairMat);
        bun.position.set(bx, 0.28, -0.05);
        headGroup.add(bun);
      });
    }

    characterGroup.add(headGroup);

    // Overhead Floating Name Tag Sprite directly above student's head
    const normalNameTex = createStudentNameTagTexture(
      renderer,
      student.name,
      student.calledInCycle,
      false
    );
    const activeNameTex = createStudentNameTagTexture(
      renderer,
      student.name,
      student.calledInCycle,
      true
    );
    const spriteMat = new THREE.SpriteMaterial({
      map: normalNameTex,
      transparent: true,
      depthWrite: false,
    });
    const nameSprite = new THREE.Sprite(spriteMat);
    nameSprite.position.set(0, 1.78, 0);
    nameSprite.scale.set(1.75, 0.49, 1);
    nameSprite.renderOrder = 5;
    characterGroup.add(nameSprite);

    group.add(characterGroup);
    container.add(group);

    nodes.push({
      studentId: student.id,
      studentName: student.name,
      calledInCycle: student.calledInCycle,
      group,
      characterGroup,
      headGroup,
      leftArm,
      rightArm,
      deskGroup,
      nameSprite,
      normalNameTex,
      activeNameTex,
      isHighlighted: false,
      homePosition: new THREE.Vector3(x, 0, z),
      dodgeOffset: 0,
    });
  });

  return { container, nodes };
}
