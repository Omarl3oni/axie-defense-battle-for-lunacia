export type AxieClass = 'plant' | 'beast' | 'aqua' | 'bird' | 'reptile' | 'bug';

export interface AxieData {
  baseId: string;
  name: string;
  modelFile: string; // e.g. 'pomodoro.glb', 'kotaro.glb', etc.
  axieClass: AxieClass;
  classLabel: string;
  icon: string;
  baseHp: number;
  baseAtk: number;
  baseSpeed: number;
  abilityName: string;
  abilityDesc: string;
}

export interface AxieUnit {
  instanceId: string;
  baseId: string;
  name: string;
  modelFile: string;
  axieClass: AxieClass;
  classLabel: string;
  icon: string;
  level: number; // 1 or 2 (Gold)
  copies: number; // 1 to 3 (3 triggers fusion)
  hp: number;
  maxHp: number;
  attack: number;
  speed: number;
  shield: number;
  isStunned?: boolean;
  abilityName: string;
  abilityDesc: string;
  item?: EquipmentItem;
}

export interface EquipmentItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  bonusHp: number;
  bonusAtk: number;
  bonusSpeed: number;
  cost: number;
}

export type BattleSide = 'player' | 'enemy';

export interface CombatAction {
  type: 'ATTACK' | 'SKILL' | 'DEATH' | 'SHIELD' | 'STUN';
  sourceSide: BattleSide;
  sourceSlot: number;
  targetSide?: BattleSide;
  targetSlot?: number;
  damage?: number;
  shield?: number;
  isCrit?: boolean;
  message?: string;
}

export interface CombatRoundResult {
  isVictory: boolean;
  isDraw: boolean;
  actions: CombatAction[];
}
