import { UpgradeCard } from './types';

export const ALL_UPGRADES: Record<string, Omit<UpgradeCard, 'level'>> = {
  horn_pocky: {
    id: 'horn_pocky',
    name: 'Cuerno: Pocky Spikes',
    partType: 'horn',
    icon: '🌵',
    description: 'Dispara espinas perforantes que atraviesan a las quimeras.',
    maxLevel: 5
  },
  back_pumpkin: {
    id: 'back_pumpkin',
    name: 'Espalda: Pumpkin Shield',
    partType: 'back',
    icon: '🎃',
    description: 'Genera orbes protectores que giran a tu alrededor y dañan a los enemigos.',
    maxLevel: 5
  },
  tail_carrot: {
    id: 'tail_carrot',
    name: 'Cola: Carrot Rocket',
    partType: 'tail',
    icon: '🥕',
    description: 'Lanza zanahorias explosivas que impactan contra grupos de monstruos.',
    maxLevel: 5
  },
  mouth_chomper: {
    id: 'mouth_chomper',
    name: 'Boca: Nutcracker Bite',
    partType: 'mouth',
    icon: '🦷',
    description: 'Mordisco salvaje en cono frontal con alto daño y probabilidad crítica.',
    maxLevel: 5
  },
  plant_vitality: {
    id: 'plant_vitality',
    name: 'Vitalidad Lunaciana',
    partType: 'passive',
    icon: '💖',
    description: 'Aumenta tu Salud Máxima en +30 HP y recupera 20 HP de inmediato.',
    maxLevel: 5
  },
  swift_feather: {
    id: 'swift_feather',
    name: 'Pluma de Pájaro',
    partType: 'passive',
    icon: '🪶',
    description: 'Aumenta tu Velocidad de Movimiento en +15%.',
    maxLevel: 5
  },
  beast_fury: {
    id: 'beast_fury',
    name: 'Furia de Bestia',
    partType: 'passive',
    icon: '🔥',
    description: 'Aumenta tu Daño e Impacto Crítico en +15%.',
    maxLevel: 5
  },
  gem_magnet: {
    id: 'gem_magnet',
    name: 'Imán de Lunacia',
    partType: 'passive',
    icon: '🧲',
    description: 'Aumenta el radio de absorción de gemas y orbes en +45%.',
    maxLevel: 5
  }
};

export function getRandomUpgrades(currentLevels: Map<string, number>, count: number = 3): UpgradeCard[] {
  const eligible = Object.values(ALL_UPGRADES).filter(card => {
    const lvl = currentLevels.get(card.id) ?? 0;
    return lvl < card.maxLevel;
  });

  // Shuffle and pick
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(c => ({
    ...c,
    level: (currentLevels.get(c.id) ?? 0) + 1
  }));
}
