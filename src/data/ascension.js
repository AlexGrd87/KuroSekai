/**
 * ascension.js — Système d'ascension des personnages de KuroSekai.
 * Rangs R0→R5 : augmente les stats et débloque un palier de niveau max.
 */

export const ASCENSION_RANKS = [
  { rank: 0, label: 'BASE', statMult: 1.00, levelCap: 50,  color: '#446688', glow: '#224455' },
  { rank: 1, label: 'R1',   statMult: 1.15, levelCap: 60,  color: '#00aacc', glow: '#0088aa' },
  { rank: 2, label: 'R2',   statMult: 1.30, levelCap: 70,  color: '#00ee88', glow: '#00cc66' },
  { rank: 3, label: 'R3',   statMult: 1.50, levelCap: 80,  color: '#a855f7', glow: '#8833dd' },
  { rank: 4, label: 'R4',   statMult: 1.75, levelCap: 90,  color: '#ff8800', glow: '#dd6600' },
  { rank: 5, label: 'R5',   statMult: 2.00, levelCap: 100, color: '#ffd700', glow: '#ffaa00' },
];

/** Coût pour passer du rang `rank-1` au rang `rank`. */
export const ASCENSION_COSTS = [
  null,                                                   // pas de coût pour R0
  { shard_basic: 5 },                                     // → R1
  { shard_basic: 10, shard_elite: 3 },                   // → R2
  { shard_elite: 5,  crystal_void: 2 },                  // → R3
  { shard_elite: 10, crystal_void: 5 },                  // → R4
  { crystal_void: 3, stone_ascension: 3 },               // → R5
];

export const MATERIAL_META = {
  shard_basic:     { label: 'Éclat Basique',        icon: '◇', color: '#00aaff', desc: 'Drop des stages 1–6' },
  shard_elite:     { label: 'Éclat Élite',          icon: '◈', color: '#a855f7', desc: 'Drop des stages 7–12' },
  crystal_void:    { label: 'Cristal du Vide',      icon: '✦', color: '#cc00ff', desc: 'Drop des stages 13–18' },
  stone_ascension: { label: 'Pierre d\'Ascension',  icon: '★', color: '#ffd700', desc: 'Rare · Donjon & Arène' },
};

export function getAscensionRankData(rank) {
  return ASCENSION_RANKS[Math.max(0, Math.min(5, rank ?? 0))];
}

/** Retourne le coût pour passer au rang suivant. */
export function getNextAscensionCost(rank) {
  const next = (rank ?? 0) + 1;
  if (next > 5) return null;
  return ASCENSION_COSTS[next];
}
