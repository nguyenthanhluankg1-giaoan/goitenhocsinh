import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  GameSettingsConfig,
  GameState,
  ScanChoreographyPattern,
  Student,
  UfoSurpriseEvent,
} from '../types/game';
import { createUFOCharacter, UfoRig } from './UFOCharacter';
import {
  ClassroomEnvironmentRig,
  createClassroomScene,
} from './ClassroomScene';
import {
  buildStudentCharacters,
  ChibiStudentNode,
} from './StudentCharacters';
import { WebGLFallbackScene } from './WebGLFallbackScene';

interface GameSceneProps {
  gameState: GameState;
  students: Student[];
  hoveredStudent: Student | null;
  selectedStudent: Student | null;
  scanPattern: ScanChoreographyPattern;
  activeSurpriseEvent: UfoSurpriseEvent | null;
  settings: GameSettingsConfig;
}

// Pre-allocated math helpers at module scope to prevent GC inside render loop
const _targetUfoPos = new THREE.Vector3();
const _starDummy = new THREE.Object3D();
export const FIXED_CLASSROOM_CAMERA_POS = new THREE.Vector3(0, 6.8, 16.5);
export const FIXED_CLASSROOM_CAMERA_LOOK = new THREE.Vector3(0, 1.9, 0);

/**
 * Detects software WebGL (SwiftShader, llvmpipe, Basic Render) from the GPU renderer string.
 */
function detectSoftwareWebGL(): { supported: boolean; isSoftwareGl: boolean } {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return { supported: false, isSoftwareGl: true };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl =
      /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: true };
  }
}

export const GameScene: React.FC<GameSceneProps> = ({
  gameState,
  students,
  hoveredStudent,
  selectedStudent,
  scanPattern,
  activeSurpriseEvent,
  settings,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Store latest props in ref so HUD updates never tear down the WebGLRenderer
  const latestPropsRef = useRef({
    gameState,
    students,
    hoveredStudent,
    selectedStudent,
    scanPattern,
    activeSurpriseEvent,
    settings,
  });
  useEffect(() => {
    latestPropsRef.current = {
      gameState,
      students,
      hoveredStudent,
      selectedStudent,
      scanPattern,
      activeSurpriseEvent,
      settings,
    };
  }, [
    gameState,
    students,
    hoveredStudent,
    selectedStudent,
    scanPattern,
    activeSurpriseEvent,
    settings,
  ]);

  const studentNodesRef = useRef<ChibiStudentNode[]>([]);
  const studentContainerRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isSoftwareGlRef = useRef<boolean>(false);

  // Rebuild student meshes when the roster or called status changes
  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    if (!scene || !renderer) return;

    if (studentContainerRef.current) {
      scene.remove(studentContainerRef.current);
    }

    const built = buildStudentCharacters(
      students,
      renderer,
      isSoftwareGlRef.current
    );
    studentContainerRef.current = built.container;
    studentNodesRef.current = built.nodes;
    scene.add(built.container);
  }, [students]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const { supported, isSoftwareGl } = detectSoftwareWebGL();
    isSoftwareGlRef.current = isSoftwareGl;
    if (!supported) {
      setWebglFailed(true);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    rendererRef.current = renderer;
    const width = container.clientWidth || window.innerWidth || 1280;
    const height = container.clientHeight || window.innerHeight || 720;

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.setAttribute('data-testid', 'ufo-3d-canvas');
    canvas.setAttribute('data-camera-mode', 'stationary');
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    container.innerHTML = '';
    container.appendChild(canvas);

    // Scene & Fog (Warm Luxury Indoor Classroom Atmosphere)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b1224);
    scene.fog = new THREE.FogExp2(0x0b1224, 0.0085);

    // Camera (Fixed stationary classroom view — classroom never moves with the UFO)
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 160);
    camera.position.copy(FIXED_CLASSROOM_CAMERA_POS);
    camera.lookAt(FIXED_CLASSROOM_CAMERA_LOOK);

    // Mandatory Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    // Luxury Classroom Lighting Rig (Warm Chandelier Key Light + Golden Fill + Cool Window Rim)
    const hemiLight = new THREE.HemisphereLight(0xfef08a, 0x3b2314, 1.05);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.75);
    keyLight.position.set(10, 18, 12);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      const d = 14;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 45;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(-12, 10, -10);
    scene.add(rimLight);

    // Build Classroom Environment + Planets + Stars (Stationary backdrop)
    const envRig: ClassroomEnvironmentRig = createClassroomScene(
      renderer,
      isSoftwareGl
    );
    scene.add(envRig.root);

    // Build UFO Rig
    const ufoRig: UfoRig = createUFOCharacter(isSoftwareGl);
    scene.add(ufoRig.root);
    scene.add(ufoRig.groundRadarRing);
    scene.add(ufoRig.decoyGroup);

    // Build Initial Student Characters
    const initialStudents = buildStudentCharacters(
      latestPropsRef.current.students,
      renderer,
      isSoftwareGl
    );
    studentContainerRef.current = initialStudents.container;
    studentNodesRef.current = initialStudents.nodes;
    scene.add(initialStudents.container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // ResizeObserver for responsive 16:9 / full-viewport projection
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    // Software-WebGL Paced Loop (`afterDraw`) vs GPU `requestAnimationFrame`
    let frameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();
    let elapsedTotal = 0;

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function findStudentNode(studentId?: string | null): ChibiStudentNode | null {
      if (!studentId) return null;
      return (
        studentNodesRef.current.find((n) => n.studentId === studentId) || null
      );
    }

    function tick() {
      if (isDisposed) return;
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const {
        gameState: st,
        hoveredStudent: hovStu,
        selectedStudent: selStu,
        scanPattern: pat,
        activeSurpriseEvent: surprise,
        settings: cfg,
      } = latestPropsRef.current;

      const speedMult = st === 'paused' ? 0 : cfg.animationSpeed;
      elapsedTotal += dt * speedMult;
      const t = elapsedTotal;

      // UFO Saucer Spin & Beacon Lights (Only the UFO moves; classroom remains stationary)
      ufoRig.saucerRim.rotation.y = t * 2.6;
      ufoRig.alienHead.rotation.y = Math.sin(t * 2.2) * 0.35;

      // Determine Target UFO Position by GameState
      const hovNode = findStudentNode(hovStu?.id);
      const selNode = findStudentNode(selStu?.id);

      let beamVisible = false;
      let radarVisible = false;
      let decoyVisible = false;
      let starsVisible = false;
      let targetTiltX = 0;
      let targetTiltZ = 0;

      if (st === 'ready' || st === 'stopped' || st === 'completed') {
        _targetUfoPos.set(
          Math.sin(t * 0.9) * 2.6,
          4.55 + Math.sin(t * 1.8) * 0.25,
          1.2 + Math.cos(t * 0.6) * 0.8
        );
      } else if (st === 'entering') {
        // Stage A: Swoop in with energetic banking
        _targetUfoPos.set(
          Math.sin(t * 3.2) * 3.5,
          4.8 + Math.cos(t * 2.5) * 0.4,
          1.0
        );
        targetTiltZ = -Math.cos(t * 3.2) * 0.25;
      } else if (st === 'scanning') {
        // Stage B: Scan classroom desks using active choreography pattern
        beamVisible = true;
        radarVisible = true;
        if (hovNode) {
          _targetUfoPos.set(
            hovNode.homePosition.x,
            4.85 + Math.sin(t * 4) * 0.18,
            hovNode.homePosition.z
          );
        } else {
          if (pat === 'leftToRightSweep') {
            _targetUfoPos.set(Math.sin(t * 2.2) * 7.5, 4.85, Math.cos(t * 1.1) * 2.5);
          } else if (pat === 'circleClassroom') {
            _targetUfoPos.set(Math.cos(t * 2.0) * 6.8, 4.9, Math.sin(t * 2.0) * 3.4);
          } else if (pat === 'figureEightDash') {
            _targetUfoPos.set(Math.sin(t * 2.4) * 7.2, 4.8, Math.sin(t * 4.8) * 2.8);
          } else {
            _targetUfoPos.set(Math.sin(t * 3.0) * 6.5, 4.85, Math.cos(t * 2.1) * 3.0);
          }
        }

        if (surprise === 'suddenBoost') {
          _targetUfoPos.x = Math.cos(t * 6.5) * 8.2;
          _targetUfoPos.z = Math.sin(t * 6.5) * 4.0;
          targetTiltZ = 0.38;
        } else if (surprise === 'fakeGiveUp') {
          _targetUfoPos.set(0, 9.8, -8.5);
          beamVisible = false;
          radarVisible = false;
        }

        targetTiltZ = THREE.MathUtils.clamp(
          (ufoRig.root.position.x - _targetUfoPos.x) * 0.12,
          -0.35,
          0.35
        );
      } else if (st === 'locking') {
        // Lock onto target student desk
        beamVisible = true;
        radarVisible = true;
        const lockNode = hovNode || selNode;
        if (lockNode) {
          _targetUfoPos.set(
            lockNode.homePosition.x,
            5.2 + Math.sin(t * 8) * 0.1,
            lockNode.homePosition.z
          );
        }
      } else if (st === 'missing') {
        // Event 2 / Event 5: UFO misses, wobbles off balance, student dodges sideways
        beamVisible = true;
        const missNode = hovNode || selNode;
        if (missNode) {
          _targetUfoPos.set(
            missNode.homePosition.x + 1.1,
            5.4 + Math.sin(t * 10) * 0.35,
            missNode.homePosition.z
          );
        }
        targetTiltZ = Math.sin(t * 14) * 0.48;
        targetTiltX = Math.cos(t * 12) * 0.28;
      } else if (st === 'falseSignal') {
        // Event 3: False signal smoke & stars, UFO tilts in confusion
        beamVisible = true;
        decoyVisible = true;
        const decoyNode = hovNode || selNode;
        const dx = decoyNode ? decoyNode.homePosition.x : 0;
        const dz = decoyNode ? decoyNode.homePosition.z : 1;
        _targetUfoPos.set(dx, 5.5, dz);
        ufoRig.decoyGroup.position.set(dx, 0.6, dz);
        ufoRig.decoyGroup.rotation.y = t * 3.5;
        targetTiltZ = 0.32 * Math.sin(t * 5);
      } else if (st === 'catching' || st === 'revealing') {
        // Event 1: Catch! Lift the chosen chibi student up into the tractor beam!
        beamVisible = true;
        radarVisible = true;
        starsVisible = true;
        if (selNode) {
          _targetUfoPos.set(
            selNode.homePosition.x,
            5.6,
            selNode.homePosition.z
          );
        } else {
          _targetUfoPos.set(0, 5.6, 0);
        }
      }

      // Smooth exponential damping on UFO only (Camera remains strictly stationary)
      const dampFactor = 1 - Math.exp(-5.5 * dt);
      ufoRig.root.position.lerp(_targetUfoPos, dampFactor);
      ufoRig.bodyGroup.rotation.z = THREE.MathUtils.lerp(
        ufoRig.bodyGroup.rotation.z,
        targetTiltZ,
        dampFactor
      );
      ufoRig.bodyGroup.rotation.x = THREE.MathUtils.lerp(
        ufoRig.bodyGroup.rotation.x,
        targetTiltX,
        dampFactor
      );

      // Tractor Beam & Ground Radar updates
      ufoRig.tractorBeamGroup.visible = beamVisible;
      ufoRig.groundRadarRing.visible = radarVisible;
      ufoRig.decoyGroup.visible = decoyVisible;
      ufoRig.starBurstInstanced.visible = starsVisible;

      if (beamVisible) {
        ufoRig.tractorRings.forEach((ring, idx) => {
          const offset = ((t * 2.2 + idx * 0.25) % 1) * 5.2;
          ring.position.y = -0.6 - offset;
          const s = 0.45 + (offset / 5.2) * 0.85;
          ring.scale.setScalar(s);
        });
      }

      if (radarVisible) {
        ufoRig.groundRadarRing.position.x = ufoRig.root.position.x;
        ufoRig.groundRadarRing.position.z = ufoRig.root.position.z;
        const pulse = 0.85 + Math.sin(t * 6) * 0.2;
        ufoRig.groundRadarRing.scale.setScalar(pulse);
      }

      // Animate Starburst Particles on Catch/Reveal
      if (starsVisible) {
        for (let i = 0; i < 36; i++) {
          const angle = (i / 36) * Math.PI * 2 + t * 2.5;
          const radius = 1.4 + ((i % 5) * 0.45) + Math.sin(t * 3 + i) * 0.35;
          const yOff = -2.8 + Math.cos(t * 2.2 + i * 0.5) * 1.8;
          _starDummy.position.set(
            Math.cos(angle) * radius,
            yOff,
            Math.sin(angle) * radius
          );
          _starDummy.rotation.set(t * 3, t * 2, i);
          _starDummy.scale.setScalar(0.8 + Math.sin(t * 5 + i) * 0.3);
          _starDummy.updateMatrix();
          ufoRig.starBurstInstanced.setMatrixAt(i, _starDummy.matrix);
        }
        ufoRig.starBurstInstanced.instanceMatrix.needsUpdate = true;
      }

      // Dim background slightly when revealing
      keyLight.intensity = st === 'revealing' ? 0.85 : 1.55;
      ufoRig.ufoSpotlight.intensity =
        st === 'catching' || st === 'revealing' ? 4.2 : 2.2;

      // Animate Chibi Students & Overhead Name Tags (idle bobbing, waving, dodging on miss, or lifting on catch)
      const nodes = studentNodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isHovered = hovStu?.id === node.studentId;
        const isSelected = selStu?.id === node.studentId;
        const shouldHighlight =
          (st === 'scanning' ||
            st === 'locking' ||
            st === 'missing' ||
            st === 'catching' ||
            st === 'revealing') &&
          (isHovered || isSelected);

        // Swap overhead name tag texture between normal and suspense highlight
        const spriteMat = node.nameSprite.material as THREE.SpriteMaterial;
        if (node.isHighlighted !== shouldHighlight) {
          node.isHighlighted = shouldHighlight;
          spriteMat.map = shouldHighlight
            ? node.activeNameTex
            : node.normalNameTex;
          spriteMat.needsUpdate = true;
        }

        // Zero-gravity space floating motion (vertical wave + horizontal drift + subtle weightless tilt)
        if (shouldHighlight) {
          const pulseScale = 1 + Math.sin(t * 14) * 0.08;
          node.nameSprite.scale.set(2.45 * pulseScale, 0.68 * pulseScale, 1);
          node.nameSprite.position.y = 1.96 + Math.sin(t * 8.5) * 0.085;
          node.nameSprite.position.x = Math.cos(t * 4.2 + i) * 0.09;
          spriteMat.rotation = Math.sin(t * 5.0 + i) * 0.065;
          node.nameSprite.renderOrder = 25;
        } else {
          node.nameSprite.scale.set(1.75, 0.49, 1);
          node.nameSprite.position.y = 1.78 + Math.sin(t * 2.3 + i * 0.85) * 0.055;
          node.nameSprite.position.x = Math.cos(t * 1.6 + i * 1.1) * 0.045;
          spriteMat.rotation = Math.sin(t * 1.8 + i * 0.7) * 0.038;
          node.nameSprite.renderOrder = 5;
        }

        if ((st === 'catching' || st === 'revealing') && isSelected) {
          // Lift student smoothly into tractor beam!
          node.characterGroup.position.y = THREE.MathUtils.lerp(
            node.characterGroup.position.y,
            2.35 + Math.sin(t * 4) * 0.18,
            dampFactor
          );
          node.characterGroup.rotation.y += dt * 2.8;
          node.leftArm.rotation.z = 2.4;
          node.rightArm.rotation.z = -2.4;
          node.characterGroup.position.x = THREE.MathUtils.lerp(
            node.characterGroup.position.x,
            0,
            dampFactor
          );
        } else if (st === 'missing' && (isHovered || isSelected)) {
          // Funny sideways dodge jump!
          node.characterGroup.position.x = THREE.MathUtils.lerp(
            node.characterGroup.position.x,
            i % 2 === 0 ? 0.95 : -0.95,
            dampFactor * 1.5
          );
          node.characterGroup.position.y = Math.abs(Math.sin(t * 10)) * 0.55;
          node.leftArm.rotation.z = 2.2;
          node.rightArm.rotation.z = -2.2;
        } else {
          // Return to desk & cute idle animation
          node.characterGroup.position.x = THREE.MathUtils.lerp(
            node.characterGroup.position.x,
            0,
            dampFactor
          );
          node.characterGroup.position.y = THREE.MathUtils.lerp(
            node.characterGroup.position.y,
            isHovered ? 0.22 + Math.abs(Math.sin(t * 7)) * 0.15 : 0,
            dampFactor
          );
          node.characterGroup.rotation.y = THREE.MathUtils.lerp(
            node.characterGroup.rotation.y,
            Math.sin(t * 1.5 + i) * 0.18,
            dampFactor
          );
          node.headGroup.rotation.z = Math.sin(t * 2.1 + i * 0.7) * 0.08;
          // Wave arms when UFO scans overhead
          if (isHovered) {
            node.leftArm.rotation.z = 2.1 + Math.sin(t * 12) * 0.35;
            node.rightArm.rotation.z = -2.1 - Math.sin(t * 12) * 0.35;
          } else {
            node.leftArm.rotation.z = 0.35;
            node.rightArm.rotation.z = -0.35;
          }
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
    };
  }, []);

  if (webglFailed || settings.prefer2DFallback) {
    return (
      <WebGLFallbackScene
        gameState={gameState}
        students={students}
        hoveredStudent={hoveredStudent}
        selectedStudent={selectedStudent}
        activeSurpriseEvent={activeSurpriseEvent}
      />
    );
  }

  const stageTargetStudent =
    gameState === 'catching' || gameState === 'revealing'
      ? selectedStudent
      : gameState === 'scanning' ||
        gameState === 'locking' ||
        gameState === 'missing'
      ? hoveredStudent || selectedStudent
      : null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Isolated WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="w-full h-full"
        aria-label="Sân khấu vũ trụ 3D UFO May Mắn"
      />

      {/* Weightless Space-Floating Target Student Name Badge during UFO Scan/Lock/Catch */}
      {stageTargetStudent && gameState !== 'revealing' && (
        <div className="pointer-events-none fixed inset-x-0 top-36 md:top-40 z-10 flex justify-center px-4">
          <div
            data-testid="floating-stage-student-name"
            className="animate-cosmic-float flex items-center gap-2.5 px-6 py-2 rounded-2xl bg-[#070B19]/92 border-2 border-amber-300 shadow-[0_10px_30px_rgba(251,191,36,0.35)]"
          >
            <span className="text-cyan-300 text-sm font-extrabold uppercase tracking-wider">
              {gameState === 'locking' || gameState === 'catching'
                ? '🎯 KHÓA MỤC TIÊU:'
                : '🛸 ĐANG QUÉT:'}
            </span>
            <span className="animate-cosmic-name-wave font-display font-extrabold text-xl md:text-2xl text-amber-300">
              {stageTargetStudent.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
