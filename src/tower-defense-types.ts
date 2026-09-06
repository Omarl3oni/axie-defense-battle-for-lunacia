import * as THREE from 'three';

export type TowerType = 'pomodoro' | 'kotaro' | 'bing' | 'tripp';

export interface TowerConfig {
  type: TowerType;
  name: string;
  classLabel: string;
  icon: string;
  modelFile: string;
  cost: number;
  upgradeCost: number;
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
}

export type EnemyType = 'scout' | 'warrior' | 'armored' | 'boss';

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  modelFile: string;
  baseHp: number;
  speed: number;
  rewardSlp: number;
  scale: number;
  colorFilter?: number;
}

export interface TDEnemy {
  id: number;
  type: EnemyType;
  name: string;
  hp: number;
  maxHp: number;
  speed: number;
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
