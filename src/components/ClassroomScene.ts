import * as THREE from 'three';

export interface ClassroomEnvironmentRig {
  root: THREE.Group;
  starField: THREE.Points;
  planetsGroup: THREE.Group;
  asteroidsMesh: THREE.InstancedMesh;
  classroomFloor: THREE.Mesh;
  chandeliersGroup?: THREE.Group;
  globeMesh?: THREE.Mesh;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

/**
 * Generates a warm, polished luxury herringbone/parquet hardwood floor texture with gold inlay accents.
 */
function createLuxuryParquetFloorTexture(
  renderer: THREE.WebGLRenderer
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base warm honey-walnut wood tone
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 64;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const isEven = (x + y) % 2 === 0;
      ctx.fillStyle = isEven ? '#6e472b' : '#58371f';
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

      // Subtle wood grain strips inside each parquet square
      ctx.fillStyle = isEven
        ? 'rgba(251, 191, 36, 0.08)'
        : 'rgba(30, 15, 5, 0.14)';
      for (let s = 1; s < 4; s++) {
        if (isEven) {
          ctx.fillRect(x * tileSize + s * 16, y * tileSize, 4, tileSize);
        } else {
          ctx.fillRect(x * tileSize, y * tileSize + s * 16, tileSize, 4);
        }
      }

      // Fine brass/gold parquet border inlay
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        x * tileSize + 1,
        y * tileSize + 1,
        tileSize - 2,
        tileSize - 2
      );
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 4);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

/**
 * Generates a royal luxury carpet texture with ornate gold border for the student seating area.
 */
function createRoyalCarpetTexture(
  renderer: THREE.WebGLRenderer
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 320);
  grad.addColorStop(0, '#1e295b');
  grad.addColorStop(1, '#121838');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Outer gold woven border
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, 476, 476);

  // Inner filigree border
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 440, 440);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function drawStar2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number,
  color: string
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/**
 * Generates a luxury gold-framed Smart Interactive Board texture with Vietnamese classroom welcome text.
 */
function createChalkboardTexture(
  renderer: THREE.WebGLRenderer
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const renderBoard = () => {
    // Deep emerald-teal luxury smartboard surface
    const grad = ctx.createLinearGradient(0, 0, 0, 384);
    grad.addColorStop(0, '#0d3b38');
    grad.addColorStop(0.5, '#0a2e2c');
    grad.addColorStop(1, '#072220');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 384);

    // Subtle luxury grid lines
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 64; x < 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, 364);
      ctx.stroke();
    }

    // Outer metallic gold border + inner cream trim
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, 1004, 364);

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, 972, 332);

    // Corner golden stars
    drawStar2D(ctx, 88, 110, 5, 22, 10, '#fde047');
    drawStar2D(ctx, 936, 110, 5, 22, 10, '#fde047');

    // Top VIP Academy Subtitle
    ctx.fillStyle = '#67e8f9';
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ HỌC VIỆN TƯƠNG LAI • PHÒNG HỌC SANG TRỌNG ★', 512, 70);

    // Main Headline
    ctx.fillStyle = '#fef08a';
    ctx.font = '800 48px "Plus Jakarta Sans", "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LỚP HỌC VUI VẺ - UFO MAY MẮN', 512, 138);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 33px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'Ai sẽ là học sinh may mắn được UFO gọi tên hôm nay?',
      512,
      212
    );

    // Vector planet & stars row at bottom
    drawStar2D(ctx, 370, 298, 5, 14, 6, '#67e8f9');
    drawStar2D(ctx, 440, 298, 4, 12, 5, '#f472b6');

    ctx.save();
    ctx.beginPath();
    ctx.arc(512, 298, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(512, 298, 34, 8, -0.25, 0, Math.PI * 2);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    drawStar2D(ctx, 584, 298, 4, 12, 5, '#f472b6');
    drawStar2D(ctx, 654, 298, 5, 14, 6, '#67e8f9');

    texture.needsUpdate = true;
  };

  renderBoard();
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(() => {
      renderBoard();
    });
  }

  return texture;
}

/**
 * Helper to build a lush decorative potted plant in a golden brass planter.
 */
function createLuxuryPottedPlant(): THREE.Group {
  const group = new THREE.Group();

  // Golden brass pot + dark soil rim
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.65,
  });
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.34, 0.75, 16),
    potMat
  );
  pot.position.y = 0.38;
  group.add(pot);

  const potRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.05, 8, 20),
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.25,
      metalness: 0.7,
    })
  );
  potRim.rotation.x = Math.PI / 2;
  potRim.position.y = 0.75;
  group.add(potRim);

  // Foliage clusters
  const leafMatMain = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.55,
  });
  const leafMatLight = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    roughness: 0.5,
  });

  const centerBush = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 14, 14),
    leafMatMain
  );
  centerBush.position.set(0, 1.18, 0);
  centerBush.scale.set(1, 1.25, 1);
  group.add(centerBush);

  const subPositions = [
    [-0.28, 0.96, 0.2],
    [0.3, 0.98, 0.18],
    [0, 1.0, -0.26],
    [-0.18, 1.48, -0.1],
    [0.2, 1.45, 0.12],
  ];
  subPositions.forEach(([x, y, z], idx) => {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 12),
      idx % 2 === 0 ? leafMatLight : leafMatMain
    );
    orb.position.set(x, y, z);
    group.add(orb);
  });

  return group;
}

/**
 * Helper to build a grand suspended Golden Halo Chandelier.
 */
function createLuxuryChandelier(): THREE.Group {
  const chandelier = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.22,
    metalness: 0.8,
  });
  const warmGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });

  // Central suspension rod
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1.8, 10),
    goldMat
  );
  rod.position.y = 0.9;
  chandelier.add(rod);

  // Outer Golden Halo Ring
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.1, 12, 36),
    goldMat
  );
  outerRing.rotation.x = Math.PI / 2;
  chandelier.add(outerRing);

  // Inner Glowing Warm LED Ring
  const innerGlowRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.72, 0.06, 10, 36),
    warmGlowMat
  );
  innerGlowRing.rotation.x = Math.PI / 2;
  innerGlowRing.position.y = -0.04;
  chandelier.add(innerGlowRing);

  // 8 Crystal Globe Bulbs around the ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      warmGlowMat
    );
    bulb.position.set(
      Math.cos(angle) * 1.85,
      -0.14,
      Math.sin(angle) * 1.85
    );
    chandelier.add(bulb);
  }

  return chandelier;
}

/**
 * Builds the 3D Luxurious Indoor Classroom ("Phòng Học Sang Trọng") with:
 * - Warm Herringbone Oak Parquet Floor + Royal Velvet & Gold Carpet
 * - Architectural Ivory & Navy Wainscoting Walls with Gold Columns & Crown Molding
 * - Tall Panoramic Windows looking out at the starry night cosmos
 * - Grand Coffered Ceiling with Suspended Golden Halo Chandeliers
 * - Raised Lecture Podium, Gold-Framed Smart Interactive Board, Mahogany Bookcases,
 *   Teacher's Executive Desk with Rotating Globe, Wall Clock & Brass Potted Plants.
 */
export function createClassroomScene(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): ClassroomEnvironmentRig {
  const root = new THREE.Group();

  // 1. Night Sky Starfield visible through the panoramic classroom windows & skylight
  const starCount = 320;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starPalette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xfef08a),
    new THREE.Color(0x67e8f9),
    new THREE.Color(0xf472b6),
  ];

  for (let i = 0; i < starCount; i++) {
    const r = 34 + Math.random() * 45;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.6;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = Math.max(2, r * Math.cos(phi) + 4);
    starPositions[i * 3 + 2] = -Math.abs(r * Math.sin(phi) * Math.sin(theta)) - 12;

    const c = starPalette[i % starPalette.length];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
  });
  const starField = new THREE.Points(starGeo, starMat);
  root.add(starField);

  // 2. Distant Night Sky Planets visible through the tall windows & skylight
  const planetsGroup = new THREE.Group();
  root.add(planetsGroup);

  const ringedPlanet = new THREE.Group();
  ringedPlanet.position.set(-22, 13, -26);
  const p1Mesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      roughness: 0.5,
      metalness: 0.15,
    })
  );
  const p1Ring = new THREE.Mesh(
    new THREE.RingGeometry(3.1, 4.5, 32),
    new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      side: THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
    })
  );
  p1Ring.rotation.x = Math.PI * 0.38;
  p1Ring.rotation.y = 0.25;
  ringedPlanet.add(p1Mesh, p1Ring);
  planetsGroup.add(ringedPlanet);

  const gasPlanet = new THREE.Group();
  gasPlanet.position.set(22, 14, -28);
  const p2Mesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.45,
      metalness: 0.25,
    })
  );
  gasPlanet.add(p2Mesh);
  planetsGroup.add(gasPlanet);

  // 3. Colorful Library Books InstancedMesh on the Classroom Bookcases (28 books)
  const bookCount = 28;
  const bookGeo = new THREE.BoxGeometry(0.22, 0.58, 0.38);
  const bookMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.45,
    metalness: 0.1,
  });
  const asteroidsMesh = new THREE.InstancedMesh(bookGeo, bookMat, bookCount);
  const bookColors = [
    0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xa855f7, 0xec4899, 0x06b6d4,
  ];
  for (let i = 0; i < bookCount; i++) {
    const isRightShelf = i >= 14;
    const localIdx = i % 14;
    const shelfRow = Math.floor(localIdx / 7); // 0 or 1
    const colIdx = localIdx % 7;
    const baseX = isRightShelf ? 6.8 : -6.8;
    const xOffset = (colIdx - 3) * 0.34;
    const yPos = shelfRow === 0 ? 1.52 : 2.52;

    _dummy.position.set(baseX + xOffset, yPos, -6.42);
    _dummy.rotation.set(0, 0, (i % 5 === 0 ? 0.12 : 0));
    _dummy.scale.set(1, 0.88 + (i % 3) * 0.1, 1);
    _dummy.updateMatrix();
    asteroidsMesh.setMatrixAt(i, _dummy.matrix);
    _color.setHex(bookColors[i % bookColors.length]);
    asteroidsMesh.setColorAt(i, _color);
  }
  asteroidsMesh.instanceMatrix.needsUpdate = true;
  if (asteroidsMesh.instanceColor)
    asteroidsMesh.instanceColor.needsUpdate = true;
  asteroidsMesh.computeBoundingSphere();
  root.add(asteroidsMesh);

  // ============================================================================
  // 4. LUXURY INDOOR CLASSROOM ARCHITECTURE ("PHÒNG HỌC SANG TRỌNG")
  // ============================================================================
  const roomWidth = 28;
  const roomDepth = 20;
  const wallHeight = 9.6;

  // 4A. Polished Luxury Herringbone Parquet Floor (Y = 0)
  const floorTex = createLuxuryParquetFloorTexture(renderer);
  const floorGeo = new THREE.BoxGeometry(roomWidth, 0.3, roomDepth);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: floorTex,
    roughness: 0.42,
    metalness: 0.12,
  });
  const classroomFloor = new THREE.Mesh(floorGeo, floorMat);
  classroomFloor.position.set(0, -0.15, 0.5);
  classroomFloor.receiveShadow = !isSoftwareGl;
  root.add(classroomFloor);

  // Golden Baseboard Skirting Trim around the floor perimeter
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.65,
  });
  const walnutWoodMat = new THREE.MeshStandardMaterial({
    color: 0x452715,
    roughness: 0.5,
    metalness: 0.15,
  });
  const creamWallMat = new THREE.MeshStandardMaterial({
    color: 0x1e2942,
    roughness: 0.65,
    metalness: 0.08,
  });
  const wainscotingMat = new THREE.MeshStandardMaterial({
    color: 0x131c33,
    roughness: 0.55,
    metalness: 0.15,
  });

  // 4B. Royal Velvet & Gold Carpet under the Student Desks (Y = 0.02)
  const carpetTex = createRoyalCarpetTexture(renderer);
  const rugGeo = new THREE.PlaneGeometry(18.5, 10.6);
  rugGeo.rotateX(-Math.PI / 2);
  const rugMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: carpetTex,
    roughness: 0.8,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const rugMesh = new THREE.Mesh(rugGeo, rugMat);
  rugMesh.position.set(0, 0.02, 0.85);
  rugMesh.receiveShadow = !isSoftwareGl;
  root.add(rugMesh);

  // 4C. Raised Front Lecture Podium (Y = 0.14, Z = -5.6)
  const podiumGroup = new THREE.Group();
  podiumGroup.position.set(0, 0, -5.65);
  root.add(podiumGroup);

  const podiumBase = new THREE.Mesh(
    new THREE.BoxGeometry(17.6, 0.26, 2.7),
    walnutWoodMat
  );
  podiumBase.position.y = 0.13;
  podiumBase.receiveShadow = !isSoftwareGl;
  podiumGroup.add(podiumBase);

  const podiumGoldEdge = new THREE.Mesh(
    new THREE.BoxGeometry(17.68, 0.06, 2.76),
    goldTrimMat
  );
  podiumGoldEdge.position.y = 0.25;
  podiumGroup.add(podiumGoldEdge);

  // 4D. Grand Back Classroom Wall (Z = -7.0)
  const backWallGroup = new THREE.Group();
  backWallGroup.position.set(0, 0, -7.0);
  root.add(backWallGroup);

  // Main Back Wall Surface
  const backWallMain = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, wallHeight, 0.45),
    creamWallMat
  );
  backWallMain.position.set(0, wallHeight / 2, 0);
  backWallGroup.add(backWallMain);

  // Lower Wainscoting Panel on Back Wall
  const backWainscot = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, 2.2, 0.52),
    wainscotingMat
  );
  backWainscot.position.set(0, 1.1, 0.04);
  backWallGroup.add(backWainscot);

  // Golden Dado Rail & Crown Molding on Back Wall
  const backDadoRail = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, 0.12, 0.58),
    goldTrimMat
  );
  backDadoRail.position.set(0, 2.22, 0.06);
  backWallGroup.add(backDadoRail);

  const backCrownMolding = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, 0.28, 0.65),
    goldTrimMat
  );
  backCrownMolding.position.set(0, wallHeight - 0.14, 0.1);
  backWallGroup.add(backCrownMolding);

  // Decorative Architectural Columns (Pilasters) along the Back Wall
  const pilasterXPositions = [-12.5, -9.2, -4.8, 4.8, 9.2, 12.5];
  pilasterXPositions.forEach((xPos) => {
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, wallHeight, 0.65),
      walnutWoodMat
    );
    column.position.set(xPos, wallHeight / 2, 0.12);
    backWallGroup.add(column);

    const goldCapital = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.24, 0.74),
      goldTrimMat
    );
    goldCapital.position.set(xPos, wallHeight - 0.35, 0.15);
    backWallGroup.add(goldCapital);

    const goldBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.28, 0.74),
      goldTrimMat
    );
    goldBase.position.set(xPos, 0.14, 0.15);
    backWallGroup.add(goldBase);
  });

  // Luxury Smart Interactive Chalkboard (Center of Back Wall)
  const boardOuterFrame = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 3.55, 0.18),
    walnutWoodMat
  );
  boardOuterFrame.position.set(0, 3.05, 0.28);
  backWallGroup.add(boardOuterFrame);

  const boardTex = createChalkboardTexture(renderer);
  const boardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9.2, 3.25),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: boardTex,
      roughness: 0.4,
      metalness: 0.08,
    })
  );
  boardMesh.position.set(0, 3.05, 0.39);
  backWallGroup.add(boardMesh);

  // Golden Classroom Wall Clock above Smartboard
  const clockGroup = new THREE.Group();
  clockGroup.position.set(0, 5.55, 0.35);
  const clockRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.12, 24),
    goldTrimMat
  );
  clockRim.rotation.x = Math.PI / 2;
  const clockFace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.14, 24),
    new THREE.MeshBasicMaterial({ color: 0xfef9c3 })
  );
  clockFace.rotation.x = Math.PI / 2;
  const handHour = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.28, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  handHour.position.set(0.06, 0.08, 0.09);
  handHour.rotation.z = -0.6;
  const handMin = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.38, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  handMin.position.set(-0.08, 0.1, 0.09);
  handMin.rotation.z = 0.45;
  clockGroup.add(clockRim, clockFace, handHour, handMin);
  backWallGroup.add(clockGroup);

  // Built-in Luxury Mahogany Bookcases on Left & Right of Smartboard
  [-6.8, 6.8].forEach((xPos) => {
    const bookcaseGroup = new THREE.Group();
    bookcaseGroup.position.set(xPos, 0, 0.42);

    const caseBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 4.2, 0.55),
      walnutWoodMat
    );
    caseBody.position.y = 2.25;
    bookcaseGroup.add(caseBody);

    const caseCrown = new THREE.Mesh(
      new THREE.BoxGeometry(2.98, 0.18, 0.66),
      goldTrimMat
    );
    caseCrown.position.y = 4.4;
    bookcaseGroup.add(caseCrown);

    // Shelf dividers
    [1.2, 2.2, 3.2].forEach((shelfY) => {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(2.65, 0.08, 0.58),
        goldTrimMat
      );
      plank.position.set(0, shelfY, 0.02);
      bookcaseGroup.add(plank);
    });

    // Golden Trophy on top shelf
    const trophyCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.1, 0.42, 14),
      goldTrimMat
    );
    trophyCup.position.set(0, 3.52, 0.06);
    bookcaseGroup.add(trophyCup);

    backWallGroup.add(bookcaseGroup);
  });

  // Warm Golden Wall Sconces on Back Wall
  [-10.8, -4.8, 4.8, 10.8].forEach((xPos) => {
    const sconce = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.12, 0.45, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    sconce.position.set(xPos, 5.2, 0.48);
    backWallGroup.add(sconce);
  });

  // 4E. Left & Right Luxury Classroom Side Walls with Tall Panoramic Windows
  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.22,
  });

  [-1, 1].forEach((dir) => {
    const sideWallGroup = new THREE.Group();
    sideWallGroup.position.set(dir * (roomWidth / 2), 0, 0.5);
    sideWallGroup.rotation.y = dir === -1 ? Math.PI / 2 : -Math.PI / 2;
    root.add(sideWallGroup);

    // Lower Wainscoting along the full side wall
    const lowerWall = new THREE.Mesh(
      new THREE.BoxGeometry(roomDepth, 2.2, 0.45),
      wainscotingMat
    );
    lowerWall.position.set(0, 1.1, 0);
    sideWallGroup.add(lowerWall);

    // Upper Wall Header Beam
    const upperHeader = new THREE.Mesh(
      new THREE.BoxGeometry(roomDepth, 1.8, 0.45),
      creamWallMat
    );
    upperHeader.position.set(0, wallHeight - 0.9, 0);
    sideWallGroup.add(upperHeader);

    // Golden Dado Rail & Crown Molding
    const sideDado = new THREE.Mesh(
      new THREE.BoxGeometry(roomDepth, 0.12, 0.55),
      goldTrimMat
    );
    sideDado.position.set(0, 2.22, 0.05);
    sideWallGroup.add(sideDado);

    const sideCrown = new THREE.Mesh(
      new THREE.BoxGeometry(roomDepth, 0.26, 0.62),
      goldTrimMat
    );
    sideCrown.position.set(0, wallHeight - 0.14, 0.08);
    sideWallGroup.add(sideCrown);

    // Vertical Wall Pillars framing 3 Panoramic Windows
    [-8.5, -3.0, 3.0, 8.5].forEach((zPos) => {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, wallHeight, 0.52),
        creamWallMat
      );
      pillar.position.set(zPos, wallHeight / 2, 0);
      sideWallGroup.add(pillar);

      const woodTrim = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, wallHeight, 0.62),
        walnutWoodMat
      );
      woodTrim.position.set(zPos, wallHeight / 2, 0.06);
      sideWallGroup.add(woodTrim);
    });

    // Translucent Panoramic Window Panes + Golden Mullions
    [-5.75, 0, 5.75].forEach((winX) => {
      const glassPane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 5.6),
        windowGlassMat
      );
      glassPane.position.set(winX, 5.0, 0.05);
      sideWallGroup.add(glassPane);

      // Gold window frame crossbar
      const hBar = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.1, 0.16),
        goldTrimMat
      );
      hBar.position.set(winX, 5.4, 0.1);
      sideWallGroup.add(hBar);
    });
  });

  // 4F. Grand Coffered Ceiling & Suspended Golden Halo Chandeliers (Y = 9.5)
  const ceilingGroup = new THREE.Group();
  ceilingGroup.position.set(0, wallHeight, 0.5);
  root.add(ceilingGroup);

  // Transverse Wooden/Gold Ceiling Beams framing the Skylight
  [-6.5, -1.5, 3.8, 8.5].forEach((zBeam) => {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, 0.38, 0.65),
      walnutWoodMat
    );
    beam.position.set(0, -0.18, zBeam);
    ceilingGroup.add(beam);

    const goldStrip = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, 0.08, 0.7),
      goldTrimMat
    );
    goldStrip.position.set(0, -0.38, zBeam);
    ceilingGroup.add(goldStrip);
  });

  // Longitudinal Ceiling Beams
  [-10.5, 0, 10.5].forEach((xBeam) => {
    const lBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.34, roomDepth),
      walnutWoodMat
    );
    lBeam.position.set(xBeam, -0.16, 0);
    ceilingGroup.add(lBeam);
  });

  // Two Suspended Golden Halo Chandeliers
  const chandeliersGroup = new THREE.Group();
  [-6.2, 6.2].forEach((xPos) => {
    const chandelier = createLuxuryChandelier();
    chandelier.position.set(xPos, wallHeight - 1.75, -1.2);
    chandeliersGroup.add(chandelier);
  });
  root.add(chandeliersGroup);

  // 4G. Teacher's Executive Desk & Rotating Golden Terrestrial Globe on Front Podium
  const teacherDeskGroup = new THREE.Group();
  teacherDeskGroup.position.set(-5.2, 0.26, -5.1);
  root.add(teacherDeskGroup);

  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.14, 1.15),
    walnutWoodMat
  );
  deskTop.position.y = 0.95;
  teacherDeskGroup.add(deskTop);

  const deskFrontPanel = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.88, 0.95),
    wainscotingMat
  );
  deskFrontPanel.position.y = 0.45;
  teacherDeskGroup.add(deskFrontPanel);

  const deskGoldBand = new THREE.Mesh(
    new THREE.BoxGeometry(2.22, 0.08, 1.02),
    goldTrimMat
  );
  deskGoldBand.position.y = 0.88;
  teacherDeskGroup.add(deskGoldBand);

  // Rotating Classroom Globe on Teacher's Desk
  const globeStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 0.12, 14),
    goldTrimMat
  );
  globeStand.position.set(-0.45, 1.08, 0);
  teacherDeskGroup.add(globeStand);

  const globeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 18, 18),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.35,
      metalness: 0.2,
    })
  );
  globeMesh.position.set(-0.45, 1.42, 0);
  teacherDeskGroup.add(globeMesh);

  // 4H. Luxury Brass Potted Plants in Classroom Corners
  const plantPositions: [number, number, number][] = [
    [-10.4, 0, -5.5],
    [10.4, 0, -5.5],
    [-11.6, 0, 2.5],
    [11.6, 0, 2.5],
  ];
  plantPositions.forEach(([x, y, z]) => {
    const plant = createLuxuryPottedPlant();
    plant.position.set(x, y, z);
    root.add(plant);
  });

  return {
    root,
    starField,
    planetsGroup,
    asteroidsMesh,
    classroomFloor,
    chandeliersGroup,
    globeMesh,
  };
}
