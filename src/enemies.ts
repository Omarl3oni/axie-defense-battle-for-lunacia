import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Enemy } from './types';
import { sounds } from './audio';

export class EnemyManager {
  public enemies: Enemy[] = [];
  private scene: THREE.Scene;
  private nextEnemyId: number = 1;
  private spawnTimer: number = 0;
  private baseSpawnInterval: number = 1.2;
  private enemyTemplates: THREE.Group[] = [];
  private enemyClips: THREE.AnimationClip[][] = [];
  private isLoaded: boolean = false;
  private bossSpawned: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public async preloadTemplates(): Promise<void> {
    const loader = new GLTFLoader();
    const variants = [
      './assets/sapidae/sapidae-f-a.glb',
      './assets/sapidae/sapidae-m-a.glb',
      './assets/sapidae/sapidae-f-b.glb'
    ];

    for (const url of variants) {
      try {
        const gltf = await loader.loadAsync(url);
        const model = gltf.scene;
        model.scale.set(1.1, 1.1, 1.1);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
          }
        });
        this.enemyTemplates.push(model);
        this.enemyClips.push(gltf.animations);
      } catch (e) {
        console.warn('Could not load enemy GLB template:', url, e);
      }
    }

    // Fallback template if none loaded
    if (this.enemyTemplates.length === 0) {
      const g = new THREE.ConeGeometry(0.7, 1.4, 8);
      const m = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.5 });
      const fallback = new THREE.Group();
      fallback.add(new THREE.Mesh(g, m));
      this.enemyTemplates.push(fallback);
      this.enemyClips.push([]);
    }

    this.isLoaded = true;
  }

  public update(
    delta: number,
    gameTime: number,
    playerPos: THREE.Vector3,
    onEnemyDefeated: (pos: THREE.Vector3, expValue: number) => void,
    onPlayerHit: (damage: number) => void
  ) {
    if (!this.isLoaded) return;

    // Scale spawn rate over time (more enemies as time goes on)
    const currentInterval = Math.max(0.25, this.baseSpawnInterval - (gameTime / 180));
    this.spawnTimer += delta;

    if (this.spawnTimer >= currentInterval && this.enemies.length < 150) {
      this.spawnTimer = 0;
      this.spawnEnemy(playerPos, gameTime);
    }

    // Spawn Boss at 240 seconds (4 minutes) or if gameTime reaches threshold
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

      if (dist > 0.1) {
        mesh.position.x += (dirX / dist) * enemy.speed * delta;
        mesh.position.z += (dirZ / dist) * enemy.speed * delta;
        mesh.rotation.y = Math.atan2(dirX, dirZ);
      }

      if (enemy.mixer) {
        enemy.mixer.update(delta);
      }

      // Check collision with player
      if (dist < enemy.radius + 0.75) {
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

  private spawnEnemy(playerPos: THREE.Vector3, gameTime: number) {
    // Spawn in a circle outside camera view
    const angle = Math.random() * Math.PI * 2;
    const distance = 16 + Math.random() * 6;
    const x = playerPos.x + Math.cos(angle) * distance;
    const z = playerPos.z + Math.sin(angle) * distance;

    const templateIndex = Math.floor(Math.random() * this.enemyTemplates.length);
    const template = this.enemyTemplates[templateIndex];
    const clone = template.clone(true);

    clone.position.set(x, 0, z);
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

    // Scale enemy stats based on elapsed time
    const hpScale = 1 + (gameTime / 60) * 0.8;
    const baseHp = 18 * hpScale;

    const enemy: Enemy = {
      id: this.nextEnemyId++,
      mesh: clone,
      mixer,
      type: 'sapidae',
      hp: baseHp,
      maxHp: baseHp,
      speed: 3.2 + Math.random() * 1.2,
      damage: 10 + Math.floor(gameTime / 60) * 3,
      expValue: 1 + Math.floor(gameTime / 120),
      isBoss: false,
      radius: 0.8
    };

    this.enemies.push(enemy);
  }

  public spawnBoss(playerPos: THREE.Vector3) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 18;
    const x = playerPos.x + Math.cos(angle) * distance;
    const z = playerPos.z + Math.sin(angle) * distance;

    const template = this.enemyTemplates[0];
    const bossMesh = template.clone(true);
    bossMesh.scale.set(3.2, 3.2, 3.2); // Huge boss!
    bossMesh.position.set(x, 0, z);

    // Give boss a distinctive red glow
    bossMesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(m => m.clone());
          mesh.material.forEach(m => (m as THREE.MeshStandardMaterial).color.setHex(0xff3366));
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
          (mesh.material as THREE.MeshStandardMaterial).color.setHex(0xff3366);
        }
      }
    });

    this.scene.add(bossMesh);

    let mixer: THREE.AnimationMixer | undefined;
    const clips = this.enemyClips[0];
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

    // Show Warning Banner
    const warning = document.querySelector('#boss-warning');
    if (warning) {
      warning.classList.remove('hidden');
      setTimeout(() => warning.classList.add('hidden'), 5000);
    }
  }

  public damageEnemy(enemyId: number, amount: number): number {
    const enemy = this.enemies.find(e => e.id === enemyId);
    if (!enemy) return 0;

    enemy.hp -= amount;
    return enemy.hp;
  }

  public clearAll() {
    for (const enemy of this.enemies) {
      this.scene.remove(enemy.mesh);
    }
    this.enemies = [];
    this.bossSpawned = false;
  }
}
