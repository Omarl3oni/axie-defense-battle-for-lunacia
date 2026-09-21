import * as THREE from 'three';
import { Arena3D } from './arena-3d';
import {
  TowerType,
  BuildingType,
  PlaceableType,
  TowerInstance,
  BuildingInstance,
  TDEnemy,
  TDProjectile,
  EnemyType,
  TargetingMode,
  RuneConfig,
  GroundHazard,
  TechConfig
} from './tower-defense-types';
import {
  TOWER_CONFIGS,
  BUILDING_CONFIGS,
  TECH_CONFIGS,
  ENEMY_CONFIGS,
  TD_WAVES,
  RUNE_CATALOG
} from './tower-defense-data';
import { sounds } from './audio';
import {
  initLanguage,
  setLanguage,
  getCurrentLanguage,
  t,
  translateDOM,
  getTutorialSteps,
  Language,
  TutorialStepLocalized
} from './i18n';
import { axieNFTManager, AxieNFT, VisualMode } from './axie-nft';

class TowerDefenseGame {
  private arena: Arena3D;
  private lastTime: number = performance.now();

  // Core Game State
  private isGameStarted: boolean = false;
  private lives: number = 10;
  private slp: number = 250; // Starting SLP for initial towers
  private currentWaveIndex: number = 0;
  private isWaveRunning: boolean = false;
  private gameSpeed: number = 1.0;

  // Intermission (Auto-Wave Countdown) State
  private isIntermission: boolean = false;
  private intermissionTimer: number = 5.0;
  private readonly initialIntermission: number = 5.0;
  private readonly betweenWaveIntermission: number = 3.0;
  private lastWarningSecond: number = -1;

  // Active Spell State
  private spellCooldown: number = 0;
  private readonly spellMaxCooldown: number = 25.0;
  private isSpellAiming: boolean = false;

  // Selections & Card Cooldowns
  private selectedBuildType: PlaceableType | null = null;
  private inspectedTower: TowerInstance | null = null;
  private inspectedBuilding: BuildingInstance | null = null;
  private cardCooldowns: Record<string, number> = {
    pomodoro: 0,
    kotaro: 0,
    bing: 0,
    tripp: 0,
    hemp_hut: 0,
    hummer_hut: 0
  };

  // Technologies / Research System (Hummer Hut)
  private unlockedTechs: Set<string> = new Set<string>();
  // Nivel 3 tokens: cantidad de mejoras permitidas por tipo de torre (1 por cada investigación Lv3 completada en un taller)
  private lv3Tokens: Record<TowerType, number> = {
    pomodoro: 0,
    kotaro: 0,
    bing: 0,
    tripp: 0
  };

  // Population / Supply System (Warcraft 3 style)
  private currentPopulation: number = 0;
  private maxPopulation: number = 3; // Base cap

  // Entities
  private towers: TowerInstance[] = [];
  private buildings: BuildingInstance[] = [];
  private enemies: TDEnemy[] = [];
  private projectiles: TDProjectile[] = [];
  private groundHazards: GroundHazard[] = [];
  private nextEnemyId: number = 1;
  private nextProjId: number = 1;
  private nextHazardId: number = 1;

  // Roguelite Runes State
  private activeRunes: RuneConfig[] = [];
  private isDraftingRune: boolean = false;

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
  private slpPill = document.querySelector('.slp-pill') as HTMLElement;
  private popDisplay = document.querySelector('#pop-display') as HTMLElement;
  private popPill = document.querySelector('#pop-pill') as HTMLElement;
  private speedBtn = document.querySelector('#speed-btn') as HTMLElement;
  private musicBtn = document.querySelector('#music-btn') as HTMLElement;
  private startWaveBtn = document.querySelector('#start-wave-btn') as HTMLButtonElement;
  private spellBtn = document.querySelector('#spell-btn') as HTMLElement;
  private spellCooldownOverlay = document.querySelector('#spell-cooldown-overlay') as HTMLElement;
  private activeRunesContainer = document.querySelector('#active-runes-container') as HTMLElement;
  private toastEl = document.querySelector('#td-toast') as HTMLElement;
  private toastTimeout: number | null = null;

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
  private ultimateStatusBox = document.querySelector('#ultimate-status-box') as HTMLElement;
  private ultimateChargeText = document.querySelector('#ultimate-charge-text') as HTMLElement;
  private ultimateFill = document.querySelector('#ultimate-fill') as HTMLElement;
  private ultimateDesc = document.querySelector('#ultimate-desc') as HTMLElement;

  private inspectorTargetingSection = document.querySelector('#inspector-targeting-section') as HTMLElement;
  private inspectorResearchSection = document.querySelector('#inspector-research-section') as HTMLElement;
  private researchTechList = document.querySelector('#research-tech-list') as HTMLElement;
  private towerTechLockNotice = document.querySelector('#tower-tech-lock-notice') as HTMLElement;

  private runeModal = document.querySelector('#rune-modal') as HTMLElement;
  private runeOptionsRow = document.querySelector('#rune-options-row') as HTMLElement;

  private tdUI = document.querySelector('#td-ui') as HTMLElement;
  private startScreen = document.querySelector('#start-screen') as HTMLElement;
  private enterPortalBtn = document.querySelector('#enter-portal-btn') as HTMLElement;
  private fadeBlackOverlay = document.querySelector('#fade-black-overlay') as HTMLElement;
  private runeCurtainOverlay = document.querySelector('#rune-curtain-overlay') as HTMLElement;
  private mainMenuHub = document.querySelector('#main-menu-hub') as HTMLElement;
  private hubPlayBattleBtn = document.querySelector('#hub-play-battle-btn') as HTMLElement;
  private hubBackToCoverBtn = document.querySelector('#hub-back-to-cover-btn') as HTMLElement;
  private hubSettingsBtn = document.querySelector('#hub-settings-btn') as HTMLElement;
  private hubRosterBtn = document.querySelector('#hub-roster-btn') as HTMLElement;
  private hubCodexBtn = document.querySelector('#hub-codex-btn') as HTMLElement;
  private hubTutorialBtn = document.querySelector('#hub-tutorial-btn') as HTMLElement;
  private hubSystemBtn = document.querySelector('#hub-system-btn') as HTMLElement;
  private isPortalTransitioning: boolean = false;
  private transitionStyle: 'curtain' | 'fadeBlack' = 'curtain';

  private codexModal = document.querySelector('#codex-modal') as HTMLElement;
  private openCodexBtn = document.querySelector('#open-codex-btn') as HTMLElement;
  private closeCodexBtn = document.querySelector('#close-codex-btn') as HTMLElement;
  private closeCodexXBtn = document.querySelector('#close-codex-x-btn') as HTMLElement;
  private guideModal = document.querySelector('#guide-modal') as HTMLElement;
  private closeGuideXBtn = document.querySelector('#close-guide-x-btn') as HTMLElement;
  private guideCloseBtn = document.querySelector('#guide-close-btn') as HTMLElement;
  private guidePracticeBtn = document.querySelector('#guide-practice-btn') as HTMLElement;
  private resultMenuBtn = document.querySelector('#result-menu-btn') as HTMLElement;
  private resultScreen = document.querySelector('#result-screen') as HTMLElement;
  private resultBadge = document.querySelector('#result-badge') as HTMLElement;
  private resultTitle = document.querySelector('#result-title') as HTMLElement;
  private resultSubtitle = document.querySelector('#result-subtitle') as HTMLElement;
  private finalWave = document.querySelector('#final-wave') as HTMLElement;
  private finalLives = document.querySelector('#final-lives') as HTMLElement;

  // Tutorial Elements & State
  private tutorialOverlay = document.querySelector('#tutorial-overlay') as HTMLElement;
  private tutorialFocusBox = document.querySelector('#tutorial-focus-box') as HTMLElement;
  private tutorialPointerArrow = document.querySelector('#tutorial-pointer-arrow') as HTMLElement;
  private tutorialCard = document.querySelector('#tutorial-card') as HTMLElement;
  private tutorialTitle = document.querySelector('#tutorial-title') as HTMLElement;
  private tutorialBody = document.querySelector('#tutorial-body') as HTMLElement;
  private tutorialStepTag = document.querySelector('#tutorial-step-tag') as HTMLElement;
  private tutorialGuideAvatar = document.querySelector('.tutorial-guide-avatar') as HTMLElement;
  private tutorialDots = document.querySelector('#tutorial-dots') as HTMLElement;
  private tutorialPrevBtn = document.querySelector('#tutorial-prev-btn') as HTMLButtonElement;
  private tutorialNextBtn = document.querySelector('#tutorial-next-btn') as HTMLButtonElement;
  private tutorialSkipBtn = document.querySelector('#tutorial-skip-btn') as HTMLButtonElement;
  private tutorialCloseBtn = document.querySelector('#tutorial-close-btn') as HTMLButtonElement;
  private currentTutorialStep: number = 0;
  private isTutorialActive: boolean = false;

  // Surrender Elements
  private surrenderHudBtn = document.querySelector('#surrender-hud-btn') as HTMLElement;
  private surrenderModal = document.querySelector('#surrender-modal') as HTMLElement;
  private confirmSurrenderBtn = document.querySelector('#confirm-surrender-btn') as HTMLElement;
  private cancelSurrenderBtn = document.querySelector('#cancel-surrender-btn') as HTMLElement;

  // Settings Modal Elements
  private openSettingsBtn = document.querySelector('#open-settings-btn') as HTMLElement;
  private settingsHudBtn = document.querySelector('#settings-hud-btn') as HTMLElement;
  private settingsModal = document.querySelector('#settings-modal') as HTMLElement;
  private closeSettingsBtn = document.querySelector('#close-settings-btn') as HTMLElement;
  private closeSettingsXBtn = document.querySelector('#close-settings-x-btn') as HTMLElement;
  private musicVolumeSlider = document.querySelector('#music-volume-slider') as HTMLInputElement;
  private musicVolLabel = document.querySelector('#music-vol-label') as HTMLElement;
  private toggleMusicSettingBtn = document.querySelector('#toggle-music-setting-btn') as HTMLElement;
  private sfxVolumeSlider = document.querySelector('#sfx-volume-slider') as HTMLInputElement;
  private sfxVolLabel = document.querySelector('#sfx-vol-label') as HTMLElement;
  private toggleSfxSettingBtn = document.querySelector('#toggle-sfx-setting-btn') as HTMLElement;
  private gfxHighBtn = document.querySelector('#gfx-high-btn') as HTMLElement;
  private gfxEcoBtn = document.querySelector('#gfx-eco-btn') as HTMLElement;

  // Axie Roster & Ronin NFT Elements
  private rosterModal = document.querySelector('#roster-modal') as HTMLElement;
  private openRosterHudBtn = document.querySelector('#open-roster-hud-btn') as HTMLElement;
  private openRosterStartBtn = document.querySelector('#open-roster-start-btn') as HTMLElement;
  private closeRosterXBtn = document.querySelector('#close-roster-x-btn') as HTMLElement;
  private saveRosterBtn = document.querySelector('#save-roster-btn') as HTMLElement;
  private connectRoninBtn = document.querySelector('#connect-ronin-btn') as HTMLElement;
  private roninBtnText = document.querySelector('#ronin-btn-text') as HTMLElement;
  private roninStatusLabel = document.querySelector('#ronin-status-label') as HTMLElement;
  private refreshRoninBtn = document.querySelector('#refresh-ronin-btn') as HTMLElement;
  private isRosterLoading = false;
  private rosterLoadingText = '';
  private axieIdInput = document.querySelector('#axie-id-input') as HTMLInputElement;
  private addAxieBtn = document.querySelector('#add-axie-btn') as HTMLElement;
  private loadDemoBtn = document.querySelector('#load-demo-btn') as HTMLElement;
  private modeBillboardBtn = document.querySelector('#mode-billboard-btn') as HTMLElement;
  private modeMascotBtn = document.querySelector('#mode-mascot-btn') as HTMLElement;
  private resetLoadoutBtn = document.querySelector('#reset-loadout-btn') as HTMLElement;
  private rosterCollectionGrid = document.querySelector('#roster-collection-grid') as HTMLElement;
  private availableCountBadge = document.querySelector('#available-count-badge') as HTMLElement;
  private rosterTabWallet = document.querySelector('#roster-tab-wallet') as HTMLElement;
  private rosterTabDemo = document.querySelector('#roster-tab-demo') as HTMLElement;
  private rosterTabAll = document.querySelector('#roster-tab-all') as HTMLElement;
  private walletCountBadge = document.querySelector('#wallet-count-badge') as HTMLElement;
  private demoCountBadge = document.querySelector('#demo-count-badge') as HTMLElement;
  private rosterFilterInput = document.querySelector('#roster-filter-input') as HTMLInputElement;
  private rosterLoadMoreBtn = document.querySelector('#roster-load-more-btn') as HTMLElement;
  private loadMoreCount = document.querySelector('#load-more-count') as HTMLElement;
  private activeRosterTab: 'wallet' | 'demo' | 'all' = 'all';
  private activeRosterClass: string = 'all';
  private rosterSearchQuery: string = '';

  // Axie Detail & Inspection Modal Elements
  private axieDetailModal = document.querySelector('#axie-detail-modal') as HTMLElement;
  private closeAxieDetailBtn = document.querySelector('#close-axie-detail-btn') as HTMLElement;
  private detailClassBadge = document.querySelector('#detail-class-badge') as HTMLElement;
  private detailSpecialBadge = document.querySelector('#detail-special-badge') as HTMLElement;
  private detailAxieImg = document.querySelector('#detail-axie-img') as HTMLImageElement;
  private detailAxieName = document.querySelector('#detail-axie-name') as HTMLElement;
  private detailAxieId = document.querySelector('#detail-axie-id') as HTMLElement;
  private detailAxieSource = document.querySelector('#detail-axie-source') as HTMLElement;
  private detailSynergyDesc = document.querySelector('#detail-synergy-desc') as HTMLElement;
  private detailSpecialSynergy = document.querySelector('#detail-special-synergy') as HTMLElement;
  private detailExplorerLink = document.querySelector('#detail-explorer-link') as HTMLAnchorElement;
  private selectedDetailAxie: AxieNFT | null = null;

  constructor() {
    const canvasWrap = document.querySelector('#canvas-wrap') as HTMLElement;
    this.arena = new Arena3D(canvasWrap);

    initLanguage();
    translateDOM();

    const savedTransition = localStorage.getItem('axie_transition_style');
    if (savedTransition && ['curtain', 'fadeBlack'].includes(savedTransition)) {
      this.transitionStyle = savedTransition as 'curtain' | 'fadeBlack';
    } else {
      this.transitionStyle = 'curtain';
    }

    this.setupUIEvents();
    this.syncSettingsUI();
    this.initAxieRoster();
    this.updateBottomDockCards();
    this.initPreload();

    // Start title BGM on first user interaction (abiding by browser autoplay restrictions)
    const initTitleAudio = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('#welcome-music-btn')) {
        return;
      }
      if (!this.isGameStarted && sounds.getMusicVolume() > 0 && !sounds.isMusicRunning()) {
        sounds.playTitleMusic(true);
      }
      window.removeEventListener('pointerdown', initTitleAudio);
      window.removeEventListener('keydown', initTitleAudio);
    };
    window.addEventListener('pointerdown', initTitleAudio);
    window.addEventListener('keydown', initTitleAudio);

    // Also attempt immediate play if permissions allow
    if (sounds.getMusicVolume() > 0) {
      sounds.playTitleMusic(true);
    }

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
      'paladill.glb',
      'sapidae-f-a.glb',
      'sapidae-m-b.glb'
    ];
    await this.arena.preloadModels(models);
  }

  private setupUIEvents() {
    // Language Switcher in Start Screen
    document.querySelectorAll('.btn-lang').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang') as Language;
        if (lang) {
          setLanguage(lang);
          this.onLanguageChanged();
          sounds.playGem();
        }
      });
    });

    // Surrender HUD Button & Confirmation Modal
    if (this.surrenderHudBtn) {
      this.surrenderHudBtn.addEventListener('click', () => {
        if (!this.isGameStarted) return;
        this.surrenderModal.classList.remove('hidden');
        sounds.playGem();
      });
    }

    if (this.confirmSurrenderBtn) {
      this.confirmSurrenderBtn.addEventListener('click', () => {
        this.surrenderGame();
      });
    }

    if (this.cancelSurrenderBtn) {
      this.cancelSurrenderBtn.addEventListener('click', () => {
        this.surrenderModal.classList.add('hidden');
        sounds.playHit();
      });
    }

    // Title Screen "ENTRAR A LUNACIA" & Click/Key Enter
    if (this.enterPortalBtn) {
      this.enterPortalBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterMainMenuHub();
      });
    }

    if (this.startScreen) {
      this.startScreen.addEventListener('click', () => {
        if (!this.startScreen.classList.contains('hidden') && !this.isPortalTransitioning) {
          this.enterMainMenuHub();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (!this.startScreen.classList.contains('hidden') && !this.isPortalTransitioning) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          this.enterMainMenuHub();
        }
      }
    });

    // Main Menu Hub Action Listeners
    if (this.hubPlayBattleBtn) {
      this.hubPlayBattleBtn.addEventListener('click', () => {
        this.startGameFromHub();
      });
    }

    if (this.hubBackToCoverBtn) {
      this.hubBackToCoverBtn.addEventListener('click', () => {
        this.backToTitleCover();
      });
    }

    if (this.hubSettingsBtn) {
      this.hubSettingsBtn.addEventListener('click', () => {
        this.openSettings();
      });
    }

    if (this.hubSystemBtn) {
      this.hubSystemBtn.addEventListener('click', () => {
        this.openSettings();
      });
    }

    if (this.hubRosterBtn) {
      this.hubRosterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Disabled for v1.1 release
      });
    }

    if (this.hubCodexBtn) {
      this.hubCodexBtn.addEventListener('click', () => {
        this.openCodex();
      });
    }

    if (this.hubTutorialBtn) {
      this.hubTutorialBtn.addEventListener('click', () => {
        this.openGuideModal();
      });
    }

    // Settings Modal Open / Close & Controls
    if (this.openSettingsBtn) {
      this.openSettingsBtn.addEventListener('click', () => {
        this.openSettings();
      });
    }

    if (this.settingsHudBtn) {
      this.settingsHudBtn.addEventListener('click', () => {
        this.openSettings();
      });
    }

    if (this.closeSettingsBtn) {
      this.closeSettingsBtn.addEventListener('click', () => {
        this.closeSettings();
      });
    }

    if (this.closeSettingsXBtn) {
      this.closeSettingsXBtn.addEventListener('click', () => {
        this.closeSettings();
      });
    }

    if (this.musicVolumeSlider) {
      this.musicVolumeSlider.addEventListener('input', () => {
        const val = parseInt(this.musicVolumeSlider.value, 10);
        this.updateMusicVolumeUI(val);
        sounds.setMusicVolume(val / 100);
        if (val > 0 && !sounds.isMusicRunning()) {
          sounds.startMusic();
        }
      });
    }

    if (this.toggleMusicSettingBtn) {
      this.toggleMusicSettingBtn.addEventListener('click', () => {
        const currentVol = sounds.getMusicVolume();
        if (currentVol > 0) {
          sounds.setMusicVolume(0);
          this.updateMusicVolumeUI(0);
          if (this.musicVolumeSlider) this.musicVolumeSlider.value = '0';
        } else {
          sounds.setMusicVolume(0.7);
          this.updateMusicVolumeUI(70);
          if (this.musicVolumeSlider) this.musicVolumeSlider.value = '70';
          if (!sounds.isMusicRunning()) sounds.startMusic();
        }
        sounds.playGem();
      });
    }

    if (this.sfxVolumeSlider) {
      this.sfxVolumeSlider.addEventListener('input', () => {
        const val = parseInt(this.sfxVolumeSlider.value, 10);
        this.updateSfxVolumeUI(val);
        sounds.setSfxVolume(val / 100);
      });
    }

    if (this.toggleSfxSettingBtn) {
      this.toggleSfxSettingBtn.addEventListener('click', () => {
        const currentVol = sounds.getSfxVolume();
        if (currentVol > 0) {
          sounds.setSfxVolume(0);
          this.updateSfxVolumeUI(0);
          if (this.sfxVolumeSlider) this.sfxVolumeSlider.value = '0';
        } else {
          sounds.setSfxVolume(0.8);
          this.updateSfxVolumeUI(80);
          if (this.sfxVolumeSlider) this.sfxVolumeSlider.value = '80';
          sounds.playGem();
        }
      });
    }

    if (this.gfxHighBtn) {
      this.gfxHighBtn.addEventListener('click', () => {
        this.setGraphicsQuality('high');
        sounds.playGem();
      });
    }

    if (this.gfxEcoBtn) {
      this.gfxEcoBtn.addEventListener('click', () => {
        this.setGraphicsQuality('eco');
        sounds.playGem();
      });
    }


    // Codex Open/Close & Tab Switching
    if (this.openCodexBtn) {
      this.openCodexBtn.addEventListener('click', () => {
        this.openCodex();
      });
    }

    if (this.closeCodexBtn) {
      this.closeCodexBtn.addEventListener('click', () => {
        this.closeCodex();
      });
    }

    if (this.closeCodexXBtn) {
      this.closeCodexXBtn.addEventListener('click', () => {
        this.closeCodex();
      });
    }

    // Tutorial Close Button
    if (this.tutorialCloseBtn) {
      this.tutorialCloseBtn.addEventListener('click', () => {
        this.closeTutorial();
      });
    }

    // Close Modals on backdrop click
    if (this.settingsModal) {
      this.settingsModal.addEventListener('click', (e) => {
        if (e.target === this.settingsModal) {
          this.closeSettings();
        }
      });
    }

    if (this.codexModal) {
      this.codexModal.addEventListener('click', (e) => {
        if (e.target === this.codexModal) {
          this.closeCodex();
        }
      });
    }

    // Guide Modal Listeners
    if (this.closeGuideXBtn) {
      this.closeGuideXBtn.addEventListener('click', () => {
        this.closeGuideModal();
      });
    }
    if (this.guideCloseBtn) {
      this.guideCloseBtn.addEventListener('click', () => {
        this.closeGuideModal();
      });
    }
    if (this.guidePracticeBtn) {
      this.guidePracticeBtn.addEventListener('click', () => {
        this.closeGuideModal();
        this.startTutorial();
      });
    }
    if (this.guideModal) {
      this.guideModal.addEventListener('click', (e) => {
        if (e.target === this.guideModal) {
          this.closeGuideModal();
        }
      });
    }

    document.querySelectorAll('.btn-codex-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const tab = tabBtn.getAttribute('data-tab');
        this.switchCodexTab(tab);
      });
    });

    document.querySelectorAll('.btn-guide-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const tab = tabBtn.getAttribute('data-tab');
        if (tab) this.switchGuideTab(tab);
      });
    });

    // Result Screen Return to Main Menu
    if (this.resultMenuBtn) {
      this.resultMenuBtn.addEventListener('click', () => {
        this.returnToMainMenu();
      });
    }

    // Top HUD Tutorial Replay Button
    const tutorialHudBtn = document.querySelector('#tutorial-hud-btn') as HTMLElement;
    if (tutorialHudBtn) {
      tutorialHudBtn.addEventListener('click', () => {
        this.openGuideModal();
      });
    }

    // Tutorial Navigation Buttons
    if (this.tutorialNextBtn) {
      this.tutorialNextBtn.addEventListener('click', () => this.nextTutorialStep());
    }
    if (this.tutorialPrevBtn) {
      this.tutorialPrevBtn.addEventListener('click', () => this.prevTutorialStep());
    }
    if (this.tutorialSkipBtn) {
      this.tutorialSkipBtn.addEventListener('click', () => this.finishTutorial());
    }

    // Restart Game Button
    const restartBtn = document.querySelector('#restart-game-btn') as HTMLElement;
    restartBtn.addEventListener('click', () => {
      this.resultScreen.classList.add('hidden');
      this.resetGame();
      if (sounds.getMusicVolume() > 0) {
        sounds.playBattleMusic();
      }
    });

    // Speed Toggle Button
    this.speedBtn.addEventListener('click', () => {
      this.gameSpeed = this.gameSpeed === 1.0 ? 2.0 : 1.0;
      this.speedBtn.textContent = `⏩ x${this.gameSpeed}`;
      sounds.playGem();
    });

    // Music Toggle Button in HUD
    if (this.musicBtn) {
      this.musicBtn.addEventListener('click', () => {
        const isPlaying = sounds.toggleMusic();
        this.musicBtn.textContent = isPlaying ? '🎵' : '🔇';
        this.musicBtn.classList.toggle('muted', !isPlaying);
      });
    }

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
      if (this.isSpellAiming) {
        this.deselectBuildType();
        this.showToast(t('toastSpellAim'));
      }
    });

    // Bottom Tower & Building Cards Click (Select Tower or Building to place)
    const towerCards = document.querySelectorAll('.tower-card');
    towerCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const towerType = card.getAttribute('data-tower') as TowerType | null;
        const buildingType = card.getAttribute('data-building') as BuildingType | null;
        const type: PlaceableType = (towerType || buildingType)!;

        const isBuilding = !!buildingType;
        const name = isBuilding ? BUILDING_CONFIGS[buildingType].name : TOWER_CONFIGS[towerType!].name;
        const cost = isBuilding ? BUILDING_CONFIGS[buildingType].cost : TOWER_CONFIGS[towerType!].cost;

        if (this.cardCooldowns[type] > 0) {
          sounds.playError();
          this.showToast(t('toastTowerCooldown', { name, sec: Math.ceil(this.cardCooldowns[type]) }), 'error');
          return;
        }

        // Population constraint check if selecting a tower
        if (!isBuilding && this.currentPopulation >= this.maxPopulation) {
          sounds.playError();
          this.showToast(t('toastPopLimit', { cur: this.currentPopulation, max: this.maxPopulation }), 'error');
          this.triggerPopError();
          return;
        }

        if (this.selectedBuildType === type) {
          // Deselect
          this.deselectBuildType();
          sounds.playHit();
        } else {
          towerCards.forEach(c => c.classList.remove('selected'));
          this.selectedBuildType = type;
          card.classList.add('selected');
          sounds.playHit();
          if (this.slp < cost) {
            this.triggerSlpError(cost, name);
          }
        }

        this.closeInspector();
      });
    });

    // Inspector Action Buttons
    this.closeInspectorBtn.addEventListener('click', () => this.closeInspector());
    this.upgradeTowerBtn.addEventListener('click', () => this.upgradeSelectedTower());
    this.sellTowerBtn.addEventListener('click', () => this.sellSelectedTower());

    // Targeting Mode Buttons in Inspector
    const targetModeBtns = document.querySelectorAll('.btn-target-mode');
    targetModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.inspectedTower) return;
        const mode = btn.getAttribute('data-mode') as TargetingMode;
        this.inspectedTower.targetingMode = mode;
        targetModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sounds.playShoot();
      });
    });

    // Keyboard shortcuts for tutorial, modal navigation, overlays, and inspector
    window.addEventListener('keydown', (e) => {
      // Interactive Guided Tutorial keyboard navigation
      if (this.isTutorialActive) {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          e.preventDefault();
          this.nextTutorialStep();
          return;
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prevTutorialStep();
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.closeTutorial();
          return;
        }
      }

      // Tactical Guide Modal arrow navigation between tabs
      if (this.guideModal && !this.guideModal.classList.contains('hidden')) {
        const tabs = ['basics', 'buildings', 'defenders', 'tactics'];
        const activeTabBtn = document.querySelector('.btn-guide-tab.active');
        const currentTab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'basics';
        const currentIndex = tabs.indexOf(currentTab || 'basics');
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextTab = tabs[(currentIndex + 1) % tabs.length];
          this.switchGuideTab(nextTab);
          return;
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
          this.switchGuideTab(prevTab);
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.closeGuideModal();
          return;
        }
      }

      if (e.key === 'Escape') {
        if (this.axieDetailModal && !this.axieDetailModal.classList.contains('hidden')) {
          this.closeAxieDetailModal();
          return;
        }
        if (this.rosterModal && !this.rosterModal.classList.contains('hidden')) {
          this.closeRosterModal();
          return;
        }
        if (this.settingsModal && !this.settingsModal.classList.contains('hidden')) {
          this.closeSettings();
          return;
        }
        if (this.codexModal && !this.codexModal.classList.contains('hidden')) {
          this.closeCodex();
          return;
        }
        if (this.selectedBuildType || this.isSpellAiming) {
          this.deselectBuildType();
          this.isSpellAiming = false;
          this.spellBtn.style.borderColor = 'var(--accent-gold)';
          sounds.playHit();
        } else if (this.inspectedTower) {
          this.closeInspector();
        }
      }
    });

    // Right-click (Context Menu) shortcut to cancel tower placement or close inspector
    window.addEventListener('contextmenu', (e) => {
      if (this.isTutorialActive) {
        e.preventDefault();
        return;
      }
      if (this.selectedBuildType || this.isSpellAiming) {
        e.preventDefault();
        this.deselectBuildType();
        this.isSpellAiming = false;
        this.spellBtn.style.borderColor = 'var(--accent-gold)';
        sounds.playHit();
      } else if (this.inspectedTower) {
        e.preventDefault();
        this.closeInspector();
      }
    });

    // Pointer Move for Placement Hologram
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));

    // Canvas 3D Click Handling
    window.addEventListener('click', (e) => this.onCanvasClick(e));

    // Resize listener to reposition tutorial elements
    window.addEventListener('resize', () => {
      if (this.isTutorialActive) {
        this.positionTutorialElements();
      }
    });
  }

  private enterMainMenuHub() {
    if (this.isPortalTransitioning) return;
    this.isPortalTransitioning = true;
    sounds.playGem();

    if (this.transitionStyle === 'curtain') {
      // OPTION: Ancestral Lunacia Vault Gates with Royal Seal Lock & Light Burst
      const curtainDoors = document.querySelectorAll('.curtain-door');
      const centralSeal = document.querySelector('#curtain-central-seal') as HTMLElement | null;
      const lightShaft = document.querySelector('.curtain-light-shaft') as HTMLElement | null;
      const impactFlare = document.querySelector('.curtain-seam-impact') as HTMLElement | null;

      if (this.runeCurtainOverlay) {
        this.runeCurtainOverlay.classList.remove('hidden');
        this.runeCurtainOverlay.classList.add('active');
        curtainDoors.forEach(d => d.classList.remove('closing', 'opening'));
        if (centralSeal) centralSeal.classList.remove('seal-locked', 'seal-unlocking');
        if (lightShaft) lightShaft.classList.remove('flood');
        if (impactFlare) impactFlare.classList.remove('impact-active');
        void this.runeCurtainOverlay.offsetWidth;
      }

      // 1. Gates slide smoothly into view from both sides (620ms)
      requestAnimationFrame(() => {
        curtainDoors.forEach(d => d.classList.add('closing'));
      });

      // 2. Lock & Impact moment at 580ms: gates meet, royal seal locks on, seam flashes
      setTimeout(() => {
        if (centralSeal) centralSeal.classList.add('seal-locked');
        if (impactFlare) impactFlare.classList.add('impact-active');
        sounds.playHit();

        // Switch screens cleanly behind the locked vault gates
        if (this.startScreen) this.startScreen.classList.add('hidden');
        if (this.mainMenuHub) this.mainMenuHub.classList.remove('hidden');
        this.arena.setTitleCamera();
        if (sounds.getMusicVolume() > 0) {
          sounds.playTitleMusic(false);
        }

        // 3. At 1050ms: Seal unlocks with radiant burst, light floods in, gates part open
        setTimeout(() => {
          if (centralSeal) {
            centralSeal.classList.remove('seal-locked');
            centralSeal.classList.add('seal-unlocking');
          }
          if (lightShaft) {
            lightShaft.classList.add('flood');
          }
          curtainDoors.forEach(d => {
            d.classList.remove('closing');
            d.classList.add('opening');
          });
          sounds.playGem();

          // 4. Finish transition after gates fully retract and light settles (700ms)
          setTimeout(() => {
            if (this.runeCurtainOverlay) {
              this.runeCurtainOverlay.classList.remove('active');
              this.runeCurtainOverlay.classList.add('hidden');
            }
            curtainDoors.forEach(d => d.classList.remove('opening'));
            if (centralSeal) centralSeal.classList.remove('seal-unlocking');
            if (lightShaft) lightShaft.classList.remove('flood');
            if (impactFlare) impactFlare.classList.remove('impact-active');
            this.isPortalTransitioning = false;
          }, 700);
        }, 470);
      }, 580);
    } else {
      // OPTION: Fade to Black (Cinematic Clean)
      if (this.fadeBlackOverlay) {
        this.fadeBlackOverlay.classList.remove('hidden');
        void this.fadeBlackOverlay.offsetWidth;
        this.fadeBlackOverlay.classList.add('active');
      }

      setTimeout(() => {
        if (this.startScreen) this.startScreen.classList.add('hidden');
        if (this.mainMenuHub) this.mainMenuHub.classList.remove('hidden');
        this.arena.setTitleCamera();
        if (sounds.getMusicVolume() > 0) {
          sounds.playTitleMusic(false);
        }

        setTimeout(() => {
          if (this.fadeBlackOverlay) {
            this.fadeBlackOverlay.classList.remove('active');
          }
          setTimeout(() => {
            if (this.fadeBlackOverlay) this.fadeBlackOverlay.classList.add('hidden');
            this.isPortalTransitioning = false;
          }, 380);
        }, 100);
      }, 400);
    }
  }

  private backToTitleCover() {
    if (this.mainMenuHub) this.mainMenuHub.classList.add('hidden');
    if (this.startScreen) {
      this.startScreen.classList.remove('hidden');
    }
    this.arena.setTitleCamera();
    sounds.playGem();
  }

  private startGameFromHub() {
    this.isGameStarted = true;
    if (this.mainMenuHub) this.mainMenuHub.classList.add('hidden');
    if (this.startScreen) this.startScreen.classList.add('hidden');
    if (this.settingsModal) this.settingsModal.classList.add('hidden');
    this.tdUI.classList.remove('hidden');
    this.arena.setGameCamera(true);
    localStorage.setItem('axie_td_tutorial_seen', 'true');
    this.resetGame();
    sounds.playGem();
    if (sounds.getMusicVolume() > 0) {
      sounds.playBattleMusic(true);
    }
  }

  private returnToMainMenu() {
    this.isGameStarted = false;
    this.isWaveRunning = false;
    this.isIntermission = false;
    this.resultScreen.classList.add('hidden');
    this.surrenderModal.classList.add('hidden');
    this.runeModal.classList.add('hidden');
    if (this.settingsModal) this.settingsModal.classList.add('hidden');
    this.closeInspector();
    this.deselectBuildType();
    if (this.isTutorialActive) {
      this.isTutorialActive = false;
      this.tutorialOverlay.classList.add('hidden');
    }
    this.tdUI.classList.add('hidden');
    if (this.startScreen) this.startScreen.classList.add('hidden');
    if (this.mainMenuHub) this.mainMenuHub.classList.remove('hidden');
    this.arena.setTitleCamera();
    this.resetGame();
    this.updateHUD();
    sounds.playGem();
    if (sounds.getMusicVolume() > 0) {
      sounds.playTitleMusic(true);
    }
  }

  private openSettings() {
    if (!this.settingsModal) return;
    this.syncSettingsUI();
    this.settingsModal.classList.remove('hidden');
    sounds.playGem();
  }

  private closeSettings() {
    if (!this.settingsModal) return;
    this.settingsModal.classList.add('hidden');
    sounds.playHit();
  }

  private syncSettingsUI() {
    const musicVol = Math.round(sounds.getMusicVolume() * 100);
    const sfxVol = Math.round(sounds.getSfxVolume() * 100);

    if (this.musicVolumeSlider) this.musicVolumeSlider.value = musicVol.toString();
    this.updateMusicVolumeUI(musicVol);

    if (this.sfxVolumeSlider) this.sfxVolumeSlider.value = sfxVol.toString();
    this.updateSfxVolumeUI(sfxVol);

    const gfxQuality = (localStorage.getItem('axie_gfx_quality') as 'high' | 'eco') || 'high';
    this.updateGfxButtonsUI(gfxQuality);
  }

  private updateMusicVolumeUI(val: number) {
    if (this.musicVolLabel) this.musicVolLabel.textContent = `${val}%`;
    if (this.toggleMusicSettingBtn) {
      const isActive = val > 0;
      this.toggleMusicSettingBtn.classList.toggle('active', isActive);
      this.toggleMusicSettingBtn.textContent = isActive ? 'ON' : 'OFF';
    }
  }

  private updateSfxVolumeUI(val: number) {
    if (this.sfxVolLabel) this.sfxVolLabel.textContent = `${val}%`;
    if (this.toggleSfxSettingBtn) {
      const isActive = val > 0;
      this.toggleSfxSettingBtn.classList.toggle('active', isActive);
      this.toggleSfxSettingBtn.textContent = isActive ? 'ON' : 'OFF';
    }
  }

  private setGraphicsQuality(mode: 'high' | 'eco') {
    localStorage.setItem('axie_gfx_quality', mode);
    this.arena.setGraphicsQuality(mode);
    this.updateGfxButtonsUI(mode);
  }

  private updateGfxButtonsUI(mode: 'high' | 'eco') {
    if (this.gfxHighBtn) this.gfxHighBtn.classList.toggle('active', mode === 'high');
    if (this.gfxEcoBtn) this.gfxEcoBtn.classList.toggle('active', mode === 'eco');
  }

  private openCodex() {
    if (this.codexModal) {
      this.codexModal.classList.remove('hidden');
      this.switchCodexTab('defenders');
      sounds.playGem();
    }
  }

  private closeCodex() {
    if (this.codexModal) {
      this.codexModal.classList.add('hidden');
      sounds.playHit();
    }
  }

  private switchCodexTab(tabName: string | null) {
    if (!tabName) return;
    document.querySelectorAll('.btn-codex-tab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.codex-tab-pane').forEach(p => {
      p.classList.add('hidden');
    });
    const targetPane = document.querySelector(`#codex-tab-${tabName}`);
    if (targetPane) {
      targetPane.classList.remove('hidden');
    }
    sounds.playHit();
  }

  private switchGuideTab(tabName: string) {
    document.querySelectorAll('.btn-guide-tab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.guide-tab-panel').forEach(panel => {
      panel.classList.add('hidden');
    });
    const targetPane = document.querySelector(`#guide-tab-${tabName}`);
    if (targetPane) {
      targetPane.classList.remove('hidden');
    }
    sounds.playHit();
  }

  private openGuideModal() {
    if (this.guideModal) {
      this.switchGuideTab('basics');
      this.guideModal.classList.remove('hidden');
      sounds.playGem();
    }
  }

  private closeGuideModal() {
    if (this.guideModal) {
      this.guideModal.classList.add('hidden');
      sounds.playHit();
    }
  }

  private isAnyModalOpen(): boolean {
    return !!(
      (this.settingsModal && !this.settingsModal.classList.contains('hidden')) ||
      (this.codexModal && !this.codexModal.classList.contains('hidden')) ||
      (this.guideModal && !this.guideModal.classList.contains('hidden')) ||
      (this.rosterModal && !this.rosterModal.classList.contains('hidden')) ||
      (this.axieDetailModal && !this.axieDetailModal.classList.contains('hidden')) ||
      (this.surrenderModal && !this.surrenderModal.classList.contains('hidden'))
    );
  }

  // --- Axie Roster & Ronin Loadout System ---
  private initAxieRoster() {
    if (this.openRosterStartBtn) {
      this.openRosterStartBtn.addEventListener('click', () => this.openRosterModal());
    }
    if (this.openRosterHudBtn) {
      this.openRosterHudBtn.addEventListener('click', () => this.openRosterModal());
    }

    if (this.closeRosterXBtn) {
      this.closeRosterXBtn.addEventListener('click', () => this.closeRosterModal());
    }
    if (this.saveRosterBtn) {
      this.saveRosterBtn.addEventListener('click', () => {
        sounds.playLevelUp();
        this.showToast('¡Equipo defensor guardado con éxito!', 'info');
        this.closeRosterModal();
      });
    }

    if (this.rosterModal) {
      this.rosterModal.addEventListener('click', (e) => {
        if (e.target === this.rosterModal) {
          this.closeRosterModal();
        }
      });
    }

    if (this.connectRoninBtn) {
      this.connectRoninBtn.addEventListener('click', async () => {
        const loadout = axieNFTManager.getLoadout();
        if (loadout.roninAddress) {
          axieNFTManager.disconnectRonin();
          sounds.playHit();
          this.showToast('Billetera Ronin desconectada', 'info');
          this.setRosterTab('all');
          this.renderRosterUI();
        } else {
          try {
            sounds.playHit();
            if (this.roninBtnText) this.roninBtnText.textContent = '⏳ Conectando...';
            this.setRosterLoading(true, 'Conectando con Ronin Wallet...');
            const res = await axieNFTManager.connectRonin();
            sounds.playLevelUp();
            if (res.axieCount > 0) {
              this.showToast(`¡Ronin conectado! Se sincronizaron ${res.axieCount} Axies on-chain. 🦊`, 'info');
              this.setRosterTab('wallet');
            } else {
              const short = `${res.address.slice(0, 10)}...`;
              this.showToast(`¡Ronin conectado (${short})! No se encontraron Axies NFT en esta dirección. Puedes introducir Axie IDs o usar el equipo Demo.`, 'info');
            }
          } catch (err: any) {
            sounds.playError();
            this.showToast(err.message || 'No se detectó Ronin Wallet. Puedes escribir tu dirección o cargar por ID.', 'error');
          } finally {
            this.setRosterLoading(false);
            this.renderRosterUI();
          }
        }
      });
    }

    if (this.refreshRoninBtn) {
      this.refreshRoninBtn.addEventListener('click', async () => {
        try {
          sounds.playHit();
          this.setRosterLoading(true, 'Actualizando Axies on-chain...');
          const axies = await axieNFTManager.refreshWalletAxies();
          sounds.playLevelUp();
          if (axies.length > 0) {
            this.showToast(`¡Billetera sincronizada! ${axies.length} Axies encontrados. 🦊`, 'info');
            this.setRosterTab('wallet');
          } else {
            this.showToast('Billetera sincronizada. No se encontraron Axies NFT.', 'info');
          }
        } catch (err: any) {
          sounds.playError();
          this.showToast(err.message || 'Error al sincronizar con Ronin', 'error');
        } finally {
          this.setRosterLoading(false);
          this.renderRosterUI();
        }
      });
    }

    if (this.addAxieBtn && this.axieIdInput) {
      const handleAdd = async () => {
        const val = this.axieIdInput.value.trim();
        if (!val) return;
        try {
          this.addAxieBtn.textContent = '⏳...';
          this.setRosterLoading(true, 'Consultando en la blockchain Ronin...');
          const res = await axieNFTManager.addAxieByIdOrAddress(val);
          this.axieIdInput.value = '';
          sounds.playLevelUp();
          if (Array.isArray(res)) {
            if (res.length > 0) {
              this.showToast(`¡Se cargaron ${res.length} Axies on-chain de la billetera! 🦊`, 'info');
              this.setRosterTab('wallet');
            } else {
              this.showToast('Billetera conectada, pero no tiene Axies NFT. Prueba cargar por ID individual.', 'info');
            }
          } else {
            this.showToast(`¡Axie #${res.id} (${res.class}) sincronizado desde la blockchain!`, 'info');
          }
        } catch (e: any) {
          sounds.playError();
          this.showToast(e.message || 'Error al consultar el Axie o billetera en Ronin', 'error');
        } finally {
          this.addAxieBtn.textContent = '🔍 Cargar';
          this.setRosterLoading(false);
          this.renderRosterUI();
        }
      };

      this.addAxieBtn.addEventListener('click', handleAdd);
      this.axieIdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAdd();
      });
    }

    if (this.loadDemoBtn) {
      this.loadDemoBtn.addEventListener('click', () => {
        axieNFTManager.loadDemoTeam();
        sounds.playLevelUp();
        this.showToast('¡Equipo Demo de Axies cargado con éxito!', 'info');
        this.setRosterTab('demo');
        this.renderRosterUI();
        this.updateBottomDockCards();
      });
    }

    if (this.modeBillboardBtn && this.modeMascotBtn) {
      this.modeBillboardBtn.addEventListener('click', () => {
        axieNFTManager.setVisualMode('billboard_25d');
        sounds.playHit();
        this.renderRosterUI();
      });
      this.modeMascotBtn.addEventListener('click', () => {
        axieNFTManager.setVisualMode('mascot_3d');
        sounds.playHit();
        this.renderRosterUI();
      });
    }

    if (this.resetLoadoutBtn) {
      this.resetLoadoutBtn.addEventListener('click', () => {
        axieNFTManager.resetToDefaults();
        sounds.playHit();
        this.showToast('Defensores restaurados a los Starters originales', 'info');
        this.renderRosterUI();
        this.updateBottomDockCards();
      });
    }

    // Source Tabs (Wallet vs Demo vs All)
    if (this.rosterTabWallet) {
      this.rosterTabWallet.addEventListener('click', () => this.setRosterTab('wallet'));
    }
    if (this.rosterTabDemo) {
      this.rosterTabDemo.addEventListener('click', () => this.setRosterTab('demo'));
    }
    if (this.rosterTabAll) {
      this.rosterTabAll.addEventListener('click', () => this.setRosterTab('all'));
    }

    // Class Filter Chips
    const chips = document.querySelectorAll('.roster-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeRosterClass = chip.getAttribute('data-class') || 'all';
        sounds.playHit();
        this.renderRosterUI();
      });
    });

    // Search input
    if (this.rosterFilterInput) {
      this.rosterFilterInput.addEventListener('input', () => {
        this.rosterSearchQuery = this.rosterFilterInput.value.trim().toLowerCase();
        this.renderRosterUI();
      });
    }

    // Load More Button
    if (this.rosterLoadMoreBtn) {
      this.rosterLoadMoreBtn.addEventListener('click', async () => {
        try {
          this.rosterLoadMoreBtn.setAttribute('disabled', 'true');
          const originalText = this.rosterLoadMoreBtn.innerHTML;
          this.rosterLoadMoreBtn.innerHTML = '⏳ Sincronizando más Axies on-chain...';
          const more = await axieNFTManager.fetchMoreWalletAxies(40);
          sounds.playLevelUp();
          this.showToast(`¡Se cargaron ${more.length} Axies más de tu billetera! 🦊`, 'info');
        } catch (e: any) {
          sounds.playError();
          this.showToast(e.message || 'Error al cargar más Axies', 'error');
        } finally {
          this.rosterLoadMoreBtn.removeAttribute('disabled');
          this.renderRosterUI();
        }
      });
    }

    // Loadout slot cards interaction
    document.querySelectorAll('.loadout-slot-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.btn-clear-slot')) return;
        const slot = card.getAttribute('data-slot') as TowerType;
        if (!slot) return;

        const currentCustom = axieNFTManager.getAxieForTowerType(slot);
        if (currentCustom) {
          // Inspect the currently equipped Axie
          this.openAxieDetailModal(currentCustom);
        } else {
          // Filter the roster to match this slot's affinity class
          const targetClass = slot === 'pomodoro' ? 'Plant' :
                              slot === 'kotaro' ? 'Beast' :
                              slot === 'bing' ? 'Aqua' : 'Bird';
          this.activeRosterClass = targetClass;
          document.querySelectorAll('.roster-chip').forEach(c => {
            c.classList.toggle('active', c.getAttribute('data-class') === targetClass);
          });
          document.querySelectorAll('.loadout-slot-card').forEach(c => c.classList.remove('slot-active-filter'));
          card.classList.add('slot-active-filter');
          sounds.playHit();
          this.renderRosterUI();
        }
      });
    });

    // Clear slot buttons
    document.querySelectorAll('.btn-clear-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot = btn.getAttribute('data-slot') as TowerType;
        if (slot) {
          axieNFTManager.clearSlot(slot);
          sounds.playHit();
          this.renderRosterUI();
          this.updateBottomDockCards();
        }
      });
    });

    // Axie Detail Modal buttons
    if (this.closeAxieDetailBtn) {
      this.closeAxieDetailBtn.addEventListener('click', () => this.closeAxieDetailModal());
    }
    if (this.axieDetailModal) {
      this.axieDetailModal.addEventListener('click', (e) => {
        if (e.target === this.axieDetailModal) {
          this.closeAxieDetailModal();
        }
      });
    }

    document.querySelectorAll('.btn-detail-slot').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.selectedDetailAxie) return;
        const slot = btn.getAttribute('data-slot') as TowerType;
        if (slot) {
          axieNFTManager.assignAxieToSlot(slot, this.selectedDetailAxie);
          sounds.playLevelUp();
          this.showToast(`¡${this.selectedDetailAxie.name} (#${this.selectedDetailAxie.id}) asignado al Slot de ${TOWER_CONFIGS[slot].classLabel}!`, 'info');
          this.closeAxieDetailModal();
          this.renderRosterUI();
          this.updateBottomDockCards();
        }
      });
    });

    axieNFTManager.subscribe(() => {
      this.renderRosterUI();
      this.updateBottomDockCards();
    });
  }

  private setRosterTab(tab: 'wallet' | 'demo' | 'all') {
    this.activeRosterTab = tab;
    if (this.rosterTabWallet) this.rosterTabWallet.classList.toggle('active', tab === 'wallet');
    if (this.rosterTabDemo) this.rosterTabDemo.classList.toggle('active', tab === 'demo');
    if (this.rosterTabAll) this.rosterTabAll.classList.toggle('active', tab === 'all');
    sounds.playHit();
    this.renderRosterUI();
  }

  private openAxieDetailModal(axie: AxieNFT) {
    this.selectedDetailAxie = axie;
    if (!this.axieDetailModal) return;

    if (this.detailAxieImg) {
      this.detailAxieImg.src = axie.image;
      this.detailAxieImg.onerror = () => {
        this.detailAxieImg.onerror = null;
        this.detailAxieImg.src = `https://axiecdn.axieinfinity.com/axies/${axie.id}/axie/axie-full-transparent.png`;
      };
    }
    if (this.detailAxieName) this.detailAxieName.textContent = axie.name;
    if (this.detailAxieId) this.detailAxieId.textContent = `#${axie.id}`;
    if (this.detailAxieSource) {
      const isWallet = axieNFTManager.getWalletAxies().some(w => w.id === axie.id);
      this.detailAxieSource.textContent = isWallet ? '🦊 Propiedad Verificada (Ronin Wallet)' : '🧪 Axie de Demostración';
    }

    if (this.detailClassBadge) {
      this.detailClassBadge.className = `slot-badge class-${axie.class.toLowerCase()}`;
      this.detailClassBadge.textContent = `${axie.class}`;
    }

    if (this.detailSpecialBadge) {
      if (axie.specialType && axie.specialType !== 'Normal') {
        this.detailSpecialBadge.textContent = `🌟 ${axie.specialType}`;
        this.detailSpecialBadge.classList.remove('hidden');
      } else {
        this.detailSpecialBadge.classList.add('hidden');
      }
    }

    if (this.detailSynergyDesc) {
      const classSynergies: Record<string, string> = {
        Plant: '🌿 Sinergia Planta: +15% Daño y Veneno persistente a quimeras al asignarlo al Slot 1.',
        Beast: '🦊 Sinergia Bestia: +15% Daño y +35% Daño Crítico al asignarlo al Slot 2.',
        Aqua: '💧 Sinergia Aqua: +15% Daño y +20% Radio de Impacto en Área al asignarlo al Slot 3.',
        Bird: '🪶 Sinergia Pájaro: +15% Daño y +30% Alcance de Disparo al asignarlo al Slot 4.',
        Bug: '🐛 Sinergia Insecto: +10% Cadencia de Ataque y ruptura de escudo enemigo.',
        Reptile: '🦎 Sinergia Reptil: +10% Reflejo de daño y ralentización a enemigos cercanos.',
        Mech: '🤖 Sinergia Mecánica: +15% Daño de impacto letal contra quimeras gigantes.',
        Dawn: '✨ Sinergia Alba: +12% Daño sagrado y aceleración de recarga de habilidades.',
        Dusk: '🌑 Sinergia Ocaso: +12% Daño en la oscuridad y probabilidad de golpe crítico.',
      };
      this.detailSynergyDesc.textContent = classSynergies[axie.class] || '⚡ Defensor de Lunacia: +5% Daño directo como NFT leal en combate.';
    }

    if (this.detailSpecialSynergy) {
      if (axie.specialType && axie.specialType !== 'Normal') {
        this.detailSpecialSynergy.innerHTML = `🌟 <strong>Bono Celestial (${axie.specialType}):</strong> +10% de daño cósmico a todas las defensas aliadas.`;
        this.detailSpecialSynergy.classList.remove('hidden');
      } else {
        this.detailSpecialSynergy.classList.add('hidden');
      }
    }

    if (this.detailExplorerLink) {
      this.detailExplorerLink.href = `https://app.axieinfinity.com/marketplace/axies/${axie.id}`;
    }

    this.axieDetailModal.classList.remove('hidden');
    sounds.playHit();
  }

  private closeAxieDetailModal() {
    if (this.axieDetailModal) {
      this.axieDetailModal.classList.add('hidden');
      this.selectedDetailAxie = null;
    }
  }

  private setRosterLoading(loading: boolean, text: string = 'Consultando en Ronin...') {
    this.isRosterLoading = loading;
    this.rosterLoadingText = text;
    if (this.connectRoninBtn) {
      this.connectRoninBtn.classList.toggle('loading', loading);
    }
    if (this.refreshRoninBtn) {
      this.refreshRoninBtn.classList.toggle('spinning', loading);
    }
    if (loading && this.rosterCollectionGrid) {
      this.rosterCollectionGrid.innerHTML = `
        <div class="roster-loading-box">
          <div class="roster-spinner"></div>
          <div class="roster-loading-msg">⏳ ${this.rosterLoadingText}</div>
          <div class="roster-loading-sub">Sincronizando contratos y metadatos oficiales en la blockchain...</div>
        </div>
      `;
    }
  }

  private openRosterModal() {
    if (this.rosterModal) {
      this.rosterModal.classList.remove('hidden');
      sounds.playHit();
    }
  }

  private closeRosterModal() {
    if (this.rosterModal) {
      this.rosterModal.classList.add('hidden');
      this.updateBottomDockCards();
    }
  }

  private renderRosterUI() {
    if (!this.rosterModal || this.rosterModal.classList.contains('hidden')) return;
    if (this.isRosterLoading) return;

    const loadout = axieNFTManager.getLoadout();

    if (this.roninBtnText && this.roninStatusLabel) {
      if (loadout.roninAddress) {
        this.roninBtnText.textContent = 'Desconectar Ronin';
        const shortAddr = `${loadout.roninAddress.slice(0, 8)}...${loadout.roninAddress.slice(-6)}`;
        this.roninStatusLabel.textContent = `🟢 Conectado: ${shortAddr}`;
        this.roninStatusLabel.classList.add('connected');
        if (this.refreshRoninBtn) this.refreshRoninBtn.classList.remove('hidden');
      } else {
        this.roninBtnText.textContent = 'Conectar Ronin Wallet';
        this.roninStatusLabel.textContent = 'Sin billetera conectada (Usa demo o introduce IDs/dirección)';
        this.roninStatusLabel.classList.remove('connected');
        if (this.refreshRoninBtn) this.refreshRoninBtn.classList.add('hidden');
      }
    }

    if (this.modeBillboardBtn && this.modeMascotBtn) {
      this.modeBillboardBtn.classList.toggle('active', loadout.visualMode === 'billboard_25d');
      this.modeMascotBtn.classList.toggle('active', loadout.visualMode === 'mascot_3d');
    }

    const slots: TowerType[] = ['pomodoro', 'kotaro', 'bing', 'tripp'];
    slots.forEach(slot => {
      const customAxie = loadout.slots[slot];
      const imgEl = document.querySelector(`#slot-img-${slot}`) as HTMLImageElement;
      const phEl = document.querySelector(`#slot-placeholder-${slot}`) as HTMLElement;
      const nameEl = document.querySelector(`#slot-name-${slot}`) as HTMLElement;
      const idEl = document.querySelector(`#slot-id-${slot}`) as HTMLElement;
      const clearBtn = document.querySelector(`.btn-clear-slot[data-slot="${slot}"]`) as HTMLElement;
      const cardEl = document.querySelector(`.loadout-slot-card[data-slot="${slot}"]`) as HTMLElement;

      if (customAxie) {
        if (imgEl) {
          imgEl.src = customAxie.image;
          imgEl.onerror = () => {
            imgEl.onerror = null;
            imgEl.src = `https://axiecdn.axieinfinity.com/axies/${customAxie.id}/axie/axie-full-transparent.png`;
          };
          imgEl.classList.remove('hidden');
        }
        if (phEl) phEl.classList.add('hidden');
        if (nameEl) nameEl.textContent = customAxie.name;
        if (idEl) idEl.textContent = `#${customAxie.id} • ${customAxie.class}`;
        if (clearBtn) clearBtn.classList.remove('hidden');
        if (cardEl) cardEl.classList.add('has-custom');
      } else {
        if (imgEl) imgEl.classList.add('hidden');
        if (phEl) phEl.classList.remove('hidden');
        const defaultName = slot === 'pomodoro' ? 'Pomodoro' : slot === 'kotaro' ? 'Kotaro' : slot === 'bing' ? 'Bing' : 'Tripp';
        if (nameEl) nameEl.textContent = defaultName;
        if (idEl) idEl.textContent = 'Starter Original';
        if (clearBtn) clearBtn.classList.add('hidden');
        if (cardEl) cardEl.classList.remove('has-custom');
      }
    });

    const walletAxies = axieNFTManager.getWalletAxies();
    const demoAxies = axieNFTManager.getDemoAxies();
    const allAxies = axieNFTManager.getAvailableAxies();

    if (this.walletCountBadge) this.walletCountBadge.textContent = `${walletAxies.length}`;
    if (this.demoCountBadge) this.demoCountBadge.textContent = `${demoAxies.length}`;
    if (this.availableCountBadge) this.availableCountBadge.textContent = `${allAxies.length} Axies`;

    // Load More Button visibility & progress
    if (this.rosterLoadMoreBtn && this.loadMoreCount) {
      const hasMore = axieNFTManager.hasMoreWalletAxies();
      const total = axieNFTManager.getWalletTotalAxies();
      if (hasMore && (this.activeRosterTab === 'wallet' || this.activeRosterTab === 'all')) {
        this.rosterLoadMoreBtn.classList.remove('hidden');
        this.loadMoreCount.textContent = `${walletAxies.length} / ${total}`;
      } else {
        this.rosterLoadMoreBtn.classList.add('hidden');
      }
    }

    // Determine Axie source based on active tab
    let sourceList: AxieNFT[] = [];
    if (this.activeRosterTab === 'wallet') {
      sourceList = walletAxies;
    } else if (this.activeRosterTab === 'demo') {
      sourceList = demoAxies;
    } else {
      sourceList = allAxies;
    }

    // Class filter
    let filtered = sourceList;
    if (this.activeRosterClass !== 'all') {
      if (this.activeRosterClass === 'other') {
        const mainClasses = ['Plant', 'Beast', 'Aqua', 'Bird'];
        filtered = filtered.filter(a => !mainClasses.includes(a.class));
      } else {
        filtered = filtered.filter(a => a.class.toLowerCase() === this.activeRosterClass.toLowerCase());
      }
    }

    // Search query filter
    if (this.rosterSearchQuery) {
      filtered = filtered.filter(a =>
        a.id.toLowerCase().includes(this.rosterSearchQuery) ||
        a.name.toLowerCase().includes(this.rosterSearchQuery) ||
        a.class.toLowerCase().includes(this.rosterSearchQuery)
      );
    }

    if (this.rosterCollectionGrid) {
      this.rosterCollectionGrid.innerHTML = '';

      if (filtered.length === 0) {
        const isWalletTab = this.activeRosterTab === 'wallet';
        this.rosterCollectionGrid.innerHTML = `
          <div class="roster-empty-box">
            <p>${isWalletTab ? 'No se encontraron Axies en tu Ronin Wallet con los filtros seleccionados.' : 'No se encontraron Axies con los filtros seleccionados.'}</p>
            ${isWalletTab ? '<button class="btn-demo-quick" id="switch-demo-tab-btn">🧪 Ver Axies Demo</button>' : '<button class="btn-demo-quick" id="empty-load-demo-btn">🧪 Cargar Selección Demo</button>'}
          </div>
        `;
        const switchDemoBtn = this.rosterCollectionGrid.querySelector('#switch-demo-tab-btn');
        if (switchDemoBtn) {
          switchDemoBtn.addEventListener('click', () => {
            this.setRosterTab('demo');
          });
        }
        const emptyDemoBtn = this.rosterCollectionGrid.querySelector('#empty-load-demo-btn');
        if (emptyDemoBtn) {
          emptyDemoBtn.addEventListener('click', () => {
            axieNFTManager.loadDemoTeam();
            this.renderRosterUI();
          });
        }
        return;
      }

      filtered.forEach(axie => {
        const card = document.createElement('div');
        card.className = 'axie-nft-card';
        card.title = 'Haz clic para ver detalles y bonos tácticos';

        const specialBadge = axie.specialType && axie.specialType !== 'Normal'
          ? `<span class="axie-special-tag">${axie.specialType}</span>`
          : '';

        const classStyle = axie.class.toLowerCase();

        card.innerHTML = `
          <div class="axie-card-top">
            <span class="axie-class-tag slot-badge class-${classStyle}">${axie.class}</span>
            ${specialBadge}
          </div>
          <div class="axie-card-thumb-wrap">
            <img src="${axie.image}" class="axie-card-thumb" alt="${axie.name}" loading="lazy" onerror="this.onerror=null;this.src='https://axiecdn.axieinfinity.com/axies/${axie.id}/axie/axie-full-transparent.png';" />
          </div>
          <div class="axie-card-title">${axie.name}</div>
          <div class="axie-card-id">#${axie.id}</div>
          <div class="assign-buttons-row">
            <button class="btn-assign-slot" data-slot="pomodoro" title="Asignar al Slot 1 (Planta)">+ Slot 1</button>
            <button class="btn-assign-slot" data-slot="kotaro" title="Asignar al Slot 2 (Bestia)">+ Slot 2</button>
            <button class="btn-assign-slot" data-slot="bing" title="Asignar al Slot 3 (Aqua)">+ Slot 3</button>
            <button class="btn-assign-slot" data-slot="tripp" title="Asignar al Slot 4 (Pájaro)">+ Slot 4</button>
          </div>
        `;

        // Clicking the card opens the Axie Detail & Tactical Inspection modal
        card.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('.btn-assign-slot')) return;
          this.openAxieDetailModal(axie);
        });

        card.querySelectorAll('.btn-assign-slot').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetSlot = btn.getAttribute('data-slot') as TowerType;
            if (targetSlot) {
              axieNFTManager.assignAxieToSlot(targetSlot, axie);
              sounds.playGem();
              this.showToast(`¡${axie.name} (#${axie.id}) asignado al Slot de ${TOWER_CONFIGS[targetSlot].classLabel}!`, 'info');
              this.renderRosterUI();
              this.updateBottomDockCards();
            }
          });
        });

        this.rosterCollectionGrid.appendChild(card);
      });
    }
  }

  private updateBottomDockCards() {
    const slots: TowerType[] = ['pomodoro', 'kotaro', 'bing', 'tripp'];
    slots.forEach(slot => {
      const card = document.querySelector(`.tower-card[data-tower="${slot}"]`) as HTMLElement;
      if (!card) return;

      const config = TOWER_CONFIGS[slot];
      const avatarEl = card.querySelector('.card-avatar') as HTMLElement;
      const nameEl = card.querySelector('.card-name') as HTMLElement;
      const roleEl = card.querySelector('.card-role') as HTMLElement;

      if (avatarEl) {
        avatarEl.innerHTML = `<img src="${config.avatarImage}" class="tower-card-thumb-img" alt="${config.name}" />`;
      }
      if (nameEl) {
        nameEl.textContent = config.name;
      }
      if (roleEl) {
        roleEl.textContent = t(`${slot}Role`);
      }
      card.classList.remove('custom-card');
    });
  }

  private startTutorial() {
    this.isTutorialActive = true;
    this.currentTutorialStep = 0;
    if (this.startScreen) this.startScreen.classList.add('hidden');
    if (this.mainMenuHub) this.mainMenuHub.classList.add('hidden');
    this.tdUI.classList.remove('hidden');
    this.tutorialOverlay.classList.remove('hidden');
    this.arena.setGameCamera(false);
    this.closeInspector();
    this.deselectBuildType();
    sounds.playGem();
    this.renderTutorialStep(0);
  }

  private onLanguageChanged() {
    translateDOM();
    this.syncSettingsUI();
    this.updateBottomDockCards();
    if (this.rosterModal && !this.rosterModal.classList.contains('hidden')) {
      this.renderRosterUI();
    }
    if (this.isTutorialActive) {
      this.renderTutorialStep(this.currentTutorialStep);
    }
    if (this.inspectedTower) {
      this.openInspector(this.inspectedTower);
    }
    this.updateHUD();
    if (this.activeRunes.length > 0) {
      this.renderRuneChips();
    }
  }

  private surrenderGame() {
    this.returnToMainMenu();
  }

  private renderTutorialStep(index: number) {
    const steps = getTutorialSteps();
    const step = steps[index];
    if (!step) return;

    this.tutorialGuideAvatar.textContent = step.avatar;
    this.tutorialTitle.textContent = step.title;
    this.tutorialBody.innerHTML = step.body;
    this.tutorialStepTag.textContent = t('tutStepLabel', { current: index + 1, total: steps.length });

    // Render progress dots
    this.tutorialDots.innerHTML = '';
    steps.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `tutorial-dot ${i === index ? 'active' : ''}`;
      dot.setAttribute('title', `${t('tutStepLabel', { current: i + 1, total: steps.length })}: ${steps[i].title}`);
      dot.addEventListener('click', () => {
        if (this.currentTutorialStep !== i) {
          this.currentTutorialStep = i;
          this.renderTutorialStep(i);
          sounds.playShoot();
        }
      });
      this.tutorialDots.appendChild(dot);
    });

    // Previous button state
    this.tutorialPrevBtn.disabled = index === 0;
    this.tutorialPrevBtn.textContent = t('tutPrevBtn');

    // Next button text & styling
    if (index === steps.length - 1) {
      this.tutorialNextBtn.textContent = t('tutFinishBtn');
      this.tutorialNextBtn.className = 'btn-tut-nav finish';
    } else {
      this.tutorialNextBtn.textContent = t('tutNextBtn');
      this.tutorialNextBtn.className = 'btn-tut-nav primary';
    }

    this.positionTutorialElements();
  }

  private positionTutorialElements() {
    const step = getTutorialSteps()[this.currentTutorialStep];
    if (!step) return;

    // Reset explicit positioning styles
    this.tutorialCard.style.top = 'auto';
    this.tutorialCard.style.bottom = 'auto';
    this.tutorialCard.style.left = 'auto';
    this.tutorialCard.style.right = 'auto';
    this.tutorialCard.style.transform = 'none';
    this.tutorialPointerArrow.classList.remove('side-arrow');

    if (!step.targetSelector) {
      // Centered dialog
      this.tutorialFocusBox.classList.add('hidden');
      this.tutorialPointerArrow.classList.add('hidden');
      this.tutorialCard.style.top = '50%';
      this.tutorialCard.style.left = '50%';
      this.tutorialCard.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const targetEl = document.querySelector(step.targetSelector) as HTMLElement;
    if (!targetEl) {
      this.tutorialFocusBox.classList.add('hidden');
      this.tutorialPointerArrow.classList.add('hidden');
      this.tutorialCard.style.top = '50%';
      this.tutorialCard.style.left = '50%';
      this.tutorialCard.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const padding = 10;

    // Position and show focus box
    this.tutorialFocusBox.classList.remove('hidden');
    this.tutorialFocusBox.style.top = `${rect.top - padding}px`;
    this.tutorialFocusBox.style.left = `${rect.left - padding}px`;
    this.tutorialFocusBox.style.width = `${rect.width + padding * 2}px`;
    this.tutorialFocusBox.style.height = `${rect.height + padding * 2}px`;

    // Position pointer arrow and card
    this.tutorialPointerArrow.classList.remove('hidden');

    if (step.cardPlacement === 'below') {
      const cardTop = rect.bottom + 24;
      const cardLeft = Math.max(16, Math.min(window.innerWidth - 456, rect.left + rect.width / 2 - 220));
      this.tutorialCard.style.top = `${cardTop}px`;
      this.tutorialCard.style.left = `${cardLeft}px`;

      this.tutorialPointerArrow.textContent = '▲';
      this.tutorialPointerArrow.style.top = `${rect.bottom + 2}px`;
      this.tutorialPointerArrow.style.left = `${rect.left + rect.width / 2 - 14}px`;
    } else if (step.cardPlacement === 'above') {
      const cardBottom = Math.max(20, window.innerHeight - rect.top + 20);
      const cardLeft = Math.max(16, Math.min(window.innerWidth - 456, rect.left + rect.width / 2 - 220));
      this.tutorialCard.style.bottom = `${cardBottom}px`;
      this.tutorialCard.style.left = `${cardLeft}px`;

      this.tutorialPointerArrow.textContent = '▼';
      this.tutorialPointerArrow.style.top = `${rect.top - 34}px`;
      this.tutorialPointerArrow.style.left = `${rect.left + rect.width / 2 - 14}px`;
    } else if (step.cardPlacement === 'left') {
      const cardWidth = 440;
      const cardLeft = Math.max(16, rect.left - cardWidth - 28);
      // Anchor to bottom to ensure navigation footer buttons never clip off-screen
      const cardBottom = Math.max(24, window.innerHeight - rect.bottom);
      this.tutorialCard.style.bottom = `${cardBottom}px`;
      this.tutorialCard.style.left = `${cardLeft}px`;

      this.tutorialPointerArrow.classList.add('side-arrow');
      this.tutorialPointerArrow.textContent = '▶';
      this.tutorialPointerArrow.style.top = `${rect.top + rect.height / 2 - 16}px`;
      this.tutorialPointerArrow.style.left = `${rect.left - 28}px`;
    }
  }

  private nextTutorialStep() {
    if (this.currentTutorialStep < getTutorialSteps().length - 1) {
      this.currentTutorialStep++;
      this.renderTutorialStep(this.currentTutorialStep);
      sounds.playShoot();
    } else {
      this.finishTutorial();
    }
  }

  private prevTutorialStep() {
    if (this.currentTutorialStep > 0) {
      this.currentTutorialStep--;
      this.renderTutorialStep(this.currentTutorialStep);
      sounds.playHit();
    }
  }

  private finishTutorial() {
    this.isTutorialActive = false;
    this.tutorialOverlay.classList.add('hidden');
    localStorage.setItem('axie_td_tutorial_seen', 'true');
    sounds.playLevelUp();

    if (!this.isGameStarted) {
      this.isGameStarted = true;
      if (this.startScreen) this.startScreen.classList.add('hidden');
      if (this.mainMenuHub) this.mainMenuHub.classList.add('hidden');
      this.tdUI.classList.remove('hidden');
      this.arena.setGameCamera(true);
      this.resetGame();
      if (sounds.getMusicVolume() > 0) {
        sounds.playBattleMusic(true);
      }
    }
  }

  private closeTutorial() {
    this.isTutorialActive = false;
    this.tutorialOverlay.classList.add('hidden');
    sounds.playHit();

    if (!this.isGameStarted) {
      if (this.mainMenuHub) {
        this.mainMenuHub.classList.remove('hidden');
      } else if (this.startScreen) {
        this.startScreen.classList.remove('hidden');
      }
      this.tdUI.classList.add('hidden');
      this.arena.setTitleCamera();
      if (sounds.getMusicVolume() > 0) {
        sounds.playTitleMusic(false);
      }
    }
  }

  private deselectBuildType() {
    this.selectedBuildType = null;
    document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
    this.arena.hidePlacementPreview();
  }

  private showToast(message: string, type: 'error' | 'info' = 'info') {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.className = `td-toast visible ${type}`;
    if (this.toastTimeout !== null) clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      this.toastEl.className = 'td-toast hidden';
      this.toastTimeout = null;
    }, 2800);
  }

  private triggerSlpError(required: number, towerName: string) {
    sounds.playError();
    this.showToast(t('toastInsufficientSLP', { cost: required, name: towerName }), 'error');
    if (this.slpPill) {
      this.slpPill.classList.remove('shake-error');
      void this.slpPill.offsetWidth; // Force reflow
      this.slpPill.classList.add('shake-error');
      setTimeout(() => this.slpPill.classList.remove('shake-error'), 450);
    }
  }

  private triggerPopError() {
    if (this.popPill) {
      this.popPill.classList.remove('shake-error');
      void this.popPill.offsetWidth; // Force reflow
      this.popPill.classList.add('shake-error');
      setTimeout(() => this.popPill.classList.remove('shake-error'), 450);
    }
  }

  private onPointerMove(e: PointerEvent) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (this.selectedBuildType) {
      this.raycaster.setFromCamera(this.mouse, this.arena.camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.18);
      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const isBuilding = this.selectedBuildType in BUILDING_CONFIGS;
        const cost = isBuilding ? BUILDING_CONFIGS[this.selectedBuildType as BuildingType].cost : TOWER_CONFIGS[this.selectedBuildType as TowerType].cost;
        const range = isBuilding ? 0 : TOWER_CONFIGS[this.selectedBuildType as TowerType].range;

        const grid = this.arena.gridSystem.worldToGrid(hitPoint.x, hitPoint.z);
        if (grid) {
          const snappedWorld = this.arena.gridSystem.gridToWorld(grid.col, grid.row);
          const footprint = 3;
          const isValid = this.isValidGridPlacement(grid.col, grid.row, cost, isBuilding, footprint);
          this.arena.updatePlacementPreview(snappedWorld, isValid, range, footprint);
          this.arena.gridSystem.updateHighlight(grid.col, grid.row, isValid, footprint);
        } else {
          this.arena.hidePlacementPreview();
        }
      }
    } else {
      this.arena.hidePlacementPreview();
    }
  }

  private isValidGridPlacement(col: number, row: number, cost: number, isBuilding: boolean = false, footprint: number = 3): boolean {
    if (this.slp < cost) return false;
    if (!isBuilding && this.currentPopulation >= this.maxPopulation) return false;
    return this.arena.gridSystem.canPlaceTower(col, row, footprint);
  }

  private resetGame() {
    this.lives = 10;
    this.slp = 250;
    this.currentWaveIndex = 0;
    this.isWaveRunning = false;
    this.gameSpeed = 1.0;
    this.spellCooldown = 0;
    this.isSpellAiming = false;
    this.selectedBuildType = null;
    this.cardCooldowns = { pomodoro: 0, kotaro: 0, bing: 0, tripp: 0, hemp_hut: 0, hummer_hut: 0 };
    this.unlockedTechs.clear();
    this.lv3Tokens = { pomodoro: 0, kotaro: 0, bing: 0, tripp: 0 };
    this.currentPopulation = 0;
    this.maxPopulation = 3;
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
    for (const b of this.buildings) {
      this.removeBuildingStatusBadge(b);
      this.arena.scene.remove(b.mesh);
    }
    for (const e of this.enemies) this.arena.scene.remove(e.mesh);
    for (const p of this.projectiles) {
      this.arena.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    }

    this.towers = [];
    this.buildings = [];
    this.enemies = [];
    this.projectiles = [];
    this.waveQueue = [];

    // Clear Ground Hazards
    for (const gh of this.groundHazards) {
      this.arena.scene.remove(gh.mesh);
      gh.mesh.geometry.dispose();
    }
    this.groundHazards = [];
    this.activeRunes = [];
    this.isDraftingRune = false;
    this.runeModal.classList.add('hidden');
    this.renderRuneChips();

    // Regenerate procedural map layout, portal, tree and obstacles for new game
    this.arena.generateRandomMap();

    this.updateHUD();
    if (sounds.getMusicVolume() > 0) {
      sounds.playBattleMusic(true);
    }
    if (this.arena.pathSystem.currentArchetype) {
      this.showToast(`🗺️ ${this.arena.pathSystem.currentArchetype.name}`, 'info');
    }
  }

  private updateHUD() {
    this.waveDisplay.textContent = `${this.currentWaveIndex + 1} / ${TD_WAVES.length}`;
    this.livesDisplay.textContent = `${this.lives}`;
    this.slpDisplay.textContent = `${this.slp} SLP`;

    // Population Display (Warcraft 3 style)
    if (this.popDisplay) {
      this.popDisplay.textContent = `${this.currentPopulation} / ${this.maxPopulation}`;
    }
    if (this.popPill) {
      this.popPill.classList.toggle('at-capacity', this.currentPopulation >= this.maxPopulation);
    }

    // Reactively update inspector if a tower or building is currently inspected
    if (this.inspectedTower) {
      this.updateInspectorState();
    } else if (this.inspectedBuilding) {
      this.updateBuildingInspectorState();
    }

    if (this.isIntermission) {
      this.startWaveBtn.disabled = false;
      this.startWaveBtn.className = 'btn-start-wave intermission';
      const sec = Math.ceil(this.intermissionTimer);
      if (sec <= 3) {
        this.startWaveBtn.classList.add('urgent');
      }
      this.startWaveBtn.textContent = t('startWaveIntermission', {
        wave: this.currentWaveIndex + 1,
        sec
      });
    } else if (this.isWaveRunning) {
      this.startWaveBtn.disabled = true;
      this.startWaveBtn.className = 'btn-start-wave';
      this.startWaveBtn.textContent = t('startWaveFighting', {
        wave: this.currentWaveIndex + 1
      });
    } else {
      this.startWaveBtn.disabled = false;
      this.startWaveBtn.className = 'btn-start-wave';
      this.startWaveBtn.textContent = t('startWaveReady');
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
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.18);
      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        this.castMeteorSpell(hitPoint);
        this.isSpellAiming = false;
        this.spellBtn.style.borderColor = 'var(--accent-gold)';
      }
      return;
    }

    // 2. If building a tower or homeland structure freely
    if (this.selectedBuildType) {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.18);
      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const isBuilding = this.selectedBuildType in BUILDING_CONFIGS;
        const cost = isBuilding ? BUILDING_CONFIGS[this.selectedBuildType as BuildingType].cost : TOWER_CONFIGS[this.selectedBuildType as TowerType].cost;
        const name = isBuilding ? BUILDING_CONFIGS[this.selectedBuildType as BuildingType].name : TOWER_CONFIGS[this.selectedBuildType as TowerType].name;
        const buildTime = isBuilding ? BUILDING_CONFIGS[this.selectedBuildType as BuildingType].buildTime : TOWER_CONFIGS[this.selectedBuildType as TowerType].buildTime;

        const grid = this.arena.gridSystem.worldToGrid(hitPoint.x, hitPoint.z);
        if (grid && this.isValidGridPlacement(grid.col, grid.row, cost, isBuilding)) {
          const snappedWorld = this.arena.gridSystem.gridToWorld(grid.col, grid.row);

          // Deduct cost and build
          this.slp -= cost;
          sounds.playShoot();

          const hasSwift = this.activeRunes.some(r => r.id === 'swift_craft');
          const bDuration = hasSwift ? buildTime * 0.55 : buildTime;

          if (isBuilding) {
            // Build Homeland Structure
            const buildingType = this.selectedBuildType as BuildingType;
            const { mesh } = this.arena.createBuildingMesh(buildingType);
            mesh.position.set(snappedWorld.x, 0.18, snappedWorld.z);

            // Progress Bar
            const { group: pbGroup, fill: pbFill } = this.arena.createTowerProgressBar();
            pbGroup.visible = true;
            (pbFill.material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
            pbFill.scale.set(0.01, 1, 1);
            mesh.add(pbGroup);

            this.arena.scene.add(mesh);

            const buildingId = `building_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            this.arena.gridSystem.occupyTower(grid.col, grid.row, buildingId, 3);

            const building: BuildingInstance = {
              id: buildingId,
              type: buildingType,
              level: 1,
              position: new THREE.Vector3(snappedWorld.x, 0.18, snappedWorld.z),
              mesh,
              populationBonus: BUILDING_CONFIGS[buildingType].populationBonus,
              isUnderConstruction: true,
              constructionTimer: bDuration,
              constructionDuration: bDuration,
              progressBarGroup: pbGroup,
              progressBarFill: pbFill,
              researchedTechs: []
            };

            this.buildings.push(building);
            this.cardCooldowns[buildingType] = bDuration;
            this.deselectBuildType();
            this.updateHUD();
            this.openBuildingInspector(building);
            return;
          } else {
            // Build Axie Guardian Tower
            const towerType = this.selectedBuildType as TowerType;
            const config = TOWER_CONFIGS[towerType];
            const customAxie = axieNFTManager.getAxieForTowerType(towerType);
            const visualMode = axieNFTManager.getLoadout().visualMode;
            const { mesh, mixer, billboardMesh, hologramGroup } = this.arena.createTowerMesh(
              config.modelFile,
              1,
              customAxie,
              visualMode
            );
            mesh.position.set(snappedWorld.x, 0.18, snappedWorld.z);

            // Progress bar
            const { group: pbGroup, fill: pbFill } = this.arena.createTowerProgressBar();
            pbGroup.visible = true;
            (pbFill.material as THREE.MeshBasicMaterial).color.setHex(0x00f0ff);
            pbFill.scale.set(0.01, 1, 1);
            mesh.add(pbGroup);

            this.arena.scene.add(mesh);

            const towerId = `tower_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            this.arena.gridSystem.occupyTower(grid.col, grid.row, towerId, 3);

            let towerDamage = config.damage;
            let towerAttackSpeed = config.attackSpeed;
            let towerRange = config.range;

            if (customAxie) {
              const isAffinity = (
                (config.type === 'pomodoro' && customAxie.class === 'Plant') ||
                (config.type === 'kotaro' && customAxie.class === 'Beast') ||
                (config.type === 'bing' && customAxie.class === 'Aqua') ||
                (config.type === 'tripp' && customAxie.class === 'Bird')
              );
              if (isAffinity) {
                towerDamage = Math.round(towerDamage * 1.15);
                towerAttackSpeed = +(towerAttackSpeed * 1.10).toFixed(2);
              } else {
                towerDamage = Math.round(towerDamage * 1.05);
              }

              if (customAxie.specialType && customAxie.specialType !== 'Normal') {
                towerDamage = Math.round(towerDamage * 1.10);
              }
            }

            const tower: TowerInstance = {
              id: towerId,
              type: config.type,
              level: 1,
              position: new THREE.Vector3(snappedWorld.x, 0.18, snappedWorld.z),
              range: towerRange,
              damage: towerDamage,
              attackSpeed: towerAttackSpeed,
              attackTimer: 0,
              targetEnemyId: null,
              targetingMode: 'first',
              ultimateCharge: 0,
              ultimateMax: config.type === 'pomodoro' ? 6 : config.type === 'kotaro' ? 5 : config.type === 'bing' ? 4 : 4,
              mesh,
              mixer,
              billboardMesh,
              hologramGroup,
              customAxie: customAxie || undefined,
              visualMode,
              attackAnimTimer: 0,
              isUnderConstruction: true,
              constructionTimer: bDuration,
              constructionDuration: bDuration,
              isUpgrading: false,
              upgradeTimer: 0,
              upgradeDuration: 0,
              targetLevel: 1,
              progressBarGroup: pbGroup,
              progressBarFill: pbFill
            };

            this.towers.push(tower);
            this.currentPopulation++; // Consume 1 population

            this.cardCooldowns[config.type] = bDuration;
            this.deselectBuildType();
            this.updateHUD();
            this.openInspector(tower);
            return;
          }
        } else {
          if (this.slp < cost) {
            this.triggerSlpError(cost, name);
          } else if (!isBuilding && this.currentPopulation >= this.maxPopulation) {
            sounds.playError();
            this.showToast(t('toastPopLimit', { cur: this.currentPopulation, max: this.maxPopulation }), 'error');
            this.triggerPopError();
          } else {
            sounds.playError();
            this.showToast(t('toastBlockedSpot'), 'error');
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

    // 3b. Check if clicked an existing building to inspect
    if (this.buildings.length > 0) {
      const buildingMeshes = this.buildings.map(b => b.mesh);
      const intersects = this.raycaster.intersectObjects(buildingMeshes, true);

      if (intersects.length > 0) {
        let clickedObj: THREE.Object3D | null = intersects[0].object;
        let clickedBuilding: BuildingInstance | null = null;
        while (clickedObj && clickedObj !== this.arena.scene) {
          const found = this.buildings.find(b => b.mesh === clickedObj);
          if (found) {
            clickedBuilding = found;
            break;
          }
          clickedObj = clickedObj.parent;
        }

        if (clickedBuilding) {
          this.openBuildingInspector(clickedBuilding);
          return;
        }
      }
    }

    // 4. Clicked empty ground: close inspector and deselect
    this.closeInspector();
  }

  private openInspector(tower: TowerInstance) {
    this.inspectedBuilding = null;
    this.inspectedTower = tower;
    const config = TOWER_CONFIGS[tower.type];

    if (tower.customAxie) {
      this.inspectAvatar.innerHTML = `<img src="${tower.customAxie.image}" style="width:38px;height:38px;object-fit:contain;" />`;
      this.inspectName.textContent = `${tower.customAxie.name}`;
      const nftBox = document.getElementById('inspect-nft-box');
      const nftId = document.getElementById('inspect-nft-id');
      const nftSynergy = document.getElementById('inspect-nft-synergy');
      const nftLink = document.getElementById('inspect-marketplace-link') as HTMLAnchorElement;
      if (nftBox && nftId && nftLink) {
        nftBox.classList.remove('hidden');
        nftId.textContent = `#${tower.customAxie.id}`;
        nftLink.href = `https://app.axieinfinity.com/marketplace/axies/${tower.customAxie.id}`;
        if (nftSynergy) {
          const isAffinity = (
            (tower.type === 'pomodoro' && tower.customAxie.class === 'Plant') ||
            (tower.type === 'kotaro' && tower.customAxie.class === 'Beast') ||
            (tower.type === 'bing' && tower.customAxie.class === 'Aqua') ||
            (tower.type === 'tripp' && tower.customAxie.class === 'Bird')
          );
          if (isAffinity) {
            nftSynergy.textContent = `⚡ Sinergia ${tower.customAxie.class} (+15% Daño)`;
            nftSynergy.style.display = 'inline-block';
          } else if (tower.customAxie.specialType && tower.customAxie.specialType !== 'Normal') {
            nftSynergy.textContent = `🌟 Bono ${tower.customAxie.specialType} (+10% Daño)`;
            nftSynergy.style.display = 'inline-block';
          } else {
            nftSynergy.textContent = `⚔️ Defensor NFT (+5% Daño)`;
            nftSynergy.style.display = 'inline-block';
          }
        }
      }
    } else {
      this.inspectAvatar.innerHTML = `<img src="${config.avatarImage}" style="width:38px;height:38px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));" alt="${config.name}" />`;
      this.inspectName.textContent = config.name;
      const nftBox = document.getElementById('inspect-nft-box');
      if (nftBox) nftBox.classList.add('hidden');
    }

    this.inspectDmg.textContent = `${Math.round(tower.damage)}`;
    this.inspectRange.textContent = `${tower.range.toFixed(1)}`;
    this.inspectSpeed.textContent = `${tower.attackSpeed.toFixed(1)}/s`;
    this.inspectTrait.textContent = t(`${tower.type}Trait`);

    // Ensure stats grid and targeting buttons are visible for towers
    const statsGrid = this.inspectorModal.querySelector('.inspector-stats') as HTMLElement;
    if (statsGrid) statsGrid.style.display = 'grid';
    const targetModeRow = this.inspectorModal.querySelector('.target-modes-row') as HTMLElement;
    if (targetModeRow) targetModeRow.style.display = 'flex';

    this.updateInspectorState();

    // Targeting Mode Buttons State
    const targetModeBtns = document.querySelectorAll('.btn-target-mode');
    targetModeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === tower.targetingMode);
    });

    // Ultimate Ability Status for Level 3
    if (tower.level >= 3) {
      this.ultimateStatusBox.classList.remove('hidden');
      this.ultimateChargeText.textContent = `${tower.ultimateCharge} / ${tower.ultimateMax}`;
      const pct = Math.min(100, Math.round((tower.ultimateCharge / tower.ultimateMax) * 100));
      this.ultimateFill.style.width = `${pct}%`;
      const ultKey = tower.type === 'pomodoro' ? 'ultPomodoro' :
                     tower.type === 'kotaro' ? 'ultKotaro' :
                     tower.type === 'bing' ? 'ultBing' : 'ultTripp';
      this.ultimateDesc.textContent = t(ultKey);
    } else {
      this.ultimateStatusBox.classList.add('hidden');
    }

    this.inspectorModal.classList.remove('hidden');
    this.arena.showRangeIndicator(tower.position, tower.range);
  }

  private openBuildingInspector(building: BuildingInstance) {
    this.inspectedTower = null;
    this.inspectedBuilding = building;
    const config = BUILDING_CONFIGS[building.type];

    const nftBox = document.getElementById('inspect-nft-box');
    if (nftBox) nftBox.classList.add('hidden');

    const buildingImg = (building.type === 'hummer_hut' && building.level >= 2 && config.upgradeImageFile)
      ? config.upgradeImageFile
      : config.imageFile;
    this.inspectAvatar.innerHTML = `<img src="${buildingImg}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" />`;
    this.inspectName.textContent = config.name;
    this.inspectTrait.textContent = config.specialTrait;

    // Hide attack stats & targeting mode row since it is a support structure
    const statsGrid = this.inspectorModal.querySelector('.inspector-stats') as HTMLElement;
    if (statsGrid) statsGrid.style.display = 'none';
    if (this.inspectorTargetingSection) this.inspectorTargetingSection.style.display = 'none';
    const targetModeRow = this.inspectorModal.querySelector('.target-modes-row') as HTMLElement;
    if (targetModeRow) targetModeRow.style.display = 'none';
    this.ultimateStatusBox.classList.add('hidden');
    if (this.towerTechLockNotice) this.towerTechLockNotice.classList.add('hidden');

    // Show/Hide Hummer Hut research panel
    if (building.type === 'hummer_hut') {
      if (this.inspectorResearchSection) this.inspectorResearchSection.classList.remove('hidden');
      this.renderResearchTechList(building);
    } else {
      if (this.inspectorResearchSection) this.inspectorResearchSection.classList.add('hidden');
    }

    this.updateBuildingInspectorState();

    this.inspectorModal.classList.remove('hidden');
    this.arena.hideRangeIndicator();
  }

  private renderResearchTechList(building: BuildingInstance) {
    if (!this.researchTechList) return;
    this.researchTechList.innerHTML = '';

    const techs = Object.values(TECH_CONFIGS);
    const hasGivenLv3Permit = building.researchedTechs?.some(id => TECH_CONFIGS[id]?.targetLevel === 3);

    for (const tech of techs) {
      const isAlreadyResearchedInThisBuilding = building.researchedTechs?.includes(tech.id);
      const isUnlockedGlobally = this.unlockedTechs.has(tech.id);
      const isCurrentlyResearching = building.currentResearch?.techId === tech.id;
      const anyResearching = !!building.currentResearch || !!building.isUpgrading;
      const meetsBuildingLvl = building.level >= (tech.reqBuildingLevel || 1);

      const row = document.createElement('div');
      row.className = `tech-item-row ${(isAlreadyResearchedInThisBuilding || (tech.targetLevel === 2 && isUnlockedGlobally)) ? 'unlocked' : ''} ${isCurrentlyResearching ? 'researching' : ''}`;

      const info = document.createElement('div');
      info.className = 'tech-item-info';
      info.innerHTML = `
        <span class="tech-item-icon">${tech.icon}</span>
        <div class="tech-item-text">
          <span class="tech-item-title">${t(tech.nameKey)}</span>
          <span class="tech-item-desc">${t(tech.descKey)}</span>
        </div>
      `;
      row.appendChild(info);

      const actionArea = document.createElement('div');
      if (tech.targetLevel === 2 && isUnlockedGlobally) {
        actionArea.innerHTML = `<span class="tech-unlocked-badge">✓ INVESTIGADO</span>`;
      } else if (tech.targetLevel === 3 && isAlreadyResearchedInThisBuilding) {
        actionArea.innerHTML = `<span class="tech-unlocked-badge">✓ 1 PERMISO DADO</span>`;
      } else if (tech.targetLevel === 3 && hasGivenLv3Permit) {
        const btn = document.createElement('button');
        btn.className = 'btn-research-tech';
        btn.disabled = true;
        btn.innerHTML = `<span>Permiso ya agotado</span><strong>🔒</strong>`;
        actionArea.appendChild(btn);
      } else if (isCurrentlyResearching) {
        actionArea.innerHTML = `<div class="tech-researching-badge">
          <span>FORJANDO...</span>
          <small class="tech-timer-display">${Math.ceil(building.currentResearch!.timer)}s</small>
        </div>`;
      } else if (!meetsBuildingLvl) {
        const btn = document.createElement('button');
        btn.className = 'btn-research-tech';
        btn.disabled = true;
        btn.innerHTML = `<span>Requiere Herrería Nv.2</span><strong>🔒</strong>`;
        actionArea.appendChild(btn);
      } else {
        const btn = document.createElement('button');
        btn.className = 'btn-research-tech';
        btn.disabled = building.isUnderConstruction || anyResearching || this.slp < tech.cost;
        const btnLabel = tech.targetLevel === 3 ? 'Forjar (+1 Permiso)' : 'Investigar';
        btn.innerHTML = `<span>${btnLabel}</span><strong>${tech.cost} ⚡</strong>`;

        const triggerResearch = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          this.startTechResearch(building, tech);
        };

        btn.addEventListener('pointerdown', triggerResearch);
        btn.addEventListener('click', triggerResearch);
        actionArea.appendChild(btn);
      }

      row.appendChild(actionArea);
      this.researchTechList.appendChild(row);
    }
  }

  private startTechResearch(building: BuildingInstance, tech: TechConfig) {
    if (building.isUnderConstruction || building.currentResearch || building.isUpgrading) {
      sounds.playError();
      this.showToast(t('toastTechInProgress'), 'error');
      return;
    }
    if (building.level < (tech.reqBuildingLevel || 1)) {
      sounds.playError();
      this.showToast('⚠️ Esta herrería debe ser mejorada a Nivel 2 para forjar esta tecnología.', 'error');
      return;
    }
    if (tech.targetLevel === 2 && this.unlockedTechs.has(tech.id)) {
      sounds.playError();
      this.showToast(t('toastTechAlreadyResearched'), 'error');
      return;
    }
    if (tech.targetLevel === 3 && building.researchedTechs?.some(id => TECH_CONFIGS[id]?.targetLevel === 3)) {
      sounds.playError();
      this.showToast('⚠️ Esta herrería ya otorgó su único permiso de Nivel 3. Construye y evoluciona otra herrería.', 'error');
      return;
    }
    if (this.slp < tech.cost) {
      this.triggerSlpError(tech.cost, t(tech.nameKey));
      return;
    }

    this.slp -= tech.cost;
    sounds.playShoot();

    const hasSwift = this.activeRunes.some(r => r.id === 'swift_craft');
    const duration = hasSwift ? tech.researchTime * 0.55 : tech.researchTime;

    building.currentResearch = {
      techId: tech.id,
      timer: duration,
      duration: duration
    };

    if (building.progressBarGroup && building.progressBarFill) {
      building.progressBarGroup.visible = true;
      (building.progressBarFill.material as THREE.MeshBasicMaterial).color.setHex(0xa855f7); // Purple for research
      building.progressBarFill.scale.set(0.01, 1, 1);
    }

    this.updateHUD();
    this.renderResearchTechList(building);
    this.updateBuildingInspectorState();
  }

  private updateInspectorState() {
    if (!this.inspectedTower) return;
    const tower = this.inspectedTower;
    const config = TOWER_CONFIGS[tower.type];

    if (this.inspectorResearchSection) this.inspectorResearchSection.classList.add('hidden');
    if (this.inspectorTargetingSection) this.inspectorTargetingSection.style.display = 'block';

    const reqTechId = `tech_${tower.type}_${tower.level + 1}`;
    const hasRequiredTech = tower.level === 1 
      ? this.unlockedTechs.has(reqTechId)
      : (this.lv3Tokens[tower.type] > 0);

    if (tower.isUnderConstruction) {
      this.inspectLevelTag.textContent = t('inspectUnderConstruction', { sec: Math.ceil(tower.constructionTimer) });
      this.upgradeTowerBtn.disabled = true;
      this.upgradeCostText.textContent = t('inspectBuildingBtn');
      if (this.towerTechLockNotice) this.towerTechLockNotice.classList.add('hidden');
    } else if (tower.isUpgrading) {
      this.inspectLevelTag.textContent = t('inspectUpgrading', { level: tower.targetLevel });
      this.upgradeTowerBtn.disabled = true;
      this.upgradeCostText.textContent = t('inspectUpgradingBtn', { sec: Math.ceil(tower.upgradeTimer) });
      if (this.towerTechLockNotice) this.towerTechLockNotice.classList.add('hidden');
    } else {
      this.inspectLevelTag.textContent = t('inspectLevel', { level: tower.level });
      // Upgrade Cost
      const currentUpCost = config.upgradeCost * tower.level;
      if (tower.level >= 3) {
        this.upgradeCostText.textContent = t('inspectMaxLevel');
        this.upgradeTowerBtn.disabled = true;
        if (this.towerTechLockNotice) this.towerTechLockNotice.classList.add('hidden');
      } else if (!hasRequiredTech) {
        // Tech locked!
        this.upgradeCostText.textContent = '🔒 BLOQUEADO';
        this.upgradeTowerBtn.disabled = true;
        if (this.towerTechLockNotice) {
          this.towerTechLockNotice.textContent = tower.level === 2
            ? t('techLockNoticeLv3')
            : t('techLockNotice');
          this.towerTechLockNotice.classList.remove('hidden');
        }
      } else {
        const tokenBadge = (tower.level === 2 && this.lv3Tokens[tower.type] > 0) ? ` (1 Permiso)` : '';
        this.upgradeCostText.textContent = `${currentUpCost} ⚡${tokenBadge}`;
        this.upgradeTowerBtn.disabled = this.slp < currentUpCost;
        if (this.towerTechLockNotice) this.towerTechLockNotice.classList.add('hidden');
      }
    }

    // Sell Refund (+70% of total invested)
    const invested = config.cost + (tower.level - 1) * config.upgradeCost;
    const refund = Math.round(invested * 0.7);
    this.sellRefundText.textContent = `+${refund} ⚡`;
    this.sellTowerBtn.disabled = false;
  }

  private updateBuildingInspectorState() {
    if (!this.inspectedBuilding) return;
    const b = this.inspectedBuilding;
    const config = BUILDING_CONFIGS[b.type];

    if (b.isUnderConstruction) {
      this.inspectLevelTag.textContent = t('inspectUnderConstruction', { sec: Math.ceil(b.constructionTimer) });
      this.upgradeTowerBtn.disabled = true;
      this.upgradeCostText.textContent = t('inspectBuildingBtn');
    } else if (b.isUpgrading) {
      this.inspectLevelTag.textContent = t('inspectUpgrading', { level: 2 });
      this.upgradeTowerBtn.disabled = true;
      this.upgradeCostText.textContent = t('inspectUpgradingBtn', { sec: Math.ceil(b.upgradeTimer || 0) });
    } else if (b.currentResearch) {
      this.inspectLevelTag.textContent = `🔬 ${t('hummerHutName')}`;
      this.upgradeTowerBtn.disabled = true;
      this.upgradeCostText.textContent = `FORJANDO (${Math.ceil(b.currentResearch.timer)}s)`;
    } else if (b.type === 'hummer_hut' && b.level === 1) {
      const upCost = config.upgradeCost || 160;
      this.inspectLevelTag.textContent = '🏠 Nivel 1';
      this.upgradeCostText.textContent = `${upCost} ⚡`;
      this.upgradeTowerBtn.disabled = this.slp < upCost;
    } else if (b.type === 'hummer_hut' && b.level >= 2) {
      this.inspectLevelTag.textContent = '🌟 Nivel 2 (Élite)';
      this.upgradeCostText.textContent = t('inspectMaxLevel');
      this.upgradeTowerBtn.disabled = true;
    } else {
      this.inspectLevelTag.textContent = '🏠 ' + t('classHomeland');
      this.upgradeTowerBtn.disabled = true;
      this.upgradeCostText.textContent = 'ACTIVO';
    }

    if (b.type === 'hummer_hut') {
      if (b.currentResearch) {
        const timerSmall = this.researchTechList.querySelector('.tech-timer-display');
        if (timerSmall) {
          timerSmall.textContent = `${Math.ceil(b.currentResearch.timer)}s`;
        }
      }
    }

    const refund = Math.round(config.cost * 0.7);
    this.sellRefundText.textContent = `+${refund} ⚡`;

    // Only allow selling if removing this hut won't put currentPopulation > maxPopulation - 2
    const canSell = (this.maxPopulation - b.populationBonus) >= this.currentPopulation;
    this.sellTowerBtn.disabled = !canSell;
  }

  private closeInspector() {
    this.inspectedTower = null;
    this.inspectedBuilding = null;
    this.inspectorModal.classList.add('hidden');
    this.arena.hideRangeIndicator();
  }

  private upgradeSelectedBuilding(b: BuildingInstance) {
    if (b.isUnderConstruction || b.isUpgrading || b.currentResearch) return;
    if (b.type !== 'hummer_hut' || b.level >= 2) return;

    const config = BUILDING_CONFIGS[b.type];
    const cost = config.upgradeCost || 160;

    if (this.slp < cost) {
      this.triggerSlpError(cost, `la mejora de ${config.name}`);
      return;
    }

    this.slp -= cost;

    const hasSwift = this.activeRunes.some(r => r.id === 'swift_craft');
    const baseDuration = config.upgradeTime || 6.0;
    const duration = hasSwift ? baseDuration * 0.55 : baseDuration;

    b.isUpgrading = true;
    b.upgradeTimer = duration;
    b.upgradeDuration = duration;

    // Show gold progress bar
    if (b.progressBarGroup && b.progressBarFill) {
      (b.progressBarFill.material as THREE.MeshBasicMaterial).color.setHex(0xffb703);
      b.progressBarFill.scale.set(0.01, 1, 1);
      b.progressBarGroup.visible = true;
    }

    sounds.playShoot();
    this.updateHUD();
    this.openBuildingInspector(b);
  }

  private upgradeSelectedTower() {
    if (this.inspectedBuilding) {
      this.upgradeSelectedBuilding(this.inspectedBuilding);
      return;
    }
    if (!this.inspectedTower || this.inspectedTower.level >= 3) return;
    const tower = this.inspectedTower;
    if (tower.isUnderConstruction || tower.isUpgrading) return;

    // Verify technology unlock requirement
    if (tower.level === 1) {
      const reqTechId = `tech_${tower.type}_2`;
      if (!this.unlockedTechs.has(reqTechId)) {
        sounds.playError();
        this.showToast(t('techLockNotice'), 'error');
        return;
      }
    } else if (tower.level === 2) {
      if (this.lv3Tokens[tower.type] <= 0) {
        sounds.playError();
        this.showToast(t('techLockNoticeLv3'), 'error');
        return;
      }
    }

    const config = TOWER_CONFIGS[tower.type];
    const cost = config.upgradeCost * tower.level;

    if (this.slp < cost) {
      this.triggerSlpError(cost, `la mejora de ${config.name}`);
      return;
    }

    this.slp -= cost;

    // Consume 1 token if upgrading to level 3
    if (tower.level === 2) {
      this.lv3Tokens[tower.type] = Math.max(0, this.lv3Tokens[tower.type] - 1);
    }

    // Cooldown duration for upgrade: Level 2 = 3.5s, Level 3 = 5.5s
    const hasSwift = this.activeRunes.some(r => r.id === 'swift_craft');
    const baseDuration = tower.level === 1 ? 3.5 : 5.5;
    const duration = hasSwift ? baseDuration * 0.55 : baseDuration;
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

  private createOrUpdateBuildingStatusBadge(building: BuildingInstance, text: string, timer: number, progress: number) {
    let badge = building.statusBadgeEl;
    if (!badge) {
      badge = document.createElement('div');
      badge.className = `tower-status-badge building`;
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
      building.statusBadgeEl = badge;
    } else {
      const label = badge.querySelector('.badge-label') as HTMLElement;
      if (label && label.textContent !== text) label.textContent = text;
      const timerEl = badge.querySelector('.badge-timer') as HTMLElement;
      if (timerEl) timerEl.textContent = `${Math.max(0, timer).toFixed(1)}s`;
      const fill = badge.querySelector('.badge-bar-fill') as HTMLElement;
      if (fill) fill.style.width = `${Math.min(100, Math.max(0, progress * 100)).toFixed(0)}%`;
    }

    const { x, y } = this.arena.projectToScreen(building.position, 2.7);
    badge.style.left = `${x}px`;
    badge.style.top = `${y}px`;
  }

  private removeStatusBadge(tower: TowerInstance) {
    if (tower.statusBadgeEl) {
      tower.statusBadgeEl.remove();
      tower.statusBadgeEl = undefined;
    }
  }

  private removeBuildingStatusBadge(building: BuildingInstance) {
    if (building.statusBadgeEl) {
      building.statusBadgeEl.remove();
      building.statusBadgeEl = undefined;
    }
  }

  private sellSelectedTower() {
    if (this.inspectedBuilding) {
      const b = this.inspectedBuilding;
      // Check if selling would violate population constraint
      if ((this.maxPopulation - b.populationBonus) < this.currentPopulation) {
        sounds.playError();
        this.showToast(t('toastCantSellHut'), 'error');
        return;
      }

      const config = BUILDING_CONFIGS[b.type];
      const refund = Math.round(config.cost * 0.7);
      this.slp += refund;
      this.maxPopulation -= b.populationBonus;

      sounds.playGem();
      this.arena.gridSystem.freeTower(b.id);
      this.removeBuildingStatusBadge(b);
      this.arena.scene.remove(b.mesh);
      this.buildings = this.buildings.filter(item => item.id !== b.id);

      this.closeInspector();
      this.updateHUD();
      return;
    }

    if (!this.inspectedTower) return;
    const tower = this.inspectedTower;
    const config = TOWER_CONFIGS[tower.type];

    const invested = config.cost + (tower.level - 1) * config.upgradeCost;
    const refund = Math.round(invested * 0.7);
    this.slp += refund;
    this.currentPopulation = Math.max(0, this.currentPopulation - 1); // Free 1 population

    sounds.playGem();

    this.arena.gridSystem.freeTower(tower.id);
    this.removeStatusBadge(tower);
    this.arena.scene.remove(tower.mesh);
    this.towers = this.towers.filter(t => t.id !== tower.id);

    this.closeInspector();
    this.updateHUD();
  }

  private castMeteorSpell(pos: THREE.Vector3) {
    const hasCelestial = this.activeRunes.some(r => r.id === 'celestial_fury');
    this.spellCooldown = hasCelestial ? 13.0 : this.spellMaxCooldown;
    sounds.playLevelUp();
    this.arena.triggerMeteorEffect(pos);

    // Deal 180 AoE damage to all enemies within radius (expanded by celestial rune)
    const aoeRadius = hasCelestial ? 5.8 : 4.5;
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
    const axieImgUrl = config.axieImageUrl || (config.axieId ? `https://axiecdn.axieinfinity.com/axies/${config.axieId}/axie/axie-full-transparent.png` : undefined);
    const { mesh, mixer, healthBarFill, healthBarGroup, axieSpriteMesh } = this.arena.createEnemyMesh(config.modelFile, config.scale, config.colorFilter, type, axieImgUrl);

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
      axieSpriteMesh,
      animTime: 0,
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

    // Update smooth camera transitions if any
    this.arena.updateCameraTransition(rawDelta);

    // If game has not been started from welcome screen, orbit cinematic camera & render
    if (!this.isGameStarted) {
      this.arena.updateTitleCamera(rawDelta);
      this.arena.renderer.render(this.arena.scene, this.arena.camera);
      return;
    }

    const delta = this.isAnyModalOpen() ? 0 : rawDelta * this.gameSpeed;

    // 0. Intermission Auto-Wave Countdown
    if (this.isIntermission && !this.isDraftingRune) {
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

    // 1b. Update Tower & Building Card Cooldowns
    const allCards = document.querySelectorAll('.tower-card');
    allCards.forEach(card => {
      const towerType = card.getAttribute('data-tower') as TowerType | null;
      const buildingType = card.getAttribute('data-building') as BuildingType | null;
      const type = (towerType || buildingType)!;

      if (this.cardCooldowns[type] > 0) {
        this.cardCooldowns[type] = Math.max(0, this.cardCooldowns[type] - delta);
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
    });

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

      // Smooth orientation along path (eliminate sudden snapping or oscillating yaw)
      const targetYaw = Math.atan2(tangent.x, tangent.z);
      if (e.facingYaw === undefined) {
        e.facingYaw = targetYaw;
      } else {
        let diff = targetYaw - e.facingYaw;
        // Normalize angle difference to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        e.facingYaw += diff * Math.min(1.0, delta * 12.0);
      }
      e.mesh.rotation.y = e.facingYaw;

      if (e.mixer) e.mixer.update(delta);

      // Compute relative orientation to face the camera
      this._tempEnemyQuat.copy(e.mesh.quaternion).invert().multiply(this.arena.camera.quaternion);
      e.healthBarGroup.quaternion.copy(this._tempEnemyQuat);

      // Axie 2.5D Sprite Billboard & Running Animation
      if (e.axieSpriteMesh) {
        e.animTime = (e.animTime || 0) + delta * currentSpeed * 2.8;
        e.axieSpriteMesh.quaternion.copy(this._tempEnemyQuat);

        // Direction flip with hysteresis to avoid flickering/dancing when moving nearly vertically
        if (e.facingFlip === undefined) e.facingFlip = 1;
        if (tangent.x < -0.22) {
          e.facingFlip = -1; // Heading clearly West
        } else if (tangent.x > 0.22) {
          e.facingFlip = 1;  // Heading clearly East
        }
        // If moving purely North/South (|tangent.x| <= 0.22), retain current flip direction!

        // Running bounce (bobbing) and gentle tilt
        const bounce = Math.abs(Math.sin(e.animTime * 3.2)) * 0.18;
        const tilt = Math.sin(e.animTime * 3.2) * 0.08;

        e.axieSpriteMesh.position.y = bounce;
        e.axieSpriteMesh.rotation.z = tilt;
        e.axieSpriteMesh.scale.x = e.facingFlip;
      }

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
        const hasHarvest = this.activeRunes.some(r => r.id === 'slp_harvest');
        const bonusSlp = hasHarvest ? 4 : 0;
        this.slp += e.rewardSlp + bonusSlp;
        sounds.playHit();
        this.arena.showDamageNumber(e.position, Math.round(e.rewardSlp + bonusSlp), false);
        this.arena.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
        this.updateHUD();
      }
    }

    // 3b. Update Ground Hazards (Floración Venenosa)
    for (let h = this.groundHazards.length - 1; h >= 0; h--) {
      const gh = this.groundHazards[h];
      gh.duration -= delta;
      gh.tickTimer += delta;

      if (gh.tickTimer >= 0.4) {
        gh.tickTimer = 0;
        for (const enemy of this.enemies) {
          if (enemy.position.distanceTo(gh.position) <= gh.radius) {
            const tickDmg = Math.round(gh.dps * 0.4);
            enemy.hp -= tickDmg;
            if (!enemy.isImmuneSlow) {
              enemy.slowTimer = Math.max(enemy.slowTimer, 1.2);
              enemy.slowFactor = Math.max(enemy.slowFactor, 0.40);
            }
            this.arena.showDamageNumber(enemy.position, tickDmg, false);
          }
        }
      }

      if (gh.duration <= 0) {
        this.arena.scene.remove(gh.mesh);
        gh.mesh.geometry.dispose();
        this.groundHazards.splice(h, 1);
      }
    }

    // 3c. Update Homeland Buildings Construction & Research
    for (const b of this.buildings) {
      if (b.isUnderConstruction) {
        b.constructionTimer -= delta;
        const progress = Math.min(1.0, Math.max(0.01, 1 - (b.constructionTimer / b.constructionDuration)));
        const badgeLabel = b.type === 'hummer_hut' ? '⚒️ CONSTRUYENDO HERRERÍA' : '🛖 CONSTRUYENDO CABAÑA';

        this.createOrUpdateBuildingStatusBadge(b, badgeLabel, b.constructionTimer, progress);

        if (b.progressBarGroup && b.progressBarFill) {
          b.progressBarGroup.quaternion.copy(this.arena.camera.quaternion);
          b.progressBarFill.scale.set(progress, 1, 1);
        }

        if (this.inspectedBuilding?.id === b.id) {
          this.updateBuildingInspectorState();
        }

        if (b.constructionTimer <= 0) {
          b.isUnderConstruction = false;
          this.removeBuildingStatusBadge(b);
          if (b.progressBarGroup) b.progressBarGroup.visible = false;
          if (b.populationBonus > 0) {
            this.maxPopulation += b.populationBonus; // +2 Max Population applied for Hemp Hut!
            sounds.playLevelUp();
            this.showToast(`✨ ¡Cabaña completada! Población máxima: +${b.populationBonus} (Tope: ${this.maxPopulation})`, 'info');
          } else {
            sounds.playLevelUp();
            this.showToast(`⚒️ ¡Herrería completada! Ya puedes investigar tecnologías de torres.`, 'info');
          }
          this.updateHUD();
          if (this.inspectedBuilding?.id === b.id) this.openBuildingInspector(b);
        }
      } else if (b.isUpgrading) {
        // Hummer Hut Upgrade in Progress (Lv1 -> Lv2)
        b.upgradeTimer = (b.upgradeTimer || 0) - delta;
        const progress = Math.min(1.0, Math.max(0.01, 1 - (b.upgradeTimer / (b.upgradeDuration || 6.0))));

        this.createOrUpdateBuildingStatusBadge(b, '⚒️ MEJORANDO HERRERÍA A NV.2', b.upgradeTimer, progress);

        if (b.progressBarGroup && b.progressBarFill) {
          b.progressBarGroup.quaternion.copy(this.arena.camera.quaternion);
          b.progressBarFill.scale.set(progress, 1, 1);
        }

        if (this.inspectedBuilding?.id === b.id) {
          this.updateBuildingInspectorState();
        }

        if (b.upgradeTimer <= 0) {
          b.isUpgrading = false;
          b.level = 2;
          this.removeBuildingStatusBadge(b);
          if (b.progressBarGroup) b.progressBarGroup.visible = false;

          // Update 3D Sprite to Hummer Hut Level 2 / hummer_hut_3.jpg
          this.arena.updateBuildingSprite(b.mesh, b.type, 2);

          sounds.playLevelUp();
          this.showToast(t('toastBuildingUpgraded', { name: BUILDING_CONFIGS[b.type].name, lvl: 2 }), 'info');

          this.updateHUD();
          if (this.inspectedBuilding?.id === b.id) this.openBuildingInspector(b);
        }
      } else if (b.currentResearch) {
        // Research in Progress
        b.currentResearch.timer -= delta;
        const progress = Math.min(1.0, Math.max(0.01, 1 - (b.currentResearch.timer / b.currentResearch.duration)));
        const tech = TECH_CONFIGS[b.currentResearch.techId];
        const techName = tech ? t(tech.nameKey) : 'TECNOLOGÍA';

        this.createOrUpdateBuildingStatusBadge(b, `🔬 FORJANDO ${techName.toUpperCase()}`, b.currentResearch.timer, progress);

        if (b.progressBarGroup && b.progressBarFill) {
          b.progressBarGroup.quaternion.copy(this.arena.camera.quaternion);
          b.progressBarFill.scale.set(progress, 1, 1);
        }

        if (this.inspectedBuilding?.id === b.id) {
          this.updateBuildingInspectorState();
        }

        if (b.currentResearch.timer <= 0) {
          const finishedTechId = b.currentResearch.techId;
          b.currentResearch = undefined;
          this.removeBuildingStatusBadge(b);
          if (b.progressBarGroup) b.progressBarGroup.visible = false;

          if (!b.researchedTechs) b.researchedTechs = [];
          if (!b.researchedTechs.includes(finishedTechId)) {
            b.researchedTechs.push(finishedTechId);
          }

          if (tech && tech.targetLevel === 3) {
            // Grants 1 token/permit for this specific tower type
            this.lv3Tokens[tech.towerType] = (this.lv3Tokens[tech.towerType] || 0) + 1;
            sounds.playLevelUp();
            const towerName = TOWER_CONFIGS[tech.towerType].name;
            this.showToast(t('toastTechUnlockedLv3', { name: techName, target: towerName }), 'info');
          } else {
            this.unlockedTechs.add(finishedTechId);
            sounds.playLevelUp();
            const targetName = tech ? TOWER_CONFIGS[tech.towerType].name : 'torre';
            this.showToast(t('toastTechUnlocked', { name: techName, target: targetName, lvl: tech?.targetLevel || 2 }), 'info');
          }

          this.updateHUD();
          if (this.inspectedBuilding?.id === b.id) this.openBuildingInspector(b);
          if (this.inspectedTower) this.updateInspectorState();
        }
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
          this.updateInspectorState();
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
          this.updateInspectorState();
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
          const { mesh, mixer, billboardMesh, hologramGroup } = this.arena.createTowerMesh(
            config.modelFile,
            t.level,
            t.customAxie,
            t.visualMode || 'billboard_25d'
          );
          mesh.position.copy(t.position);

          // Re-attach progress bar
          const { group: pbGroup, fill: pbFill } = this.arena.createTowerProgressBar();
          mesh.add(pbGroup);
          t.mesh = mesh;
          t.mixer = mixer;
          t.billboardMesh = billboardMesh;
          t.hologramGroup = hologramGroup;
          this.arena.scene.add(mesh);

          sounds.playLevelUp();
          if (this.inspectedTower?.id === t.id) this.openInspector(t);
        }
        continue; // Tower does not attack while channeling upgrade
      }

      // C. Active Combat targeting and firing
      if (t.mixer) t.mixer.update(delta);

      // Procedural animations for custom Axies (breathing, recoil, hologram rotation)
      if (t.billboardMesh) {
        let bounce = 0;
        if (t.attackAnimTimer && t.attackAnimTimer > 0) {
          t.attackAnimTimer -= delta;
          bounce = Math.sin((t.attackAnimTimer / 0.25) * Math.PI) * 0.35;
        }
        const breath = Math.sin(performance.now() * 0.003 + (t.spotId || 0) * 1.5) * 0.05;
        t.billboardMesh.position.y = 0.35 + breath + bounce;
      }
      if (t.hologramGroup) {
        t.hologramGroup.rotation.y += delta * 1.2;
        t.hologramGroup.position.y = 2.3 + Math.sin(performance.now() * 0.003) * 0.06;
      }

      t.attackTimer += delta;

      // Apply Hawkeye rune: +20% range
      const hasHawkeye = this.activeRunes.some(r => r.id === 'hawkeye_rune');
      const effRange = hasHawkeye ? t.range * 1.20 : t.range;

      const effAttackSpeed = t.attackSpeed;

      // Find best target based on tower.targetingMode
      let bestTarget: TDEnemy | null = null;
      let bestScore = -Infinity;

      for (const enemy of this.enemies) {
        const dist = enemy.position.distanceTo(t.position);
        if (dist <= effRange) {
          let score = 0;
          switch (t.targetingMode) {
            case 'first':
              score = enemy.pathDistance;
              break;
            case 'strongest':
              score = enemy.hp;
              break;
            case 'weakest':
              score = -enemy.hp;
              break;
            case 'fastest':
              score = enemy.speed;
              break;
          }
          if (score > bestScore) {
            bestScore = score;
            bestTarget = enemy;
          }
        }
      }

      if (bestTarget) {
        // Rotate tower smoothly towards target
        const dir = new THREE.Vector3().subVectors(bestTarget.position, t.position);
        t.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Fire
        const cooldown = 1 / effAttackSpeed;
        if (t.attackTimer >= cooldown) {
          t.attackTimer = 0;
          this.fireProjectile(t, bestTarget);
        }
      }
    }

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifeTimer += delta;

      // Fail-safe 1: Despawn expired projectiles (cannot freeze or accumulate)
      if (p.lifeTimer >= p.maxLife) {
        this.arena.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      const targetEnemy = this.enemies.find(e => e.id === p.targetId);

      if (targetEnemy) {
        p.targetLastPos.copy(targetEnemy.position);
        p.targetLastPos.y = 0.8; // Aim at center of body, not feet!
      }

      // Move toward target position
      const dir = new THREE.Vector3().subVectors(p.targetLastPos, p.mesh.position);
      const dist = dir.length();
      const moveStep = p.speed * delta;

      // Fail-safe 2: Hit detection!
      // If within 0.8m OR if moveStep will reach or overshoot the target this frame:
      if (dist <= moveStep || dist < 0.8) {
        // Impact!
        this.onProjectileImpact(p, targetEnemy);
        this.arena.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.projectiles.splice(i, 1);
      } else {
        dir.normalize();
        p.mesh.position.addScaledVector(dir, moveStep);
        p.mesh.lookAt(p.targetLastPos);
      }
    }

    // 6. Render 3D Scene
    this.arena.renderer.render(this.arena.scene, this.arena.camera);
  }

  private fireProjectile(tower: TowerInstance, target: TDEnemy) {
    sounds.playShoot();
    tower.attackAnimTimer = 0.25;

    // Ultimate Charge Accumulation for Level 3 Towers
    if (tower.level >= 3) {
      tower.ultimateCharge++;
      if (this.inspectedTower?.id === tower.id) {
        this.ultimateChargeText.textContent = `${tower.ultimateCharge} / ${tower.ultimateMax}`;
        const pct = Math.min(100, Math.round((tower.ultimateCharge / tower.ultimateMax) * 100));
        this.ultimateFill.style.width = `${pct}%`;
      }

      if (tower.ultimateCharge >= tower.ultimateMax) {
        tower.ultimateCharge = 0;
        if (this.inspectedTower?.id === tower.id) {
          this.ultimateChargeText.textContent = `0 / ${tower.ultimateMax}`;
          this.ultimateFill.style.width = `0%`;
        }
        this.triggerTowerUltimate(tower, target);
      }
    }

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

    const targetPos = target.position.clone();
    targetPos.y = 0.8;

    this.projectiles.push({
      id: this.nextProjId++,
      type: tower.type,
      mesh,
      targetId: target.id,
      targetLastPos: targetPos,
      speed: tower.type === 'tripp' ? 32 : 18,
      damage: finalDmg,
      isCrit,
      isSplash: tower.type === 'bing',
      splashRadius: 2.8,
      isSlow: tower.type === 'bing',
      isPoison: tower.type === 'pomodoro' && tower.level >= 2,
      lifeTimer: 0,
      maxLife: 2.5
    });
  }

  private onProjectileImpact(p: TDProjectile, directTarget?: TDEnemy) {
    sounds.playHit();

    const hasStorm = this.activeRunes.some(r => r.id === 'storm_rune');
    const hasFrost = this.activeRunes.some(r => r.id === 'frost_amulet');
    const hasDeepPoison = this.activeRunes.some(r => r.id === 'deep_poison');

    // Rune: Storm Rune (Kotaro Crit triggers chain lightning)
    if (hasStorm && p.isCrit) {
      this.triggerChainLightning(p.targetLastPos, 3, 65);
    }

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

          // Rune: Frost Amulet (30% chance to freeze completely for 1.0s)
          if (hasFrost && !enemy.isImmuneSlow && Math.random() < 0.30) {
            enemy.slowTimer = 1.0;
            enemy.slowFactor = 1.0; // 100% freeze
            this.arena.showDamageNumber(enemy.position, 0, true);
          } else if (!enemy.isImmuneSlow) {
            // Personality: Anti-Slow Immunity & Boss Resistance
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
        directTarget.poisonTimer = hasDeepPoison ? 8.0 : 4.0;
        directTarget.poisonDmg = hasDeepPoison ? 14 : 8;
      }
    }
  }

  private triggerTowerUltimate(tower: TowerInstance, target: TDEnemy) {
    sounds.playLevelUp();

    if (tower.type === 'pomodoro') {
      // Pomodoro: Triple Mortar barrage!
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (!target || (target.hp <= 0 && this.enemies.length === 0)) return;
          const currentTarget = this.enemies.find(e => e.id === target.id) || this.enemies[0];
          if (!currentTarget) return;

          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 2.5,
            0,
            (Math.random() - 0.5) * 2.5
          );
          const mortarPos = currentTarget.position.clone().add(offset);
          mortarPos.y = 0.8;

          const geom = new THREE.SphereGeometry(0.35, 8, 8);
          const mat = new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e });
          const mesh = new THREE.Mesh(geom, mat);
          mesh.position.copy(tower.position);
          mesh.position.y = 1.6;
          this.arena.scene.add(mesh);

          this.projectiles.push({
            id: this.nextProjId++,
            type: 'pomodoro',
            mesh,
            targetId: currentTarget.id,
            targetLastPos: mortarPos,
            speed: 22,
            damage: Math.round(tower.damage * 2.0),
            isCrit: true,
            isSplash: true,
            splashRadius: 3.5,
            isSlow: false,
            isPoison: true,
            lifeTimer: 0,
            maxLife: 2.5
          });
          sounds.playShoot();
        }, i * 160);
      }
    } else if (tower.type === 'kotaro') {
      // Kotaro: Whirlwind Slash in 360 degrees (radius 3.8m)
      this.arena.triggerWhirlwindSlash(tower.position, 3.8);
      sounds.playShoot();
      for (const enemy of this.enemies) {
        if (enemy.position.distanceTo(tower.position) <= 3.8) {
          const ultDmg = Math.round(tower.damage * 2.4);
          enemy.hp -= ultDmg;
          this.arena.showDamageNumber(enemy.position, ultDmg, true);
        }
      }
    } else if (tower.type === 'bing') {
      // Bing: Tsunami Wave pushing enemies back 2.8m along path
      this.arena.triggerTsunamiWave(tower.position, 5.2);
      sounds.playShoot();
      for (const enemy of this.enemies) {
        if (enemy.position.distanceTo(tower.position) <= 5.2) {
          const ultDmg = Math.round(tower.damage * 1.5);
          enemy.hp -= ultDmg;
          this.arena.showDamageNumber(enemy.position, ultDmg, false);

          // Push back along path
          enemy.pathDistance = Math.max(0, enemy.pathDistance - 2.8);
          const { position, tangent } = this.arena.pathSystem.getPositionAtDistance(enemy.pathDistance);
          enemy.position.copy(position);
          enemy.mesh.position.copy(position);
          enemy.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

          // Apply slow
          if (!enemy.isImmuneSlow) {
            enemy.slowTimer = 3.0;
            enemy.slowFactor = 0.5;
          }
        }
      }
    } else if (tower.type === 'tripp') {
      // Tripp: Divine Piercing Beam
      const targetPos = target.position.clone();
      targetPos.y = 0.8;
      const dir = new THREE.Vector3().subVectors(targetPos, tower.position).normalize();
      const beamEnd = tower.position.clone().addScaledVector(dir, tower.range * 1.3);
      this.arena.triggerDivineBeam(tower.position, beamEnd);
      sounds.playShoot();

      const lineSegment = new THREE.Line3(tower.position, beamEnd);
      const closestPoint = new THREE.Vector3();

      for (const enemy of this.enemies) {
        lineSegment.closestPointToPoint(enemy.position, true, closestPoint);
        if (closestPoint.distanceTo(enemy.position) <= 1.4) {
          const ultDmg = Math.round(tower.damage * 3.2);
          enemy.hp -= ultDmg;
          this.arena.showDamageNumber(enemy.position, ultDmg, true);
        }
      }
    }
  }

  private triggerChainLightning(origin: THREE.Vector3, maxTargets: number, damage: number) {
    const sorted = [...this.enemies]
      .filter(e => e.hp > 0)
      .sort((a, b) => a.position.distanceTo(origin) - b.position.distanceTo(origin));

    const targets = sorted.slice(0, maxTargets);
    if (targets.length === 0) return;

    const points: THREE.Vector3[] = [origin.clone()];
    for (const t of targets) {
      points.push(t.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
      t.hp -= damage;
      this.arena.showDamageNumber(t.position, damage, true);
    }

    this.arena.triggerChainLightning(points);
    sounds.playShoot();
  }

  private spawnGroundHazard(pos: THREE.Vector3, radius: number, duration: number, dps: number) {
    const mesh = this.arena.createBloomHazardMesh(pos, radius);
    const hazard: GroundHazard = {
      id: this.nextHazardId++,
      position: pos.clone(),
      radius,
      duration,
      maxDuration: duration,
      dps,
      mesh,
      tickTimer: 0
    };
    this.groundHazards.push(hazard);
  }

  private renderRuneChips() {
    this.activeRunesContainer.innerHTML = '';
    for (const rune of this.activeRunes) {
      const chip = document.createElement('div');
      chip.className = `rune-chip ${rune.rarity}`;
      const name = t(`rune_${rune.id}_name`);
      const desc = t(`rune_${rune.id}_desc`);
      chip.title = `${name}: ${desc}`;
      chip.innerHTML = `${rune.icon} <span>${name}</span>`;
      this.activeRunesContainer.appendChild(chip);
    }
  }

  private openRuneDraft() {
    this.isDraftingRune = true;
    sounds.playLevelUp();

    const unowned = RUNE_CATALOG.filter(r => !this.activeRunes.some(ar => ar.id === r.id));
    const shuffled = [...unowned].sort(() => 0.5 - Math.random());
    const draftChoices = shuffled.slice(0, 3);

    this.runeOptionsRow.innerHTML = '';
    draftChoices.forEach(rune => {
      const card = document.createElement('div');
      card.className = `rune-card ${rune.rarity}`;
      const name = rune.name;
      const desc = rune.description;
      const classKey = rune.classReq === 'plant' ? 'classPlant' :
                       rune.classReq === 'beast' ? 'classBeast' :
                       rune.classReq === 'aqua' ? 'classAqua' :
                       rune.classReq === 'bird' ? 'classBird' : '';
      const typeLabel = classKey ? t(classKey) : 'Universal';
      card.innerHTML = `
        <div class="rune-card-rarity">${rune.rarity.toUpperCase()}</div>
        <div class="rune-card-icon">${rune.icon}</div>
        <div class="rune-card-name">${name}</div>
        <div class="rune-card-desc">${desc}</div>
        <div class="rune-card-type">${typeLabel}</div>
      `;
      card.addEventListener('click', () => {
        this.selectRune(rune);
      });
      this.runeOptionsRow.appendChild(card);
    });

    this.runeModal.classList.remove('hidden');
  }

  private selectRune(rune: RuneConfig) {
    this.activeRunes.push(rune);
    if (rune.id === 'ancient_bulwark') {
      this.lives = Math.min(16, this.lives + 6);
      this.updateHUD();
    }
    this.renderRuneChips();
    this.runeModal.classList.add('hidden');
    this.isDraftingRune = false;
    sounds.playGem();
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
    if (sounds.getMusicVolume() > 0) {
      sounds.playTitleMusic(true);
    } else {
      sounds.stopMusic();
    }
    this.resultScreen.classList.remove('hidden');

    if (isVictory) {
      sounds.playLevelUp();
      this.resultBadge.textContent = t('resultVictoryBadge');
      this.resultBadge.style.color = 'var(--accent-gold)';
      this.resultTitle.textContent = t('resultVictoryTitle');
      this.resultSubtitle.textContent = t('resultVictorySubtitle');
    } else {
      sounds.playGameOver();
      this.resultBadge.textContent = t('resultDefeatBadge');
      this.resultBadge.style.color = 'var(--accent-beast)';
      this.resultTitle.textContent = t('resultDefeatTitle');
      this.resultSubtitle.textContent = t('resultDefeatSubtitle', { wave: this.currentWaveIndex + 1 });
    }

    this.finalWave.textContent = `${this.currentWaveIndex + 1} / ${TD_WAVES.length}`;
    this.finalLives.textContent = `${this.lives} / 10`;
  }
}

// Start Game Engine
window.addEventListener('DOMContentLoaded', () => {
  new TowerDefenseGame();
});
