import * as THREE from 'three';
import { TowerType, TowerConfig, EnemyType, EnemyConfig, WaveConfig } from './tower-defense-types';

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  pomodoro: {
    type: 'pomodoro',
    name: 'Pomodoro',
    classLabel: 'Planta',
    icon: '🍅',
    modelFile: 'pomodoro.glb',
    cost: 100,
    upgradeCost: 90,
    buildTime: 2.5,
    range: 6.8,
    attackSpeed: 1.8,
    damage: 20,
    damageType: 'rapid',
    description: 'Ametralladora de semillas rápidas. En Nivel 2 aplica veneno continuo.',
    specialTrait: '🌿 Fuego Rápido & Esporas Venenosas'
  },
  kotaro: {
    type: 'kotaro',
    name: 'Kotaro',
    classLabel: 'Bestia',
    icon: '🦊',
    modelFile: 'kotaro.glb',
    cost: 150,
    upgradeCost: 130,
    buildTime: 3.5,
    range: 5.6,
    attackSpeed: 1.0,
    damage: 52,
    damageType: 'crit',
    description: 'Cuchilladas feroces con 35% de golpe crítico (x2.5 daño). Destruye quimeras blindadas.',
    specialTrait: '⚔️ Rompe-Blindajes & Crítico Masivo'
  },
  bing: {
    type: 'bing',
    name: 'Bing',
    classLabel: 'Aqua',
    icon: '🌊',
    modelFile: 'bing.glb',
    cost: 175,
    upgradeCost: 150,
    buildTime: 4.0,
    range: 7.2,
    attackSpeed: 0.75,
    damage: 36,
    damageType: 'splash',
    description: 'Dispara proyectiles de agua en mortero que explotan y ralentizan un 45% a los enemigos cercanos.',
    specialTrait: '💧 Daño de Área & Ralentización'
  },
  tripp: {
    type: 'tripp',
    name: 'Tripp',
    classLabel: 'Pájaro',
    icon: '🪶',
    modelFile: 'tripp.glb',
    cost: 200,
    upgradeCost: 170,
    buildTime: 5.0,
    range: 11.0,
    attackSpeed: 0.55,
    damage: 90,
    damageType: 'sniper',
    description: 'Francotirador de larguísimo alcance. Elimina a las quimeras más adelantadas del camino.',
    specialTrait: '🎯 Francotirador de Alta Precisión'
  }
};

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  scout: {
    type: 'scout',
    name: 'Quimera Exploradora',
    traitLabel: '⚡ Sprint Veloz',
    modelFile: 'sapidae-m-a.glb',
    baseHp: 75,
    speed: 4.2,
    rewardSlp: 12,
    scale: 1.0,
    hasSprint: true
  },
  warrior: {
    type: 'warrior',
    name: 'Quimera Guerrera',
    traitLabel: '🛡️ Regeneración',
    modelFile: 'sapidae-f-a.glb',
    baseHp: 160,
    speed: 2.6,
    rewardSlp: 20,
    scale: 1.25,
    regenRate: 10
  },
  armored: {
    type: 'armored',
    name: 'Quimera Blindada',
    traitLabel: '🧱 Anti-Slow & Blindaje',
    modelFile: 'sapidae-m-e.glb',
    baseHp: 380,
    speed: 1.5,
    rewardSlp: 40,
    scale: 1.5,
    colorFilter: 0x9333ea,
    isImmuneSlow: true,
    armorReduction: 0.3
  },
  toxic: {
    type: 'toxic',
    name: 'Quimera Tóxica',
    traitLabel: '🧪 Anti-Veneno & Aura',
    modelFile: 'sapidae-f-c.glb',
    baseHp: 240,
    speed: 2.3,
    rewardSlp: 30,
    scale: 1.25,
    colorFilter: 0x10b981,
    isImmunePoison: true
  },
  boss: {
    type: 'boss',
    name: 'Reina Quimera Ancestral',
    traitLabel: '👑 Colosal Imparable',
    modelFile: 'sapidae-f-b.glb',
    baseHp: 2800,
    speed: 1.3,
    rewardSlp: 250,
    scale: 2.7,
    colorFilter: 0xff1144
  }
};

// S-curved 3D Waypoints across Lunacia Forest
export const PATH_WAYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(-19, 0, -8),   // Portal Start
  new THREE.Vector3(-11, 0, -8),
  new THREE.Vector3(-8, 0, -2),
  new THREE.Vector3(-8, 0, 7),     // First big curve down
  new THREE.Vector3(-1, 0, 7),
  new THREE.Vector3(1, 0, -4),     // Second big curve up
  new THREE.Vector3(8, 0, -4),
  new THREE.Vector3(8, 0, 6),      // Third curve
  new THREE.Vector3(15, 0, 6),
  new THREE.Vector3(18, 0, 0)      // Ancient Tree of Lunacia End
];

// 8 Strategic Tower Platforms overlooking the path curves
export const TOWER_SPOTS_POSITIONS: THREE.Vector3[] = [
  new THREE.Vector3(-14, 0, -4.5),  // Spot 0: Early start
  new THREE.Vector3(-4.5, 0, 4.0),   // Spot 1: Inside first bend
  new THREE.Vector3(-11.5, 0, 3.5),  // Spot 2: Outside first bend
  new THREE.Vector3(-4.5, 0, -2.5),  // Spot 3: Center intersection
  new THREE.Vector3(4.5, 0, 2.5),    // Spot 4: Mid intersection
  new THREE.Vector3(4.5, 0, -7.5),   // Spot 5: Top loop
  new THREE.Vector3(11.5, 0, 2.5),   // Spot 6: Late curve inside
  new THREE.Vector3(11.5, 0, 9.5)    // Spot 7: Late defense before tree
];

// 10 Balanced Progressive Waves
export const TD_WAVES: WaveConfig[] = [
  // Ola 1: Introducción
  {
    waveNumber: 1,
    groups: [
      { enemyType: 'scout', count: 6, interval: 1.6, delay: 0 }
    ]
  },
  // Ola 2: Mezcla de veloces y guerreros
  {
    waveNumber: 2,
    groups: [
      { enemyType: 'scout', count: 8, interval: 1.4, delay: 0 },
      { enemyType: 'warrior', count: 3, interval: 2.0, delay: 4 }
    ]
  },
  // Ola 3: Escuadrón de Guerreros
  {
    waveNumber: 3,
    groups: [
      { enemyType: 'warrior', count: 8, interval: 1.6, delay: 0 },
      { enemyType: 'scout', count: 6, interval: 1.0, delay: 6 }
    ]
  },
  // Ola 4: Primera Quimera Blindada
  {
    waveNumber: 4,
    groups: [
      { enemyType: 'armored', count: 2, interval: 3.5, delay: 0 },
      { enemyType: 'scout', count: 10, interval: 1.2, delay: 2 }
    ]
  },
  // Ola 5: Introducción de Quimeras Tóxicas
  {
    waveNumber: 5,
    groups: [
      { enemyType: 'warrior', count: 8, interval: 1.3, delay: 0 },
      { enemyType: 'toxic', count: 4, interval: 2.0, delay: 3 },
      { enemyType: 'armored', count: 2, interval: 2.5, delay: 7 }
    ]
  },
  // Ola 6: Desfile de Blindados
  {
    waveNumber: 6,
    groups: [
      { enemyType: 'armored', count: 5, interval: 2.2, delay: 0 },
      { enemyType: 'scout', count: 12, interval: 0.9, delay: 4 }
    ]
  },
  // Ola 7: Ataque Relámpago con Toxinas
  {
    waveNumber: 7,
    groups: [
      { enemyType: 'scout', count: 16, interval: 0.7, delay: 0 },
      { enemyType: 'toxic', count: 5, interval: 1.8, delay: 3 },
      { enemyType: 'warrior', count: 8, interval: 1.2, delay: 6 }
    ]
  },
  // Ola 8: Alta Resistencia Quimérica
  {
    waveNumber: 8,
    groups: [
      { enemyType: 'armored', count: 6, interval: 2.0, delay: 0 },
      { enemyType: 'toxic', count: 6, interval: 1.6, delay: 2 },
      { enemyType: 'warrior', count: 12, interval: 1.1, delay: 5 }
    ]
  },
  // Ola 9: Gran Asedio Pre-Jefe
  {
    waveNumber: 9,
    groups: [
      { enemyType: 'armored', count: 8, interval: 1.8, delay: 0 },
      { enemyType: 'scout', count: 14, interval: 0.8, delay: 2 },
      { enemyType: 'toxic', count: 8, interval: 1.4, delay: 4 },
      { enemyType: 'warrior', count: 10, interval: 1.0, delay: 7 }
    ]
  },
  // Ola 10: JEFE FINAL - Reina Quimera Ancestral
  {
    waveNumber: 10,
    groups: [
      { enemyType: 'armored', count: 4, interval: 2.0, delay: 0 },
      { enemyType: 'toxic', count: 4, interval: 1.8, delay: 2 },
      { enemyType: 'boss', count: 1, interval: 1.0, delay: 5 },
      { enemyType: 'scout', count: 16, interval: 0.8, delay: 8 }
    ]
  }
];
