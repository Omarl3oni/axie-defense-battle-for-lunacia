import * as THREE from 'three';
import { Player } from './player';
import { EnemyManager } from './enemies';
import { CombatManager } from './combat';
import { CharacterType, UpgradeCard } from './types';
import { getRandomUpgrades, ALL_UPGRADES } from './cards';
import { sounds } from './audio';

enum GameState {
  MENU,
  PLAYING,
  LEVELING_UP,
  GAME_OVER,
  VICTORY
}

class Game {
  private container: HTMLElement;
  private canvasWrap: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // Arena
  private readonly arenaRadius = 35;

  // Game Logic
  private state: GameState = GameState.MENU;
  private player: Player | null = null;
  private enemyManager: EnemyManager;
  private combatManager: CombatManager;
  private selectedCharacter: CharacterType = 'pomodoro';

  private gameTime: number = 0;
  private kills: number = 0;
  private upgrades: Map<string, number> = new Map();

  // Input
  private keys: Record<string, boolean> = {};
  private touchStart: { x: number; y: number } | null = null;
  private touchVector: { x: number; y: number } = { x: 0, y: 0 };

  // UI Elements
  private timerDisplay = document.querySelector('#timer-display') as HTMLElement;
  private killsDisplay = document.querySelector('#kills-display') as HTMLElement;
  private levelBadge = document.querySelector('#player-level-badge') as HTMLElement;
  private expText = document.querySelector('#exp-text') as HTMLElement;
  private expBarFill = document.querySelector('#exp-bar-fill') as HTMLElement;
  private axieNameLabel = document.querySelector('#axie-name-label') as HTMLElement;
  private hpText = document.querySelector('#hp-text') as HTMLElement;
  private hpBarFill = document.querySelector('#hp-bar-fill') as HTMLElement;
  private partsInventory = document.querySelector('#parts-inventory') as HTMLElement;

  private hud = document.querySelector('#hud') as HTMLElement;
  private startScreen = document.querySelector('#start-screen') as HTMLElement;
  private levelupScreen = document.querySelector('#levelup-screen') as HTMLElement;
  private cardsContainer = document.querySelector('#cards-container') as HTMLElement;
  private gameoverScreen = document.querySelector('#gameover-screen') as HTMLElement;
  private resultBadge = document.querySelector('#result-badge') as HTMLElement;
  private resultTitle = document.querySelector('#result-title') as HTMLElement;
  private finalTime = document.querySelector('#final-time') as HTMLElement;
  private finalKills = document.querySelector('#final-kills') as HTMLElement;
  private finalLevel = document.querySelector('#final-level') as HTMLElement;

  constructor() {
    this.container = document.querySelector('#game-container') as HTMLElement;
    this.canvasWrap = document.querySelector('#canvas-wrap') as HTMLElement;

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1220);
    this.scene.fog = new THREE.FogExp2(0x0c1220, 0.015);

    // 2. Camera Setup (Top-down isometric view)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.camera.position.set(0, 22, 20);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvasWrap.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // 4. Managers
    this.enemyManager = new EnemyManager(this.scene);
    this.combatManager = new CombatManager(this.scene, this.camera, this.container);

    // 5. Build Arena Environment & Lighting
    this.setupLighting();
    this.setupArena();

    // 6. Preload Enemy Templates
    this.enemyManager.preloadTemplates().catch(console.error);

    // 7. Event Listeners
    this.setupInputs();
    this.setupUIEvents();

    window.addEventListener('resize', () => this.onResize());

    // 8. Start Render Loop
    this.renderer.setAnimationLoop(() => this.loop());
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.2);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x142033, 1.8);
    this.scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfff7ed, 3.2);
    sun.position.set(16, 28, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    this.scene.add(sun);
  }

  private setupArena() {
    // Ground plane
    const groundGeom = new THREE.CircleGeometry(this.arenaRadius + 5, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x14281e, // Lunacia deep forest grass
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle grid overlay for visual depth
    const grid = new THREE.GridHelper(this.arenaRadius * 2, 40, 0x22c55e, 0x1e3a2b);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // Arena boundary pillars / ancient Lunacia stones
    const pillarGeom = new THREE.CylinderGeometry(0.7, 0.9, 3.5, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.7
    });

    const count = 36;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const x = Math.cos(angle) * this.arenaRadius;
      const z = Math.sin(angle) * this.arenaRadius;

      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(x, 1.75, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;

      // Small glowing crystal on top of pillar
      const crystalGeom = new THREE.OctahedronGeometry(0.35);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00b4d8,
        roughness: 0.2
      });
      const crystal = new THREE.Mesh(crystalGeom, crystalMat);
      crystal.position.set(x, 3.8, z);

      this.scene.add(pillar);
      this.scene.add(crystal);
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch support for mobile
    window.addEventListener('touchstart', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const touch = e.touches[0];
      this.touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.touchStart || this.state !== GameState.PLAYING) return;
      const touch = e.touches[0];
      const dx = touch.clientX - this.touchStart.x;
      const dy = touch.clientY - this.touchStart.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 10) {
        this.touchVector = { x: dx / dist, y: dy / dist };
      } else {
        this.touchVector = { x: 0, y: 0 };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.touchStart = null;
      this.touchVector = { x: 0, y: 0 };
    }, { passive: true });
  }

  private setupUIEvents() {
    // Character selection cards
    const cards = document.querySelectorAll('.character-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedCharacter = card.getAttribute('data-character') as CharacterType;
      });
    });

    // Start Button
    const startBtn = document.querySelector('#start-button') as HTMLElement;
    startBtn.addEventListener('click', () => {
      this.startGame();
    });

    // Restart Button
    const restartBtn = document.querySelector('#restart-button') as HTMLElement;
    restartBtn.addEventListener('click', () => {
      this.startGame();
    });
  }

  private async startGame() {
    this.startScreen.classList.add('hidden');
    this.gameoverScreen.classList.add('hidden');
    this.levelupScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');

    // Clean up previous state
    if (this.player) {
      this.scene.remove(this.player.mesh);
    }
    this.enemyManager.clearAll();
    this.combatManager.clearAll();

    this.gameTime = 0;
    this.kills = 0;
    this.upgrades.clear();

    // Create and load player
    this.player = new Player(this.selectedCharacter);
    await this.player.loadModel(this.scene);

    // Initial starter part
    if (this.selectedCharacter === 'pomodoro') {
      this.upgrades.set('back_pumpkin', 1);
    } else {
      this.upgrades.set('horn_pocky', 1);
    }

    // Oleada inicial de quimeras para acción inmediata desde el segundo 0
    this.enemyManager.spawnInitialWave(this.player.mesh.position, 8);

    this.updateHUD();
    this.updatePartsInventoryUI();

    this.state = GameState.PLAYING;
    sounds.startMusic();
  }

  private loop() {
    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === GameState.PLAYING && this.player) {
      this.gameTime += delta;
      this.updateTimerDisplay();

      // Get Input Vector
      let inputX = 0;
      let inputZ = 0;

      if (this.keys['KeyW'] || this.keys['ArrowUp']) inputZ -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) inputZ += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;

      // Combine with touch
      if (this.touchVector.x !== 0 || this.touchVector.y !== 0) {
        inputX = this.touchVector.x;
        inputZ = this.touchVector.y;
      }

      // Update Player
      this.player.update(delta, inputX, inputZ, this.arenaRadius);

      // Smooth Camera Follow
      const targetCamX = this.player.mesh.position.x;
      const targetCamZ = this.player.mesh.position.z + 18;
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, delta * 4);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, delta * 4);
      this.camera.lookAt(this.player.mesh.position.x, 0, this.player.mesh.position.z);

      // Update Enemies
      this.enemyManager.update(
        delta,
        this.gameTime,
        this.player.mesh.position,
        (pos, expVal) => {
          this.kills++;
          this.killsDisplay.textContent = `${this.kills}`;
          this.combatManager.spawnGem(pos, expVal);
        },
        (damage) => {
          if (!this.player) return;
          const isDead = this.player.takeDamage(damage);
          this.updateHUD();
          if (isDead) {
            this.handleGameOver(false);
          }
        }
      );

      // Update Combat & Weapons
      this.combatManager.update(
        delta,
        this.player.mesh.position,
        this.player.facingAngle,
        this.player.stats,
        this.upgrades,
        this.enemyManager.enemies,
        (gemVal) => {
          if (!this.player) return;
          const leveledUp = this.player.addExp(gemVal);
          this.updateHUD();
          if (leveledUp) {
            this.triggerLevelUp();
          }
        }
      );

      // Check Victory condition (5 minutes survived or 300 seconds)
      if (this.gameTime >= 300) {
        this.handleGameOver(true);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private triggerLevelUp() {
    this.state = GameState.LEVELING_UP;
    this.levelupScreen.classList.remove('hidden');

    const options = getRandomUpgrades(this.upgrades, 3);
    this.cardsContainer.innerHTML = '';

    options.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'upgrade-card';
      cardEl.innerHTML = `
        <div class="card-icon">${card.icon}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-type">${card.partType}</div>
        <div class="card-desc">${card.description}</div>
        <div class="card-level-tag">Nivel ${card.level} / ${card.maxLevel}</div>
      `;

      cardEl.addEventListener('click', () => {
        this.applyUpgrade(card);
      });

      this.cardsContainer.appendChild(cardEl);
    });
  }

  private applyUpgrade(card: UpgradeCard) {
    this.upgrades.set(card.id, card.level);

    // Apply immediate passive stat buffs
    if (this.player) {
      if (card.id === 'plant_vitality') {
        this.player.stats.maxHp += 30;
        this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 20);
      } else if (card.id === 'swift_feather') {
        this.player.stats.speed *= 1.15;
      } else if (card.id === 'beast_fury') {
        this.player.stats.critRate += 0.08;
        this.player.stats.critDamage += 0.2;
      } else if (card.id === 'gem_magnet') {
        this.player.stats.pickupRadius *= 1.45;
      }
    }

    this.updateHUD();
    this.updatePartsInventoryUI();

    this.levelupScreen.classList.add('hidden');
    this.state = GameState.PLAYING;
  }

  private updateHUD() {
    if (!this.player) return;

    this.axieNameLabel.textContent = this.selectedCharacter === 'pomodoro' ? 'Pomodoro (Planta)' : 'Kotaro (Bestia)';
    this.hpText.textContent = `${Math.round(this.player.stats.hp)} / ${this.player.stats.maxHp}`;
    const hpPct = Math.max(0, Math.min(100, (this.player.stats.hp / this.player.stats.maxHp) * 100));
    this.hpBarFill.style.width = `${hpPct}%`;

    this.levelBadge.textContent = `LVL ${this.player.stats.level}`;
    this.expText.textContent = `${this.player.stats.exp} / ${this.player.stats.nextLevelExp} EXP`;
    const expPct = Math.max(0, Math.min(100, (this.player.stats.exp / this.player.stats.nextLevelExp) * 100));
    this.expBarFill.style.width = `${expPct}%`;
  }

  private updatePartsInventoryUI() {
    this.partsInventory.innerHTML = '';
    for (const [id, lvl] of this.upgrades.entries()) {
      const info = ALL_UPGRADES[id];
      if (!info) continue;
      const badge = document.createElement('div');
      badge.className = 'part-badge';
      badge.innerHTML = `<span>${info.icon}</span><span class="part-lvl">Niv.${lvl}</span>`;
      this.partsInventory.appendChild(badge);
    }
  }

  private updateTimerDisplay() {
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    this.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private handleGameOver(isVictory: boolean) {
    this.state = isVictory ? GameState.VICTORY : GameState.GAME_OVER;
    sounds.stopMusic();

    if (isVictory) {
      sounds.playLevelUp();
      this.resultBadge.textContent = '¡VICTORIA EN LUNACIA!';
      this.resultBadge.style.color = 'var(--accent-gold)';
      this.resultTitle.textContent = '¡Has Purificado el Valle!';
    } else {
      sounds.playGameOver();
      this.resultBadge.textContent = 'FIN DE LA PARTIDA';
      this.resultBadge.style.color = 'var(--accent-beast)';
      this.resultTitle.textContent = 'Has Caído en Lunacia';
    }

    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    this.finalTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.finalKills.textContent = `${this.kills}`;
    this.finalLevel.textContent = `${this.player ? this.player.stats.level : 1}`;

    this.gameoverScreen.classList.remove('hidden');
  }

  private onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

// Start Game Engine
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
