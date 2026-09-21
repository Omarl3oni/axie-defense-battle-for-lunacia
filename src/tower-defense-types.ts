import * as THREE from 'three';

export type TowerType = 'pomodoro' | 'kotaro' | 'bing' | 'tripp';
export type BuildingType = 'hemp_hut' | 'hummer_hut';
export type PlaceableType = TowerType | BuildingType;

export interface TechConfig {
  id: string;
  towerType: TowerType;
  targetLevel: number;
  reqBuildingLevel?: number;
  nameKey: string;
  descKey: string;
  cost: number;
  researchTime: number; // in seconds
  icon: string;
}

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  categoryLabel: string;
  icon: string;
  imageFile: string;
  upgradeImageFile?: string;
  cost: number;
  upgradeCost?: number;
  upgradeTime?: number;
  buildTime: number;
  populationBonus: number;
  description: string;
  specialTrait: string;
}

export interface BuildingInstance {
  id: string;
  type: BuildingType;
  level: number;
  position: THREE.Vector3;
  mesh: THREE.Group;
  populationBonus: number;
  isUnderConstruction: boolean;
  constructionTimer: number;
  constructionDuration: number;
  isUpgrading?: boolean;
  upgradeTimer?: number;
  upgradeDuration?: number;
  currentResearch?: {
    techId: string;
    timer: number;
    duration: number;
  };
  progressBarGroup?: THREE.Group;
  progressBarFill?: THREE.Mesh;
  statusBadgeEl?: HTMLElement;
  researchedTechs?: string[];
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  classLabel: string;
  icon: string;
  avatarImage: string;
  modelFile: string;
  cost: number;
  upgradeCost: number;
  buildTime: number; // Construction duration in seconds
  range: number;
  attackSpeed: number; // Attacks per second
  damage: number;
  damageType: 'rapid' | 'crit' | 'splash' | 'sniper';
  description: string;
  specialTrait: string;
}

export interface TowerInstance {
  id: string;
  type: TowerType;
  level: number; // 1, 2, or 3
  spotId?: number;
  position: THREE.Vector3;
  range: number;
  damage: number;
  attackSpeed: number;
  attackTimer: number;
  targetEnemyId: number | null;
  mesh: THREE.Group;
  mixer?: THREE.AnimationMixer;
  rangeMesh?: THREE.Mesh;

  // Targeting & Ultimate Skill State
  targetingMode: TargetingMode;
  ultimateCharge: number;
  ultimateMax: number;

  // Custom Axie NFT & Visual Mode State
  customAxie?: import('./axie-nft').AxieNFT;
  billboardMesh?: THREE.Mesh;
  hologramGroup?: THREE.Group;
  visualMode?: import('./axie-nft').VisualMode;
  attackAnimTimer?: number;

  // Construction & Upgrade Cooldown State
  isUnderConstruction: boolean;
  constructionTimer: number;
  constructionDuration: number;
  isUpgrading: boolean;
  upgradeTimer: number;
  upgradeDuration: number;
  targetLevel: number;
  progressBarGroup?: THREE.Group;
  progressBarFill?: THREE.Mesh;
  statusBadgeEl?: HTMLElement;
}

export type TargetingMode = 'first' | 'strongest' | 'weakest' | 'fastest';

export interface RuneConfig {
  id: string;
  name: string;
  icon: string;
  rarity: 'rare' | 'epic' | 'legendary';
  description: string;
  classReq?: string;
}

export interface GroundHazard {
  id: number;
  position: THREE.Vector3;
  radius: number;
  duration: number;
  maxDuration: number;
  dps: number;
  mesh: THREE.Mesh;
  tickTimer: number;
}

export type EnemyType = 'scout' | 'warrior' | 'armored' | 'toxic' | 'boss';

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  traitLabel: string;
  modelFile: string;
  baseHp: number;
  speed: number;
  rewardSlp: number;
  scale: number;
  colorFilter?: number;
  isImmuneSlow?: boolean;
  isImmunePoison?: boolean;
  armorReduction?: number;
  regenRate?: number;
  hasSprint?: boolean;
  axieId?: string;
  axieImageUrl?: string;
}

export interface TDEnemy {
  id: number;
  type: EnemyType;
  name: string;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  rewardSlp: number;
  pathDistance: number; // Total distance traversed along path
  position: THREE.Vector3;
  mesh: THREE.Group;
  mixer?: THREE.AnimationMixer;
  isBoss: boolean;
  slowTimer: number;
  slowFactor: number;
  poisonTimer: number;
  poisonDmg: number;
  healthBarFill: THREE.Mesh;
  healthBarGroup: THREE.Group;
  axieSpriteMesh?: THREE.Mesh;
  animTime?: number;
  facingYaw?: number;
  facingFlip?: number;

  // Personality Traits
  isImmuneSlow?: boolean;
  isImmunePoison?: boolean;
  armorReduction?: number;
  regenRate?: number;
  hasSprint?: boolean;
  isFrenzyActive?: boolean;
}

export interface TDProjectile {
  id: number;
  type: TowerType;
  mesh: THREE.Mesh;
  targetId: number;
  targetLastPos: THREE.Vector3;
  speed: number;
  damage: number;
  isCrit: boolean;
  isSplash: boolean;
  splashRadius: number;
  isSlow: boolean;
  isPoison: boolean;
  lifeTimer: number;
  maxLife: number;
}

export interface TowerSpot {
  id: number;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  occupiedBy: TowerInstance | null;
}

export interface WaveGroup {
  enemyType: EnemyType;
  count: number;
  interval: number; // seconds between spawns
  delay: number;    // seconds before starting this group
}

export interface WaveConfig {
  waveNumber: number;
  groups: WaveGroup[];
}

export interface GridCoord {
  col: number;
  row: number;
}

export interface PathArchetype {
  id: string;
  name: string;
  description: string;
  gridTurns: GridCoord[];
  baseWaypoints?: THREE.Vector3[];
}
