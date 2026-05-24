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
    for (const sub of (art.subStats || [])) {
      result[sub.stat] = (result[sub.stat] ?? 0) + sub.value;
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

/** Formate une valeur de stat pour affichage. */
export function formatStatValue(stat, value) {
  if (!value) return '0';
  if (stat.endsWith('_pct') || stat === 'crit_rate' || stat === 'crit_dmg') {
    return `+${Math.round(value * 100)}%`;
  }
  return `+${Math.round(value)}`;
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
