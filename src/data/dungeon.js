/**
 * dungeon.js
 * Données du mode Donjon Abyssal — 5 salles roguelite.
 *
 * Les ennemis sont scalés via statMult par salle.
 * Les buffs modifient directement les stats de l'équipe entre les salles.
 */

import { ENEMIES } from './enemies.js';

/* ══════════════════════════════════════════
   SALLES DU DONJON
══════════════════════════════════════════ */

export const DUNGEON_ROOMS = [
  {
    id: 'room_1', roomNum: 1,
    name: 'VESTIBULE',
    subtitle: 'Sas d\'entrée sécurisé',
    enemies: ['drone_mk1', 'drone_mk1', 'phantom_hacker'],
    statMult: 1.0,
    isBoss: false,
  },
  {
    id: 'room_2', roomNum: 2,
    name: 'COULOIRS',
    subtitle: 'Réseau de surveillance',
    enemies: ['neuro_guard', 'cyber_witch', 'phantom_hacker'],
    statMult: 1.3,
    isBoss: false,
  },
  {
    id: 'room_3', roomNum: 3,
    name: 'ARCHIVES',
    subtitle: 'Stockage de données critiques',
    enemies: ['shadow_samurai', 'arc_sentinel', 'tide_crawler'],
    statMult: 1.65,
    isBoss: false,
  },
  {
    id: 'room_4', roomNum: 4,
    name: 'CŒUR SYSTÈME',
    subtitle: 'Protocole de défense finale',
    enemies: ['iron_colossus', 'void_specter', 'cyber_oni'],
    statMult: 2.1,
    isBoss: false,
  },
  {
    id: 'room_5', roomNum: 5,
    name: 'NŒUD ABYSSAL',
    subtitle: 'L\'Archonte du Vide t\'attend',
    enemies: ['void_archon'],
    statMult: 2.7,
    isBoss: true,
  },
];

/* ══════════════════════════════════════════
   CATALOGUE DES BUFFS
══════════════════════════════════════════ */

export const DUNGEON_BUFFS = [
  {
    id: 'lame', icon: '⚔', color: '#ff6622',
    name: 'LAME AIGUISÉE',
    desc: '+25% ATK pour toute l\'équipe',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats, atk: Math.round(c.stats.atk * 1.25) } })),
  },
  {
    id: 'blindage', icon: '🛡', color: '#4488ff',
    name: 'BLINDAGE',
    desc: '+30% DEF pour toute l\'équipe',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats, def: Math.round(c.stats.def * 1.30) } })),
  },
  {
    id: 'vitalite', icon: '❤', color: '#ff2244',
    name: 'VITALITÉ',
    desc: '+30% PV max pour toute l\'équipe',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats, hp: Math.round(c.stats.hp * 1.30) } })),
  },
  {
    id: 'acceleration', icon: '⚡', color: '#ffee00',
    name: 'ACCÉLÉRATEUR',
    desc: '+30% SPD pour toute l\'équipe',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats, spd: Math.round(c.stats.spd * 1.30) } })),
  },
  {
    id: 'frenezie', icon: '🔥', color: '#ff4400',
    name: 'FRÉNÉSIE',
    desc: '+50% ATK, −15% DEF',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats,
      atk: Math.round(c.stats.atk * 1.50),
      def: Math.round(c.stats.def * 0.85),
    } })),
  },
  {
    id: 'synergie', icon: '✦', color: '#cc88ff',
    name: 'SYNERGIE',
    desc: 'Toutes les stats +15%',
    apply: t => t.map(c => ({ ...c, stats: {
      hp:  Math.round(c.stats.hp  * 1.15),
      atk: Math.round(c.stats.atk * 1.15),
      def: Math.round(c.stats.def * 1.15),
      spd: Math.round(c.stats.spd * 1.15),
    } })),
  },
  {
    id: 'survie', icon: '💊', color: '#00cc88',
    name: 'PROTOCOLE SURVIE',
    desc: '+40% PV, +20% DEF',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats,
      hp:  Math.round(c.stats.hp  * 1.40),
      def: Math.round(c.stats.def * 1.20),
    } })),
  },
  {
    id: 'overdrive', icon: '💀', color: '#aa0044',
    name: 'OVERDRIVE',
    desc: '+60% ATK, −25% PV',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats,
      atk: Math.round(c.stats.atk * 1.60),
      hp:  Math.round(c.stats.hp  * 0.75),
    } })),
  },
  {
    id: 'equilibre', icon: '🌀', color: '#0099cc',
    name: 'ÉQUILIBRE',
    desc: '+20% ATK, +20% DEF, +20% SPD',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats,
      atk: Math.round(c.stats.atk * 1.20),
      def: Math.round(c.stats.def * 1.20),
      spd: Math.round(c.stats.spd * 1.20),
    } })),
  },
  {
    id: 'ancienne', icon: '🗿', color: '#886633',
    name: 'ANCIENNE ARMURE',
    desc: '+50% DEF, +30% PV',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats,
      def: Math.round(c.stats.def * 1.50),
      hp:  Math.round(c.stats.hp  * 1.30),
    } })),
  },
  {
    id: 'fantome', icon: '👻', color: '#8844cc',
    name: 'PROTOCOLE FANTÔME',
    desc: '+40% SPD, +25% ATK',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats,
      spd: Math.round(c.stats.spd * 1.40),
      atk: Math.round(c.stats.atk * 1.25),
    } })),
  },
  {
    id: 'titan', icon: '⛏', color: '#446688',
    name: 'TITAN',
    desc: '+70% PV, +40% DEF, −20% ATK',
    apply: t => t.map(c => ({ ...c, stats: { ...c.stats,
      hp:  Math.round(c.stats.hp  * 1.70),
      def: Math.round(c.stats.def * 1.40),
      atk: Math.round(c.stats.atk * 0.80),
    } })),
  },
];

/* ══════════════════════════════════════════
   CONSTRUCTION D'UN STAGE DONJON
   (retourne des objets ennemis scalés, pas des IDs)
══════════════════════════════════════════ */

export function buildDungeonStage(room) {
  const scaledEnemies = room.enemies.map(id => {
    const base = ENEMIES.find(e => e.id === id);
    if (!base) throw new Error(`Dungeon: enemy not found: ${id}`);
    const m = room.statMult;
    return {
      ...base,
      stats: {
        hp:  Math.round(base.stats.hp  * m),
        atk: Math.round(base.stats.atk * m),
        def: Math.round(base.stats.def * m),
        spd: Math.round(base.stats.spd * (1 + (m - 1) * 0.6)),
      },
    };
  });

  return {
    id:       room.id,
    name:     room.name,
    subtitle: room.subtitle,
    isBoss:   room.isBoss ?? false,
    waves:    [scaledEnemies],
    rewards:  { exp: 0, currency: 0 }, // récompenses gérées par DungeonUI
  };
}
