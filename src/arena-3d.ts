import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { AxieUnit, CombatAction, BattleSide } from './tactics-types';
import { sounds } from './audio';

export class Arena3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private loader: GLTFLoader = new GLTFLoader();
  private modelCache: Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }> = new Map();

  // 3D Unit representations by side and slot
  private playerMeshes: (THREE.Group | null)[] = [null, null, null];
  private playerMixers: (THREE.AnimationMixer | null)[] = [null, null, null];

  private enemyMeshes: (THREE.Group | null)[] = [null, null, null];
  private enemyMixers: (THREE.AnimationMixer | null)[] = [null, null, null];

  // Base slot positions in 3D world space
  // Player faces positive X (looking at enemy)
  public readonly playerSlotPositions: THREE.Vector3[] = [
    new THREE.Vector3(-2.8, 0, 0),   // Front (Slot 0)
    new THREE.Vector3(-5.8, 0, 1.2), // Mid (Slot 1)
    new THREE.Vector3(-8.8, 0, -1.2) // Back (Slot 2)
  ];

  // Enemy faces negative X (looking at player)
  public readonly enemySlotPositions: THREE.Vector3[] = [
    new THREE.Vector3(2.8, 0, 0),    // Front (Slot 0)
    new THREE.Vector3(5.8, 0, -1.2), // Mid (Slot 1)
    new THREE.Vector3(8.8, 0, 1.2)   // Back (Slot 2)
  ];

  constructor(canvasContainer: HTMLElement) {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.015);

    // 2. Camera: Isometric arena angle
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
    this.camera.position.set(0, 16, 18);
    this.camera.lookAt(0, 1.0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    canvasContainer.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupBoard();

    window.addEventListener('resize', () => this.onResize());
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xdbeafe, 1.4);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 1.8);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffedd5, 3.0);
    sun.position.set(10, 20, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    this.scene.add(sun);

    // Subtle blue rim light for player side
    const blueSpot = new THREE.PointLight(0x00f0ff, 2.5, 20);
    blueSpot.position.set(-6, 4, 0);
    this.scene.add(blueSpot);

    // Subtle red rim light for enemy side
    const redSpot = new THREE.PointLight(0xff0055, 2.5, 20);
    redSpot.position.set(6, 4, 0);
    this.scene.add(redSpot);
  }

  private setupBoard() {
    // Arena Floor
    const floorGeom = new THREE.CylinderGeometry(14, 15, 0.6, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e,
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -0.3;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Decorative Battle Divider in Center
    const lineGeom = new THREE.PlaneGeometry(0.12, 12);
    lineGeom.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.4
    });
    const line = new THREE.Mesh(lineGeom, lineMat);
    line.position.set(0, 0.02, 0);
    this.scene.add(line);

    // Battle Pads for Player Slots
    this.playerSlotPositions.forEach((pos, idx) => {
      const padGeom = new THREE.CylinderGeometry(1.3, 1.4, 0.08, 24);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        roughness: 0.4
      });
      const pad = new THREE.Mesh(padGeom, padMat);
      pad.position.set(pos.x, 0.04, pos.z);
      pad.receiveShadow = true;
      this.scene.add(pad);

      // Label ring
      const ringGeom = new THREE.RingGeometry(1.35, 1.48, 24);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(pos.x, 0.06, pos.z);
      this.scene.add(ring);
    });

    // Battle Pads for Enemy Slots
    this.enemySlotPositions.forEach((pos, idx) => {
      const padGeom = new THREE.CylinderGeometry(1.3, 1.4, 0.08, 24);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        emissive: 0xdc2626,
        emissiveIntensity: 0.35,
        roughness: 0.4
      });
      const pad = new THREE.Mesh(padGeom, padMat);
      pad.position.set(pos.x, 0.04, pos.z);
      pad.receiveShadow = true;
      this.scene.add(pad);

      const ringGeom = new THREE.RingGeometry(1.35, 1.48, 24);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xf87171, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(pos.x, 0.06, pos.z);
      this.scene.add(ring);
    });
  }

  public async preloadModels(fileList: string[]): Promise<void> {
    for (const file of fileList) {
      if (this.modelCache.has(file)) continue;
      const isMascot = !file.startsWith('sapidae');
      const fullPath = `./assets/${isMascot ? 'mascots' : 'sapidae'}/${file}`;
      try {
        const gltf = await this.loader.loadAsync(fullPath);
        const scene = gltf.scene;
        scene.scale.set(1.4, 1.4, 1.4);
        scene.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.modelCache.set(file, { scene, animations: gltf.animations });
      } catch (e) {
        console.warn('Could not preload model:', file, e);
      }
    }
  }

  public renderTeam(side: BattleSide, units: (AxieUnit | null)[]) {
    const meshes = side === 'player' ? this.playerMeshes : this.enemyMeshes;
    const mixers = side === 'player' ? this.playerMixers : this.enemyMixers;
    const positions = side === 'player' ? this.playerSlotPositions : this.enemySlotPositions;

    units.forEach((unit, slot) => {
      // Clean up previous mesh in this slot
      if (meshes[slot]) {
        this.scene.remove(meshes[slot]!);
        meshes[slot] = null;
        mixers[slot] = null;
      }

      if (!unit || unit.hp <= 0) return;

      const pos = positions[slot];
      const cached = this.modelCache.get(unit.modelFile);

      let group: THREE.Group;
      let mixer: THREE.AnimationMixer | null = null;

      if (cached) {
        group = SkeletonUtils.clone(cached.scene) as THREE.Group;
        if (cached.animations.length > 0) {
          mixer = new THREE.AnimationMixer(group);
          const idleClip = cached.animations.find(a => /idle/i.test(a.name)) ?? cached.animations[0];
          if (idleClip) mixer.clipAction(idleClip).play();
        }
      } else {
        // Fallback stylized colored sphere
        group = new THREE.Group();
        const g = new THREE.SphereGeometry(0.75, 16, 16);
        const m = new THREE.MeshStandardMaterial({
          color: side === 'player' ? 0x22c55e : 0xef4444,
          roughness: 0.4
        });
        const sphere = new THREE.Mesh(g, m);
        sphere.position.y = 0.75;
        group.add(sphere);
      }

      group.position.set(pos.x, 0, pos.z);
      // Face towards opposite side
      group.rotation.y = side === 'player' ? Math.PI / 2 : -Math.PI / 2;

      // Golden Aura for Level 2 Units
      if (unit.level === 2) {
        const goldRingGeom = new THREE.RingGeometry(0.8, 1.1, 24);
        goldRingGeom.rotateX(-Math.PI / 2);
        const goldRingMat = new THREE.MeshBasicMaterial({
          color: 0xffb703,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const goldRing = new THREE.Mesh(goldRingGeom, goldRingMat);
        goldRing.position.y = 0.1;
        group.add(goldRing);
      }

      this.scene.add(group);
      meshes[slot] = group;
      mixers[slot] = mixer;
    });
  }

  public async playCombatAnimation(
    actions: CombatAction[],
    onActionStep: (action: CombatAction) => void,
    onFinish: () => void
  ) {
    for (const action of actions) {
      onActionStep(action);

      if (action.type === 'ATTACK') {
        sounds.playShoot();
        const attackerMesh = action.sourceSide === 'player'
          ? this.playerMeshes[action.sourceSlot]
          : this.enemyMeshes[action.sourceSlot];

        const targetMesh = action.targetSide === 'player'
          ? this.playerMeshes[action.targetSlot!]
          : this.enemyMeshes[action.targetSlot!];

        if (attackerMesh && targetMesh) {
          // Quick lunge forward animation
          const originalPos = attackerMesh.position.clone();
          const targetPos = targetMesh.position.clone();
          const lungePos = originalPos.clone().lerp(targetPos, 0.45);

          attackerMesh.position.copy(lungePos);
          await this.delay(160);

          sounds.playHit();
          attackerMesh.position.copy(originalPos);
          await this.delay(140);
        }
      } else if (action.type === 'DEATH') {
        const deadMesh = action.sourceSide === 'player'
          ? this.playerMeshes[action.sourceSlot]
          : this.enemyMeshes[action.sourceSlot];

        if (deadMesh) {
          // Shrink / sink away
          deadMesh.scale.set(0.1, 0.1, 0.1);
          this.scene.remove(deadMesh);
        }
        await this.delay(150);
      } else if (action.type === 'SHIELD') {
        await this.delay(200);
      } else {
        await this.delay(220);
      }
    }

    onFinish();
  }

  public update(delta: number) {
    this.playerMixers.forEach(m => m?.update(delta));
    this.enemyMixers.forEach(m => m?.update(delta));
    this.renderer.render(this.scene, this.camera);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  private onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
