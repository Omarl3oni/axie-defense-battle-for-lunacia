import { AxieUnit, BattleSide, CombatAction, CombatRoundResult } from './tactics-types';

export class CombatSimulator {
  public static simulate(
    playerTeamRaw: (AxieUnit | null)[],
    enemyTeamRaw: AxieUnit[]
  ): CombatRoundResult {
    const actions: CombatAction[] = [];

    // Deep clone units for simulation
    const playerTeam: (AxieUnit | null)[] = playerTeamRaw.map(u => u ? { ...u } : null);
    const enemyTeam: (AxieUnit | null)[] = enemyTeamRaw.map(u => ({ ...u }));

    // 1. Apply Class Synergies (Player Side)
    const activePlayerUnits = playerTeam.filter((u): u is AxieUnit => u !== null && u.hp > 0);
    const plantCount = activePlayerUnits.filter(u => u.axieClass === 'plant').length;
    const beastCount = activePlayerUnits.filter(u => u.axieClass === 'beast').length;
    const speedCount = activePlayerUnits.filter(u => u.axieClass === 'aqua' || u.axieClass === 'bird').length;

    if (plantCount >= 2) {
      activePlayerUnits.forEach(u => {
        u.shield += 30;
      });
      actions.push({
        type: 'SHIELD',
        sourceSide: 'player',
        sourceSlot: 0,
        shield: 30,
        message: '¡Sinergia Planta: +30 Escudo a todo el equipo!'
      });
    }

    if (speedCount >= 2) {
      activePlayerUnits.forEach(u => {
        u.speed += 25;
      });
      actions.push({
        type: 'SKILL',
        sourceSide: 'player',
        sourceSlot: 0,
        message: '¡Sinergia Aqua/Pájaro: +25 Velocidad a todo el equipo!'
      });
    }

    // Paladill Ability: grants shield to the unit behind him
    for (let slot = 0; slot < playerTeam.length - 1; slot++) {
      const u = playerTeam[slot];
      const behind = playerTeam[slot + 1];
      if (u && u.baseId === 'paladill' && behind) {
        behind.shield += 30;
        actions.push({
          type: 'SHIELD',
          sourceSide: 'player',
          sourceSlot: slot,
          targetSide: 'player',
          targetSlot: slot + 1,
          shield: 30,
          message: `${u.name} otorga Escudo a ${behind.name}!`
        });
      }
    }

    // 2. Turn Simulation Loop
    let roundStep = 0;
    const maxSteps = 45;

    while (roundStep++ < maxSteps) {
      // Gather all living combatants
      interface CombatantRef {
        side: BattleSide;
        slot: number;
        unit: AxieUnit;
      }

      const combatants: CombatantRef[] = [];
      playerTeam.forEach((unit, slot) => {
        if (unit && unit.hp > 0) combatants.push({ side: 'player', slot, unit });
      });
      enemyTeam.forEach((unit, slot) => {
        if (unit && unit.hp > 0) combatants.push({ side: 'enemy', slot, unit });
      });

      // Check win/loss immediately
      const livingPlayers = combatants.filter(c => c.side === 'player');
      const livingEnemies = combatants.filter(c => c.side === 'enemy');

      if (livingPlayers.length === 0 || livingEnemies.length === 0) {
        break;
      }

      // Order by Speed (Highest goes first)
      combatants.sort((a, b) => b.unit.speed - a.unit.speed);

      // Execute each combatant's action
      for (const attacker of combatants) {
        if (attacker.unit.hp <= 0) continue; // Died earlier this turn

        const opposingTeam = attacker.side === 'player' ? enemyTeam : playerTeam;
        const opposingSide: BattleSide = attacker.side === 'player' ? 'enemy' : 'player';

        // Find target
        let targetSlot = -1;

        // Bing prioritizes back-line target
        if (attacker.unit.baseId === 'bing') {
          for (let s = opposingTeam.length - 1; s >= 0; s--) {
            const opp = opposingTeam[s];
            if (opp && opp.hp > 0) {
              targetSlot = s;
              break;
            }
          }
        }

        // Default: Front-line target
        if (targetSlot === -1) {
          for (let s = 0; s < opposingTeam.length; s++) {
            const opp = opposingTeam[s];
            if (opp && opp.hp > 0) {
              targetSlot = s;
              break;
            }
          }
        }

        if (targetSlot === -1) break; // All opponents dead

        const target = opposingTeam[targetSlot]!;

        // Check Stun
        if (attacker.unit.isStunned) {
          attacker.unit.isStunned = false;
          actions.push({
            type: 'STUN',
            sourceSide: attacker.side,
            sourceSlot: attacker.slot,
            message: `${attacker.unit.name} está aturdido y pierde el turno.`
          });
          continue;
        }

        // Calculate Damage
        let baseDmg = attacker.unit.attack;

        // Tripp bonus on first attack
        if (attacker.unit.baseId === 'tripp' && roundStep === 1) {
          baseDmg += 15;
        }

        // Class Advantage calculation (+15% extra damage)
        if (
          (attacker.unit.axieClass === 'plant' && (target.axieClass === 'aqua' || target.axieClass === 'bird')) ||
          ((attacker.unit.axieClass === 'aqua' || attacker.unit.axieClass === 'bird') && (target.axieClass === 'beast' || target.axieClass === 'bug')) ||
          ((attacker.unit.axieClass === 'beast' || attacker.unit.axieClass === 'bug') && (target.axieClass === 'plant' || target.axieClass === 'reptile'))
        ) {
          baseDmg = Math.round(baseDmg * 1.15);
        }

        // Critical Hit calculation
        let isCrit = false;
        let critChance = 0.1;
        if (attacker.unit.baseId === 'kotaro') critChance = 0.45;
        if (attacker.side === 'player' && beastCount >= 2) critChance += 0.25;

        if (Math.random() < critChance) {
          isCrit = true;
          baseDmg = Math.round(baseDmg * (attacker.unit.level === 2 ? 2.5 : 1.9));
        }

        // Shield Absorption
        let finalHpDamage = baseDmg;
        if (target.shield > 0) {
          if (target.shield >= baseDmg) {
            target.shield -= baseDmg;
            finalHpDamage = 0;
          } else {
            finalHpDamage = baseDmg - target.shield;
            target.shield = 0;
          }
        }

        target.hp = Math.max(0, target.hp - finalHpDamage);

        actions.push({
          type: 'ATTACK',
          sourceSide: attacker.side,
          sourceSlot: attacker.slot,
          targetSide: opposingSide,
          targetSlot,
          damage: baseDmg,
          isCrit,
          message: `${attacker.unit.name} ataca a ${target.name} (-${baseDmg}${isCrit ? ' CRÍTICO!' : ''})`
        });

        // Pomodoro Counter-Reflect Ability
        if (target.baseId === 'pomodoro' && target.hp > 0) {
          const reflectDmg = target.level === 2 ? 20 : 12;
          attacker.unit.hp = Math.max(0, attacker.unit.hp - reflectDmg);
          target.shield += 15;
          actions.push({
            type: 'SKILL',
            sourceSide: opposingSide,
            sourceSlot: targetSlot,
            targetSide: attacker.side,
            targetSlot: attacker.slot,
            damage: reflectDmg,
            message: `¡${target.name} refleja ${reflectDmg} de daño y gana 15 de escudo!`
          });
        }

        // Kibo Stun Ability
        if (attacker.unit.baseId === 'kibo' && Math.random() < 0.35 && target.hp > 0) {
          target.isStunned = true;
          actions.push({
            type: 'STUN',
            sourceSide: attacker.side,
            sourceSlot: attacker.slot,
            targetSide: opposingSide,
            targetSlot,
            message: `¡${attacker.unit.name} aturde a ${target.name}!`
          });
        }

        // Death check
        if (target.hp <= 0) {
          actions.push({
            type: 'DEATH',
            sourceSide: opposingSide,
            sourceSlot: targetSlot,
            message: `¡${target.name} ha sido derrotado!`
          });
        }

        if (attacker.unit.hp <= 0) {
          actions.push({
            type: 'DEATH',
            sourceSide: attacker.side,
            sourceSlot: attacker.slot,
            message: `¡${attacker.unit.name} ha sido derrotado!`
          });
        }
      }
    }

    const livingPlayersFinal = playerTeam.filter(u => u !== null && u.hp > 0);
    const livingEnemiesFinal = enemyTeam.filter(u => u !== null && u.hp > 0);

    const isVictory = livingPlayersFinal.length > 0 && livingEnemiesFinal.length === 0;
    const isDraw = livingPlayersFinal.length === 0 && livingEnemiesFinal.length === 0;

    return {
      isVictory,
      isDraw,
      actions
    };
  }
}
