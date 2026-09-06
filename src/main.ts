import * as THREE from 'three';
import { Arena3D } from './arena-3d';
import {
  TowerType,
  TowerInstance,
  TDEnemy,
  TDProjectile,
  TowerSpot,
  EnemyType
} from './tower-defense-types';
import {
  TOWER_CONFIGS,
  ENEMY_CONFIGS,
  TD_WAVES
} from './tower-defense-data';
import { sounds } from './audio';

class TowerDefenseGame {
  private arena: Arena3D;
  private lastTime: number = performance.now();

  // Core Game State
  private lives: number = 20;
  private slp: number = 300; // Starting SLP for initial towers
  private currentWaveIndex: number = 0;
  private isWaveRunning: boolean = false;
  private gameSpeed: number = 1.0;

  // Active Spell State
  private spellCooldown: number = 0;
  private readonly spellMaxCooldown: number = 25.0;
  private isSpellAiming: boolean = false;

  // Selections
  private selectedBuildType: TowerType | null = null;
  private inspectedTower: TowerInstance | null = null;

  // Entities
  private towers: TowerInstance[] = [];
  private enemies: TDEnemy[] = [];
  private projectiles: TDProjectile[] = [];
  private nextEnemyId: number = 1;
  private nextProjId: number = 1;

  // Wave Spawning Queue
  private waveQueue: { enemyType: EnemyType; spawnTime: number }[] = [];
  private waveTimer: number = 0;

  // Raycaster & Mouse
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  // UI Element References
  private waveDisplay = document.querySelector('#wave-display') as HTMLElement;
  private livesDisplay = document.querySelector('#lives-display') as HTMLElement;
  private slpDisplay = document.querySelector('#slp-display') as HTMLElement;
  private speedBtn = document.querySelector('#speed-btn') as HTMLElement;
  private startWaveBtn = document.querySelector('#start-wave-btn') as HTMLButtonElement;
  private spellBtn = document.querySelector('#spell-btn') as HTMLElement;
  private spellCooldownOverlay = document.querySelector('#spell-cooldown-overlay') as HTMLElement;

  private inspectorModal = document.querySelector('#inspector-modal') as HTMLElement;
  private inspectAvatar = document.querySelector('#inspect-avatar') as HTMLElement;
  private inspectName = document.querySelector('#inspect-name') as HTMLElement;
  private inspectLevelTag = document.querySelector('#inspect-level-tag') as HTMLElement;
  private inspectDmg = document.querySelector('#inspect-dmg') as HTMLElement;
  private inspectRange = document.querySelector('#inspect-range') as HTMLElement;
  private inspectSpeed = document.querySelector('#inspect-speed') as HTMLElement;
  private inspectTrait = document.querySelector('#inspect-trait') as HTMLElement;
  private upgradeTowerBtn = document.querySelector('#upgrade-tower-btn') as HTMLButtonElement;
  private upgradeCostText = document.querySelector('#upgrade-cost-text') as HTMLElement;
  private sellTowerBtn = document.querySelector('#sell-tower-btn') as HTMLButtonElement;
  private sellRefundText = document.querySelector('#sell-refund-text') as HTMLElement;
  private closeInspectorBtn = document.querySelector('#close-inspector-btn') as HTMLElement;

  private startScreen = document.querySelector('#start-screen') as HTMLElement;
  private resultScreen = document.querySelector('#result-screen') as HTMLElement;
  private resultBadge = document.querySelector('#result-badge') as HTMLElement;
  private resultTitle = document.querySelector('#result-title') as HTMLElement;
  private resultSubtitle = document.querySelector('#result-subtitle') as HTMLElement;
  private finalWave = document.querySelector('#final-wave') as HTMLElement;
  private finalLives = document.querySelector('#final-lives') as HTMLElement;

  constructor() {
    const canvasWrap = document.querySelector('#canvas-wrap') as HTMLElement;
    this.arena = new Arena3D(canvasWrap);

    this.setupUIEvents();
    this.initPreload();

    // Start 3D Game Loop
    this.arena.renderer.setAnimationLoop(() => this.loop());
  }

  private async initPreload() {
    const models = [
      'pomodoro.glb',
      'kotaro.glb',
      'bing.glb',
      'tripp.glb',
      'sapidae-f-a.glb',
      'sapidae-m-a.glb',
      'sapidae-m-e.glb',
      'sapidae-f-b.glb'
    ];
    await this.arena.preloadModels(models);
  }

  private setupUIEvents() {
    // Start Welcome Button
    const startPlayBtn = document.querySelector('#start-play-btn') as HTMLElement;
    startPlayBtn.addEventListener('click', () => {
      this.startScreen.classList.add('hidden');
      this.resetGame();
    });

    // Restart Game Button
    const restartBtn = document.querySelector('#restart-game-btn') as HTMLElement;
    restartBtn.addEventListener('click', () => {
      this.resultScreen.classList.add('hidden');
      this.resetGame();
    });

    // Speed Toggle Button
    this.speedBtn.addEventListener('click', () => {
      this.gameSpeed = this.gameSpeed === 1.0 ? 2.0 : 1.0;
      this.speedBtn.textContent = `⏩ x${this.gameSpeed}`;
      sounds.playGem();
    });

    // Start Wave Button
    this.startWaveBtn.addEventListener('click', () => {
      if (this.isWaveRunning) return;
      this.startWave();
    });

    // Spell Button (Emergency Meteor / Thorn Bomb)
    this.spellBtn.addEventListener('click', () => {
      if (this.spellCooldown > 0) return;
      this.isSpellAiming = !this.isSpellAiming;
      this.spellBtn.style.borderColor = this.isSpellAiming ? 'var(--accent-aqua)' : 'var(--accent-gold)';
      sounds.playShoot();
    });

    // Bottom Tower Cards Click (Select Tower Type to place)
    const towerCards = document.querySelectorAll('.tower-card');
    towerCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = card.getAttribute('data-tower') as TowerType;

        if (this.selectedBuildType === type) {
          // Deselect
          this.selectedBuildType = null;
          card.classList.remove('selected');
        } else {
          towerCards.forEach(c => c.classList.remove('selected'));
          this.selectedBuildType = type;
          card.classList.add('selected');
          sounds.playHit();
        }

        this.closeInspector();
      });
    });

    // Inspector Action Buttons
    this.closeInspectorBtn.addEventListener('click', () => this.closeInspector());
    this.upgradeTowerBtn.addEventListener('click', () => this.upgradeSelectedTower());
    this.sellTowerBtn.addEventListener('click', () => this.sellSelectedTower());

    // Canvas 3D Click Handling
    window.addEventListener('click', (e) => this.onCanvasClick(e));
  }

  private resetGame() {
    this.lives = 20;
    this.slp = 300;
    this.currentWaveIndex = 0;
    this.isWaveRunning = false;
    this.gameSpeed = 1.0;
    this.spellCooldown = 0;
    this.isSpellAiming = false;
    this.selectedBuildType = null;
    this.closeInspector();

    // Clear Entities
    for (const t of this.towers) this.arena.scene.remove(t.mesh);
    for (const e of this.enemies) this.arena.scene.remove(e.mesh);
    for (const p of this.projectiles) this.arena.scene.remove(p.mesh);

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.waveQueue = [];

    // Reset Spots
    this.arena.towerSpots.forEach(s => {
      s.occupiedBy = null;
      (s.ringMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
    });

    this.updateHUD();
    sounds.startMusic();
  }

  private updateHUD() {
    this.waveDisplay.textContent = `${this.currentWaveIndex + 1} / ${TD_WAVES.length}`;
    this.livesDisplay.textContent = `${this.lives}`;
    this.slpDisplay.textContent = `${this.slp} SLP`;

    if (!this.isWaveRunning) {
      this.startWaveBtn.disabled = false;
      this.startWaveBtn.textContent = `⚔️ Iniciar Ola ${this.currentWaveIndex + 1}`;
    } else {
      this.startWaveBtn.disabled = true;
      this.startWaveBtn.textContent = 'En Combate...';
    }

    // Update Spell Cooldown UI
    if (this.spellCooldown > 0) {
      this.spellCooldownOverlay.classList.remove('hidden');
      this.spellCooldownOverlay.textContent = `${Math.ceil(this.spellCooldown)}s`;
    } else {
      this.spellCooldownOverlay.classList.add('hidden');
    }
  }

  private onCanvasClick(e: MouseEvent) {
    // Ignore clicks on UI elements
    const target = e.target as HTMLElement;
    if (target.closest('#td-ui') && !target.matches('#canvas-wrap')) return;

    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.arena.camera);

    // 1. If Spell is aiming, cast spell on ground intersection!
    if (this.isSpellAiming) {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(groundPlane, hitPoint);

      if (hitPoint) {
        this.castMeteorSpell(hitPoint);
        this.isSpellAiming = false;
        this.spellBtn.style.borderColor = 'var(--accent-gold)';
      }
      return;
    }

    // 2. Check intersection with Tower Platforms
    const spotMeshes = this.arena.towerSpots.map(s => s.mesh);
    const intersects = this.raycaster.intersectObjects(spotMeshes);

    if (intersects.length > 0) {
      const hitSpotMesh = intersects[0].object as THREE.Mesh;
      const spotId = (hitSpotMesh as any).userData?.spotId;
      const spot = this.arena.towerSpots[spotId];

      if (spot) {
        this.handleSpotClick(spot);
        return;
      }
    }

    // 3. Clicked empty ground: close inspector and deselect
    this.closeInspector();
  }

  private handleSpotClick(spot: TowerSpot) {
    if (spot.occupiedBy) {
      // Open Inspector for this tower
      this.openInspector(spot.occupiedBy);
      return;
    }

    // Spot is empty: check if we have a tower type selected to build
    if (this.selectedBuildType) {
      const config = TOWER_CONFIGS[this.selectedBuildType];
      if (this.slp < config.cost) {
        sounds.playGameOver();
        alert(`¡No tienes suficiente SLP! Necesitas ${config.cost} SLP.`);
        return;
      }

      // Deduct cost and build
      this.slp -= config.cost;
      sounds.playShoot();

      const { mesh, mixer } = this.arena.createTowerMesh(config.modelFile, 1);
      mesh.position.copy(spot.position);
      this.arena.scene.add(mesh);

      const tower: TowerInstance = {
        id: `tower_${spot.id}_${Date.now()}`,
        type: config.type,
        level: 1,
        spotId: spot.id,
        position: spot.position.clone(),
        range: config.range,
        damage: config.damage,
        attackSpeed: config.attackSpeed,
        attackTimer: 0,
        targetEnemyId: null,
        mesh,
        mixer
      };

      spot.occupiedBy = tower;
      (spot.ringMesh.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
      this.towers.push(tower);

      this.updateHUD();
      this.openInspector(tower);
    }
  }

  private openInspector(tower: TowerInstance) {
    this.inspectedTower = tower;
    const config = TOWER_CONFIGS[tower.type];

    this.inspectAvatar.textContent = config.icon;
    this.inspectName.textContent = `${config.name} (${config.classLabel})`;
    this.inspectLevelTag.textContent = `Nivel ${tower.level}`;
    this.inspectDmg.textContent = `${Math.round(tower.damage)}`;
    this.inspectRange.textContent = `${tower.range.toFixed(1)}`;
    this.inspectSpeed.textContent = `${tower.attackSpeed.toFixed(1)}/s`;
    this.inspectTrait.textContent = config.specialTrait;

    // Upgrade Cost
    const currentUpCost = config.upgradeCost * tower.level;
    this.upgradeCostText.textContent = `${currentUpCost} ⚡`;
    this.upgradeTowerBtn.disabled = tower.level >= 3 || this.slp < currentUpCost;
    if (tower.level >= 3) {
      this.upgradeCostText.textContent = 'MÁXIMO';
    }

    // Sell Refund (+70% of total invested)
    const invested = config.cost + (tower.level - 1) * config.upgradeCost;
    const refund = Math.round(invested * 0.7);
    this.sellRefundText.textContent = `+${refund} ⚡`;

    this.inspectorModal.classList.remove('hidden');
    this.arena.showRangeIndicator(tower.position, tower.range);
  }

  private closeInspector() {
    this.inspectedTower = null;
    this.inspectorModal.classList.add('hidden');
    this.arena.hideRangeIndicator();
  }

  private upgradeSelectedTower() {
    if (!this.inspectedTower || this.inspectedTower.level >= 3) return;
    const tower = this.inspectedTower;
    const config = TOWER_CONFIGS[tower.type];
    const cost = config.upgradeCost * tower.level;

    if (this.slp < cost) {
      sounds.playGameOver();
      return;
    }

    this.slp -= cost;
    tower.level++;
    tower.damage = Math.round(tower.damage * 1.65);
    tower.range += 0.8;
    tower.attackSpeed += 0.2;

    sounds.playLevelUp();

    // Visual aura update
    this.arena.scene.remove(tower.mesh);
    const { mesh, mixer } = this.arena.createTowerMesh(config.modelFile, tower.level);
    mesh.position.copy(tower.position);
    this.arena.scene.add(mesh);
    tower.mesh = mesh;
    tower.mixer = mixer;

    this.updateHUD();
    this.openInspector(tower);
  }

  private sellSelectedTower() {
    if (!this.inspectedTower) return;
    const tower = this.inspectedTower;
    const config = TOWER_CONFIGS[tower.type];
    const spot = this.arena.towerSpots[tower.spotId];

    const invested = config.cost + (tower.level - 1) * config.upgradeCost;
    const refund = Math.round(invested * 0.7);
    this.slp += refund;

    sounds.playGem();

    this.arena.scene.remove(tower.mesh);
    spot.occupiedBy = null;
    (spot.ringMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);

    this.towers = this.towers.filter(t => t.id !== tower.id);

    this.closeInspector();
    this.updateHUD();
  }

  private castMeteorSpell(pos: THREE.Vector3) {
    this.spellCooldown = this.spellMaxCooldown;
    sounds.playLevelUp();
    this.arena.triggerMeteorEffect(pos);

    // Deal 180 AoE damage to all enemies within radius 4.5
    const aoeRadius = 4.5;
    let hitCount = 0;

    for (const enemy of this.enemies) {
      const dist = enemy.position.distanceTo(pos);
      if (dist <= aoeRadius) {
        enemy.hp -= 180;
        this.arena.showDamageNumber(enemy.position, 180, true);
        hitCount++;
      }
    }

    if (hitCount > 0) sounds.playHit();
    this.updateHUD();
  }

  private startWave() {
    if (this.currentWaveIndex >= TD_WAVES.length) return;
    const wave = TD_WAVES[this.currentWaveIndex];

    this.isWaveRunning = true;
    this.waveTimer = 0;
    this.waveQueue = [];

    // Queue all enemies with appropriate delays
    wave.groups.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        this.waveQueue.push({
          enemyType: group.enemyType,
          spawnTime: group.delay + i * group.interval
        });
      }
    });

    // Sort queue by spawnTime
    this.waveQueue.sort((a, b) => a.spawnTime - b.spawnTime);
    this.updateHUD();
  }

  private spawnEnemy(type: EnemyType) {
    const config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.scout;
    const { mesh, mixer, healthBarFill } = this.arena.createEnemyMesh(config.modelFile, config.scale, config.colorFilter);

    const startPos = this.arena.pathSystem.getPositionAtDistance(0).position;
    mesh.position.copy(startPos);
    this.arena.scene.add(mesh);

    const enemy: TDEnemy = {
      id: this.nextEnemyId++,
      type,
      name: config.name,
      hp: config.baseHp * (1 + this.currentWaveIndex * 0.15),
      maxHp: config.baseHp * (1 + this.currentWaveIndex * 0.15),
      speed: config.speed,
      rewardSlp: config.rewardSlp,
      pathDistance: 0,
      position: startPos.clone(),
      mesh,
      mixer,
      isBoss: type === 'boss',
      slowTimer: 0,
      slowFactor: 0,
      poisonTimer: 0,
      poisonDmg: 0,
      healthBarFill
    };

    this.enemies.push(enemy);
  }

  private loop() {
    const now = performance.now();
    const rawDelta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const delta = rawDelta * this.gameSpeed;

    // 1. Update Spell Cooldown
    if (this.spellCooldown > 0) {
      this.spellCooldown = Math.max(0, this.spellCooldown - delta);
      this.updateHUD();
    }

    // 2. Wave Spawning
    if (this.isWaveRunning) {
      this.waveTimer += delta;

      while (this.waveQueue.length > 0 && this.waveQueue[0].spawnTime <= this.waveTimer) {
        const item = this.waveQueue.shift()!;
        this.spawnEnemy(item.enemyType);
      }

      // Check if wave is cleared
      if (this.waveQueue.length === 0 && this.enemies.length === 0) {
        this.onWaveCleared();
      }
    }

    // 3. Update Enemies Movement & Status Effects
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Slow Effect
      if (e.slowTimer > 0) {
        e.slowTimer -= delta;
      } else {
        e.slowFactor = 0;
      }

      // Poison Effect
      if (e.poisonTimer > 0) {
        e.poisonTimer -= delta;
        e.hp -= e.poisonDmg * delta;
      }

      // Move along path
      const currentSpeed = e.speed * (1 - e.slowFactor);
      e.pathDistance += currentSpeed * delta;

      const { position, tangent } = this.arena.pathSystem.getPositionAtDistance(e.pathDistance);
      e.position.copy(position);
      e.mesh.position.copy(position);
      e.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

      if (e.mixer) e.mixer.update(delta);

      // Update Overhead 3D Health Bar
      const hpRatio = Math.max(0, e.hp / e.maxHp);
      e.healthBarFill.scale.set(hpRatio, 1, 1);

      // Enemy Reached Ancient Tree (Goal)
      if (e.pathDistance >= this.arena.pathSystem.totalLength) {
        this.lives = Math.max(0, this.lives - (e.isBoss ? 5 : 1));
        sounds.playPlayerHurt();
        this.arena.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
        this.updateHUD();

        if (this.lives <= 0) {
          this.handleGameOver(false);
          return;
        }
        continue;
      }

      // Enemy Died
      if (e.hp <= 0) {
        this.slp += e.rewardSlp;
        sounds.playHit();
        this.arena.showDamageNumber(e.position, Math.round(e.rewardSlp), false);
        this.arena.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
        this.updateHUD();
      }
    }

    // 4. Update Towers Targeting & Firing
    for (const t of this.towers) {
      if (t.mixer) t.mixer.update(delta);

      t.attackTimer += delta;

      // Find best target (furthest along path in range)
      let bestTarget: TDEnemy | null = null;
      let maxDist = -1;

      for (const enemy of this.enemies) {
        const dist = enemy.position.distanceTo(t.position);
        if (dist <= t.range && enemy.pathDistance > maxDist) {
          maxDist = enemy.pathDistance;
          bestTarget = enemy;
        }
      }

      if (bestTarget) {
        // Rotate tower smoothly towards target
        const dir = new THREE.Vector3().subVectors(bestTarget.position, t.position);
        t.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Fire
        const cooldown = 1 / t.attackSpeed;
        if (t.attackTimer >= cooldown) {
          t.attackTimer = 0;
          this.fireProjectile(t, bestTarget);
        }
      }
    }

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const targetEnemy = this.enemies.find(e => e.id === p.targetId);

      if (targetEnemy) {
        p.targetLastPos.copy(targetEnemy.position);
      }

      // Move toward target position
      const dir = new THREE.Vector3().subVectors(p.targetLastPos, p.mesh.position);
      const dist = dir.length();

      if (dist < 0.6) {
        // Impact!
        this.onProjectileImpact(p, targetEnemy);
        this.arena.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      } else {
        dir.normalize();
        p.mesh.position.addScaledVector(dir, p.speed * delta);
      }
    }

    // 6. Render 3D Scene
    this.arena.renderer.render(this.arena.scene, this.arena.camera);
  }

  private fireProjectile(tower: TowerInstance, target: TDEnemy) {
    sounds.playShoot();

    // Create Projectile Mesh
    let geom: THREE.BufferGeometry;
    let mat: THREE.Material;

    if (tower.type === 'pomodoro') {
      geom = new THREE.SphereGeometry(0.2, 8, 8);
      mat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x10b981 });
    } else if (tower.type === 'kotaro') {
      geom = new THREE.ConeGeometry(0.18, 0.6, 6);
      geom.rotateX(Math.PI / 2);
      mat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626 });
    } else if (tower.type === 'bing') {
      geom = new THREE.DodecahedronGeometry(0.35);
      mat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x0284c7 });
    } else {
      // Tripp
      geom = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6);
      geom.rotateX(Math.PI / 2);
      mat = new THREE.MeshStandardMaterial({ color: 0xffb703, emissive: 0xfbbf24 });
    }

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(tower.position);
    mesh.position.y = 1.4;
    this.arena.scene.add(mesh);

    const isCrit = tower.type === 'kotaro' && Math.random() < 0.38;
    const finalDmg = isCrit ? Math.round(tower.damage * 2.5) : tower.damage;

    this.projectiles.push({
      id: this.nextProjId++,
      type: tower.type,
      mesh,
      targetId: target.id,
      targetLastPos: target.position.clone(),
      speed: tower.type === 'tripp' ? 32 : 18,
      damage: finalDmg,
      isCrit,
      isSplash: tower.type === 'bing',
      splashRadius: 2.8,
      isSlow: tower.type === 'bing',
      isPoison: tower.type === 'pomodoro' && tower.level >= 2
    });
  }

  private onProjectileImpact(p: TDProjectile, directTarget?: TDEnemy) {
    sounds.playHit();

    if (p.isSplash) {
      // Splash damage & Slow in area
      for (const enemy of this.enemies) {
        if (enemy.position.distanceTo(p.targetLastPos) <= p.splashRadius) {
          enemy.hp -= p.damage;
          enemy.slowTimer = 2.5;
          enemy.slowFactor = 0.45;
          this.arena.showDamageNumber(enemy.position, p.damage, p.isCrit);
        }
      }
    } else if (directTarget) {
      directTarget.hp -= p.damage;
      this.arena.showDamageNumber(directTarget.position, p.damage, p.isCrit);

      if (p.isPoison) {
        directTarget.poisonTimer = 4.0;
        directTarget.poisonDmg = 8;
      }
    }
  }

  private onWaveCleared() {
    this.isWaveRunning = false;
    this.slp += 60; // Wave completion bonus
    sounds.playLevelUp();

    if (this.currentWaveIndex + 1 >= TD_WAVES.length) {
      this.handleGameOver(true);
      return;
    }

    this.currentWaveIndex++;
    this.updateHUD();
  }

  private handleGameOver(isVictory: boolean) {
    sounds.stopMusic();
    this.resultScreen.classList.remove('hidden');

    if (isVictory) {
      sounds.playLevelUp();
      this.resultBadge.textContent = '¡VICTORIA ABSOLUTA!';
      this.resultBadge.style.color = 'var(--accent-gold)';
      this.resultTitle.textContent = '¡Lunacia Está a Salvo!';
      this.resultSubtitle.textContent = 'Has defendido el Árbol Ancestral derrotando a las 10 oleadas de Quimeras.';
    } else {
      sounds.playGameOver();
      this.resultBadge.textContent = 'DERROTA';
      this.resultBadge.style.color = 'var(--accent-beast)';
      this.resultTitle.textContent = 'El Árbol Ancestral ha Caído';
      this.resultSubtitle.textContent = `Las quimeras lograron atravesar tus defensas en la Oleada ${this.currentWaveIndex + 1}.`;
    }

    this.finalWave.textContent = `${this.currentWaveIndex + 1} / ${TD_WAVES.length}`;
    this.finalLives.textContent = `${this.lives} / 20`;
  }
}

// Start Game Engine
window.addEventListener('DOMContentLoaded', () => {
  new TowerDefenseGame();
});
