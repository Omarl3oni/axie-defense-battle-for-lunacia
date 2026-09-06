import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { PathSystem } from './path-system';
import { TOWER_SPOTS_POSITIONS } from './tower-defense-data';
import { TowerSpot } from './tower-defense-types';

export class Arena3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public pathSystem: PathSystem;

  public towerSpots: TowerSpot[] = [];
  public rangeCircleMesh: THREE.Mesh;

  private loader: GLTFLoader = new GLTFLoader();
  private modelCache: Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }> = new Map();
  private container: HTMLElement;

  constructor(canvasContainer: HTMLElement) {
    this.container = canvasContainer;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a101d);
    this.scene.fog = new THREE.FogExp2(0x0a101d, 0.012);

    // 2. Camera: Isometric top-down overview of the whole path
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.camera.position.set(0, 32, 26);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    canvasContainer.appendChild(this.renderer.domElement);

    // 4. Path System
    this.pathSystem = new PathSystem();
    this.scene.add(this.pathSystem.createVisualPath());

    // 5. Build Environment, Portal, Tree, and Platforms
    this.setupLighting();
    this.setupEnvironment();
    this.setupTowerSpots();

    // 6. Range Circle Indicator (Hidden by default)
    const rangeGeom = new THREE.RingGeometry(0.1, 1, 32);
    rangeGeom.rotateX(-Math.PI / 2);
    const rangeMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    this.rangeCircleMesh = new THREE.Mesh(rangeGeom, rangeMat);
    this.rangeCircleMesh.position.y = 0.08;
    this.rangeCircleMesh.visible = false;
    this.scene.add(this.rangeCircleMesh);

    window.addEventListener('resize', () => this.onResize());
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xdbeafe, 1.3);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0x142033, 1.6);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff7ed, 2.8);
    sun.position.set(18, 30, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    this.scene.add(sun);
  }

  private setupEnvironment() {
    // Ground Terrain
    const groundGeom = new THREE.PlaneGeometry(65, 50, 24, 24);
    groundGeom.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x15261d, // Deep Lunacia forest grass
      roughness: 0.85
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Chimera Spawning Portal (at start of path)
    const portalGroup = new THREE.Group();
    const portalBase = new THREE.CylinderGeometry(2.0, 2.4, 0.4, 16);
    const portalMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.6 });
    const pMesh = new THREE.Mesh(portalBase, portalMat);
    portalGroup.add(pMesh);

    const vortexGeom = new THREE.TorusGeometry(1.6, 0.35, 12, 24);
    const vortexMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.6
    });
    const vortex = new THREE.Mesh(vortexGeom, vortexMat);
    vortex.position.y = 1.4;
    vortex.rotation.x = Math.PI / 3;
    portalGroup.add(vortex);

    portalGroup.position.set(-19, 0, -8);
    this.scene.add(portalGroup);

    // Ancient Tree of Lunacia (at end of path: goal to defend)
    const treeGroup = new THREE.Group();
    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(1.2, 1.8, 5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Glowing Canopy
    const canopyGeom = new THREE.DodecahedronGeometry(3.5);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.3,
      roughness: 0.4
    });
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.y = 6.2;
    canopy.castShadow = true;
    treeGroup.add(canopy);

    // Heart Crystal floating inside canopy
    const crystalGeom = new THREE.OctahedronGeometry(0.9);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      emissive: 0xff0044,
      emissiveIntensity: 0.8
    });
    const crystal = new THREE.Mesh(crystalGeom, crystalMat);
    crystal.position.y = 6.2;
    treeGroup.add(crystal);

    treeGroup.position.set(18, 0, 0);
    this.scene.add(treeGroup);
  }

  private setupTowerSpots() {
    TOWER_SPOTS_POSITIONS.forEach((pos, idx) => {
      // Pedestal
      const padGeom = new THREE.CylinderGeometry(1.4, 1.6, 0.4, 20);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
        metalness: 0.2
      });
      const pad = new THREE.Mesh(padGeom, padMat);
      pad.position.set(pos.x, 0.2, pos.z);
      pad.castShadow = true;
      pad.receiveShadow = true;
      (pad as any).userData = { spotId: idx };

      // Glowing Runic Ring
      const ringGeom = new THREE.RingGeometry(1.45, 1.6, 24);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(pos.x, 0.41, pos.z);

      this.scene.add(pad);
      this.scene.add(ring);

      this.towerSpots.push({
        id: idx,
        position: pos.clone().setY(0.4),
        mesh: pad,
        ringMesh: ring,
        occupiedBy: null
      });
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
        console.warn('Could not preload model in TD:', file, e);
      }
    }
  }

  public createTowerMesh(modelFile: string, level: number): { mesh: THREE.Group; mixer?: THREE.AnimationMixer } {
    const cached = this.modelCache.get(modelFile);
    let group: THREE.Group;
    let mixer: THREE.AnimationMixer | undefined;

    if (cached) {
      group = SkeletonUtils.clone(cached.scene) as THREE.Group;
      if (cached.animations.length > 0) {
        mixer = new THREE.AnimationMixer(group);
        const idleClip = cached.animations.find(a => /idle/i.test(a.name)) ?? cached.animations[0];
        if (idleClip) mixer.clipAction(idleClip).play();
      }
    } else {
      // Fallback
      group = new THREE.Group();
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 })
      );
      s.position.y = 0.8;
      group.add(s);
    }

    // Scale and Level Aura
    if (level === 2) {
      group.scale.multiplyScalar(1.15);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.0, 1.25, 20),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      ring.rotateX(-Math.PI / 2);
      ring.position.y = 0.05;
      group.add(ring);
    } else if (level === 3) {
      group.scale.multiplyScalar(1.3);
      // Golden Master Crown
      const goldRing = new THREE.Mesh(
        new THREE.RingGeometry(1.0, 1.35, 24),
        new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide })
      );
      goldRing.rotateX(-Math.PI / 2);
      goldRing.position.y = 0.05;
      group.add(goldRing);
    }

    return { mesh: group, mixer };
  }

  public createEnemyMesh(modelFile: string, scale: number, colorFilter?: number): { mesh: THREE.Group; mixer?: THREE.AnimationMixer; healthBarFill: THREE.Mesh } {
    const cached = this.modelCache.get(modelFile);
    let group: THREE.Group;
    let mixer: THREE.AnimationMixer | undefined;

    if (cached) {
      group = SkeletonUtils.clone(cached.scene) as THREE.Group;
      group.scale.set(scale, scale, scale);

      if (colorFilter) {
        group.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const m = (c as THREE.Mesh).material;
            if (m) {
              const cl = (Array.isArray(m) ? m[0] : m).clone() as THREE.MeshStandardMaterial;
              if (cl.color) cl.color.setHex(colorFilter);
              (c as THREE.Mesh).material = cl;
            }
          }
        });
      }

      if (cached.animations.length > 0) {
        mixer = new THREE.AnimationMixer(group);
        const runClip = cached.animations.find(a => /run|walk/i.test(a.name)) ?? cached.animations[0];
        if (runClip) mixer.clipAction(runClip).play();
      }
    } else {
      group = new THREE.Group();
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.7 * scale, 12, 12),
        new THREE.MeshStandardMaterial({ color: colorFilter || 0xef4444, roughness: 0.4 })
      );
      s.position.y = 0.7 * scale;
      group.add(s);
    }

    // Overhead 3D Health Bar
    const hbGroup = new THREE.Group();
    hbGroup.position.y = 1.8 * scale;

    const bgBar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4 * scale, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
    );
    bgBar.rotation.x = -Math.PI / 4;
    hbGroup.add(bgBar);

    const fillBar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.36 * scale, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })
    );
    fillBar.rotation.x = -Math.PI / 4;
    fillBar.position.z = 0.01;
    hbGroup.add(fillBar);

    group.add(hbGroup);

    return { mesh: group, mixer, healthBarFill: fillBar };
  }

  public showRangeIndicator(position: THREE.Vector3, range: number) {
    this.rangeCircleMesh.geometry.dispose();
    this.rangeCircleMesh.geometry = new THREE.RingGeometry(range - 0.15, range, 48);
    this.rangeCircleMesh.geometry.rotateX(-Math.PI / 2);
    this.rangeCircleMesh.position.set(position.x, 0.08, position.z);
    this.rangeCircleMesh.visible = true;
  }

  public hideRangeIndicator() {
    this.rangeCircleMesh.visible = false;
  }

  public showDamageNumber(worldPos: THREE.Vector3, amount: number, isCrit: boolean) {
    const screenPos = worldPos.clone();
    screenPos.y += 1.8;
    screenPos.project(this.camera);

    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = `damage-number ${isCrit ? 'crit' : ''}`;
    el.textContent = `${amount}${isCrit ? '!' : ''}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    this.container.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  public triggerMeteorEffect(pos: THREE.Vector3) {
    // Shockwave ring on ground
    const blastGeom = new THREE.RingGeometry(0.2, 4.2, 32);
    blastGeom.rotateX(-Math.PI / 2);
    const blastMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const blast = new THREE.Mesh(blastGeom, blastMat);
    blast.position.set(pos.x, 0.12, pos.z);
    this.scene.add(blast);

    let t = 0;
    const interval = setInterval(() => {
      t += 0.06;
      blast.scale.set(1 + t * 0.8, 1 + t * 0.8, 1);
      blastMat.opacity = Math.max(0, 0.9 - t * 1.5);
      if (t >= 0.7) {
        clearInterval(interval);
        this.scene.remove(blast);
        blastGeom.dispose();
        blastMat.dispose();
      }
    }, 16);
  }

  public onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
