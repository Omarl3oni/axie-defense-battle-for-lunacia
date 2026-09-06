import * as THREE from 'three';

export type CharacterType = 'pomodoro' | 'kotaro';

export type AxiePartType = 'horn' | 'mouth' | 'back' | 'tail' | 'passive';

export interface UpgradeCard {
  id: string;
  name: string;
  partType: AxiePartType;
  icon: string;
  description: string;
  level: number;
  maxLevel: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  speed: number;
  critRate: number;
  critDamage: number;
  defense: number;
  pickupRadius: number;
  exp: number;
  nextLevelExp: number;
  level: number;
}

export interface ActiveWeapon {
  id: string;
  level: number;
  cooldownTimer: number;
  baseCooldown: number;
}

export interface Enemy {
  id: number;
  mesh: THREE.Object3D;
  mixer?: THREE.AnimationMixer;
  type: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  expValue: number;
  isBoss: boolean;
  radius: number;
}

export interface Projectile {
  id: number;
  mesh: THREE.Object3D;
  velocity: THREE.Vector3;
  lifetime: number;
  damage: number;
  isCrit: boolean;
  pierce: number;
  hitEnemies: Set<number>;
}

export interface OrbitingShield {
  mesh: THREE.Object3D;
  angle: number;
  distance: number;
  damage: number;
}

export interface ExpGem {
  id: number;
  mesh: THREE.Object3D;
  value: number;
}
