/**
 * artifacts.js — Système d'artefacts équipables de KuroSekai.
 * 4 emplacements par personnage : arme, armure, accessoire, relique
 * 6 sets avec bonus 2-pièces et 4-pièces.
 */

export const ARTIFACT_SLOTS = ['arme', 'armure', 'accessoire', 'relique'];

export const SLOT_META = {
  arme:       { label: 'Arme',       icon: '⚔', kanji: '武' },
  armure:     { label: 'Armure',     icon: '🛡', kanji: '防' },
  accessoire: { label: 'Accessoire', icon: '◆', kanji: '具' },
  relique:    { label: 'Relique',    icon: '✦', kanji: '遺' },
};

export const ARTIFACT_SETS = {
  fureur: {
    id: 'fureur', name: 'Fureur', color: '#ff4422', glow: '#ff2200', icon: '🔥',
    desc: 'Le feu de la bataille brûle en permanence.',
    bonus2: { label: 'ATK +15%',          effect: { atk_pct: 0.15 } },
    bonus4: { label: 'ATK +30%',          effect: { atk_pct: 0.30 } },
  },
  gardien: {
    id: 'gardien', name: 'Gardien', color: '#4488ff', glow: '#2266dd', icon: '🛡',
    desc: 'Forteresse imprenable de Neo-Osaka.',
    bonus2: { label: 'DEF +15%',          effect: { def_pct: 0.15 } },
    bonus4: { label: 'DEF +15% · HP +20%', effect: { def_pct: 0.15, hp_pct: 0.20 } },
  },
  foudre: {
    id: 'foudre', name: 'Foudre', color: '#ffcc00', glow: '#ddaa00', icon: '⚡',
    desc: 'Précision et puissance critique absolues.',
    bonus2: { label: 'CRIT +10%',          effect: { crit_rate: 0.10 } },
    bonus4: { label: 'CRIT +10% · CRIT DMG +25%', effect: { crit_rate: 0.10, crit_dmg: 0.25 } },
  },
  vitalite: {
    id: 'vitalite', name: 'Vitalité', color: '#00ee88', glow: '#00cc66', icon: '💚',
    desc: 'Force vitale inépuisable du réseau.',
    bonus2: { label: 'HP +18%',            effect: { hp_pct: 0.18 } },
    bonus4: { label: 'HP +35%',            effect: { hp_pct: 0.35 } },
  },
  ombre: {
    id: 'ombre', name: 'Ombre', color: '#9933ff', glow: '#7711dd', icon: '◈',
    desc: 'Vitesse de l\'obscurité absolue.',
    bonus2: { label: 'SPD +10%',           effect: { spd_pct: 0.10 } },
    bonus4: { label: 'SPD +20%',           effect: { spd_pct: 0.20 } },
  },
  neant: {
    id: 'neant', name: 'Néant', color: '#cc00ff', glow: '#aa00dd', icon: '★',
    desc: 'Équilibre parfait entre tous les attributs.',
    bonus2: { label: 'Tous stats +6%',     effect: { all_pct: 0.06 } },
    bonus4: { label: 'Tous stats +15%',    effect: { all_pct: 0.15 } },
  },
};

export const STAT_LABELS = {
  atk_flat:  'ATK flat',
  atk_pct:   'ATK %',
  def_flat:  'DEF flat',
  def_pct:   'DEF %',
  hp_flat:   'PV flat',
  hp_pct:    'PV %',
  spd_flat:  'VIT flat',
  spd_pct:   'VIT %',
  crit_rate: 'Taux CRIT',
  crit_dmg:  'DMG CRIT',
  all_pct:   'Tous stats %',
};

const MAIN_STAT_POOLS = {
  arme:       ['atk_flat', 'atk_pct'],
  armure:     ['def_flat', 'def_pct', 'hp_pct'],
  accessoire: ['hp_flat',  'hp_pct',  'atk_pct'],
  relique:    ['atk_pct',  'def_pct', 'hp_pct', 'spd_flat', 'crit_rate', 'crit_dmg'],
};

const SUB_STAT_POOL = [
  'atk_flat', 'atk_pct', 'def_flat', 'def_pct',
  'hp_flat',  'hp_pct',  'spd_flat', 'crit_rate', 'crit_dmg',
];

function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randRange(min, max) { return min + Math.random() * (max - min); }

function statBaseValue(stat, rarity) {
  const r = Math.min(5, Math.max(1, rarity)) - 1;
  const table = {
    atk_flat:  [35, 55, 85, 130, 180],
    atk_pct:   [0.04, 0.06, 0.09, 0.12, 0.16],
    def_flat:  [28, 44, 70, 105, 145],
    def_pct:   [0.04, 0.06, 0.09, 0.12, 0.16],
    hp_flat:   [130, 220, 360, 540, 760],
    hp_pct:    [0.04, 0.06, 0.09, 0.12, 0.16],
    spd_flat:  [3, 5, 8, 12, 17],
    crit_rate: [0.03, 0.05, 0.07, 0.10, 0.13],
    crit_dmg:  [0.06, 0.09, 0.12, 0.16, 0.20],
  };
  return (table[stat]?.[r] ?? 0) * randRange(0.85, 1.15);
}

let _artIdSeq = Date.now();

/**
 * Génère un artefact aléatoire.
 * @param {string} slot   - 'arme'|'armure'|'accessoire'|'relique'
 * @param {string} setId  - clé dans ARTIFACT_SETS (ou aléatoire si non fourni)
 * @param {number} rarity - 1–5
 */
export function generateArtifact(slot, setId = null, rarity = 3) {
  const setKeys  = Object.keys(ARTIFACT_SETS);
  const finalSet = setId ?? randChoice(setKeys);
  const mainPool = MAIN_STAT_POOLS[slot] || ['atk_pct'];
  const mainStat = randChoice(mainPool);
  const mainVal  = statBaseValue(mainStat, rarity) * 3.2;

  const subCount = Math.min(4, Math.max(1, rarity - 1));
  const subPool  = SUB_STAT_POOL.filter(s => s !== mainStat);
  const chosen   = new Set();
  const subStats = [];
  for (let i = 0; i < subCount; i++) {
    const pool = subPool.filter(s => !chosen.has(s));
    if (!pool.length) break;
    const stat = randChoice(pool);
    chosen.add(stat);
    subStats.push({ stat, value: statBaseValue(stat, rarity) });
  }

  return {
    id:       `art_${_artIdSeq++}`,
    setId:    finalSet,
    slot,
    rarity,
    mainStat: { stat: mainStat, value: mainVal },
    subStats,
  };
}

/**
 * Calcule les bonus de stats depuis un tableau d'artefacts équipés.
 * @param {Array} arts - jusqu'à 4 artefacts (null = vide)
 * @returns {Object} - totaux de stats bonus
 */
export function calcArtifactStats(arts = []) {
  const result = {
    atk_flat: 0, atk_pct: 0, def_flat: 0, def_pct: 0,
    hp_flat:  0, hp_pct:  0, spd_flat: 0, spd_pct: 0,
    crit_rate: 0, crit_dmg: 0, all_pct: 0,
  };
  const setCounts = {};

  for (const art of arts) {
    if (!art) continue;
    if (art.mainStat) {
      result[art.mainStat.stat] = (result[art.mainStat.stat] ?? 0) + art.mainStat.value;
    }
    for (let si = 0; si < (art.subStats || []).length; si++) {
      const sub      = art.subStats[si];
      const enhLevel = art.enhancements?.[si] ?? 0;
      const effVal   = getEnhancedSubValue(sub, enhLevel);
      result[sub.stat] = (result[sub.stat] ?? 0) + effVal;
    }
    setCounts[art.setId] = (setCounts[art.setId] ?? 0) + 1;
  }

  for (const [sid, count] of Object.entries(setCounts)) {
    const set = ARTIFACT_SETS[sid];
    if (!set) continue;
    if (count >= 2 && set.bonus2?.effect) {
      for (const [k, v] of Object.entries(set.bonus2.effect)) {
        result[k] = (result[k] ?? 0) + v;
      }
    }
    if (count >= 4 && set.bonus4?.effect) {
      for (const [k, v] of Object.entries(set.bonus4.effect)) {
        result[k] = (result[k] ?? 0) + v;
      }
    }
  }
  return result;
}

/* ════════════════════════════════
   FORGE — CONSTANTES
════════════════════════════════ */

/** Métadonnées des matériaux de forge. */
export const FORGE_MATERIALS = {
  forge_fragment:  { label: 'Fragment de Forge',   icon: '🔩', color: '#aaaaaa', desc: 'Débris récupérés d\'artefacts démantelés.' },
  crystal_essence: { label: 'Essence Cristalline', icon: '💠', color: '#44aaff', desc: 'Énergie cristallisée extraite d\'artefacts rares.' },
  primal_shard:    { label: 'Éclat Primordial',    icon: '⬡',  color: '#cc00ff', desc: 'Fragment de puissance primordiale du Vide.' },
};

/** Matériaux gagnés en démantelant un artefact selon sa rareté. */
export const DISMANTLE_REWARDS = {
  1: { forge_fragment: 5 },
  2: { forge_fragment: 12, crystal_essence: 2 },
  3: { forge_fragment: 8,  crystal_essence: 6,  primal_shard: 1 },
  4: { forge_fragment: 4,  crystal_essence: 5,  primal_shard: 3 },
  5: { forge_fragment: 2,  crystal_essence: 3,  primal_shard: 6 },
};

/** Coût en matériaux pour fusionner 3 artefacts vers la rareté cible. */
export const FUSION_COSTS = {
  2: { forge_fragment: 15 },
  3: { forge_fragment: 8,  crystal_essence: 5 },
  4: { crystal_essence: 5, primal_shard: 2 },
  5: { crystal_essence: 8, primal_shard: 5 },
};

/** Coût par niveau de renforcement (index 0 = vers niveau 1, etc.). */
export const ENHANCE_COSTS = [
  { forge_fragment: 20, crystal_essence: 5 },   // sub-stat → niveau 1
  { crystal_essence: 10, primal_shard: 2 },       // → niveau 2
  { crystal_essence: 8,  primal_shard: 5 },       // → niveau 3
];

/** Boost multiplicateur de valeur par niveau d'amélioration (cumulatif). */
export const ENHANCE_BOOST_PER_LEVEL = 0.25; // +25% de la valeur de base par niveau

/** Retourne la valeur effective d'un sub-stat avec ses améliorations. */
export function getEnhancedSubValue(subStat, enhLevel = 0) {
  return subStat.value * (1 + ENHANCE_BOOST_PER_LEVEL * enhLevel);
}

/** Retourne le résumé des récompenses de démantèlement. */
export function formatDismantleRewards(rarity) {
  const r = DISMANTLE_REWARDS[rarity] ?? {};
  return Object.entries(r)
    .map(([k, v]) => `${v}× ${FORGE_MATERIALS[k]?.label ?? k}`)
    .join(' · ');
}

/** Formate une valeur de stat pour affichage. */
export function formatStatValue(stat, value) {
  if (!value) return '0';
  if (stat.endsWith('_pct') || stat === 'crit_rate' || stat === 'crit_dmg') {
    return `+${Math.round(value * 100)}%`;
  }
  return `+${Math.round(value)}`;
}

/* ════════════════════════════════
   SYSTÈME DE DROP D'ARTEFACTS
════════════════════════════════ */

/**
 * Table de pondération de rareté par source.
 * Indices 0-4 = ★1 à ★5, somme = 100.
 */
const DROP_TABLES = {
  campaign:       { chance: 0.30, weights: [55, 35, 10,  0,  0], count: 1  },
  dungeon_room:   { chance: 0.40, weights: [45, 35, 20,  0,  0], count: 1  },
  dungeon_win:    { chance: 1.00, weights: [ 0, 25, 55, 20,  0], count: [1, 2] },
  tower_normal:   { chance: 0.25, weights: [ 0, 60, 40,  0,  0], count: 1  },
  tower_milestone:{ chance: 1.00, weights: [ 0,  5, 65, 30,  0], count: 1  },
  tower_high:     { chance: 1.00, weights: [ 0,  0, 30, 55, 15], count: 1  },
  boss_tier2:     { chance: 1.00, weights: [ 0, 60, 40,  0,  0], count: 1  },
  boss_tier3:     { chance: 1.00, weights: [ 0,  0, 70, 30,  0], count: 1  },
  boss_tier4:     { chance: 1.00, weights: [ 0,  0, 30, 60, 10], count: 2  },
  boss_tier5:     { chance: 1.00, weights: [ 0,  0, 10, 50, 40], count: 2  },
};

/**
 * Tire une rareté depuis une table de poids (indices 0–4 = ★1–★5).
 */
function _rollRarity(weights) {
  const roll = Math.random() * 100;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (roll < acc) return i + 1;
  }
  return 3; // fallback
}

/**
 * Génère un ou plusieurs artefacts de drop selon la source.
 * @param {string} source - clé dans DROP_TABLES
 * @param {object} [opts] - { floor: number } pour la tour
 * @returns {Array} tableau d'artefacts (peut être vide)
 */
export function rollArtifactDrops(source, opts = {}) {
  // Sélection auto de la source tour selon l'étage
  if (source === 'tower') {
    const floor = opts.floor ?? 1;
    if (floor % 10 === 0)           source = floor >= 30 ? 'tower_high' : 'tower_milestone';
    else if (floor % 5 === 0)       source = 'tower_milestone';
    else                            source = 'tower_normal';
  }

  const table = DROP_TABLES[source];
  if (!table) return [];

  // Test de chance
  if (Math.random() >= table.chance) return [];

  // Nombre d'artefacts
  const count = Array.isArray(table.count)
    ? table.count[Math.floor(Math.random() * table.count.length)]
    : table.count;

  const drops = [];
  for (let i = 0; i < count; i++) {
    const rarity = _rollRarity(table.weights);
    const slot   = randChoice(ARTIFACT_SLOTS);
    drops.push(generateArtifact(slot, null, rarity));
  }
  return drops;
}

/**
 * Résumé textuel d'un tableau d'artefacts droppés.
 */
export function formatArtifactDrops(drops) {
  if (!drops || drops.length === 0) return '';
  return drops.map(art => {
    const set = ARTIFACT_SETS[art.setId];
    return `${set?.icon ?? '?'} ${set?.name ?? art.setId} ${'★'.repeat(art.rarity)}`;
  }).join('  ·  ');
}

/** Retourne les bonus de set actifs pour un tableau d'artefacts. */
export function getActiveSets(arts = []) {
  const counts = {};
  for (const art of arts) {
    if (!art) continue;
    counts[art.setId] = (counts[art.setId] ?? 0) + 1;
  }
  const active = [];
  for (const [sid, count] of Object.entries(counts)) {
    const set = ARTIFACT_SETS[sid];
    if (!set) continue;
    if (count >= 2) active.push({ set, pieces: count, bonus: count >= 4 ? set.bonus4 : set.bonus2 });
  }
  return active;
}
