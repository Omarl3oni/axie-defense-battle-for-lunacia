import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Enemy } from './types';
import { sounds } from './audio';

export class EnemyManager {
  public enemies: Enemy[] = [];
  private scene: THREE.Scene;
  private nextEnemyId: number = 1;
  private spawnTimer: number = 0;
  private baseSpawnInterval: number = 1.0;
  private enemyTemplates: THREE.Group[] = [];
  private enemyClips: THREE.AnimationClip[][] = [];
  private isLoaded: boolean = true; // Immediately true thanks to procedural template
  private bossSpawned: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Immediately create procedural Lunacia Quimera template so enemies are ALWAYS visible from frame 1
    const fallback = this.createQuimeraTemplate();
    this.enemyTemplates.push(fallback);
    this.enemyClips.push([]);
  }

  private createQuimeraTemplate(): THREE.Group {
    const group = new THREE.Group();

    // Body (Round Purple/Magenta Beast)
    const bodyGeom = new THREE.SphereGeometry(0.8, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      roughness: 0.35,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Glowing Eyes
    const eyeGeom = new THREE.SphereGeometry(0.14, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0044,
      roughness: 0.1
    });

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(0.28, 0.95, 0.65);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-0.28, 0.95, 0.65);
    group.add(rightEye);

    // Horns / Spikes
    const hornGeom = new THREE.ConeGeometry(0.16, 0.5, 6);
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x3b0764,
      roughness: 0.6
    });

    const leftHorn = new THREE.Mesh(hornGeom, hornMat);
    leftHorn.position.set(0.35, 1.45, 0.1);
    leftHorn.rotation.z = -0.3;
    leftHorn.castShadow = true;
    group.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeom, hornMat);
    rightHorn.position.set(-0.35, 1.45, 0.1);
    rightHorn.rotation.z = 0.3;
    rightHorn.castShadow = true;
    group.add(rightHorn);

    return group;
  }

  public async preloadTemplates(): Promise<void> {
    const loader = new GLTFLoader();
    const urls = [
      './assets/sapidae/sapidae-f-a.glb',
      './assets/sapidae/sapidae-m-a.glb'
    ];

    for (const url of urls) {
      try {
        const gltf = await loader.loadAsync(url);
        const model = gltf.scene;
        model.scale.set(1.3, 1.3, 1.3);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const m = (child as THREE.Mesh).material;
            if (m) {
              (m as THREE.Material).needsUpdate = true;
            }
          }
        });

        // Add 3D Sapidae to pool
        this.enemyTemplates.push(model);
        this.enemyClips.push(gltf.animations);
      } catch (e) {
        console.warn('Could not load sapidae GLB:', url, e);
      }
    }
  }

  public spawnInitialWave(playerPos: THREE.Vector3, count: number = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
      const dist = 9 + Math.random() * 3; // Immediately visible within camera frustum!
      const x = playerPos.x + Math.cos(angle) * dist;
      const z = playerPos.z + Math.sin(angle) * dist;
      this.createEnemyAt(x, z, 0);
    }
  }

  public update(
    delta: number,
    gameTime: number,
    playerPos: THREE.Vector3,
    onEnemyDefeated: (pos: THREE.Vector3, expValue: number) => void,
    onPlayerHit: (damage: number) => void
  ) {
    if (!this.isLoaded || this.enemyTemplates.length === 0) return;

    // Scale spawn rate over time
    const currentInterval = Math.max(0.2, this.baseSpawnInterval - (gameTime / 180));
    this.spawnTimer += delta;

    if (this.spawnTimer >= currentInterval && this.enemies.length < 160) {
      this.spawnTimer = 0;
      this.spawnContinuousEnemy(playerPos, gameTime);
    }

    // Spawn Boss at 240 seconds (4 minutes)
    if (gameTime >= 240 && !this.bossSpawned) {
      this.spawnBoss(playerPos);
      this.bossSpawned = true;
    }

    // Update each enemy
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const mesh = enemy.mesh;

      // Move toward player
      const dirX = playerPos.x - mesh.position.x;
      const dirZ = playerPos.z - mesh.position.z;
      const dist = Math.hypot(dirX, dirZ);

      if (dist > 0.05) {
        mesh.position.x += (dirX / dist) * enemy.speed * delta;
        mesh.position.z += (dirZ / dist) * enemy.speed * delta;
        mesh.rotation.y = Math.atan2(dirX, dirZ);
      }

      // Procedural bobbing if no animation mixer
      if (enemy.mixer) {
        enemy.mixer.update(delta);
      } else {
        mesh.position.y = Math.sin(gameTime * 6 + enemy.id) * 0.12;
      }

      // Check collision with player
      if (dist < enemy.radius + 0.8) {
        onPlayerHit(enemy.damage);
      }

      // Check death
      if (enemy.hp <= 0) {
        sounds.playHit();
        onEnemyDefeated(mesh.position.clone(), enemy.expValue);
        this.scene.remove(mesh);
        this.enemies.splice(i, 1);
      }
    }
  }

  private spawnContinuousEnemy(playerPos: THREE.Vector3, gameTime: number) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 11 + Math.random() * 4; // Spawns right at outer view rim
    const x = playerPos.x + Math.cos(angle) * distance;
    const z = playerPos.z + Math.sin(angle) * distance;
    this.createEnemyAt(x, z, gameTime);
  }

  private createEnemyAt(x: number, z: number, gameTime: number) {
    // Pick template (if GLB sapidae is loaded, prefer it 70% of time)
    let templateIndex = 0;
    if (this.enemyTemplates.length > 1) {
      templateIndex = Math.random() < 0.75
        ? Math.floor(1 + Math.random() * (this.enemyTemplates.length - 1))
        : 0;
    }

    const template = this.enemyTemplates[templateIndex];

    // Use SkeletonUtils.clone to properly duplicate rigged/skinned meshes
    const clone = (SkeletonUtils.clone(template) as THREE.Group);
    clone.position.set(x, 0, z);

    // Ground Target Indicator (Glowing ring on floor)
    const ringGeom = new THREE.RingGeometry(0.55, 0.75, 16);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = 0.04;
    clone.add(ring);

    this.scene.add(clone);

    let mixer: THREE.AnimationMixer | undefined;
    const clips = this.enemyClips[templateIndex];
    if (clips && clips.length > 0) {
      mixer = new THREE.AnimationMixer(clone);
      const runClip = clips.find(c => /run|walk/i.test(c.name)) ?? clips[0];
      if (runClip) {
        mixer.clipAction(runClip).play();
      }
    }

    const hpScale = 1 + (gameTime / 60) * 0.8;
    const baseHp = 18 * hpScale;

    const enemy: Enemy = {
      id: this.nextEnemyId++,
      mesh: clone,
      mixer,
      type: templateIndex === 0 ? 'quimera' : 'sapidae',
      hp: baseHp,
      maxHp: baseHp,
      speed: 3.2 + Math.random() * 1.0,
      damage: 10 + Math.floor(gameTime / 60) * 3,
      expValue: 1 + Math.floor(gameTime / 120),
      isBoss: false,
      radius: 0.8
    };

    this.enemies.push(enemy);
  }

  public spawnBoss(playerPos: THREE.Vector3) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 14;
    const x = playerPos.x + Math.cos(angle) * distance;
    const z = playerPos.z + Math.sin(angle) * distance;

    const template = this.enemyTemplates[this.enemyTemplates.length - 1];
    const bossMesh = (SkeletonUtils.clone(template) as THREE.Group);
    bossMesh.scale.set(3.2, 3.2, 3.2);
    bossMesh.position.set(x, 0, z);

    // Glowing Boss Aura
    bossMesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const m = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const clonedMat = m.clone() as THREE.MeshStandardMaterial;
          clonedMat.color.setHex(0xff1144);
          mesh.material = clonedMat;
        }
      }
    });

    this.scene.add(bossMesh);

    let mixer: THREE.AnimationMixer | undefined;
    const clips = this.enemyClips[this.enemyTemplates.length - 1];
    if (clips && clips.length > 0) {
      mixer = new THREE.AnimationMixer(bossMesh);
      const runClip = clips.find(c => /run|walk/i.test(c.name)) ?? clips[0];
      if (runClip) {
        mixer.clipAction(runClip).play();
      }
    }

    const boss: Enemy = {
      id: this.nextEnemyId++,
      mesh: bossMesh,
      mixer,
      type: 'chimera_boss',
      hp: 1200,
      maxHp: 1200,
      speed: 2.8,
      damage: 28,
      expValue: 50,
      isBoss: true,
      radius: 2.4
    };

    this.enemies.push(boss);

    const warning = document.querySelector('#boss-warning');
    if (warning) {
      warning.classList.remove('hidden');
      setTimeout(() => warning.classList.add('hidden'), 5000);
    }
  }

  public clearAll() {
    for (const enemy of this.enemies) {
      this.scene.remove(enemy.mesh);
    }
    this.enemies = [];
    this.bossSpawned = false;
  }
}
