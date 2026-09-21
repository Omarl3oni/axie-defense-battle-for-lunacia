import * as THREE from 'three';
import { TowerType, TowerConfig, BuildingType, BuildingConfig, EnemyType, EnemyConfig, WaveConfig, RuneConfig, PathArchetype, TechConfig } from './tower-defense-types';

export const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
  hemp_hut: {
    type: 'hemp_hut',
    name: 'Cabaña de Cáñamo',
    categoryLabel: 'Edificio',
    icon: '🛖',
    imageFile: 'assets/homeland/hemp_hut.webp',
    cost: 75,
    buildTime: 3.0,
    populationBonus: 2,
    description: 'Cabaña de descanso. Alberga axies trabajadores y guardianes, aumentando la población.',
    specialTrait: '🏠 +2 Capacidad de Población de Axies'
  },
  hummer_hut: {
    type: 'hummer_hut',
    name: 'Herrería',
    categoryLabel: 'Edificio',
    icon: '⚒️',
    imageFile: 'assets/homeland_all/buildings/hummer_hut_2.jpg',
    upgradeImageFile: 'assets/homeland_all/buildings/hummer_hut_3.jpg',
    cost: 120,
    upgradeCost: 160,
    upgradeTime: 6.0,
    buildTime: 4.5,
    populationBonus: 0,
    description: 'Herrería de forja e investigación. Desarrolla tecnologías para torres. En Nivel 2 desbloquea mejoras a Nivel 3.',
    specialTrait: '🔬 Forja de Tecnologías de Torres'
  }
};

export const TECH_CONFIGS: Record<string, TechConfig> = {
  // --- Nivel 2 (Disponibles desde Taller Nivel 1) ---
  'tech_pomodoro_2': {
    id: 'tech_pomodoro_2',
    towerType: 'pomodoro',
    targetLevel: 2,
    reqBuildingLevel: 1,
    nameKey: 'techPomodoro2Name',
    descKey: 'techPomodoro2Desc',
    cost: 80,
    researchTime: 4.0,
    icon: '🌿'
  },
  'tech_kotaro_2': {
    id: 'tech_kotaro_2',
    towerType: 'kotaro',
    targetLevel: 2,
    reqBuildingLevel: 1,
    nameKey: 'techKotaro2Name',
    descKey: 'techKotaro2Desc',
    cost: 95,
    researchTime: 5.0,
    icon: '⚔️'
  },
  'tech_bing_2': {
    id: 'tech_bing_2',
    towerType: 'bing',
    targetLevel: 2,
    reqBuildingLevel: 1,
    nameKey: 'techBing2Name',
    descKey: 'techBing2Desc',
    cost: 110,
    researchTime: 5.5,
    icon: '🌊'
  },
  'tech_tripp_2': {
    id: 'tech_tripp_2',
    towerType: 'tripp',
    targetLevel: 2,
    reqBuildingLevel: 1,
    nameKey: 'techTripp2Name',
    descKey: 'techTripp2Desc',
    cost: 125,
    researchTime: 6.0,
    icon: '🎯'
  },

  // --- Nivel 3 (Requiere Taller Nivel 2 - Otorga permiso para 1 torre) ---
  'tech_pomodoro_3': {
    id: 'tech_pomodoro_3',
    towerType: 'pomodoro',
    targetLevel: 3,
    reqBuildingLevel: 2,
    nameKey: 'techPomodoro3Name',
    descKey: 'techPomodoro3Desc',
    cost: 180,
    researchTime: 8.0,
    icon: '💥'
  },
  'tech_kotaro_3': {
    id: 'tech_kotaro_3',
    towerType: 'kotaro',
    targetLevel: 3,
    reqBuildingLevel: 2,
    nameKey: 'techKotaro3Name',
    descKey: 'techKotaro3Desc',
    cost: 210,
    researchTime: 8.5,
    icon: '🌪️'
  },
  'tech_bing_3': {
    id: 'tech_bing_3',
    towerType: 'bing',
    targetLevel: 3,
    reqBuildingLevel: 2,
    nameKey: 'techBing3Name',
    descKey: 'techBing3Desc',
    cost: 230,
    researchTime: 9.0,
    icon: '🌊'
  },
  'tech_tripp_3': {
    id: 'tech_tripp_3',
    towerType: 'tripp',
    targetLevel: 3,
    reqBuildingLevel: 2,
    nameKey: 'techTripp3Name',
    descKey: 'techTripp3Desc',
    cost: 260,
    researchTime: 9.5,
    icon: '⚡'
  }
};

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  pomodoro: {
    type: 'pomodoro',
    name: 'Pomodoro',
    classLabel: 'Planta',
    icon: '🍅',
    avatarImage: './assets/mascots/pomodoro_avatar.png',
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
    avatarImage: './assets/mascots/kotaro_avatar.png',
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
    avatarImage: './assets/mascots/bing_avatar.png',
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
    avatarImage: './assets/mascots/tripp_avatar.png',
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
    name: 'Axie Xia (Veloz)',
    traitLabel: '⚡ Sprint Feroz',
    modelFile: 'xia.glb',
    baseHp: 95,
    speed: 4.4,
    rewardSlp: 12,
    scale: 0.95,
    hasSprint: true
  },
  warrior: {
    type: 'warrior',
    name: 'Axie Kibo (Guerrero)',
    traitLabel: '🛡️ Regeneración',
    modelFile: 'kibo.glb',
    baseHp: 220,
    speed: 2.7,
    rewardSlp: 22,
    scale: 1.1,
    regenRate: 14
  },
  armored: {
    type: 'armored',
    name: 'Axie Paladill (Tanque)',
    traitLabel: '🧱 Anti-Slow & Blindaje',
    modelFile: 'paladill.glb',
    baseHp: 500,
    speed: 1.6,
    rewardSlp: 45,
    scale: 1.35,
    isImmuneSlow: true,
    armorReduction: 0.35
  },
  toxic: {
    type: 'toxic',
    name: 'Axie Bing (Aura)',
    traitLabel: '🧪 Anti-Veneno & Aura',
    modelFile: 'bing.glb',
    baseHp: 320,
    speed: 2.4,
    rewardSlp: 35,
    scale: 1.1,
    isImmunePoison: true
  },
  boss: {
    type: 'boss',
    name: 'Axie Kibo Titánico',
    traitLabel: '👑 Colosal Imparable',
    modelFile: 'kibo.glb',
    baseHp: 3600,
    speed: 1.35,
    rewardSlp: 300,
    scale: 2.0
  }
};

// Procedural Path Archetypes across Lunacia Forest (Killzone & Multi-Loop Circuits)
// CRITICAL RULE: Minimum separation between any parallel roads is >= 4 cells (at least 3 grass tiles between roads for 3x3 towers)
export const PATH_ARCHETYPES: PathArchetype[] = [
  {
    id: 'outer_ambush',
    name: 'El Gran Circuito en Ocho & Killzone Central',
    description: 'Ruta en forma de infinito con Killzone central. Todos los pasillos paralelos tienen al menos 3 baldosas de hierba libres para ubicar torres 3x3 a ambos lados del camino.',
    gridTurns: [
      { col: 1, row: 4 },
      { col: 18, row: 4 },
      { col: 18, row: 10 },
      { col: 5, row: 10 },
      { col: 5, row: 23 },
      { col: 23, row: 23 },
      // Cruce central con separación vertical amplia
      { col: 23, row: 14 },
      { col: 41, row: 14 },
      { col: 41, row: 4 },
      { col: 29, row: 4 },
      { col: 29, row: 23 },
      { col: 37, row: 23 },
      { col: 37, row: 18 },
      { col: 44, row: 18 }
    ]
  },
  {
    id: 'clover_killzone',
    name: 'El Trébol de Cuatro Hojas & Corazón de Batalla',
    description: 'Circuito de 4 alas envolventes que convergen en una gran plaza central, con pasillos anchos de más de 3 baldosas de hierba para torres pesadas.',
    gridTurns: [
      { col: 1, row: 14 },
      // Entrada a Killzone Oeste
      { col: 10, row: 14 },
      { col: 10, row: 4 },
      { col: 22, row: 4 },
      { col: 22, row: 10 },
      // Lóbulo Suroeste (separado 4+ filas del camino superior y del horizontal)
      { col: 5, row: 10 },
      { col: 5, row: 23 },
      { col: 22, row: 23 },
      // Cruce Killzone Central
      { col: 22, row: 14 },
      { col: 28, row: 14 },
      // Lóbulo Noreste
      { col: 28, row: 4 },
      { col: 41, row: 4 },
      { col: 41, row: 14 },
      // Lóbulo Sureste
      { col: 35, row: 14 },
      { col: 35, row: 23 },
      { col: 26, row: 23 },
      { col: 26, row: 18 },
      { col: 44, row: 18 }
    ]
  },
  {
    id: 'hourglass_crossroads',
    name: 'El Reloj de Arena & Doble Garganta',
    description: 'Dos grandes bahías este y oeste con un embudo central. Todos los pasillos interiores cuentan con un mínimo de 3 casillas de anchura para colocar torres.',
    gridTurns: [
      { col: 1, row: 4 },
      { col: 15, row: 4 },
      { col: 15, row: 9 },
      { col: 4, row: 9 },
      { col: 4, row: 23 },
      { col: 19, row: 23 },
      // Cuello de botella central Killzone
      { col: 19, row: 14 },
      { col: 27, row: 14 },
      // Bahía Este
      { col: 27, row: 4 },
      { col: 41, row: 4 },
      { col: 41, row: 9 },
      { col: 32, row: 9 },
      { col: 32, row: 23 },
      // Retorno con separación de 5 casillas de fila (row 23 -> row 18)
      { col: 23, row: 23 },
      { col: 23, row: 18 },
      { col: 44, row: 18 }
    ]
  },
  {
    id: 'triple_ring_colosseum',
    name: 'El Coliseo del Triple Anillo',
    description: 'Tres anillos concéntricos con corredores de 4 a 6 casillas de hierba de ancho entre cada vuelta, permitiendo poblar todo el perímetro de torres defensivas.',
    gridTurns: [
      { col: 1, row: 23 },
      { col: 8, row: 23 },
      { col: 8, row: 4 },
      { col: 39, row: 4 },
      { col: 39, row: 23 },
      // Retorno con 5 columnas de separación (39 -> 34, 8 -> 13)
      { col: 13, row: 23 },
      { col: 13, row: 9 },
      { col: 34, row: 9 },
      { col: 34, row: 18 },
      // Núcleo Killzone Central (row 18 -> row 14)
      { col: 21, row: 18 },
      { col: 21, row: 14 },
      { col: 44, row: 14 }
    ]
  },
  {
    id: 'twin_helix_citadel',
    name: 'La Doble Hélice & Nudo Sagrado',
    description: 'Dos lazos simétricos en hélice con islas interiores garantizadas de 4x4 casillas donde caben holgadamente torres 3x3.',
    gridTurns: [
      { col: 1, row: 4 },
      { col: 19, row: 4 },
      { col: 19, row: 23 },
      { col: 7, row: 23 },
      { col: 7, row: 11 },
      // Cruce Killzone
      { col: 26, row: 11 },
      { col: 26, row: 4 },
      { col: 41, row: 4 },
      { col: 41, row: 23 },
      { col: 32, row: 23 },
      { col: 32, row: 16 },
      { col: 44, row: 16 }
    ]
  }
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

export const RUNE_CATALOG: RuneConfig[] = [
  {
    id: 'storm_rune',
    name: 'Runa de Tormenta',
    icon: '⚡',
    rarity: 'rare',
    description: 'Los críticos de Kotaro lanzan un rayo que salta a 3 quimeras cercanas infligiendo 70 de daño.'
  },
  {
    id: 'frost_amulet',
    name: 'Amuleto de Glaciación',
    icon: '❄️',
    rarity: 'epic',
    description: 'Las explosiones de mortero de Bing congelan totalmente a los enemigos durante 1.0 segundo.'
  },
  {
    id: 'hawkeye_rune',
    name: 'Ojo de Halcón',
    icon: '🏹',
    rarity: 'rare',
    description: 'Aumenta el alcance de visión de Tripp en un +35% y su daño base en un +25%.'
  },
  {
    id: 'slp_harvest',
    name: 'Cosecha de SLP',
    icon: '🍯',
    rarity: 'rare',
    description: 'Cada quimera eliminada otorga +4 SLP adicionales al botín.'
  },
  {
    id: 'celestial_fury',
    name: 'Furia Celestial',
    icon: '☄️',
    rarity: 'epic',
    description: 'El hechizo de Lluvia de Espinas reduce su tiempo de recarga a 13s y amplía su área +30%.'
  },
  {
    id: 'deep_poison',
    name: 'Espinas Virulentas',
    icon: '💉',
    rarity: 'rare',
    description: 'El veneno de Pomodoro dura el doble (8s) y reduce la regeneración enemiga un 80%.'
  },
  {
    id: 'ancient_bulwark',
    name: 'Baluarte de Lunacia',
    icon: '🛡️',
    rarity: 'legendary',
    description: 'Otorga inmediatamente +6 vidas extra y un escudo espiritual al Árbol Ancestral.'
  },
  {
    id: 'swift_craft',
    name: 'Ingeniería Ágil',
    icon: '⏱️',
    rarity: 'legendary',
    description: 'Todas las torres se construyen y evolucionan un 45% más rápido reduciendo el tiempo de espera.'
  }
];
