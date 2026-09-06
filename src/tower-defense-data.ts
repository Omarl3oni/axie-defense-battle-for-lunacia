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
    name: 'Quimera Berserker',
    traitLabel: '⚡ Sprint Feroz',
    modelFile: 'xia.glb',
    baseHp: 95,
    speed: 4.4,
    rewardSlp: 12,
    scale: 1.05,
    colorFilter: 0xdc2626,
    hasSprint: true
  },
  warrior: {
    type: 'warrior',
    name: 'Quimera Bestia Feral',
    traitLabel: '🛡️ Regeneración',
    modelFile: 'kibo.glb',
    baseHp: 220,
    speed: 2.7,
    rewardSlp: 22,
    scale: 1.25,
    colorFilter: 0x15803d,
    regenRate: 14
  },
  armored: {
    type: 'armored',
    name: 'Quimera Acorazada',
    traitLabel: '🧱 Anti-Slow & Blindaje',
    modelFile: 'paladill.glb',
    baseHp: 500,
    speed: 1.6,
    rewardSlp: 45,
    scale: 1.45,
    colorFilter: 0x6b21a8,
    isImmuneSlow: true,
    armorReduction: 0.35
  },
  toxic: {
    type: 'toxic',
    name: 'Quimera Tóxica',
    traitLabel: '🧪 Anti-Veneno & Aura',
    modelFile: 'bing.glb',
    baseHp: 320,
    speed: 2.4,
    rewardSlp: 35,
    scale: 1.2,
    colorFilter: 0x059669,
    isImmunePoison: true
  },
  boss: {
    type: 'boss',
    name: 'Reina Quimera Ancestral',
    traitLabel: '👑 Colosal Imparable',
    modelFile: 'kibo.glb',
    baseHp: 3600,
    speed: 1.35,
    rewardSlp: 300,
    scale: 2.5,
    colorFilter: 0x991b1b
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
  new THREE.Vector3(8, 0, 9),      // Third curve down
  new THREE.Vector3(15, 0, 9),
  new THREE.Vector3(19, 0, 2)      // Ancient Tree Goal
];

// Pre-defined strategic placement spots
export const FIXED_TOWER_SPOTS: THREE.Vector3[] = [
  new THREE.Vector3(-15, 0, -5),     // Spot 0: Early killzone
  new THREE.Vector3(-11.5, 0, -11.5), // Spot 1: North inlet
  new THREE.Vector3(-11.5, 0, 3.5),  // Spot 2: Outside first bend
  new THREE.Vector3(-4.5, 0, -2.5),  // Spot 3: Center intersection
  new THREE.Vector3(4.5, 0, 2.5),    // Spot 4: Mid intersection
  new THREE.Vector3(4.5, 0, -7.5),   // Spot 5: Top loop
  new THREE.Vector3(11.5, 0, 2.5),   // Spot 6: Late curve inside
  new THREE.Vector3(11.5, 0, 9.5)    // Spot 7: Late defense before tree
];

// 10 Balanced Progressive Waves
export const TD_WAVES: WaveConfig[] = [
  // Ola 1: Introducción Rápida
  {
    waveNumber: 1,
    groups: [
      { enemyType: 'scout', count: 8, interval: 1.2, delay: 0 }
    ]
  },
  // Ola 2: Mezcla de veloces y bestias feroces
  {
    waveNumber: 2,
    groups: [
      { enemyType: 'scout', count: 10, interval: 1.1, delay: 0 },
      { enemyType: 'warrior', count: 4, interval: 1.8, delay: 4 }
    ]
  },
  // Ola 3: Escuadrón de Bestias Ferales
  {
    waveNumber: 3,
    groups: [
      { enemyType: 'warrior', count: 10, interval: 1.3, delay: 0 },
      { enemyType: 'scout', count: 8, interval: 0.9, delay: 5 }
    ]
  },
  // Ola 4: Vanguardia Acorazada
  {
    waveNumber: 4,
    groups: [
      { enemyType: 'armored', count: 4, interval: 2.8, delay: 0 },
      { enemyType: 'scout', count: 12, interval: 1.0, delay: 2 }
    ]
  },
  // Ola 5: Horda Mixta con Quimeras Tóxicas
  {
    waveNumber: 5,
    groups: [
      { enemyType: 'warrior', count: 10, interval: 1.2, delay: 0 },
      { enemyType: 'toxic', count: 5, interval: 1.8, delay: 3 },
      { enemyType: 'armored', count: 3, interval: 2.4, delay: 7 }
    ]
  },
  // Ola 6: Asedio de Caparazones Acorazados
  {
    waveNumber: 6,
    groups: [
      { enemyType: 'armored', count: 7, interval: 2.0, delay: 0 },
      { enemyType: 'scout', count: 15, interval: 0.8, delay: 3 }
    ]
  },
  // Ola 7: Ataque Relámpago en Enjambre
  {
    waveNumber: 7,
    groups: [
      { enemyType: 'scout', count: 20, interval: 0.6, delay: 0 },
      { enemyType: 'toxic', count: 7, interval: 1.6, delay: 2 },
      { enemyType: 'warrior', count: 10, interval: 1.0, delay: 5 }
    ]
  },
  // Ola 8: Fortaleza Móvil Tóxica
  {
    waveNumber: 8,
    groups: [
      { enemyType: 'armored', count: 8, interval: 1.8, delay: 0 },
      { enemyType: 'toxic', count: 8, interval: 1.4, delay: 2 },
      { enemyType: 'warrior', count: 14, interval: 1.0, delay: 4 }
    ]
  },
  // Ola 9: Gran Asedio Pre-Jefe
  {
    waveNumber: 9,
    groups: [
      { enemyType: 'armored', count: 10, interval: 1.6, delay: 0 },
      { enemyType: 'scout', count: 18, interval: 0.7, delay: 2 },
      { enemyType: 'toxic', count: 10, interval: 1.3, delay: 4 },
      { enemyType: 'warrior', count: 12, interval: 0.9, delay: 6 }
    ]
  },
  // Ola 10: JEFE FINAL - Reina Quimera Ancestral
  {
    waveNumber: 10,
    groups: [
      { enemyType: 'armored', count: 6, interval: 1.8, delay: 0 },
      { enemyType: 'toxic', count: 6, interval: 1.6, delay: 2 },
      { enemyType: 'boss', count: 1, interval: 1.0, delay: 4 },
      { enemyType: 'scout', count: 20, interval: 0.7, delay: 7 }
    ]
  }
];
