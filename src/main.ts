import * as THREE from 'three';
import { Arena3D } from './arena-3d';
import {
  TowerType,
  TowerInstance,
  TDEnemy,
  TDProjectile,
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
  private slp: number = 250; // Starting SLP for initial towers
  private currentWaveIndex: number = 0;
  private isWaveRunning: boolean = false;
  private gameSpeed: number = 1.0;

  // Intermission (Auto-Wave Countdown) State
  private isIntermission: boolean = true;
  private intermissionTimer: number = 5.0;
  private readonly initialIntermission: number = 5.0;
  private readonly betweenWaveIntermission: number = 3.0;
  private lastWarningSecond: number = -1;

  // Active Spell State
  private spellCooldown: number = 0;
  private readonly spellMaxCooldown: number = 25.0;
  private isSpellAiming: boolean = false;

  // Selections & Card Cooldowns
  private selectedBuildType: TowerType | null = null;
  private inspectedTower: TowerInstance | null = null;
  private cardCooldowns: Record<TowerType, number> = {
    pomodoro: 0,
    kotaro: 0,
    bing: 0,
    tripp: 0
  };

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
  private _tempEnemyQuat: THREE.Quaternion = new THREE.Quaternion();

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
      'xia.glb',
      'kibo.glb',
      'paladill.glb'
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

    // Start Wave Button (Early Call)
    this.startWaveBtn.addEventListener('click', () => {
      if (this.isWaveRunning) return;
      this.startWave(true);
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

        if (this.cardCooldowns[type] > 0) {
          sounds.playHit();
          return;
        }

        if (this.selectedBuildType === type) {
          // Deselect
          this.selectedBuildType = null;
          card.classList.remove('selected');
          this.arena.hidePlacementPreview();
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

    // Pointer Move for Placement Hologram
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));

    // Canvas 3D Click Handling
    window.addEventListener('click', (e) => this.onCanvasClick(e));
  }

  private onPointerMove(e: PointerEvent) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (this.selectedBuildType) {
      this.raycaster.setFromCamera(this.mouse, this.arena.camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const config = TOWER_CONFIGS[this.selectedBuildType];
        const isValid = this.isValidPlacement(hitPoint, config.cost);
        this.arena.updatePlacementPreview(hitPoint, isValid, config.range);
      }
    } else {
      this.arena.hidePlacementPreview();
    }
  }

  private isValidPlacement(pos: THREE.Vector3, cost: number): boolean {
    if (this.slp < cost) return false;

    // Map boundaries
    if (Math.abs(pos.x) > 27 || Math.abs(pos.z) > 19) return false;

    // Keep clear of the Catmull-Rom path
    if (this.arena.pathSystem.isNearPath(pos, 2.2)) return false;

    // Clearance from Spawning Portal and Ancient Tree
    if (pos.distanceTo(new THREE.Vector3(-19, 0, -8)) < 3.8) return false;
    if (pos.distanceTo(new THREE.Vector3(18, 0, 0)) < 4.2) return false;

    // Minimum distance from any existing tower
    for (const t of this.towers) {
      if (pos.distanceTo(t.position) < 2.5) {
        return false;
      }
    }

    return true;
  }

  private resetGame() {
    this.lives = 20;
    this.slp = 250;
    this.currentWaveIndex = 0;
    this.isWaveRunning = false;
    this.gameSpeed = 1.0;
    this.spellCooldown = 0;
    this.isSpellAiming = false;
    this.selectedBuildType = null;
    this.cardCooldowns = { pomodoro: 0, kotaro: 0, bing: 0, tripp: 0 };
    this.isIntermission = true;
    this.intermissionTimer = this.initialIntermission;
    this.lastWarningSecond = -1;
    this.arena.hidePlacementPreview();
    document.querySelectorAll('.tower-card').forEach(c => {
      c.classList.remove('selected', 'cooldown');
      const ov = c.querySelector('.tower-card-cooldown-overlay');
      if (ov) ov.remove();
    });
    this.closeInspector();

    // Clear Entities
    for (const t of this.towers) {
      this.removeStatusBadge(t);
      this.arena.scene.remove(t.mesh);
    }
    for (const e of this.enemies) this.arena.scene.remove(e.mesh);
    for (const p of this.projectiles) this.arena.scene.remove(p.mesh);

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.waveQueue = [];

    this.updateHUD();
    sounds.startMusic();
  }

  private updateHUD() {
    this.waveDisplay.textContent = `${this.currentWaveIndex + 1} / ${TD_WAVES.length}`;
    this.livesDisplay.textContent = `${this.lives}`;
    this.slpDisplay.textContent = `${this.slp} SLP`;

    if (this.isIntermission) {
      this.startWaveBtn.disabled = false;
      this.startWaveBtn.className = 'btn-start-wave intermission';
      const sec = Math.ceil(this.intermissionTimer);
      if (sec <= 3) {
        this.startWaveBtn.classList.add('urgent');
      }
      this.startWaveBtn.textContent = `⏳ Ola ${this.currentWaveIndex + 1} en ${sec}s | ⚡ Iniciar (+15⚡)`;
    } else if (this.isWaveRunning) {
      this.startWaveBtn.disabled = true;
      this.startWaveBtn.className = 'btn-start-wave';
      this.startWaveBtn.textContent = `⚔️ En Combate (Ola ${this.currentWaveIndex + 1})...`;
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

    // 1. If Spell is aiming, cast spell on ground intersection
    if (this.isSpellAiming) {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        this.castMeteorSpell(hitPoint);
        this.isSpellAiming = false;
        this.spellBtn.style.borderColor = 'var(--accent-gold)';
      }
      return;
    }

    // 2. If building a tower freely
    if (this.selectedBuildType) {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const config = TOWER_CONFIGS[this.selectedBuildType];
        if (this.isValidPlacement(hitPoint, config.cost)) {
          // Deduct cost and build
          this.slp -= config.cost;
          sounds.playShoot();

          const { mesh, mixer } = this.arena.createTowerMesh(config.modelFile, 1);
          mesh.position.set(hitPoint.x, 0, hitPoint.z);

          // Create & attach 3D overhead progress bar for construction
          const { group: pbGroup, fill: pbFill } = this.arena.createTowerProgressBar();
          pbGroup.visible = true;
          (pbFill.material as THREE.MeshBasicMaterial).color.setHex(0x00f0ff);
          pbFill.scale.set(0.01, 1, 1);
          mesh.add(pbGroup);

          this.arena.scene.add(mesh);

          const tower: TowerInstance = {
            id: `tower_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: config.type,
            level: 1,
            position: new THREE.Vector3(hitPoint.x, 0, hitPoint.z),
            range: config.range,
            damage: config.damage,
            attackSpeed: config.attackSpeed,
            attackTimer: 0,
            targetEnemyId: null,
            mesh,
            mixer,
            isUnderConstruction: true,
            constructionTimer: config.buildTime,
            constructionDuration: config.buildTime,
            isUpgrading: false,
            upgradeTimer: 0,
            upgradeDuration: 0,
            targetLevel: 1,
            progressBarGroup: pbGroup,
            progressBarFill: pbFill
          };

          this.towers.push(tower);

          // Trigger card cooldown in tray
          this.cardCooldowns[config.type] = config.buildTime;

          // Clear selection
          this.selectedBuildType = null;
          document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
          this.arena.hidePlacementPreview();

          this.updateHUD();
          this.openInspector(tower);
          return;
        } else {
          if (this.slp < config.cost) {
            sounds.playGameOver();
            alert(`¡No tienes suficiente SLP! Necesitas ${config.cost} SLP.`);
          } else {
            sounds.playHit();
          }
          return;
        }
      }
    }

    // 3. Check if clicked an existing tower to inspect
    if (this.towers.length > 0) {
      const towerMeshes = this.towers.map(t => t.mesh);
      const intersects = this.raycaster.intersectObjects(towerMeshes, true);

      if (intersects.length > 0) {
        let clickedObj: THREE.Object3D | null = intersects[0].object;
        let clickedTower: TowerInstance | null = null;
        while (clickedObj && clickedObj !== this.arena.scene) {
          const found = this.towers.find(t => t.mesh === clickedObj);
          if (found) {
            clickedTower = found;
            break;
          }
          clickedObj = clickedObj.parent;
        }

        if (clickedTower) {
          this.openInspector(clickedTower);
          return;
        }
      }
    }

    // 4. Clicked empty ground: close inspector and deselect
    this.closeInspector();
  }

  private openInspector(tower: TowerInstance) {
    this.inspectedTower = tower;
    const config = TOWER_CONFIGS[tower.type];

    this.inspectAvatar.textContent = config.icon;
    this.inspectName.textContent = `${config.name} (${config.classLabel})`;
    this.inspectDmg.textContent = `${Math.round(tower.damage)}`;
    this.inspectRange.textContent = `${tower.range.toFixed(1)}`;
    this.inspectSpeed.textContent = `${tower.attackSpeed.toFixed(1)}/s`;
    this.inspectTrait.textContent = config.specialTrait;

    if (tower.isUnderConstruction) {
      this.inspectLevelTag.textContent = `En Construcción... (${Math.ceil(tower.constructionTimer)}s)`;
      this.upgradeTowerBtn.disabled = true;
      this.upgradeCostText.textContent = 'CONSTRUYENDO...';
    } else if (tower.isUpgrading) {
      this.inspectLevelTag.textContent = `Mejorando a Nivel ${tower.targetLevel}...`;
      this.upgradeTowerBtn.disabled = true;
      this.upgradeCostText.textContent = `MEJORANDO... (${Math.ceil(tower.upgradeTimer)}s)`;
    } else {
      this.inspectLevelTag.textContent = `Nivel ${tower.level}`;
      // Upgrade Cost
      const currentUpCost = config.upgradeCost * tower.level;
      this.upgradeCostText.textContent = `${currentUpCost} ⚡`;
      this.upgradeTowerBtn.disabled = tower.level >= 3 || this.slp < currentUpCost;
      if (tower.level >= 3) {
        this.upgradeCostText.textContent = 'MÁXIMO';
      }
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
    if (tower.isUnderConstruction || tower.isUpgrading) return;

    const config = TOWER_CONFIGS[tower.type];
    const cost = config.upgradeCost * tower.level;

    if (this.slp < cost) {
      sounds.playGameOver();
      return;
    }

    this.slp -= cost;

    // Cooldown duration for upgrade: Level 2 = 3.5s, Level 3 = 5.5s
    const duration = tower.level === 1 ? 3.5 : 5.5;
    tower.isUpgrading = true;
    tower.upgradeTimer = duration;
    tower.upgradeDuration = duration;
    tower.targetLevel = tower.level + 1;

    // Show gold progress bar
    if (tower.progressBarGroup && tower.progressBarFill) {
      (tower.progressBarFill.material as THREE.MeshBasicMaterial).color.setHex(0xffb703);
      tower.progressBarFill.scale.set(0.01, 1, 1);
      tower.progressBarGroup.visible = true;
    }

    sounds.playShoot();
    this.updateHUD();
    this.openInspector(tower);
  }

  private createOrUpdateStatusBadge(tower: TowerInstance, text: string, timer: number, progress: number, type: 'building' | 'upgrading') {
    let badge = tower.statusBadgeEl;
    if (!badge) {
      badge = document.createElement('div');
      badge.className = `tower-status-badge ${type}`;
      badge.innerHTML = `
        <div class="badge-header">
          <span class="badge-label">${text}</span>
          <span class="badge-timer">${Math.max(0, timer).toFixed(1)}s</span>
        </div>
        <div class="badge-bar-track">
          <div class="badge-bar-fill" style="width: ${(progress * 100).toFixed(0)}%;"></div>
        </div>
      `;
      const canvasWrap = document.querySelector('#canvas-wrap') as HTMLElement;
      canvasWrap.appendChild(badge);
      tower.statusBadgeEl = badge;
    } else {
      badge.className = `tower-status-badge ${type}`;
      const label = badge.querySelector('.badge-label') as HTMLElement;
      if (label && label.textContent !== text) label.textContent = text;
      const timerEl = badge.querySelector('.badge-timer') as HTMLElement;
      if (timerEl) timerEl.textContent = `${Math.max(0, timer).toFixed(1)}s`;
      const fill = badge.querySelector('.badge-bar-fill') as HTMLElement;
      if (fill) fill.style.width = `${Math.min(100, Math.max(0, progress * 100)).toFixed(0)}%`;
    }

    // Position badge directly above the tower in screen space
    const { x, y } = this.arena.projectToScreen(tower.position, 2.7);
    badge.style.left = `${x}px`;
    badge.style.top = `${y}px`;
  }

  private removeStatusBadge(tower: TowerInstance) {
    if (tower.statusBadgeEl) {
      tower.statusBadgeEl.remove();
      tower.statusBadgeEl = undefined;
    }
  }

  private sellSelectedTower() {
    if (!this.inspectedTower) return;
    const tower = this.inspectedTower;
    const config = TOWER_CONFIGS[tower.type];

    const invested = config.cost + (tower.level - 1) * config.upgradeCost;
    const refund = Math.round(invested * 0.7);
    this.slp += refund;

    sounds.playGem();

    this.removeStatusBadge(tower);
    this.arena.scene.remove(tower.mesh);
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

  private startWave(isEarlyCall: boolean = false) {
    if (this.currentWaveIndex >= TD_WAVES.length) return;
    const wave = TD_WAVES[this.currentWaveIndex];

    this.isIntermission = false;
    this.isWaveRunning = true;
    this.waveTimer = 0;
    this.waveQueue = [];

    // Early call bonus
    if (isEarlyCall) {
      const bonus = 15;
      this.slp += bonus;
      sounds.playGem();
      this.arena.showDamageNumber(new THREE.Vector3(0, 0, 0), bonus, true);
    } else {
      sounds.playShoot();
    }

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
    const { mesh, mixer, healthBarFill, healthBarGroup } = this.arena.createEnemyMesh(config.modelFile, config.scale, config.colorFilter, type);

    const startPos = this.arena.pathSystem.getPositionAtDistance(0).position;
    mesh.position.copy(startPos);
    this.arena.scene.add(mesh);

    const enemy: TDEnemy = {
      id: this.nextEnemyId++,
      type,
      name: config.name,
      hp: config.baseHp * (1 + this.currentWaveIndex * 0.24),
      maxHp: config.baseHp * (1 + this.currentWaveIndex * 0.24),
      speed: config.speed,
      baseSpeed: config.speed,
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
      healthBarFill,
      healthBarGroup,
      isImmuneSlow: config.isImmuneSlow,
      isImmunePoison: config.isImmunePoison,
      armorReduction: config.armorReduction,
      regenRate: config.regenRate,
      hasSprint: config.hasSprint,
      isFrenzyActive: false
    };

    this.enemies.push(enemy);
  }

  private loop() {
    const now = performance.now();
    const rawDelta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const delta = rawDelta * this.gameSpeed;

    // 0. Intermission Auto-Wave Countdown
    if (this.isIntermission) {
      this.intermissionTimer -= delta;

      const sec = Math.ceil(this.intermissionTimer);
      if (sec <= 3 && sec > 0 && sec !== this.lastWarningSecond) {
        this.lastWarningSecond = sec;
        sounds.playHit();
      }

      this.updateHUD();

      if (this.intermissionTimer <= 0) {
        this.startWave(false);
      }
    }

    // 1. Update Spell Cooldown
    if (this.spellCooldown > 0) {
      this.spellCooldown = Math.max(0, this.spellCooldown - delta);
      this.updateHUD();
    }

    // 1b. Update Tower Card Cooldowns
    const towerTypes: TowerType[] = ['pomodoro', 'kotaro', 'bing', 'tripp'];
    for (const type of towerTypes) {
      if (this.cardCooldowns[type] > 0) {
        this.cardCooldowns[type] = Math.max(0, this.cardCooldowns[type] - delta);
        const card = document.querySelector(`.tower-card[data-tower="${type}"]`) as HTMLElement;
        if (card) {
          if (this.cardCooldowns[type] > 0) {
            card.classList.add('cooldown');
            let overlay = card.querySelector('.tower-card-cooldown-overlay') as HTMLElement;
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.className = 'tower-card-cooldown-overlay';
              card.appendChild(overlay);
            }
            overlay.textContent = `${Math.ceil(this.cardCooldowns[type])}s`;
          } else {
            card.classList.remove('cooldown');
            const overlay = card.querySelector('.tower-card-cooldown-overlay');
            if (overlay) overlay.remove();
          }
        }
      }
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
    const toxicAuraPositions: THREE.Vector3[] = [];
    for (const e of this.enemies) {
      if (e.type === 'toxic' && e.hp > 0) {
        toxicAuraPositions.push(e.position);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Personality: Warrior Health Regeneration
      if (e.regenRate && e.hp < e.maxHp && e.hp > 0) {
        e.hp = Math.min(e.maxHp, e.hp + e.regenRate * delta);
      }

      // Personality: Scout Sprint Frenzy (< 45% HP)
      if (e.hasSprint && !e.isFrenzyActive && (e.hp / e.maxHp) <= 0.45) {
        e.isFrenzyActive = true;
        e.speed = e.baseSpeed * 1.45;
        this.arena.showDamageNumber(e.position, 0, true);
      }

      // Personality: Toxic Pheromone Aura (+15% speed buff to nearby allies within 4.5m)
      let auraSpeedMult = 1.0;
      if (e.type !== 'toxic') {
        for (const tPos of toxicAuraPositions) {
          if (tPos.distanceTo(e.position) <= 4.5) {
            auraSpeedMult = 1.15;
            break;
          }
        }
      }

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
      const currentSpeed = e.speed * auraSpeedMult * (1 - e.slowFactor);
      e.pathDistance += currentSpeed * delta;

      const { position, tangent } = this.arena.pathSystem.getPositionAtDistance(e.pathDistance);
      e.position.copy(position);
      e.mesh.position.copy(position);
      e.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

      if (e.mixer) e.mixer.update(delta);

      // Billboard Overhead 3D Health Bar to Camera
      this._tempEnemyQuat.copy(e.mesh.quaternion).invert().multiply(this.arena.camera.quaternion);
      e.healthBarGroup.quaternion.copy(this._tempEnemyQuat);

      // Update Overhead 3D Health Bar with Dynamic Color
      const hpRatio = Math.max(0, e.hp / e.maxHp);
      e.healthBarFill.scale.set(hpRatio, 1, 1);
      const fillMat = e.healthBarFill.material as THREE.MeshBasicMaterial;
      if (hpRatio > 0.55) {
        fillMat.color.setHex(0x22c55e); // Green
      } else if (hpRatio > 0.25) {
        fillMat.color.setHex(0xf59e0b); // Amber / Yellow
      } else {
        fillMat.color.setHex(0xef4444); // Red
      }

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
      // A. Construction Progress
      if (t.isUnderConstruction) {
        t.constructionTimer -= delta;
        const progress = Math.min(1.0, Math.max(0.01, 1 - (t.constructionTimer / t.constructionDuration)));

        // Update High-Visibility Screen-Space Badge
        this.createOrUpdateStatusBadge(t, '🔨 CONSTRUYENDO', t.constructionTimer, progress, 'building');

        // Billboard and scale in-world 3D bar
        if (t.progressBarGroup && t.progressBarFill) {
          t.progressBarGroup.quaternion.copy(this.arena.camera.quaternion);
          t.progressBarFill.scale.set(progress, 1, 1);
        }

        if (this.inspectedTower?.id === t.id) {
          this.inspectLevelTag.textContent = `En Construcción... (${Math.ceil(t.constructionTimer)}s)`;
          this.upgradeTowerBtn.disabled = true;
          this.upgradeCostText.textContent = 'CONSTRUYENDO...';
        }

        if (t.constructionTimer <= 0) {
          t.isUnderConstruction = false;
          this.removeStatusBadge(t);
          if (t.progressBarGroup) t.progressBarGroup.visible = false;
          sounds.playLevelUp();
          if (this.inspectedTower?.id === t.id) this.openInspector(t);
        }
        continue; // Tower cannot attack while under construction
      }

      // B. Upgrade Channeling Progress
      if (t.isUpgrading) {
        t.upgradeTimer -= delta;
        const progress = Math.min(1.0, Math.max(0.01, 1 - (t.upgradeTimer / t.upgradeDuration)));

        // Update High-Visibility Screen-Space Badge
        this.createOrUpdateStatusBadge(t, `⚡ MEJORANDO A NV.${t.targetLevel}`, t.upgradeTimer, progress, 'upgrading');

        // Billboard and scale in-world 3D bar
        if (t.progressBarGroup && t.progressBarFill) {
          t.progressBarGroup.quaternion.copy(this.arena.camera.quaternion);
          t.progressBarFill.scale.set(progress, 1, 1);
        }

        if (this.inspectedTower?.id === t.id) {
          this.inspectLevelTag.textContent = `Mejorando a Nivel ${t.targetLevel}...`;
          this.upgradeCostText.textContent = `MEJORANDO... (${Math.ceil(t.upgradeTimer)}s)`;
          this.upgradeTowerBtn.disabled = true;
        }

        if (t.upgradeTimer <= 0) {
          t.isUpgrading = false;
          this.removeStatusBadge(t);
          if (t.progressBarGroup) t.progressBarGroup.visible = false;
          t.level = t.targetLevel;
          t.damage = Math.round(t.damage * 1.65);
          t.range += 0.8;
          t.attackSpeed += 0.2;

          // Replace mesh with upgraded visuals & aura
          const config = TOWER_CONFIGS[t.type];
          this.arena.scene.remove(t.mesh);
          const { mesh, mixer } = this.arena.createTowerMesh(config.modelFile, t.level);
          mesh.position.copy(t.position);

          // Re-attach progress bar
          const { group: pbGroup, fill: pbFill } = this.arena.createTowerProgressBar();
          mesh.add(pbGroup);
          t.mesh = mesh;
          t.mixer = mixer;
          t.progressBarGroup = pbGroup;
          t.progressBarFill = pbFill;
          this.arena.scene.add(mesh);

          sounds.playLevelUp();
          if (this.inspectedTower?.id === t.id) this.openInspector(t);
        }
        continue; // Tower does not attack while channeling upgrade
      }

      // C. Active Combat targeting and firing
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
          let dealtDmg = p.damage;
          // Personality: Armored Chitin absorbs 30% normal damage (Crits pierce armor!)
          if (enemy.armorReduction && !p.isCrit) {
            dealtDmg = Math.round(dealtDmg * (1 - enemy.armorReduction));
          }

          enemy.hp -= dealtDmg;

          // Personality: Anti-Slow Immunity & Boss Resistance
          if (!enemy.isImmuneSlow) {
            enemy.slowTimer = 2.5;
            enemy.slowFactor = enemy.isBoss ? 0.20 : 0.45;
          }

          this.arena.showDamageNumber(enemy.position, dealtDmg, p.isCrit);
        }
      }
    } else if (directTarget) {
      let dealtDmg = p.damage;
      // Personality: Armored Chitin absorbs 30% normal damage (Crits pierce armor!)
      if (directTarget.armorReduction && !p.isCrit) {
        dealtDmg = Math.round(dealtDmg * (1 - directTarget.armorReduction));
      }

      directTarget.hp -= dealtDmg;
      this.arena.showDamageNumber(directTarget.position, dealtDmg, p.isCrit);

      // Personality: Toxic quimera is immune to poison
      if (p.isPoison && !directTarget.isImmunePoison) {
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

    // Start countdown to next wave automatically!
    this.isIntermission = true;
    this.intermissionTimer = this.betweenWaveIntermission;
    this.lastWarningSecond = -1;

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
