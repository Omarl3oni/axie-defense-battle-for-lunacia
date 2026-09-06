import { Arena3D } from './arena-3d';
import { AxieUnit } from './tactics-types';
import {
  AXIE_DATABASE,
  ENEMY_ROUNDS,
  createAxieInstance
} from './tactics-data';
import { CombatSimulator } from './combat-sim';
import { sounds } from './audio';

class TacticsGame {
  private arena: Arena3D;
  private lastTime: number = performance.now();

  // Core Game State
  private round: number = 1;
  private wins: number = 0;
  private hearts: number = 3;
  private gold: number = 10;

  private team: (AxieUnit | null)[] = [null, null, null];
  private bench: (AxieUnit | null)[] = [null, null, null, null];
  private shopOffers: AxieUnit[] = [];
  private isFrozen: boolean = false;
  private isCombatActive: boolean = false;
  private selectedSlot: { type: 'team' | 'bench'; index: number } | null = null;

  // UI Element References
  private roundDisplay = document.querySelector('#round-display') as HTMLElement;
  private winsDisplay = document.querySelector('#wins-display') as HTMLElement;
  private heartsDisplay = document.querySelector('#hearts-display') as HTMLElement;
  private goldDisplay = document.querySelector('#gold-display') as HTMLElement;
  private synergiesList = document.querySelector('#synergies-list') as HTMLElement;
  private combatBanner = document.querySelector('#combat-banner') as HTMLElement;
  private combatLogText = document.querySelector('#combat-log-text') as HTMLElement;
  private shopContainer = document.querySelector('#shop-container') as HTMLElement;
  private shopCards = document.querySelector('#shop-cards') as HTMLElement;
  private rerollBtn = document.querySelector('#reroll-btn') as HTMLElement;
  private freezeBtn = document.querySelector('#freeze-btn') as HTMLElement;
  private freezeText = document.querySelector('#freeze-text') as HTMLElement;
  private startBattleBtn = document.querySelector('#start-battle-btn') as HTMLElement;
  private skipCombatBtn = document.querySelector('#skip-combat-btn') as HTMLElement;

  private startScreen = document.querySelector('#start-screen') as HTMLElement;
  private resultScreen = document.querySelector('#result-screen') as HTMLElement;
  private resultBadge = document.querySelector('#result-badge') as HTMLElement;
  private resultTitle = document.querySelector('#result-title') as HTMLElement;
  private resultSubtitle = document.querySelector('#result-subtitle') as HTMLElement;
  private finalWins = document.querySelector('#final-wins') as HTMLElement;
  private finalRound = document.querySelector('#final-round') as HTMLElement;

  constructor() {
    const canvasWrap = document.querySelector('#canvas-wrap') as HTMLElement;
    this.arena = new Arena3D(canvasWrap);

    this.setupUIEvents();
    this.initPreloads();

    // Start 3D Render Loop
    this.arena.renderer.setAnimationLoop(() => this.loop());
  }

  private async initPreloads() {
    // Preload mascot and common sapidae models
    const allModels = [
      'pomodoro.glb',
      'kotaro.glb',
      'bing.glb',
      'tripp.glb',
      'paladill.glb',
      'xia.glb',
      'kibo.glb',
      'sapidae-f-a.glb',
      'sapidae-m-a.glb',
      'sapidae-f-b.glb'
    ];
    await this.arena.preloadModels(allModels);
  }

  private setupUIEvents() {
    // Welcome Start Game Button
    const startGameBtn = document.querySelector('#start-game-btn') as HTMLElement;
    startGameBtn.addEventListener('click', () => {
      this.startScreen.classList.add('hidden');
      this.resetGame();
    });

    // Restart Game Button
    const restartBtn = document.querySelector('#restart-game-btn') as HTMLElement;
    restartBtn.addEventListener('click', () => {
      this.resultScreen.classList.add('hidden');
      this.resetGame();
    });

    // Reroll Shop Button (1 Gold)
    this.rerollBtn.addEventListener('click', () => {
      if (this.isCombatActive || this.gold < 1) return;
      this.gold -= 1;
      sounds.playGem();
      this.refreshShop(true);
      this.updateHUD();
    });

    // Freeze Shop Button (Free)
    this.freezeBtn.addEventListener('click', () => {
      if (this.isCombatActive) return;
      this.isFrozen = !this.isFrozen;
      sounds.playHit();
      this.updateShopControlsUI();
    });

    // Start Battle Button
    this.startBattleBtn.addEventListener('click', () => {
      if (this.isCombatActive) return;
      this.startBattle();
    });

    // Click on Team and Bench Slots
    const allSlotBoxes = document.querySelectorAll('.slot-box');
    allSlotBoxes.forEach((box) => {
      box.addEventListener('click', () => {
        if (this.isCombatActive) return;
        const type = box.getAttribute('data-type') as 'team' | 'bench';
        const index = parseInt(box.getAttribute('data-slot') || '0', 10);
        this.handleSlotClick(type, index);
      });
    });
  }

  private resetGame() {
    this.round = 1;
    this.wins = 0;
    this.hearts = 3;
    this.gold = 10;
    this.isFrozen = false;
    this.isCombatActive = false;
    this.selectedSlot = null;

    // Initial Starter Unit: Free Pomodoro in Front Slot
    this.team = [createAxieInstance('pomodoro', 1), null, null];
    this.bench = [null, null, null, null];

    this.refreshShop(true);
    this.updateHUD();
    this.renderSquadUI();
    this.arena.renderTeam('player', this.team);
    this.arena.renderTeam('enemy', [null, null, null]);
    sounds.startMusic();
  }

  private refreshShop(force: boolean = false) {
    if (this.isFrozen && !force) return;

    const baseKeys = Object.keys(AXIE_DATABASE);
    this.shopOffers = [];

    for (let i = 0; i < 4; i++) {
      const randKey = baseKeys[Math.floor(Math.random() * baseKeys.length)];
      this.shopOffers.push(createAxieInstance(randKey, 1));
    }

    this.isFrozen = false;
    this.renderShopCardsUI();
    this.updateShopControlsUI();
  }

  private renderShopCardsUI() {
    this.shopCards.innerHTML = '';

    this.shopOffers.forEach((unit, idx) => {
      const card = document.createElement('div');
      card.className = 'shop-card';

      // Check current ownership of this baseId
      const ownedCopies = this.countOwnedCopies(unit.baseId);
      const isFusionReady = ownedCopies === 2;

      if (isFusionReady) {
        card.classList.add('fusion-ready');
        const banner = document.createElement('div');
        banner.className = 'card-fusion-banner';
        banner.textContent = '✨ ¡FUSIÓN DORADA NIVEL 2!';
        card.appendChild(banner);
      }

      card.innerHTML += `
        <div class="shop-card-top">
          <div class="card-avatar">${unit.icon}</div>
          <div class="card-meta">
            <span class="card-title">${unit.name}</span>
            <span class="card-class-tag class-${unit.axieClass}">${unit.classLabel}</span>
          </div>
        </div>

        <div class="shop-card-stats">
          <span>❤️ ${unit.hp} HP</span>
          <span>⚔️ ${unit.attack} ATK</span>
          <span>⚡ ${unit.speed} VEL</span>
        </div>

        <div class="shop-card-ability">${unit.abilityDesc}</div>

        <div class="shop-card-bottom">
          <span class="card-ownership-tag">${ownedCopies > 0 ? `Tienes: ${ownedCopies}/3` : ''}</span>
          <span class="card-buy-tag">Comprar · 3 💰</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.buyShopUnit(idx);
      });

      this.shopCards.appendChild(card);
    });
  }

  private countOwnedCopies(baseId: string): number {
    let count = 0;
    const allUnits = [...this.team, ...this.bench];
    for (const u of allUnits) {
      if (u && u.baseId === baseId && u.level === 1) {
        count += u.copies;
      }
    }
    return count;
  }

  private buyShopUnit(index: number) {
    if (this.isCombatActive || this.gold < 3) return;
    const unitToBuy = this.shopOffers[index];
    if (!unitToBuy) return;

    // Check 3-in-1 Golden Fusion
    const ownedCopies = this.countOwnedCopies(unitToBuy.baseId);

    if (ownedCopies >= 2) {
      // Golden Fusion!
      this.gold -= 3;
      sounds.playLevelUp();

      // Find the existing copies and merge into the first found slot
      let targetSlotInfo: { type: 'team' | 'bench'; index: number } | null = null;

      // Find first occurrence in team
      for (let i = 0; i < this.team.length; i++) {
        if (this.team[i]?.baseId === unitToBuy.baseId && this.team[i]?.level === 1) {
          targetSlotInfo = { type: 'team', index: i };
          break;
        }
      }

      // If not in team, find in bench
      if (!targetSlotInfo) {
        for (let i = 0; i < this.bench.length; i++) {
          if (this.bench[i]?.baseId === unitToBuy.baseId && this.bench[i]?.level === 1) {
            targetSlotInfo = { type: 'bench', index: i };
            break;
          }
        }
      }

      // Remove all other level 1 copies of this baseId
      let removedOther = false;
      for (let i = 0; i < this.team.length; i++) {
        if (
          targetSlotInfo &&
          !(targetSlotInfo.type === 'team' && targetSlotInfo.index === i) &&
          this.team[i]?.baseId === unitToBuy.baseId &&
          this.team[i]?.level === 1
        ) {
          this.team[i] = null;
          removedOther = true;
          break;
        }
      }

      if (!removedOther) {
        for (let i = 0; i < this.bench.length; i++) {
          if (
            targetSlotInfo &&
            !(targetSlotInfo.type === 'bench' && targetSlotInfo.index === i) &&
            this.bench[i]?.baseId === unitToBuy.baseId &&
            this.bench[i]?.level === 1
          ) {
            this.bench[i] = null;
            break;
          }
        }
      }

      // Upgrade target slot to Level 2 Golden!
      const goldenUnit = createAxieInstance(unitToBuy.baseId, 2);
      if (targetSlotInfo) {
        if (targetSlotInfo.type === 'team') {
          this.team[targetSlotInfo.index] = goldenUnit;
        } else {
          this.bench[targetSlotInfo.index] = goldenUnit;
        }
      }

      // Remove offer from shop
      this.shopOffers.splice(index, 1);
      this.updateHUD();
      this.renderSquadUI();
      this.renderShopCardsUI();
      this.arena.renderTeam('player', this.team);
      return;
    }

    // Normal Purchase: Find first open bench or team slot
    let placed = false;

    // Try team first if space
    for (let i = 0; i < this.team.length; i++) {
      if (!this.team[i]) {
        this.team[i] = unitToBuy;
        placed = true;
        break;
      }
    }

    // Try bench if team full
    if (!placed) {
      for (let i = 0; i < this.bench.length; i++) {
        if (!this.bench[i]) {
          this.bench[i] = unitToBuy;
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      alert('¡Tanto tu escuadrón como tu banca están llenos! Vende o mueve un Axie.');
      return;
    }

    this.gold -= 3;
    sounds.playShoot();
    this.shopOffers.splice(index, 1);

    this.updateHUD();
    this.renderSquadUI();
    this.renderShopCardsUI();
    this.arena.renderTeam('player', this.team);
  }

  private handleSlotClick(type: 'team' | 'bench', index: number) {
    const list = type === 'team' ? this.team : this.bench;

    // If no slot is selected currently
    if (!this.selectedSlot) {
      if (list[index]) {
        this.selectedSlot = { type, index };
        sounds.playHit();
        this.highlightSelectedSlot();
      }
      return;
    }

    // If clicking the same slot: deselect
    if (this.selectedSlot.type === type && this.selectedSlot.index === index) {
      this.selectedSlot = null;
      this.highlightSelectedSlot();
      return;
    }

    // Swap units between selectedSlot and this slot
    const fromList = this.selectedSlot.type === 'team' ? this.team : this.bench;
    const temp = fromList[this.selectedSlot.index];
    fromList[this.selectedSlot.index] = list[index];
    list[index] = temp;

    sounds.playShoot();
    this.selectedSlot = null;
    this.highlightSelectedSlot();

    this.renderSquadUI();
    this.arena.renderTeam('player', this.team);
    this.updateSynergiesUI();
  }

  private highlightSelectedSlot() {
    const allSlotBoxes = document.querySelectorAll('.slot-box');
    allSlotBoxes.forEach((box) => {
      const type = box.getAttribute('data-type');
      const index = parseInt(box.getAttribute('data-slot') || '0', 10);
      if (this.selectedSlot && this.selectedSlot.type === type && this.selectedSlot.index === index) {
        box.classList.add('selected');
      } else {
        box.classList.remove('selected');
      }
    });
  }

  private renderSquadUI() {
    // 1. Team Slots
    this.team.forEach((unit, idx) => {
      const box = document.querySelector(`.slot-box[data-type="team"][data-slot="${idx}"]`) as HTMLElement;
      if (!box) return;
      this.fillSlotBox(box, unit, `Slot ${idx + 1}`);
    });

    // 2. Bench Slots
    this.bench.forEach((unit, idx) => {
      const box = document.querySelector(`.slot-box[data-type="bench"][data-slot="${idx}"]`) as HTMLElement;
      if (!box) return;
      this.fillSlotBox(box, unit, `Banca ${idx + 1}`);
    });

    this.updateSynergiesUI();
  }

  private fillSlotBox(box: HTMLElement, unit: AxieUnit | null, defaultTag: string) {
    box.innerHTML = `<span class="slot-tag">${defaultTag}</span>`;

    if (!unit) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'slot-content empty';
      emptyEl.textContent = defaultTag.startsWith('Slot') ? '+ Colocar' : '-';
      box.appendChild(emptyEl);
    } else {
      const card = document.createElement('div');
      card.className = 'slot-unit-card';
      card.innerHTML = `
        <div class="slot-avatar">${unit.icon}</div>
        <div class="slot-details">
          <span class="slot-name ${unit.level === 2 ? 'golden' : ''}">${unit.name}</span>
          <span class="slot-stats">❤️${unit.hp} ⚔️${unit.attack}</span>
          ${unit.level === 2 ? '<span class="slot-badge-gold">★ NIVEL 2</span>' : ''}
        </div>
      `;
      box.appendChild(card);
    }
  }

  private updateSynergiesUI() {
    this.synergiesList.innerHTML = '';
    const activeUnits = this.team.filter((u): u is AxieUnit => u !== null);

    const plantCount = activeUnits.filter(u => u.axieClass === 'plant').length;
    const beastCount = activeUnits.filter(u => u.axieClass === 'beast').length;
    const speedCount = activeUnits.filter(u => u.axieClass === 'aqua' || u.axieClass === 'bird').length;

    // Planta Synergy
    const plantEl = document.createElement('div');
    plantEl.className = `synergy-item ${plantCount >= 2 ? 'active' : ''}`;
    plantEl.innerHTML = `<span>🌱 Planta (${plantCount}/2)</span> <span>${plantCount >= 2 ? '✓ +30 Escudo' : ''}</span>`;
    this.synergiesList.appendChild(plantEl);

    // Bestia Synergy
    const beastEl = document.createElement('div');
    beastEl.className = `synergy-item ${beastCount >= 2 ? 'active' : ''}`;
    beastEl.innerHTML = `<span>🐾 Bestia (${beastCount}/2)</span> <span>${beastCount >= 2 ? '✓ +25% Crítico' : ''}</span>`;
    this.synergiesList.appendChild(beastEl);

    // Aqua/Pájaro Synergy
    const speedEl = document.createElement('div');
    speedEl.className = `synergy-item ${speedCount >= 2 ? 'active' : ''}`;
    speedEl.innerHTML = `<span>💧 Velocidad (${speedCount}/2)</span> <span>${speedCount >= 2 ? '✓ +25 Vel' : ''}</span>`;
    this.synergiesList.appendChild(speedEl);
  }

  private updateHUD() {
    this.roundDisplay.textContent = `${this.round} / 10`;
    this.winsDisplay.textContent = `🏆 ${this.wins} / 10 Victorias`;

    let heartsStr = '';
    for (let i = 0; i < this.hearts; i++) heartsStr += '❤️ ';
    this.heartsDisplay.textContent = heartsStr.trim() || '💀 0';

    this.goldDisplay.textContent = `💰 ${this.gold} Oro`;
  }

  private updateShopControlsUI() {
    this.freezeBtn.classList.toggle('frozen', this.isFrozen);
    this.freezeText.textContent = this.isFrozen ? '¡Congelada!' : 'Congelar';
  }

  private async startBattle() {
    const hasUnits = this.team.some(u => u !== null);
    if (!hasUnits) {
      alert('¡Debes colocar al menos 1 Axie en tu escuadrón de batalla!');
      return;
    }

    this.isCombatActive = true;
    this.shopContainer.classList.add('hidden');
    this.combatBanner.classList.remove('hidden');
    this.combatLogText.textContent = `¡Comenzando combate de la Ronda ${this.round}!`;

    // Fetch enemy team for this round
    const enemyTeamRound = ENEMY_ROUNDS[Math.min(this.round - 1, ENEMY_ROUNDS.length - 1)];
    const enemyTeam = enemyTeamRound.map(u => ({ ...u }));

    // Render 3D teams
    this.arena.renderTeam('player', this.team);
    this.arena.renderTeam('enemy', enemyTeam);

    // Simulate outcome
    const result = CombatSimulator.simulate(this.team, enemyTeam);

    // Animate Combat Action by Action
    await this.arena.playCombatAnimation(
      result.actions,
      (action) => {
        if (action.message) {
          this.combatLogText.textContent = action.message;
        }
      },
      () => {
        this.finishBattle(result.isVictory, result.isDraw);
      }
    );
  }

  private finishBattle(isVictory: boolean, isDraw: boolean) {
    if (isVictory) {
      this.wins++;
      sounds.playLevelUp();
      this.combatLogText.textContent = '🎉 ¡VICTORIA DE RONDA! +1 Trofeo';
    } else if (isDraw) {
      this.combatLogText.textContent = '⚖️ ¡EMPATE! No se pierden vidas.';
    } else {
      this.hearts--;
      sounds.playGameOver();
      this.combatLogText.textContent = '💔 ¡DERROTA! Pierdes 1 corazón.';
    }

    this.updateHUD();

    setTimeout(() => {
      this.combatBanner.classList.add('hidden');
      this.shopContainer.classList.remove('hidden');
      this.isCombatActive = false;

      // Check Match Victory or Match Defeat
      if (this.wins >= 10) {
        this.handleEndMatch(true);
        return;
      }
      if (this.hearts <= 0) {
        this.handleEndMatch(false);
        return;
      }

      // Next Round Preparation
      this.round++;
      this.gold = 10;
      this.refreshShop();
      this.updateHUD();
      this.arena.renderTeam('player', this.team);
      this.arena.renderTeam('enemy', [null, null, null]);
    }, 1800);
  }

  private handleEndMatch(isVictory: boolean) {
    sounds.stopMusic();
    this.resultScreen.classList.remove('hidden');

    if (isVictory) {
      sounds.playLevelUp();
      this.resultBadge.textContent = '¡CAMPEÓN DE LUNACIA!';
      this.resultBadge.style.color = 'var(--accent-gold)';
      this.resultTitle.textContent = '¡10 Victorias Conseguidas!';
      this.resultSubtitle.textContent = 'Tu escuadrón táctico ha dominado toda la arena del Vibeathon.';
    } else {
      sounds.playGameOver();
      this.resultBadge.textContent = 'FIN DE LA PARTIDA';
      this.resultBadge.style.color = 'var(--accent-beast)';
      this.resultTitle.textContent = 'Has Sido Derrotado';
      this.resultSubtitle.textContent = `Te has quedado sin corazones en la Ronda ${this.round}.`;
    }

    this.finalWins.textContent = `${this.wins} / 10`;
    this.finalRound.textContent = `${this.round}`;
  }

  private loop() {
    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.arena.update(delta);
  }
}

// Start Game Engine
window.addEventListener('DOMContentLoaded', () => {
  new TacticsGame();
});
