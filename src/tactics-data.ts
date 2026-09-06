import { AxieData, AxieUnit, EquipmentItem } from './tactics-types';

export const AXIE_DATABASE: Record<string, AxieData> = {
  pomodoro: {
    baseId: 'pomodoro',
    name: 'Pomodoro',
    modelFile: 'pomodoro.glb',
    axieClass: 'plant',
    classLabel: 'Planta',
    icon: '🍅',
    baseHp: 130,
    baseAtk: 22,
    baseSpeed: 25,
    abilityName: 'Espinas Lunacianas',
    abilityDesc: 'Al recibir daño, contraataca con 12 de daño y genera 15 de escudo.'
  },
  kotaro: {
    baseId: 'kotaro',
    name: 'Kotaro',
    modelFile: 'kotaro.glb',
    axieClass: 'beast',
    classLabel: 'Bestia',
    icon: '🦊',
    baseHp: 80,
    baseAtk: 38,
    baseSpeed: 45,
    abilityName: 'Filo Crítico',
    abilityDesc: 'Tiene un 40% de probabilidad de infligir daño crítico (x2.0).'
  },
  bing: {
    baseId: 'bing',
    name: 'Bing',
    modelFile: 'bing.glb',
    axieClass: 'aqua',
    classLabel: 'Aqua',
    icon: '🌊',
    baseHp: 95,
    baseAtk: 32,
    baseSpeed: 40,
    abilityName: 'Cañón de Agua',
    abilityDesc: 'Dispara al enemigo más alejado (retaguardia), saltándose a los tanques.'
  },
  tripp: {
    baseId: 'tripp',
    name: 'Tripp',
    modelFile: 'tripp.glb',
    axieClass: 'bird',
    classLabel: 'Pájaro',
    icon: '🪶',
    baseHp: 75,
    baseAtk: 36,
    baseSpeed: 55,
    abilityName: 'Asalto Rápido',
    abilityDesc: 'Siempre ataca primero en el combate. En su primer ataque hace +15 daño.'
  },
  paladill: {
    baseId: 'paladill',
    name: 'Paladill',
    modelFile: 'paladill.glb',
    axieClass: 'reptile',
    classLabel: 'Reptil',
    icon: '🦎',
    baseHp: 115,
    baseAtk: 24,
    baseSpeed: 30,
    abilityName: 'Manto de Escamas',
    abilityDesc: 'Al inicio del combate, otorga 25 de escudo al aliado colocado detrás de él.'
  },
  xia: {
    baseId: 'xia',
    name: 'Xia',
    modelFile: 'xia.glb',
    axieClass: 'bug',
    classLabel: 'Bicho',
    icon: '🐛',
    baseHp: 90,
    baseAtk: 26,
    baseSpeed: 35,
    abilityName: 'Esporas Venenosas',
    abilityDesc: 'Aplica veneno al atacar, infligiendo 8 de daño continuo que ignora escudos.'
  },
  kibo: {
    baseId: 'kibo',
    name: 'Kibo',
    modelFile: 'kibo.glb',
    axieClass: 'beast',
    classLabel: 'Bestia',
    icon: '🔨',
    baseHp: 105,
    baseAtk: 34,
    baseSpeed: 28,
    abilityName: 'Golpe Martillo',
    abilityDesc: 'Golpe pesado: 30% de probabilidad de aturdir al enemigo por 1 turno.'
  }
};

export const EQUIPMENT_DATABASE: EquipmentItem[] = [
  {
    id: 'wooden_shield',
    name: 'Escudo de Lunacia',
    icon: '🛡️',
    desc: '+40 de Salud Máxima',
    bonusHp: 40,
    bonusAtk: 0,
    bonusSpeed: 0,
    cost: 3
  },
  {
    id: 'holy_carrot',
    name: 'Zanahoria Afilada',
    icon: '🥕',
    desc: '+14 de Ataque',
    bonusHp: 0,
    bonusAtk: 14,
    bonusSpeed: 0,
    cost: 3
  },
  {
    id: 'feather_boots',
    name: 'Botas de Pluma',
    icon: '🥾',
    desc: '+20 de Velocidad',
    bonusHp: 0,
    bonusAtk: 0,
    bonusSpeed: 20,
    cost: 3
  }
];

let instanceCounter = 1;

export function createAxieInstance(baseId: string, level: number = 1): AxieUnit {
  const data = AXIE_DATABASE[baseId] || AXIE_DATABASE['pomodoro'];
  const multiplier = level === 2 ? 1.85 : 1.0;

  return {
    instanceId: `axie_${instanceCounter++}`,
    baseId: data.baseId,
    name: data.name,
    modelFile: data.modelFile,
    axieClass: data.axieClass,
    classLabel: data.classLabel,
    icon: data.icon,
    level,
    copies: 1,
    hp: Math.round(data.baseHp * multiplier),
    maxHp: Math.round(data.baseHp * multiplier),
    attack: Math.round(data.baseAtk * multiplier),
    speed: data.baseSpeed + (level === 2 ? 10 : 0),
    shield: 0,
    abilityName: level === 2 ? `${data.abilityName} (Dorado)` : data.abilityName,
    abilityDesc: data.abilityDesc
  };
}

export function createEnemyUnit(
  name: string,
  modelFile: string,
  axieClass: any,
  hp: number,
  attack: number,
  speed: number,
  icon: string = '👾'
): AxieUnit {
  return {
    instanceId: `enemy_${instanceCounter++}`,
    baseId: 'enemy',
    name,
    modelFile,
    axieClass,
    classLabel: 'Quimera',
    icon,
    level: 1,
    copies: 1,
    hp,
    maxHp: hp,
    attack,
    speed,
    shield: 0,
    abilityName: 'Ataque Salvaje',
    abilityDesc: 'Ataca con ferocidad a los invasores de Lunacia.'
  };
}

// 10 Progressive Rounds of Enemy Squadrons
export const ENEMY_ROUNDS: AxieUnit[][] = [
  // Ronda 1: 2 Sapidae Reclutas
  [
    createEnemyUnit('Sapidae Recluta', 'sapidae-f-a.glb', 'plant', 70, 16, 20, '🌿'),
    createEnemyUnit('Sapidae Ágil', 'sapidae-m-a.glb', 'beast', 55, 22, 35, '⚡')
  ],
  // Ronda 2: Tanque y Golpeador
  [
    createEnemyUnit('Sapidae Escudo', 'sapidae-f-b.glb', 'plant', 95, 18, 18, '🛡️'),
    createEnemyUnit('Sapidae Guerrero', 'sapidae-m-b.glb', 'beast', 70, 26, 38, '⚔️')
  ],
  // Ronda 3: Dúo Reforzado
  [
    createEnemyUnit('Quimera del Bosque', 'sapidae-f-c.glb', 'plant', 120, 22, 22, '🌳'),
    createEnemyUnit('Quimera Veloz', 'sapidae-m-c.glb', 'aqua', 85, 30, 48, '💧')
  ],
  // Ronda 4: 3x Enemigos (Desbloqueo de Slot 3)
  [
    createEnemyUnit('Vanguardia Sapidae', 'sapidae-f-d.glb', 'plant', 110, 20, 20, '🛡️'),
    createEnemyUnit('Tirador Sapidae', 'sapidae-m-d.glb', 'bird', 75, 32, 50, '🏹'),
    createEnemyUnit('Brujo de Lunacia', 'sapidae-f-a.glb', 'bug', 80, 25, 30, '🔮')
  ],
  // Ronda 5: Escuadrón Táctico
  [
    createEnemyUnit('Golem de Roca', 'sapidae-m-e.glb', 'reptile', 140, 22, 15, '🪨'),
    createEnemyUnit('Garras Sombra', 'sapidae-f-e.glb', 'beast', 90, 36, 42, '🐾'),
    createEnemyUnit('Chispa Marina', 'sapidae-m-a.glb', 'aqua', 95, 28, 44, '⚡')
  ],
  // Ronda 6: Escuadrón con Unidad Nivel 2
  [
    createEnemyUnit('Sapidae Titán', 'sapidae-f-b.glb', 'plant', 170, 26, 20, '👑'),
    createEnemyUnit('Asesino Carmesí', 'sapidae-m-b.glb', 'beast', 110, 42, 46, '🩸'),
    createEnemyUnit('Arquero Alado', 'sapidae-f-c.glb', 'bird', 90, 35, 52, '🪽')
  ],
  // Ronda 7: Trío de Élite
  [
    createEnemyUnit('Caparazón Ancestral', 'sapidae-m-c.glb', 'reptile', 180, 28, 25, '🐢'),
    createEnemyUnit('Bestia Frenética', 'sapidae-f-d.glb', 'beast', 125, 45, 40, '🔥'),
    createEnemyUnit('Tóxico Mayor', 'sapidae-m-d.glb', 'bug', 115, 32, 38, '☠️')
  ],
  // Ronda 8: Casi Final
  [
    createEnemyUnit('Guardia Real', 'sapidae-f-e.glb', 'plant', 210, 32, 28, '⚜️'),
    createEnemyUnit('Cazador Supremo', 'sapidae-m-e.glb', 'beast', 140, 50, 48, '🎯'),
    createEnemyUnit('Oráculo Océano', 'sapidae-f-a.glb', 'aqua', 130, 38, 55, '🌊')
  ],
  // Ronda 9: Semifinal Pesada
  [
    createEnemyUnit('Coloso de Lunacia', 'sapidae-m-b.glb', 'reptile', 240, 36, 22, '🗿'),
    createEnemyUnit('Rey Quimera', 'sapidae-f-c.glb', 'beast', 160, 54, 45, '👑'),
    createEnemyUnit('Fénix Oscuro', 'sapidae-m-c.glb', 'bird', 130, 44, 60, '🦅')
  ],
  // Ronda 10: JEFE FINAL (Sapidae Reina + Guardias Reales)
  [
    createEnemyUnit('Reina Sapidae (JEFE)', 'sapidae-f-a.glb', 'plant', 380, 48, 30, '👑'),
    createEnemyUnit('Campeón del Vasto', 'sapidae-m-e.glb', 'beast', 200, 58, 48, '⚡'),
    createEnemyUnit('Centinela Celeste', 'sapidae-f-e.glb', 'aqua', 180, 42, 52, '🛡️')
  ]
];
