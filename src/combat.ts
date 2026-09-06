import * as THREE from 'three';
import { Projectile, OrbitingShield, ExpGem, Enemy, PlayerStats } from './types';
import { sounds } from './audio';

export class CombatManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private container: HTMLElement;

  public projectiles: Projectile[] = [];
  public shields: OrbitingShield[] = [];
  public gems: ExpGem[] = [];

  private nextProjId: number = 1;
  private nextGemId: number = 1;

  // Weapon Timers
  private hornTimer: number = 0;
  private tailTimer: number = 0;
  private mouthTimer: number = 0;

  // Shield group attached to scene
  private shieldGroup: THREE.Group = new THREE.Group();

  constructor(scene: THREE.Scene, camera: THREE.Camera, container: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.container = container;
    this.scene.add(this.shieldGroup);
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerAngle: number,
    playerStats: PlayerStats,
    upgrades: Map<string, number>,
    enemies: Enemy[],
    onGemCollect: (val: number) => void
  ) {
    // 1. Update Horn Projectiles (Pocky)
    const hornLvl = upgrades.get('horn_pocky') ?? 0;
    if (hornLvl > 0) {
      this.hornTimer += delta;
      const cooldown = Math.max(0.35, 1.1 - hornLvl * 0.15);
      if (this.hornTimer >= cooldown) {
        this.hornTimer = 0;
        this.fireHornSpikes(playerPos, hornLvl, playerStats, enemies);
      }
    }

    // 2. Update Orbiting Pumpkin Shields
    const backLvl = upgrades.get('back_pumpkin') ?? 0;
    this.updateShields(delta, playerPos, backLvl, playerStats, enemies);

    // 3. Update Tail Carrot Rockets
    const tailLvl = upgrades.get('tail_carrot') ?? 0;
    if (tailLvl > 0) {
      this.tailTimer += delta;
      const cooldown = Math.max(1.0, 2.5 - tailLvl * 0.3);
      if (this.tailTimer >= cooldown) {
        this.tailTimer = 0;
        this.fireCarrotRocket(playerPos, tailLvl, playerStats, enemies);
      }
    }

    // 4. Update Mouth Chomp
    const mouthLvl = upgrades.get('mouth_chomper') ?? 0;
    if (mouthLvl > 0) {
      this.mouthTimer += delta;
      const cooldown = Math.max(0.6, 1.8 - mouthLvl * 0.25);
      if (this.mouthTimer >= cooldown) {
        this.mouthTimer = 0;
        this.executeMouthChomp(playerPos, playerAngle, mouthLvl, playerStats, enemies);
      }
    }

    // Update active projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Check collision with enemies
      for (const enemy of enemies) {
        if (p.hitEnemies.has(enemy.id)) continue;

        const dist = Math.hypot(
          enemy.mesh.position.x - p.mesh.position.x,
          enemy.mesh.position.z - p.mesh.position.z
        );
        if (dist < enemy.radius + 0.7) {
          p.hitEnemies.add(enemy.id);
          enemy.hp -= p.damage;
          this.showDamageNumber(enemy.mesh.position, p.damage, p.isCrit);
          sounds.playHit();

          p.pierce--;
          if (p.pierce <= 0) break;
        }
      }

      if (p.lifetime <= 0 || p.pierce <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // Update EXP Gems & Magnet
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];
      const dist = gem.mesh.position.distanceTo(playerPos);

      // Collect
      if (dist < 0.9) {
        onGemCollect(gem.value);
        this.scene.remove(gem.mesh);
        this.gems.splice(i, 1);
        continue;
      }

      // Magnet pull towards player
      if (dist < playerStats.pickupRadius) {
        const pullSpeed = 12 * (1 - dist / playerStats.pickupRadius) + 4;
        const dir = new THREE.Vector3().subVectors(playerPos, gem.mesh.position).normalize();
        gem.mesh.position.addScaledVector(dir, pullSpeed * delta);
      }

      // Gentle floating animation
      gem.mesh.rotation.y += delta * 3;
    }
  }

  private fireHornSpikes(playerPos: THREE.Vector3, level: number, stats: PlayerStats, enemies: Enemy[]) {
    if (enemies.length === 0) return;

    // Find closest enemies
    const sorted = [...enemies].sort((a, b) =>
      a.mesh.position.distanceTo(playerPos) - b.mesh.position.distanceTo(playerPos)
    );

    const projectileCount = Math.min(level + 1, 4);
    const targets = sorted.slice(0, projectileCount);

    sounds.playShoot();

    for (let i = 0; i < projectileCount; i++) {
      const target = targets[i % targets.length];
      const dir = new THREE.Vector3().subVectors(target.mesh.position, playerPos);
      dir.y = 0;
      dir.normalize();

      // Add slight spread if targeting same enemy
      if (i > 0) {
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - 0.5) * 0.25);
      }

      const geom = new THREE.CylinderGeometry(0.08, 0.14, 0.9, 6);
      geom.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0088cc,
        roughness: 0.2
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(playerPos);
      mesh.position.y = 0.8;
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

      this.scene.add(mesh);

      const isCrit = Math.random() < stats.critRate;
      const baseDmg = 16 + level * 6;
      const finalDmg = Math.round(isCrit ? baseDmg * stats.critDamage : baseDmg);

      this.projectiles.push({
        id: this.nextProjId++,
        mesh,
        velocity: dir.multiplyScalar(22),
        lifetime: 2.2,
        damage: finalDmg,
        isCrit,
        pierce: 1 + Math.floor(level / 2),
        hitEnemies: new Set()
      });
    }
  }

  private updateShields(delta: number, playerPos: THREE.Vector3, level: number, stats: PlayerStats, enemies: Enemy[]) {
    if (level === 0) {
      if (this.shields.length > 0) {
        this.shieldGroup.clear();
        this.shields = [];
      }
      return;
    }

    const desiredShields = Math.min(level + 1, 5);
    while (this.shields.length < desiredShields) {
      const geom = new THREE.SphereGeometry(0.4, 12, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffb703,
        emissive: 0xff8800,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(geom, mat);
      this.shieldGroup.add(mesh);

      this.shields.push({
        mesh,
        angle: (this.shields.length * Math.PI * 2) / desiredShields,
        distance: 2.2,
        damage: 14 + level * 5
      });
    }

    this.shieldGroup.position.copy(playerPos);
    this.shieldGroup.position.y = 0.8;

    for (const shield of this.shields) {
      shield.angle += delta * 2.8;
      shield.mesh.position.set(
        Math.cos(shield.angle) * shield.distance,
        0,
        Math.sin(shield.angle) * shield.distance
      );

      // Check collision with enemies
      const worldPos = new THREE.Vector3();
      shield.mesh.getWorldPosition(worldPos);

      for (const enemy of enemies) {
        const dist = Math.hypot(
          enemy.mesh.position.x - worldPos.x,
          enemy.mesh.position.z - worldPos.z
        );
        if (dist < enemy.radius + 0.8) {
          const isCrit = Math.random() < stats.critRate;
          const dmg = Math.round(isCrit ? shield.damage * stats.critDamage : shield.damage);
          enemy.hp -= dmg * delta * 2; // Continuous ticking damage
          this.showDamageNumber(enemy.mesh.position, Math.round(dmg * delta * 2), isCrit);
        }
      }
    }
  }

  private fireCarrotRocket(playerPos: THREE.Vector3, level: number, stats: PlayerStats, enemies: Enemy[]) {
    if (enemies.length === 0) return;

    // Pick a random enemy in distant crowd
    const target = enemies[Math.floor(Math.random() * enemies.length)];
    const dir = new THREE.Vector3().subVectors(target.mesh.position, playerPos).normalize();

    const geom = new THREE.ConeGeometry(0.2, 0.8, 8);
    geom.rotateX(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xfb8500,
      emissive: 0xd9480f,
      roughness: 0.3
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(playerPos);
    mesh.position.y = 1.0;
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

    this.scene.add(mesh);

    const isCrit = Math.random() < stats.critRate;
    const baseDmg = 35 + level * 14;
    const dmg = Math.round(isCrit ? baseDmg * stats.critDamage : baseDmg);

    this.projectiles.push({
      id: this.nextProjId++,
      mesh,
      velocity: dir.multiplyScalar(16),
      lifetime: 3.0,
      damage: dmg,
      isCrit,
      pierce: 3 + level,
      hitEnemies: new Set()
    });
  }

  private executeMouthChomp(
    playerPos: THREE.Vector3,
    playerAngle: number,
    level: number,
    stats: PlayerStats,
    enemies: Enemy[]
  ) {
    // Frontal cleave in forward direction
    const forward = new THREE.Vector3(Math.sin(playerAngle), 0, Math.cos(playerAngle));
    const range = 3.5 + level * 0.4;
    const halfFov = Math.PI / 3; // 60 degrees arc

    let hitAny = false;
    for (const enemy of enemies) {
      const toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, playerPos);
      const dist = toEnemy.length();

      if (dist <= range) {
        toEnemy.normalize();
        const angleDiff = forward.angleTo(toEnemy);
        if (angleDiff <= halfFov) {
          const isCrit = Math.random() < (stats.critRate + 0.2); // Mouth has higher crit!
          const baseDmg = 45 + level * 18;
          const dmg = Math.round(isCrit ? baseDmg * stats.critDamage : baseDmg);
          enemy.hp -= dmg;
          this.showDamageNumber(enemy.mesh.position, dmg, isCrit);
          hitAny = true;
        }
      }
    }

    if (hitAny) {
      sounds.playHit();
    }
  }

  public spawnGem(position: THREE.Vector3, value: number) {
    const geom = new THREE.OctahedronGeometry(0.28);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00b4d8,
      roughness: 0.1,
      metalness: 0.8
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(position);
    mesh.position.y = 0.4;
    this.scene.add(mesh);

    this.gems.push({
      id: this.nextGemId++,
      mesh,
      value
    });
  }

  public showDamageNumber(worldPos: THREE.Vector3, amount: number, isCrit: boolean) {
    if (amount <= 0) return;

    // Convert 3D position to 2D screen coordinates
    const screenPos = worldPos.clone();
    screenPos.y += 1.2;
    screenPos.project(this.camera);

    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = `damage-number ${isCrit ? 'crit' : ''}`;
    el.textContent = `${amount}${isCrit ? '!' : ''}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    this.container.appendChild(el);
    setTimeout(() => el.remove(), 750);
  }

  public clearAll() {
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    for (const g of this.gems) this.scene.remove(g.mesh);
    this.shieldGroup.clear();
    this.projectiles = [];
    this.shields = [];
    this.gems = [];
    this.hornTimer = 0;
    this.tailTimer = 0;
    this.mouthTimer = 0;
  }
}
