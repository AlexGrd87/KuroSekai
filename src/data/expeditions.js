/**
 * expeditions.js — Définitions des expéditions passives de KuroSekai.
 * 3 slots indépendants, durées simulées en temps réel.
 */

export const EXPEDITION_SLOTS = 3;

export const EXPEDITION_TYPES = [
  {
    id:             'court',
    label:          'PATROUILLE',
    kanji:          '巡',
    durationMs:     30 * 60 * 1000,      // 30 min
    durationLabel:  '30 min',
    color:          '#44ccff',
    glow:           'rgba(68,204,255,0.30)',
    rewards: {
      currency:    500,
      shard_basic: 1,
    },
    rewardDesc:     '500 ◈ · 1× Frag. Basique',
    artifactChance: 0,
  },
  {
    id:             'moyen',
    label:          'RECONNAISSANCE',
    kanji:          '偵',
    durationMs:     2 * 60 * 60 * 1000,  // 2 h
    durationLabel:  '2 h',
    color:          '#aa44ff',
    glow:           'rgba(170,68,255,0.30)',
    rewards: {
      currency:    1500,
      shard_basic: 2,
      shard_elite: 1,
    },
    rewardDesc:     '1 500 ◈ · 1× Frag. Élite · 2× Frag. Basique',
    artifactChance: 0,
  },
  {
    id:             'long',
    label:          'OPÉRATION',
    kanji:          '作',
    durationMs:     8 * 60 * 60 * 1000,  // 8 h
    durationLabel:  '8 h',
    color:          '#ff8800',
    glow:           'rgba(255,136,0,0.30)',
    rewards: {
      currency:    4000,
      shard_elite: 2,
      crystal_void: 1,
    },
    rewardDesc:     '4 000 ◈ · 1× Cristal du Vide · 2× Frag. Élite',
    artifactChance: 0.5,   // 50 % de chance d'obtenir un artefact
  },
];

/** Retourne le type d'expédition par id (fallback : premier type). */
export function getExpeditionType(id) {
  return EXPEDITION_TYPES.find(t => t.id === id) ?? EXPEDITION_TYPES[0];
}

/**
 * Formate un temps restant en mm:ss (< 1 h) ou hh:mm.
 * @param {number} ms - millisecondes restantes
 */
export function formatRemaining(ms) {
  if (ms <= 0) return '00:00';
  const totalSecs = Math.floor(ms / 1000);
  const mins      = Math.floor(totalSecs / 60);
  const hours     = Math.floor(mins / 60);

  if (hours > 0) {
    const m = mins % 60;
    return `${String(hours).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
  }
  const s = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
