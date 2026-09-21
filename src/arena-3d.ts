import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { PathSystem } from './path-system';
import { GridSystem, CellType } from './grid-system';
import { TowerSpot, EnemyType, BuildingType } from './tower-defense-types';
import { AxieNFT, VisualMode } from './axie-nft';

export class Arena3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public pathSystem: PathSystem;
  public gridSystem: GridSystem = new GridSystem(46, 28, 0.8);
  public boardGroup: THREE.Group | null = null;

  public towerSpots: TowerSpot[] = [];
  public rangeCircleMesh: THREE.Mesh;
  public groundMesh!: THREE.Mesh;
  public portalGroup!: THREE.Group;
  public treeGroup!: THREE.Group;
  public pathGroup!: THREE.Group;
  public obstaclesGroup: THREE.Group = new THREE.Group();
  public obstacleColliders: { position: THREE.Vector3; radius: number }[] = [];

  private isDraggingCamera: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  // Placement Preview Meshes
  private placementPreviewGroup!: THREE.Group;
  private previewFootprintMesh!: THREE.Mesh;
  private previewRangeMesh!: THREE.Mesh;
  private currentPreviewRange: number = 0;

  // Title / Cinematic Camera State
  public isTitleMode: boolean = true;
  private isTransitioningCamera: boolean = false;
  private cameraTransitionProgress: number = 0;
  private titleAngle: number = 0;
  private defaultGameCamPos: THREE.Vector3 = new THREE.Vector3(0, 36, 29);
  private defaultGameLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private camStartPos: THREE.Vector3 = new THREE.Vector3();

  private loader: GLTFLoader = new GLTFLoader();
  private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
  private modelCache: Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();
  private container: HTMLElement;


  constructor(canvasContainer: HTMLElement) {
    this.container = canvasContainer;

    this.textureLoader.setCrossOrigin('anonymous');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a101d);
    this.scene.fog = new THREE.FogExp2(0x0a101d, 0.012);

    // 2. Camera: Isometric top-down overview of the whole path
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.camera.position.set(0, 36, 29);
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

    // 5. Build Environment, Portal, Tree, and Placement Preview
    this.setupLighting();
    this.setupEnvironment();
    this.setupPlacementPreview();

    this.scene.add(this.obstaclesGroup);
    this.generateRandomMap();

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
    this.rangeCircleMesh.position.y = 0.21;
    this.rangeCircleMesh.visible = false;
    this.scene.add(this.rangeCircleMesh);

    window.addEventListener('resize', () => this.onResize());

    try {
      const savedQuality = (localStorage.getItem('axie_gfx_quality') as 'high' | 'eco') || 'high';
      this.setGraphicsQuality(savedQuality);
    } catch {}
  }

  public setGraphicsQuality(quality: 'high' | 'eco') {
    if (quality === 'high') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
    } else {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    }
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
    // Ground Terrain - Surrounding mystical mist floor
    const groundGeom = new THREE.PlaneGeometry(110, 85, 24, 24);
    groundGeom.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x060c14, // Deep abyssal void surrounding the Lunacia island
      roughness: 0.98
    });
    this.groundMesh = new THREE.Mesh(groundGeom, groundMat);
    this.groundMesh.position.y = -1.6;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Floating Diorama Cliff Base underneath the playable board (46x28 * 0.8 = 36.8 x 22.4)
    const dioramaBaseGeom = new THREE.BoxGeometry(37.4, 1.2, 23.0);
    const dioramaBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.88,
      metalness: 0.1
    });
    const dioramaBase = new THREE.Mesh(dioramaBaseGeom, dioramaBaseMat);
    dioramaBase.position.set(0, -0.6, 0);
    dioramaBase.receiveShadow = true;
    dioramaBase.castShadow = true;
    this.scene.add(dioramaBase);

    // Chimera Spawning Portal (at start of path)
    this.portalGroup = new THREE.Group();
    const portalBase = new THREE.CylinderGeometry(2.0, 2.4, 0.4, 16);
    const portalMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.6 });
    const pMesh = new THREE.Mesh(portalBase, portalMat);
    this.portalGroup.add(pMesh);

    const vortexGeom = new THREE.TorusGeometry(1.6, 0.35, 12, 24);
    const vortexMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.6
    });
    const vortex = new THREE.Mesh(vortexGeom, vortexMat);
    vortex.position.y = 1.4;
    vortex.rotation.x = Math.PI / 3;
    this.portalGroup.add(vortex);

    this.scene.add(this.portalGroup);

    // Ancient Tree of Lunacia (at end of path: goal to defend)
    this.treeGroup = new THREE.Group();
    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(1.2, 1.8, 5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    this.treeGroup.add(trunk);

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
    this.treeGroup.add(canopy);

    // Heart Crystal floating inside canopy
    const crystalGeom = new THREE.OctahedronGeometry(0.9);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      emissive: 0xff0044,
      emissiveIntensity: 0.8
    });
    const crystal = new THREE.Mesh(crystalGeom, crystalMat);
    crystal.position.y = 6.2;
    this.treeGroup.add(crystal);

    this.scene.add(this.treeGroup);
  }

  private setupPlacementPreview() {
    this.placementPreviewGroup = new THREE.Group();

    // 3x3 footprint plane (2.36m x 2.36m)
    const footprintGeom = new THREE.PlaneGeometry(2.36, 2.36);
    footprintGeom.rotateX(-Math.PI / 2);
    const footprintMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22
    });
    this.previewFootprintMesh = new THREE.Mesh(footprintGeom, footprintMat);
    this.previewFootprintMesh.position.y = 0.20;
    this.placementPreviewGroup.add(this.previewFootprintMesh);

    // Attack range circle
    const rangeGeom = new THREE.RingGeometry(0.8, 1.0, 48);
    rangeGeom.rotateX(-Math.PI / 2);
    const rangeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    this.previewRangeMesh = new THREE.Mesh(rangeGeom, rangeMat);
    this.previewRangeMesh.position.y = 0.21;
    this.placementPreviewGroup.add(this.previewRangeMesh);

    this.placementPreviewGroup.visible = false;
    this.scene.add(this.placementPreviewGroup);
  }

  public updatePlacementPreview(pos: THREE.Vector3, isValid: boolean, range: number, footprintCells: number = 3) {
    this.placementPreviewGroup.position.set(pos.x, 0, pos.z);
    const colorHex = isValid ? 0x10b981 : 0xef4444;

    const fpSize = (footprintCells * 0.8) - 0.04;
    this.previewFootprintMesh.visible = false; // We use individual per-cell highlightBoxes so only blocked cells turn red!

    if (range > 0) {
      this.previewRangeMesh.visible = true;
      (this.previewRangeMesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
      if (Math.abs(this.currentPreviewRange - range) > 0.01) {
        this.currentPreviewRange = range;
        this.previewRangeMesh.geometry.dispose();
        const geom = new THREE.RingGeometry(range - 0.2, range, 48);
        geom.rotateX(-Math.PI / 2);
        this.previewRangeMesh.geometry = geom;
      }
    } else {
      this.previewRangeMesh.visible = false;
    }

    this.placementPreviewGroup.visible = true;
  }

  public hidePlacementPreview() {
    this.placementPreviewGroup.visible = false;
    this.gridSystem.hideHighlight();
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

  public preloadTexture(url: string): Promise<THREE.Texture> {
    if (this.textureCache.has(url)) {
      return Promise.resolve(this.textureCache.get(url)!);
    }
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          this.textureCache.set(url, tex);
          resolve(tex);
        },
        undefined,
        (err) => {
          console.warn('Could not load axie texture:', url, err);
          reject(err);
        }
      );
    });
  }

  public createTowerMesh(
    modelFile: string,
    level: number,
    customAxie?: AxieNFT | null,
    visualMode: VisualMode = 'billboard_25d'
  ): {
    mesh: THREE.Group;
    mixer?: THREE.AnimationMixer;
    billboardMesh?: THREE.Mesh;
    hologramGroup?: THREE.Group;
  } {
    const rootGroup = new THREE.Group();

    // Determine runic glow color by class
    let glowColor = 0x38bdf8; // default cyan
    if (customAxie) {
      switch (customAxie.class) {
        case 'Plant': glowColor = 0x22c55e; break;
        case 'Beast': glowColor = 0xf97316; break;
        case 'Aqua': glowColor = 0x06b6d4; break;
        case 'Bird': glowColor = 0xec4899; break;
        case 'Mech': glowColor = 0x94a3b8; break;
        case 'Bug': glowColor = 0x84cc16; break;
        case 'Reptile': glowColor = 0x8b5cf6; break;
        default: glowColor = 0x38bdf8; break;
      }
    }

    // 1. Stone pedestal base under the Axie
    const padGeom = new THREE.CylinderGeometry(1.3, 1.5, 0.35, 20);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.15
    });
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.position.y = 0.175;
    pad.castShadow = true;
    pad.receiveShadow = true;
    (pad as any).userData = { isTowerBase: true };
    rootGroup.add(pad);

    // Glowing runic rim
    const rimGeom = new THREE.RingGeometry(1.32, 1.48, 24);
    rimGeom.rotateX(-Math.PI / 2);
    const rimMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.position.y = 0.36;
    rootGroup.add(rim);

    let mixer: THREE.AnimationMixer | undefined;
    let billboardMesh: THREE.Mesh | undefined;
    let hologramGroup: THREE.Group | undefined;

    if (customAxie && visualMode === 'billboard_25d') {
      // --- 2.5D HIGH-FIDELITY NFT BILLBOARD ---
      const imgUrl = (customAxie.image || '').replace('assets.axieinfinity.com', 'axiecdn.axieinfinity.com');
      let texture = this.textureCache.get(imgUrl);
      if (!texture) {
        texture = this.textureLoader.load(
          imgUrl,
          undefined,
          undefined,
          (err) => {
            console.warn(`[3D Arena] Error loading Axie texture: ${imgUrl}`, err);
          }
        );
        texture.colorSpace = THREE.SRGBColorSpace;
        this.textureCache.set(imgUrl, texture);
      }

      const spriteW = 2.4;
      const spriteH = 2.4;
      const spriteGeom = new THREE.PlaneGeometry(spriteW, spriteH);
      spriteGeom.translate(0, spriteH / 2, 0); // Pivot at ground level

      const spriteMat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.08,
        depthWrite: false,
        side: THREE.DoubleSide,
        roughness: 0.6,
        metalness: 0.05
      });

      billboardMesh = new THREE.Mesh(spriteGeom, spriteMat);
      billboardMesh.position.set(0, 0.35, 0);
      billboardMesh.rotation.x = -Math.PI / 4.0; // Angled facing the isometric camera
      billboardMesh.castShadow = true;
      billboardMesh.renderOrder = 15;
      rootGroup.add(billboardMesh);

      // Soft contact shadow on the stone pedestal
      const shadowGeom = new THREE.PlaneGeometry(1.6, 1.3);
      shadowGeom.rotateX(-Math.PI / 2);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x020617,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
      shadowMesh.position.set(0, 0.365, 0.05);
      rootGroup.add(shadowMesh);

      // Mystic / Origin Celestial Halo
      if (customAxie.specialType === 'Mystic' || customAxie.specialType === 'Origin') {
        const haloGeom = new THREE.RingGeometry(0.85, 1.1, 24);
        haloGeom.rotateX(-Math.PI / 2);
        const haloMat = new THREE.MeshBasicMaterial({
          color: customAxie.specialType === 'Mystic' ? 0xfacc15 : 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const halo = new THREE.Mesh(haloGeom, haloMat);
        halo.position.y = 0.37;
        rootGroup.add(halo);
      }

      // Upgrades scale & auras
      if (level === 2) {
        billboardMesh.scale.multiplyScalar(1.15);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.0, 1.25, 20),
          new THREE.MeshBasicMaterial({ color: glowColor, side: THREE.DoubleSide })
        );
        ring.rotateX(-Math.PI / 2);
        ring.position.y = 0.38;
        rootGroup.add(ring);
      } else if (level === 3) {
        billboardMesh.scale.multiplyScalar(1.3);
        const goldRing = new THREE.Mesh(
          new THREE.RingGeometry(1.0, 1.35, 24),
          new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide })
        );
        goldRing.rotateX(-Math.PI / 2);
        goldRing.position.y = 0.38;
        rootGroup.add(goldRing);
      }
    } else {
      // --- 3D MASCOT MODEL ---
      const cached = this.modelCache.get(modelFile);
      let axieGroup: THREE.Group;

      if (cached) {
        axieGroup = SkeletonUtils.clone(cached.scene) as THREE.Group;
        if (cached.animations.length > 0) {
          mixer = new THREE.AnimationMixer(axieGroup);
          const idleClip = cached.animations.find(a => /idle/i.test(a.name)) ?? cached.animations[0];
          if (idleClip) mixer.clipAction(idleClip).play();
        }
      } else {
        // Fallback
        axieGroup = new THREE.Group();
        const s = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 })
        );
        s.position.y = 0.8;
        axieGroup.add(s);
      }

      axieGroup.position.y = 0.35;
      rootGroup.add(axieGroup);

      // Optional Floating Overhead Holographic NFT Badge
      if (customAxie) {
        hologramGroup = new THREE.Group();
        hologramGroup.position.set(0, 2.3, 0);

        let texture = this.textureCache.get(customAxie.image);
        if (!texture) {
          texture = this.textureLoader.load(customAxie.image);
          texture.colorSpace = THREE.SRGBColorSpace;
          this.textureCache.set(customAxie.image, texture);
        }

        // Floating holographic crest frame
        const crestFrameGeom = new THREE.TorusGeometry(0.52, 0.035, 8, 24);
        const crestFrameMat = new THREE.MeshBasicMaterial({
          color: glowColor,
          wireframe: false,
          transparent: true,
          opacity: 0.85
        });
        const frameMesh = new THREE.Mesh(crestFrameGeom, crestFrameMat);
        hologramGroup.add(frameMesh);

        // Portrait disc
        const portraitGeom = new THREE.CircleGeometry(0.48, 24);
        const portraitMat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.12,
          side: THREE.DoubleSide
        });
        const portraitMesh = new THREE.Mesh(portraitGeom, portraitMat);
        hologramGroup.add(portraitMesh);

        rootGroup.add(hologramGroup);
      }

      // Scale and Level Aura
      if (level === 2) {
        axieGroup.scale.multiplyScalar(1.15);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.0, 1.25, 20),
          new THREE.MeshBasicMaterial({ color: glowColor, side: THREE.DoubleSide })
        );
        ring.rotateX(-Math.PI / 2);
        ring.position.y = 0.38;
        rootGroup.add(ring);
      } else if (level === 3) {
        axieGroup.scale.multiplyScalar(1.3);
        const goldRing = new THREE.Mesh(
          new THREE.RingGeometry(1.0, 1.35, 24),
          new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide })
        );
        goldRing.rotateX(-Math.PI / 2);
        goldRing.position.y = 0.38;
        rootGroup.add(goldRing);
      }
    }

    (rootGroup as any).userData = { isTower: true };

    return { mesh: rootGroup, mixer, billboardMesh, hologramGroup };
  }

  public createBuildingMesh(type: BuildingType = 'hemp_hut', level: number = 1): { mesh: THREE.Group } {
    const rootGroup = new THREE.Group();

    // 1. Cozy Homeland Courtyard Ground Base
    const earthGroup = new THREE.Group();
    const groundGeom = new THREE.BoxGeometry(2.8, 0.16, 2.8);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728, // Rich Lunacian farm soil / garden foundation
      roughness: 0.9,
      metalness: 0.1
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.position.y = 0.08;
    groundMesh.receiveShadow = true;
    earthGroup.add(groundMesh);

    // Stone pathway trim along the front
    const borderGeom = new THREE.BoxGeometry(2.9, 0.06, 0.35);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.8
    });
    const frontBorder = new THREE.Mesh(borderGeom, borderMat);
    frontBorder.position.set(0, 0.17, 1.25);
    frontBorder.receiveShadow = true;
    earthGroup.add(frontBorder);

    // Decorative entrance cobblestones
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.7 });
    for (let s = -0.6; s <= 0.6; s += 0.4) {
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.28), stoneMat);
      stone.position.set(s, 0.17, 0.95);
      earthGroup.add(stone);
    }

    // Shadow decal below the structure
    const shadowGeom = new THREE.PlaneGeometry(2.9, 2.7);
    shadowGeom.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x070b14,
      transparent: true,
      opacity: 0.45
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.position.set(0.05, 0.09, 0.1);
    earthGroup.add(shadowMesh);

    rootGroup.add(earthGroup);

    // 2. Authentic Homeland Structure Silhouette (2.5D Isometric Standee)
    const imgUrl = type === 'hummer_hut'
      ? (level >= 2 ? 'assets/homeland_all/buildings/hummer_hut_3.jpg' : 'assets/homeland_all/buildings/hummer_hut_2.jpg')
      : 'assets/homeland/hemp_hut.webp';
    let texture = this.textureCache.get(imgUrl);
    if (!texture) {
      texture = this.textureLoader.load(imgUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.textureCache.set(imgUrl, texture);
    }

    // Proportional dimensions for 3x3 footprint
    const spriteW = type === 'hummer_hut' ? (level >= 2 ? 3.6 : 3.4) : 3.2;
    const spriteH = type === 'hummer_hut' ? (level >= 2 ? 3.7 : 3.5) : 3.3;
    const spriteGeom = new THREE.PlaneGeometry(spriteW, spriteH);
    // Center hut accurately over the 3x3 courtyard
    spriteGeom.translate(0.05, (spriteH / 2) - 0.22, 0);

    const spriteMat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false, // Prevents depth occlusion clipping with neighboring tower bases
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.05
    });

    const structureSprite = new THREE.Mesh(spriteGeom, spriteMat);
    structureSprite.name = 'buildingSprite';
    structureSprite.position.set(0, 0.08, 0.15);
    // Align with camera elevation pitch (~50 degrees)
    structureSprite.rotation.x = -Math.PI / 4.8;
    structureSprite.castShadow = true;
    structureSprite.renderOrder = 10;
    rootGroup.add(structureSprite);

    // 3. Cozy Homeland Hearth Glow
    const hearthColor = type === 'hummer_hut' ? (level >= 2 ? 0xa855f7 : 0xf97316) : 0xf59e0b;
    const hearthLight = new THREE.PointLight(hearthColor, 1.8, 4.5);
    hearthLight.position.set(-0.2, 0.7, 0.45);
    rootGroup.add(hearthLight);

    (rootGroup as any).userData = { isBuilding: true, buildingType: type, buildingLevel: level };

    return { mesh: rootGroup };
  }

  public updateBuildingSprite(meshGroup: THREE.Group, type: BuildingType, level: number) {
    const sprite = meshGroup.getObjectByName('buildingSprite') as THREE.Mesh;
    if (!sprite) return;
    const imgUrl = type === 'hummer_hut'
      ? (level >= 2 ? 'assets/homeland_all/buildings/hummer_hut_3.jpg' : 'assets/homeland_all/buildings/hummer_hut_2.jpg')
      : 'assets/homeland/hemp_hut.webp';

    let texture = this.textureCache.get(imgUrl);
    if (!texture) {
      texture = this.textureLoader.load(imgUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.textureCache.set(imgUrl, texture);
    }
    const mat = sprite.material as THREE.MeshStandardMaterial;
    mat.map = texture;
    mat.needsUpdate = true;
  }

  public createTowerProgressBar(): { group: THREE.Group; fill: THREE.Mesh } {
    const group = new THREE.Group();
    group.position.y = 2.4;

    // Background border & bar
    const border = new THREE.Mesh(
      new THREE.PlaneGeometry(2.24, 0.38),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    border.position.z = -0.01;
    group.add(border);

    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(2.18, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x0a101d, side: THREE.DoubleSide })
    );
    group.add(bg);

    // Fill bar
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(2.12, 0.26),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide })
    );
    fill.position.z = 0.01;
    group.add(fill);

    group.visible = false;
    return { group, fill };
  }

  public createEnemyMesh(
    modelFile: string,
    scale: number,
    colorFilter?: number,
    enemyType: EnemyType = 'scout',
    axieImageUrl?: string
  ): { mesh: THREE.Group; mixer?: THREE.AnimationMixer; healthBarFill: THREE.Mesh; healthBarGroup: THREE.Group; axieSpriteMesh?: THREE.Mesh } {
    let group: THREE.Group;
    let mixer: THREE.AnimationMixer | undefined;
    let axieSpriteMesh: THREE.Mesh | undefined;

    if (axieImageUrl) {
      group = new THREE.Group();

      // Shadow projection plane on ground
      const shadowGeom = new THREE.CircleGeometry(0.75 * scale, 24);
      shadowGeom.rotateX(-Math.PI / 2);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x030712,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
      shadowMesh.position.y = 0.03;
      group.add(shadowMesh);

      // Axie Sprite Plane
      const spriteW = 2.4 * scale;
      const spriteH = 1.9 * scale;
      const spriteGeom = new THREE.PlaneGeometry(spriteW, spriteH);
      spriteGeom.translate(0, spriteH / 2, 0);

      // Load texture with cache
      let texture = this.textureCache.get(axieImageUrl);
      if (!texture) {
        texture = this.textureLoader.load(axieImageUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        this.textureCache.set(axieImageUrl, texture);
      }

      const spriteMat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        roughness: 0.6,
        metalness: 0.1
      });

      if (colorFilter) {
        spriteMat.emissive = new THREE.Color(colorFilter).multiplyScalar(0.25);
      }

      axieSpriteMesh = new THREE.Mesh(spriteGeom, spriteMat);
      axieSpriteMesh.castShadow = true;
      group.add(axieSpriteMesh);
    } else {
      const cached = this.modelCache.get(modelFile);
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
                cl.emissive = new THREE.Color(colorFilter).multiplyScalar(0.2);
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
    }

    // High-Visibility Overhead 3D Health Bar & Personality Badge
    const hbGroup = new THREE.Group();
    hbGroup.position.y = 1.85 + (0.35 / scale);

    const worldWidth = Math.max(2.4, 1.35 * scale);
    const localWidth = worldWidth / scale;
    const worldHeight = 0.38;
    const localHeight = worldHeight / scale;

    // Dark Border Frame
    const borderBar = new THREE.Mesh(
      new THREE.PlaneGeometry(localWidth + (0.16 / scale), localHeight + (0.14 / scale)),
      new THREE.MeshBasicMaterial({ color: 0x070a10, side: THREE.DoubleSide })
    );
    hbGroup.add(borderBar);

    // Inner Dark Background Bar
    const bgBar = new THREE.Mesh(
      new THREE.PlaneGeometry(localWidth, localHeight),
      new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide })
    );
    bgBar.position.z = 0.005 / scale;
    hbGroup.add(bgBar);

    // Dynamic Fill Bar (Left-Anchored so it empties left-to-right)
    const fillWidth = localWidth - (0.04 / scale);
    const fillHeight = localHeight - (0.04 / scale);
    const fillGeom = new THREE.PlaneGeometry(fillWidth, fillHeight);
    fillGeom.translate(fillWidth / 2, 0, 0);

    const fillBar = new THREE.Mesh(
      fillGeom,
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })
    );
    fillBar.position.set(-fillWidth / 2, 0, 0.01 / scale);
    hbGroup.add(fillBar);

    // Visual Trait Badge
    const badgeGroup = new THREE.Group();
    badgeGroup.position.set(0, (localHeight / 2) + (0.24 / scale), 0.02 / scale);

    if (enemyType === 'scout') {
      // ⚡ Golden Diamond Runner Emblem
      const diamond = new THREE.Mesh(
        new THREE.ConeGeometry(0.18 / scale, 0.42 / scale, 4),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
      );
      diamond.rotation.z = Math.PI;
      badgeGroup.add(diamond);
    } else if (enemyType === 'warrior') {
      // 🛡️ Emerald Regeneration Cross
      const hBar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.40 / scale, 0.14 / scale),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      const vBar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14 / scale, 0.40 / scale),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      vBar.position.z = 0.002 / scale;
      badgeGroup.add(hBar);
      badgeGroup.add(vBar);
    } else if (enemyType === 'armored') {
      // 🧱 Amethyst Sturdy Shield
      const shield = new THREE.Mesh(
        new THREE.CircleGeometry(0.24 / scale, 6),
        new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide })
      );
      const shieldCore = new THREE.Mesh(
        new THREE.CircleGeometry(0.12 / scale, 6),
        new THREE.MeshBasicMaterial({ color: 0xe9d5ff, side: THREE.DoubleSide })
      );
      shieldCore.position.z = 0.002 / scale;
      badgeGroup.add(shield);
      badgeGroup.add(shieldCore);
    } else if (enemyType === 'toxic') {
      // 🧪 Neon Toxic Hazard Orb
      const orb = new THREE.Mesh(
        new THREE.CircleGeometry(0.18 / scale, 12),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })
      );
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.22 / scale, 0.28 / scale, 12),
        new THREE.MeshBasicMaterial({ color: 0x059669, side: THREE.DoubleSide })
      );
      ring.position.z = 0.002 / scale;
      badgeGroup.add(orb);
      badgeGroup.add(ring);
    } else if (enemyType === 'boss') {
      // 👑 Golden Boss Crown
      const crownBase = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55 / scale, 0.16 / scale),
        new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide })
      );
      const crownLeft = new THREE.Mesh(
        new THREE.ConeGeometry(0.12 / scale, 0.28 / scale, 3),
        new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide })
      );
      crownLeft.position.set(-0.2 / scale, 0.16 / scale, 0);
      const crownMid = new THREE.Mesh(
        new THREE.ConeGeometry(0.14 / scale, 0.38 / scale, 3),
        new THREE.MeshBasicMaterial({ color: 0xffe066, side: THREE.DoubleSide })
      );
      crownMid.position.set(0, 0.22 / scale, 0.002 / scale);
      const crownRight = new THREE.Mesh(
        new THREE.ConeGeometry(0.12 / scale, 0.28 / scale, 3),
        new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide })
      );
      crownRight.position.set(0.2 / scale, 0.16 / scale, 0);

      badgeGroup.add(crownBase);
      badgeGroup.add(crownLeft);
      badgeGroup.add(crownMid);
      badgeGroup.add(crownRight);
    }

    hbGroup.add(badgeGroup);
    group.add(hbGroup);

    return { mesh: group, mixer, healthBarFill: fillBar, healthBarGroup: hbGroup, axieSpriteMesh };
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

  public projectToScreen(worldPos: THREE.Vector3, heightOffset: number = 2.4): { x: number; y: number } {
    const screenPos = worldPos.clone();
    screenPos.y += heightOffset;
    screenPos.project(this.camera);

    return {
      x: (screenPos.x * 0.5 + 0.5) * window.innerWidth,
      y: (-(screenPos.y * 0.5) + 0.5) * window.innerHeight
    };
  }

  public showDamageNumber(worldPos: THREE.Vector3, amount: number, isCrit: boolean) {
    const { x, y } = this.projectToScreen(worldPos, 1.8);

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

  public createBloomHazardMesh(pos: THREE.Vector3, radius: number): THREE.Mesh {
    const group = new THREE.Group();
    const geom = new THREE.CircleGeometry(radius, 24);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(pos.x, 0.05, pos.z);

    // Decorative inner floral ring
    const ringGeom = new THREE.RingGeometry(radius * 0.5, radius * 0.85, 16);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = 0.01;
    mesh.add(ring);

    this.scene.add(mesh);
    return mesh;
  }

  public triggerTsunamiWave(pos: THREE.Vector3, radius: number) {
    const geom = new THREE.RingGeometry(0.5, radius, 32);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const wave = new THREE.Mesh(geom, mat);
    wave.position.set(pos.x, 0.15, pos.z);
    this.scene.add(wave);

    let t = 0;
    const interval = setInterval(() => {
      t += 0.08;
      wave.scale.set(1 + t * 1.2, 1 + t * 1.2, 1);
      mat.opacity = Math.max(0, 0.85 - t * 1.2);
      if (t >= 0.8) {
        clearInterval(interval);
        this.scene.remove(wave);
        geom.dispose();
        mat.dispose();
      }
    }, 16);
  }

  public triggerWhirlwindSlash(pos: THREE.Vector3, radius: number) {
    const geom = new THREE.RingGeometry(0.3, radius, 32);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const slash = new THREE.Mesh(geom, mat);
    slash.position.set(pos.x, 0.15, pos.z);
    this.scene.add(slash);

    let t = 0;
    const interval = setInterval(() => {
      t += 0.1;
      slash.scale.set(1 + t * 0.9, 1 + t * 0.9, 1);
      slash.rotation.y += 0.3;
      mat.opacity = Math.max(0, 0.9 - t * 1.4);
      if (t >= 0.7) {
        clearInterval(interval);
        this.scene.remove(slash);
        geom.dispose();
        mat.dispose();
      }
    }, 16);
  }

  public triggerDivineBeam(start: THREE.Vector3, end: THREE.Vector3) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();
    const geom = new THREE.CylinderGeometry(0.14, 0.14, length, 8);
    geom.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.95
    });
    const beam = new THREE.Mesh(geom, mat);
    beam.position.copy(start).addScaledVector(dir, 0.5);
    beam.lookAt(end);
    this.scene.add(beam);

    let t = 0;
    const interval = setInterval(() => {
      t += 0.12;
      mat.opacity = Math.max(0, 0.95 - t * 1.5);
      if (t >= 0.7) {
        clearInterval(interval);
        this.scene.remove(beam);
        geom.dispose();
        mat.dispose();
      }
    }, 16);
  }

  public triggerChainLightning(points: THREE.Vector3[]) {
    if (points.length < 2) return;
    const curveGeom = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3, transparent: true, opacity: 0.95 });
    const line = new THREE.Line(curveGeom, lineMat);
    this.scene.add(line);

    setTimeout(() => {
      this.scene.remove(line);
      curveGeom.dispose();
      lineMat.dispose();
    }, 180);
  }

  public generateRandomMap(archetypeIndex?: number): void {
    // 1. Pick an archetype and generate procedural path
    this.pathSystem.generateRandomPath(archetypeIndex);

    // 2. Reset grid and mark path cells (1 tile width)
    this.gridSystem.resetGrid();
    this.gridSystem.markOrthogonalPath(this.pathSystem.currentArchetype.gridTurns, 1);

    // 3. Move and orient portal to path entrance
    const startPos = this.pathSystem.getStartPosition();
    const initTangent = this.pathSystem.getInitialTangent();
    this.portalGroup.position.set(startPos.x, 0.18, startPos.z);
    this.portalGroup.rotation.y = Math.atan2(initTangent.x, initTangent.z);
    this.markAreaBlocked(startPos, 2.0);

    // 4. Move Ancient Tree to path exit
    const endPos = this.pathSystem.getEndPosition();
    this.treeGroup.position.set(endPos.x, 0.18, endPos.z);
    this.markAreaBlocked(endPos, 2.2);

    // 5. Spawn new procedural scenery/obstacles on grid
    this.spawnEnvironmentalObstacles();

    // 6. Build and add visual 3D tile board
    if (this.boardGroup) {
      this.scene.remove(this.boardGroup);
      this.boardGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
    }
    this.boardGroup = this.gridSystem.createBoardMesh();
    this.scene.add(this.boardGroup);

    // 7. Refresh visual path mesh in scene
    if (this.pathGroup) {
      this.scene.remove(this.pathGroup);
      this.pathGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
    }
    this.pathGroup = this.pathSystem.createVisualPath(this.camera);
    this.scene.add(this.pathGroup);
  }

  private markAreaBlocked(pos: THREE.Vector3, radius: number): void {
    const minGrid = this.gridSystem.worldToGrid(pos.x - radius, pos.z - radius);
    const maxGrid = this.gridSystem.worldToGrid(pos.x + radius, pos.z + radius);
    const r2 = radius * radius;
    const minC = minGrid ? minGrid.col : 0;
    const maxC = maxGrid ? maxGrid.col : this.gridSystem.cols - 1;
    const minR = minGrid ? minGrid.row : 0;
    const maxR = maxGrid ? maxGrid.row : this.gridSystem.rows - 1;
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (this.gridSystem.cells[r][c].type === CellType.PATH) continue;
        const w = this.gridSystem.gridToWorld(c, r);
        const dx = w.x - pos.x;
        const dz = w.z - pos.z;
        if (dx * dx + dz * dz <= r2) {
          this.gridSystem.markObstacleCell(c, r);
        }
      }
    }
  }

  private spawnEnvironmentalObstacles(): void {
    // Clear existing obstacles
    while (this.obstaclesGroup.children.length > 0) {
      const child = this.obstaclesGroup.children[0];
      this.obstaclesGroup.remove(child);
      child.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      });
    }
    this.obstacleColliders = [];

    const startPos = this.pathSystem.getStartPosition();
    const endPos = this.pathSystem.getEndPosition();
    const numObstacles = 7 + Math.floor(Math.random() * 4); // 7 to 10 obstacles
    const candidatePositions: THREE.Vector3[] = [];

    let attempts = 0;
    while (candidatePositions.length < numObstacles && attempts < 160) {
      attempts++;
      const c = 2 + Math.floor(Math.random() * (this.gridSystem.cols - 4));
      const r = 2 + Math.floor(Math.random() * (this.gridSystem.rows - 4));

      if (this.gridSystem.cells[r][c].type !== CellType.GRASS) continue;

      const cand = this.gridSystem.gridToWorld(c, r);

      // Safe clearance from path, portal, tree, and existing obstacles
      if (this.pathSystem.isNearPath(cand, 1.6)) continue;
      if (cand.distanceTo(startPos) < 3.8) continue;
      if (cand.distanceTo(endPos) < 3.8) continue;

      // Keep curve corners / strategic bend pockets completely free for 3x3 tower placement
      let nearTurn = false;
      if (this.pathSystem.currentArchetype && this.pathSystem.currentArchetype.gridTurns) {
        for (const turn of this.pathSystem.currentArchetype.gridTurns) {
          const turnWorld = this.gridSystem.gridToWorld(turn.col, turn.row);
          if (cand.distanceTo(turnWorld) < 4.2) {
            nearTurn = true;
            break;
          }
        }
      }
      if (nearTurn) continue;

      let tooClose = false;
      for (const other of candidatePositions) {
        if (cand.distanceTo(other) < 3.2) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      this.markAreaBlocked(cand, 0.9);
      candidatePositions.push(cand);
    }

    // Shared materials for environmental props
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      metalness: 0.1
    });
    const mossRockMat = new THREE.MeshStandardMaterial({
      color: 0x2e4a3e,
      roughness: 0.9,
      metalness: 0.05
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.8
    });
    const pineMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      roughness: 0.7
    });
    const pineAutumnMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.75
    });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.2
    });
    const mushroomStemMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5
    });
    const mushroomCapMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });

    for (let i = 0; i < candidatePositions.length; i++) {
      const pos = candidatePositions[i];
      const propGroup = new THREE.Group();
      propGroup.position.copy(pos);

      const propType = i % 5; // 0: Mossy Boulder, 1: Pine Tree, 2: Glowing Mushrooms, 3: Ancient Rune Shrine, 4: Autumn Foliage

      if (propType === 0) {
        // Ancient Mossy Slate Boulder
        const s = 0.85 + (i * 0.17) % 0.55;
        const geom = new THREE.DodecahedronGeometry(s, 0);
        const rock = new THREE.Mesh(geom, i % 2 === 0 ? mossRockMat : rockMat);
        rock.position.y = s * 0.7;
        rock.rotation.set((i * 1.3) % Math.PI, (i * 2.1) % Math.PI, (i * 0.7) % Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        propGroup.add(rock);
        this.obstacleColliders.push({ position: pos, radius: s * 1.1 });
      } else if (propType === 1) {
        // Mini Lunacia Pine Tree
        const trunkGeom = new THREE.CylinderGeometry(0.18, 0.28, 1.2, 6);
        const trunk = new THREE.Mesh(trunkGeom, woodMat);
        trunk.position.y = 0.6;
        trunk.castShadow = true;
        propGroup.add(trunk);

        const pineGeom = new THREE.ConeGeometry(0.95, 2.0, 7);
        const pine = new THREE.Mesh(pineGeom, pineMat);
        pine.position.y = 1.9;
        pine.castShadow = true;
        pine.receiveShadow = true;
        propGroup.add(pine);

        this.obstacleColliders.push({ position: pos, radius: 1.1 });
      } else if (propType === 2) {
        // Cluster of Glowing Mushrooms
        const stemGeom = new THREE.CylinderGeometry(0.1, 0.18, 0.7, 6);
        const capGeom = new THREE.SphereGeometry(0.42, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);

        const offsets = [
          { x: 0, z: 0, s: 1.0 },
          { x: 0.35, z: 0.25, s: 0.7 },
          { x: -0.3, z: 0.2, s: 0.55 }
        ];

        for (const off of offsets) {
          const stem = new THREE.Mesh(stemGeom, mushroomStemMat);
          stem.position.set(off.x, 0.35 * off.s, off.z);
          stem.scale.set(off.s, off.s, off.s);
          stem.castShadow = true;
          propGroup.add(stem);

          const cap = new THREE.Mesh(capGeom, mushroomCapMat);
          cap.position.set(off.x, 0.7 * off.s, off.z);
          cap.scale.set(off.s, off.s, off.s);
          cap.castShadow = true;
          propGroup.add(cap);
        }

        this.obstacleColliders.push({ position: pos, radius: 1.0 });
      } else if (propType === 3) {
        // Ancient Rune Monolith with glowing floating crystal
        const pedestalGeom = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        const pedestal = new THREE.Mesh(pedestalGeom, rockMat);
        pedestal.position.y = 0.3;
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        propGroup.add(pedestal);

        const crystalGeom = new THREE.OctahedronGeometry(0.4, 0);
        const crystal = new THREE.Mesh(crystalGeom, crystalMat);
        crystal.position.y = 1.1;
        crystal.rotation.y = Math.PI / 4;
        crystal.castShadow = true;
        propGroup.add(crystal);

        this.obstacleColliders.push({ position: pos, radius: 1.1 });
      } else {
        // Golden Autumn Tree
        const trunkGeom = new THREE.CylinderGeometry(0.16, 0.24, 1.0, 6);
        const trunk = new THREE.Mesh(trunkGeom, woodMat);
        trunk.position.y = 0.5;
        trunk.castShadow = true;
        propGroup.add(trunk);

        const foliageGeom = new THREE.DodecahedronGeometry(0.9, 1);
        const foliage = new THREE.Mesh(foliageGeom, pineAutumnMat);
        foliage.position.y = 1.7;
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        propGroup.add(foliage);

        this.obstacleColliders.push({ position: pos, radius: 1.1 });
      }

      this.obstaclesGroup.add(propGroup);
    }
  }

  public isNearObstacle(pos: THREE.Vector3, threshold: number = 1.3): boolean {
    for (const obs of this.obstacleColliders) {
      const dx = pos.x - obs.position.x;
      const dz = pos.z - obs.position.z;
      const maxD = obs.radius + threshold;
      if ((dx * dx + dz * dz) < (maxD * maxD)) {
        return true;
      }
    }
    return false;
  }

  public updateTitleCamera(delta: number) {
    if (!this.isTitleMode) return;

    this.titleAngle += delta * 0.15; // smooth orbit
    const radius = 33;
    const height = 23 + Math.sin(this.titleAngle * 0.5) * 3.5;
    this.camera.position.x = Math.sin(this.titleAngle) * radius;
    this.camera.position.z = Math.cos(this.titleAngle) * radius;
    this.camera.position.y = height;
    this.camera.lookAt(0, 2.5, 0);
  }

  public setGameCamera(smooth: boolean = true) {
    this.isTitleMode = false;
    if (!smooth) {
      this.isTransitioningCamera = false;
      this.camera.position.copy(this.defaultGameCamPos);
      this.camera.lookAt(this.defaultGameLookAt);
      return;
    }
    this.isTransitioningCamera = true;
    this.cameraTransitionProgress = 0;
    this.camStartPos.copy(this.camera.position);
  }

  public updateCameraTransition(delta: number) {
    if (!this.isTransitioningCamera) return;
    this.cameraTransitionProgress += delta * 1.6;
    if (this.cameraTransitionProgress >= 1) {
      this.cameraTransitionProgress = 1;
      this.isTransitioningCamera = false;
      this.camera.position.copy(this.defaultGameCamPos);
      this.camera.lookAt(this.defaultGameLookAt);
    } else {
      // Ease out cubic
      const t = 1 - Math.pow(1 - this.cameraTransitionProgress, 3);
      this.camera.position.lerpVectors(this.camStartPos, this.defaultGameCamPos, t);
      this.camera.lookAt(0, 2.5 * (1 - t), 0);
    }
  }

  public setTitleCamera() {
    this.isTitleMode = true;
    this.isTransitioningCamera = false;
  }

  public onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
