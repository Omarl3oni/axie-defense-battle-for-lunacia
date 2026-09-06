import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CharacterType, PlayerStats } from './types';
import { sounds } from './audio';

export class Player {
  public mesh: THREE.Group = new THREE.Group();
  public stats: PlayerStats;
  public characterType: CharacterType;
  public isInvulnerable: boolean = false;
  private invulnTimer: number = 0;
  private readonly invulnDuration: number = 0.5;

  private mixer?: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentAction?: THREE.AnimationAction;
  private isMoving: boolean = false;
  public facingAngle: number = 0;

  constructor(charType: CharacterType) {
    this.characterType = charType;
    if (charType === 'pomodoro') {
      this.stats = {
        hp: 130,
        maxHp: 130,
        speed: 7.2,
        critRate: 0.08,
        critDamage: 1.5,
        defense: 2,
        pickupRadius: 3.5,
        exp: 0,
        nextLevelExp: 10,
        level: 1
      };
    } else {
      // Kotaro
      this.stats = {
        hp: 100,
        maxHp: 100,
        speed: 8.8,
        critRate: 0.22,
        critDamage: 1.8,
        defense: 0,
        pickupRadius: 3.0,
        exp: 0,
        nextLevelExp: 10,
        level: 1
      };
    }
  }

  public async loadModel(scene: THREE.Scene): Promise<void> {
    const loader = new GLTFLoader();
    const modelPath = `./assets/mascots/${this.characterType}.glb`;

    try {
      const gltf = await loader.loadAsync(modelPath);
      const model = gltf.scene;

      // Adjust scale and center
      model.scale.set(1.5, 1.5, 1.5);
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.mesh.add(model);
      scene.add(this.mesh);

      // Setup animations
      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);
        for (const clip of gltf.animations) {
          const action = this.mixer.clipAction(clip);
          this.actions.set(clip.name.toLowerCase(), action);
        }

        this.playAnimation('idle');
      }
    } catch (err) {
      console.error(`Failed to load ${this.characterType} GLB:`, err);
      // Fallback procedural geometry if GLB fails
      const geom = new THREE.SphereGeometry(0.8, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: this.characterType === 'pomodoro' ? 0x22c55e : 0xf43f5e,
        roughness: 0.4
      });
      const sphere = new THREE.Mesh(geom, mat);
      sphere.position.y = 0.8;
      this.mesh.add(sphere);
      scene.add(this.mesh);
    }
  }

  public playAnimation(name: string) {
    if (!this.mixer) return;
    const lower = name.toLowerCase();
    let action = this.actions.get(lower);

    // Look for fallback like sword.run or hammer.run
    if (!action) {
      for (const [k, v] of this.actions.entries()) {
        if (k.includes(lower)) {
          action = v;
          break;
        }
      }
    }

    if (!action || action === this.currentAction) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(0.12);
    }
    action.reset().fadeIn(0.12).play();
    this.currentAction = action;
  }

  public update(delta: number, inputX: number, inputZ: number, arenaRadius: number) {
    // Movement logic
    const len = Math.hypot(inputX, inputZ);
    if (len > 0.05) {
      const normX = inputX / len;
      const normZ = inputZ / len;

      this.mesh.position.x += normX * this.stats.speed * delta;
      this.mesh.position.z += normZ * this.stats.speed * delta;

      // Keep within arena boundary
      const distFromCenter = Math.hypot(this.mesh.position.x, this.mesh.position.z);
      if (distFromCenter > arenaRadius) {
        const angle = Math.atan2(this.mesh.position.z, this.mesh.position.x);
        this.mesh.position.x = Math.cos(angle) * arenaRadius;
        this.mesh.position.z = Math.sin(angle) * arenaRadius;
      }

      // Smooth rotation towards movement direction
      const targetAngle = Math.atan2(normX, normZ);
      this.facingAngle = targetAngle;
      this.mesh.rotation.y = targetAngle;

      if (!this.isMoving) {
        this.isMoving = true;
        this.playAnimation('run');
      }
    } else {
      if (this.isMoving) {
        this.isMoving = false;
        this.playAnimation('idle');
      }
    }

    // Invulnerability cooldown
    if (this.isInvulnerable) {
      this.invulnTimer -= delta;
      // Flash effect
      this.mesh.visible = Math.floor(this.invulnTimer * 15) % 2 === 0;
      if (this.invulnTimer <= 0) {
        this.isInvulnerable = false;
        this.mesh.visible = true;
      }
    }

    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || this.stats.hp <= 0) return false;

    const actualDmg = Math.max(1, amount - this.stats.defense);
    this.stats.hp = Math.max(0, this.stats.hp - actualDmg);
    this.isInvulnerable = true;
    this.invulnTimer = this.invulnDuration;

    sounds.playPlayerHurt();
    return this.stats.hp <= 0;
  }

  public addExp(amount: number): boolean {
    this.stats.exp += amount;
    sounds.playGem();
    if (this.stats.exp >= this.stats.nextLevelExp) {
      this.stats.exp -= this.stats.nextLevelExp;
      this.stats.level++;
      this.stats.nextLevelExp = Math.floor(this.stats.nextLevelExp * 1.35 + 5);
      sounds.playLevelUp();
      return true; // Leveled up!
    }
    return false;
  }
}
