/**
 * tower.js — Tour Infinie de KuroSekai.
 * Génération procédurale des étages, paliers, récompenses, et état hebdomadaire.
 */

/** RNG déterministe xorshift32 — même pattern que ArenaUI */
function seededRand(seed) {
  let s = seed | 0;
  return function () {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) / 0xFFFFFFFF);
  };
}

/* ════════════════════════════════
   PALIERS (TIERS) D'ÉTAGE
════════════════════════════════ */

export const TOWER_TIERS = [
  {
    id: 1, name: 'NOVICE',        kanji: '初', color: '#44aaff', glow: '#0077cc',
    floors: [1,  10],
    enemies:     ['drone_mk1',   'phantom_hacker', 'plasma_sentinel', 'cyber_witch',   'neuro_guard'],
    bossEnemies: ['neuro_guard', 'iron_colossus'],
  },
  {
    id: 2, name: 'INTERMÉDIAIRE', kanji: '中', color: '#44dd88', glow: '#00aa55',
    floors: [11, 20],
    enemies:     ['shadow_samurai', 'tide_crawler', 'cyber_oni',  'network_spider', 'regen_drone'],
    bossEnemies: ['cyber_oni',      'iron_colossus'],
  },
  {
    id: 3, name: 'AVANCÉ',        kanji: '上', color: '#ffcc00', glow: '#cc9900',
    floors: [21, 30],
    enemies:     ['void_specter', 'arc_sentinel', 'iron_colossus', 'regen_drone', 'network_spider'],
    bossEnemies: ['iron_colossus', 'void_specter'],
  },
  {
    id: 4, name: 'ÉLITE',         kanji: '精', color: '#ff8800', glow: '#cc5500',
    floors: [31, 40],
    enemies:     ['null_fragment', 'void_herald', 'quantum_reaper', 'cyber_seraph', 'chrono_breaker'],
    bossEnemies: ['storm_titan',   'origin_guardian'],
  },
  {
    id: 5, name: 'LÉGENDAIRE',    kanji: '傑', color: '#ff3300', glow: '#cc0000',
    floors: [41, 50],
    enemies:     ['storm_titan',   'quantum_reaper', 'void_archon', 'origin_guardian', 'null_sovereign'],
    bossEnemies: ['null_sovereign','void_archon'],
  },
  {
    id: 6, name: 'TRANSCENDANT',  kanji: '越', color: '#cc00ff', glow: '#8800cc',
    floors: [51, 9999],
    enemies:     ['void_mother',   'null_sovereign', 'origin_guardian', 'chrono_breaker', 'null_fragment'],
    bossEnemies: ['void_mother',   'null_sovereign'],
  },
];

export function getTierForFloor(floor) {
  return TOWER_TIERS.find(t => floor >= t.floors[0] && floor <= t.floors[1]) ?? TOWER_TIERS[5];
}

/* ════════════════════════════════
   GÉNÉRATION D'ÉTAGE
════════════════════════════════ */

function _genWaves(floor, tier, rng) {
  const isMilestone = floor % 10 === 0;
  const pool        = isMilestone ? tier.bossEnemies : tier.enemies;

  // Nombre de vagues selon la profondeur
  let waveCount;
  if (floor <= 10)      waveCount = 1;
  else if (floor <= 30) waveCount = 2;
  else                  waveCount = 3;

  // Taille de vague selon la profondeur
  let minSize, maxSize;
  if (floor <= 5)       { minSize = 1; maxSize = 1; }
  else if (floor <= 10) { minSize = 1; maxSize = 2; }
  else if (floor <= 20) { minSize = 2; maxSize = 2; }
  else if (floor <= 30) { minSize = 2; maxSize = 3; }
  else if (floor <= 40) { minSize = 3; maxSize = 3; }
  else                  { minSize = 3; maxSize = 3; }

  const waves = [];
  for (let w = 0; w < waveCount; w++) {
    const size = minSize + Math.round(rng() * (maxSize - minSize));
    const wave = Array.from({ length: size }, () => {
      return pool[Math.floor(rng() * pool.length)];
    });
    waves.push(wave);
  }

  // Étage jalon (× 10) : dernière vague toujours boss
  if (isMilestone && waves.length > 0) {
    const lastWave = waves[waves.length - 1];
    lastWave[0] = tier.bossEnemies[0]; // ennemi boss en premier
  }

  return waves;
}

/**
 * Génère le stage compatible CombatUI pour un étage donné.
 * Le résultat est déterministe : le même étage produit toujours les mêmes ennemis.
 */
export function getTowerFloorStage(floor) {
  const tier        = getTierForFloor(floor);
  const isMilestone = floor % 10 === 0;
  const rng         = seededRand(floor * 7919 + 42);
  const waves       = _genWaves(floor, tier, rng);

  return {
    id:         `tower_floor_${floor}`,
    name:       `ÉTAGE ${floor}`,
    subtitle:   `${tier.name} · ${isMilestone ? 'BOSS' : 'Combat'}`,
    element:    'Void',
    color:      tier.color,
    glow:       tier.glow,
    difficulty: Math.min(5, Math.ceil(floor / 10)),
    unlockAfter: null,
    waves,
    rewards:    getTowerRewards(floor),
    chapter:    tier.id,
    isBoss:     isMilestone,
    isTower:    true,
  };
}

/* ════════════════════════════════
   RÉCOMPENSES
════════════════════════════════ */

/** Récompenses spéciales aux jalons. */
export const TOWER_MILESTONES = {
  10:  { currency: 2000,  freeRolls: 1 },
  20:  { currency: 4000,  shard_basic: 5 },
  30:  { currency: 8000,  shard_elite: 2, freeRolls: 2 },
  40:  { currency: 15000, crystal_void: 1, freeRolls: 2 },
  50:  { currency: 30000, crystal_void: 2, stone_ascension: 1, freeRolls: 3 },
};

export function getTowerRewards(floor) {
  const base      = { currency: floor * 150, exp: floor * 100 };
  const milestone = TOWER_MILESTONES[floor] ?? null;
  return milestone ? { ...base, ...milestone } : base;
}

/** Texte résumé des récompenses d'un étage. */
export function formatTowerRewards(floor) {
  const r = getTowerRewards(floor);
  const parts = [`${r.currency} ◈`];
  if (r.freeRolls)        parts.push(`${r.freeRolls} tirage${r.freeRolls > 1 ? 's' : ''}`);
  if (r.shard_basic)      parts.push(`${r.shard_basic}× Fragment Basique`);
  if (r.shard_elite)      parts.push(`${r.shard_elite}× Fragment Élite`);
  if (r.crystal_void)     parts.push(`${r.crystal_void}× Cristal du Vide`);
  if (r.stone_ascension)  parts.push(`${r.stone_ascension}× Pierre d'Ascension`);
  return parts.join(' · ');
}

/* ════════════════════════════════
   CLASSEMENT FACTICE (leaderboard)
════════════════════════════════ */

const _TOWER_NAMES = [
  'ShadowKira', 'VoidHunter', 'NeonBlade', 'AkaneZero', 'GlitchTaka',
  'QuantumX',   'GhostByte',  'DarkSeraph','OmegaUnit', 'CrimsonPact',
];

export function getTowerLeaderboard(playerFloor) {
  const seed   = Math.floor(Date.now() / (86_400_000 * 7)); // change each week
  const rng    = seededRand(seed * 1337 + 99);
  const entries = _TOWER_NAMES.map((name, i) => ({
    name,
    floor: Math.max(1, Math.round(playerFloor * 1.2 + rng() * 30) - i * 5),
    isPlayer: false,
  }));
  entries.push({ name: 'TOI', floor: playerFloor, isPlayer: true });
  entries.sort((a, b) => b.floor - a.floor);
  return entries.slice(0, 8);
}
