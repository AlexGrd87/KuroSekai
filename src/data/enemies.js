/**
 * enemies.js
 * Base de données des ennemis de KuroSekai.
 * Chaque ennemi a les mêmes stats que les personnages + une IA simple.
 */

export const ENEMIES = [
  /* ── Tier 1 ── */
  {
    id: 'drone_mk1',
    name: 'MK-01 DRONE',
    class: 'Unité',
    element: 'Neutral',
    color: '#445566',
    stats: { hp: 3200, atk: 580, def: 320, spd: 98 },
    skills: [
      { name: 'Tir Automatique', desc: 'Inflige 100% ATK.', multiplier: 1.0, target: 'single', cooldown: 0 },
      { name: 'Rafale',          desc: 'Inflige 70% ATK × 2.', multiplier: 0.7, target: 'single', hits: 2, cooldown: 2 },
    ],
    ai: 'aggressive',
    symbol: '⬡',
  },
  {
    id: 'neuro_guard',
    name: 'NEURO-GARDE',
    class: 'Tank',
    element: 'Earth',
    color: '#664422',
    stats: { hp: 6800, atk: 720, def: 880, spd: 72 },
    skills: [
      { name: 'Charge Blindée', desc: 'Inflige 120% ATK. Réduit DEF.', multiplier: 1.2, target: 'single', debuff: 'def_down', cooldown: 0 },
      { name: 'Bouclier Ferro', desc: 'Bouclier 20% PV max.',          multiplier: 0,   target: 'self',   buff: 'shield',      cooldown: 3 },
    ],
    ai: 'defensive',
    symbol: '⬢',
  },
  {
    id: 'phantom_hacker',
    name: 'FANTÔME.EXE',
    class: 'Assassin',
    element: 'Dark',
    color: '#440088',
    stats: { hp: 2800, atk: 960, def: 240, spd: 145 },
    skills: [
      { name: 'Code Viral',     desc: 'Inflige 140% ATK. Hémorragie.',  multiplier: 1.4, target: 'single',  debuff: 'bleed', cooldown: 0 },
      { name: 'Exécution Zéro', desc: 'Inflige 280% ATK au plus faible.', multiplier: 2.8, target: 'weakest',                 cooldown: 3 },
    ],
    ai: 'assassin',
    symbol: '◆',
  },
  {
    id: 'plasma_sentinel',
    name: 'SENTINELLE Ω',
    class: 'Guerrier',
    element: 'Fire',
    color: '#882200',
    stats: { hp: 5200, atk: 840, def: 560, spd: 110 },
    skills: [
      { name: 'Lance Plasma', desc: 'Inflige 150% ATK.',          multiplier: 1.5, target: 'single', cooldown: 0 },
      { name: 'Supernova',    desc: 'Inflige 120% ATK à tous.',    multiplier: 1.2, target: 'all',    cooldown: 4 },
    ],
    ai: 'aggressive',
    symbol: '▲',
  },
  {
    id: 'cyber_witch',
    name: 'SORCIÈRE CYBER',
    class: 'Mage',
    element: 'Thunder',
    color: '#886600',
    stats: { hp: 3600, atk: 1020, def: 280, spd: 132 },
    skills: [
      { name: 'Foudre Matrix',      desc: 'Inflige 130% ATK. Paralysie.',      multiplier: 1.3, target: 'single', debuff: 'paralyze', cooldown: 0 },
      { name: 'Tempête de Données', desc: 'Inflige 90% ATK × 3 aléatoires.', multiplier: 0.9, target: 'random', hits: 3, cooldown: 3 },
    ],
    ai: 'aggressive',
    symbol: '✦',
  },

  /* ── Tier 2 ── */
  {
    id: 'shadow_samurai',
    name: 'SAMOURAÏ FANTÔME',
    class: 'Assassin',
    element: 'Dark',
    color: '#220055',
    stats: { hp: 4200, atk: 1180, def: 380, spd: 158 },
    skills: [
      { name: 'Tranchant Silencieux', desc: 'Inflige 180% ATK. Brûlure.',       multiplier: 1.8, target: 'single', debuff: 'burn',  cooldown: 0 },
      { name: 'Iaido Fantôme',        desc: 'Inflige 320% ATK au plus faible.',  multiplier: 3.2, target: 'weakest',                cooldown: 4 },
    ],
    ai: 'assassin',
    symbol: '刀',
  },
  {
    id: 'tide_crawler',
    name: 'RÔDEUR DES DOCKS',
    class: 'Guerrier',
    element: 'Water',
    color: '#004477',
    stats: { hp: 5800, atk: 880, def: 680, spd: 105 },
    skills: [
      { name: 'Vague de Choc',  desc: 'Inflige 130% ATK à tous.',        multiplier: 1.3, target: 'all',    cooldown: 0 },
      { name: 'Submersion',     desc: 'Inflige 200% ATK. Hémorragie.',    multiplier: 2.0, target: 'single', debuff: 'bleed', cooldown: 3 },
    ],
    ai: 'aggressive',
    symbol: '〜',
  },

  /* ── Tier 3 ── */
  {
    id: 'cyber_oni',
    name: 'ONI CYBERNÉTIQUE',
    class: 'Berserker',
    element: 'Fire',
    color: '#aa1100',
    stats: { hp: 7200, atk: 1280, def: 520, spd: 118 },
    skills: [
      { name: 'Frappe de Démon',  desc: 'Inflige 160% ATK. Brûlure.',      multiplier: 1.6, target: 'single', debuff: 'burn',  cooldown: 0 },
      { name: 'Furie Infernale',  desc: 'Inflige 280% ATK à tous.',         multiplier: 2.8, target: 'all',                     cooldown: 4 },
    ],
    ai: 'aggressive',
    symbol: '鬼',
  },
  {
    id: 'network_spider',
    name: 'ARAIGNÉE-RÉSEAU',
    class: 'Hacker',
    element: 'Void',
    color: '#660099',
    stats: { hp: 3800, atk: 1060, def: 300, spd: 148 },
    skills: [
      { name: 'Fil de Données', desc: 'Inflige 110% ATK × 3 aléatoires.',  multiplier: 1.1, target: 'random', hits: 3, cooldown: 0 },
      { name: 'Virus Parasite', desc: 'Inflige 200% ATK. Paralysie.',       multiplier: 2.0, target: 'single', debuff: 'paralyze', cooldown: 3 },
    ],
    ai: 'assassin',
    symbol: '蜘',
  },

  /* ── Tier 4 / Boss ── */
  {
    id: 'mech_overlord',
    name: 'SEIGNEUR MÉCANIQUE',
    class: 'Tank Boss',
    element: 'Earth',
    color: '#443300',
    stats: { hp: 14000, atk: 1100, def: 1400, spd: 68 },
    skills: [
      { name: 'Poing de Titane',  desc: 'Inflige 140% ATK. DEF ennemie -.',  multiplier: 1.4, target: 'single', debuff: 'def_down', cooldown: 0 },
      { name: 'Blindage Total',   desc: 'Bouclier absorbant 25% PV max.',      multiplier: 0,   target: 'self',   buff: 'shield',      cooldown: 3 },
      { name: 'Tremblement',      desc: 'Inflige 180% ATK à tous.',            multiplier: 1.8, target: 'all',                          cooldown: 5 },
    ],
    ai: 'defensive',
    symbol: '⚙',
  },
  {
    id: 'void_archon',
    name: 'ARCHONTE DU VIDE',
    class: 'Boss Final',
    element: 'Void',
    color: '#550088',
    stats: { hp: 18000, atk: 1560, def: 980, spd: 136 },
    skills: [
      { name: 'Annihilation',     desc: 'Inflige 200% ATK à tous.',            multiplier: 2.0, target: 'all',                          cooldown: 0 },
      { name: 'Fracture Réelle',  desc: 'Inflige 320% ATK au plus faible.',    multiplier: 3.2, target: 'weakest',                       cooldown: 3 },
      { name: 'Vortex de Vide',   desc: 'Inflige 160% ATK × 2 aléatoires.',   multiplier: 1.6, target: 'random', hits: 2, cooldown: 4 },
    ],
    ai: 'assassin',
    symbol: '虚',
  },
];

/* ══════════════════════════════════════════
   STAGES — Zones de combat progressives
══════════════════════════════════════════ */
export const STAGES = [
  {
    id: 'stage_01',
    order: 1,
    name: 'Secteur 7',
    subtitle: 'Périphérie Corrompue',
    lore: 'Les drones de surveillance ont été compromis par un signal inconnu. La périphérie de Neo-Osaka brûle.',
    element: 'Neutral',
    color: '#445566',
    glow: '#667799',
    difficulty: 1,
    unlockAfter: null,
    waves: [
      ['drone_mk1', 'drone_mk1', 'drone_mk1'],
      ['drone_mk1', 'neuro_guard', 'drone_mk1'],
      ['phantom_hacker', 'neuro_guard', 'drone_mk1'],
    ],
    rewards: { exp: 120, currency: 300 },
  },
  {
    id: 'stage_02',
    order: 2,
    name: 'Secteur 12',
    subtitle: 'Quartier Démon',
    lore: 'Des entités numériques démoniques s\'infiltrent dans les réseaux civils. Les hackers fantômes opèrent depuis les ruelles sombres.',
    element: 'Dark',
    color: '#440088',
    glow: '#9900ff',
    difficulty: 2,
    unlockAfter: 'stage_01',
    waves: [
      ['phantom_hacker', 'cyber_witch', 'drone_mk1'],
      ['plasma_sentinel', 'neuro_guard', 'phantom_hacker'],
      ['phantom_hacker', 'cyber_witch', 'plasma_sentinel'],
    ],
    rewards: { exp: 280, currency: 600 },
  },
  {
    id: 'stage_03',
    order: 3,
    name: 'Port Cyborg',
    subtitle: 'Les Docks Maudits',
    lore: 'Le port industriel est désormais contrôlé par des samouraïs fantômes et des créatures des profondeurs cybernétiques. Aucun cargo n\'en est revenu.',
    element: 'Water',
    color: '#004477',
    glow: '#0099ff',
    difficulty: 3,
    unlockAfter: 'stage_02',
    waves: [
      ['tide_crawler', 'drone_mk1', 'shadow_samurai'],
      ['plasma_sentinel', 'tide_crawler', 'phantom_hacker'],
      ['shadow_samurai', 'tide_crawler', 'cyber_witch'],
    ],
    rewards: { exp: 480, currency: 1000 },
  },
  {
    id: 'stage_04',
    order: 4,
    name: 'Ruche Neurale',
    subtitle: 'Nœud 03 — Zone Rouge',
    lore: 'Le centre de traitement de données de la corporation Yamamoto est tombé. Des entités inconnues se reproduisent dans les serveurs. La résistance n\'a que quelques heures.',
    element: 'Thunder',
    color: '#886600',
    glow: '#ffdd00',
    difficulty: 4,
    unlockAfter: 'stage_03',
    waves: [
      ['cyber_oni', 'cyber_witch', 'network_spider'],
      ['network_spider', 'plasma_sentinel', 'shadow_samurai'],
      ['cyber_oni', 'network_spider', 'mech_overlord'],
    ],
    rewards: { exp: 750, currency: 1600 },
  },
  {
    id: 'stage_05',
    order: 5,
    name: 'Tour Yamamoto',
    subtitle: 'Sanctuaire du Vide',
    lore: 'Au sommet de la tour maudite, l\'Archonte du Vide attend. Il est l\'origine de tout — la corruption, la Purge, la chute de Neo-Osaka. Tout s\'arrête ici.',
    element: 'Void',
    color: '#550088',
    glow: '#cc00ff',
    difficulty: 5,
    unlockAfter: 'stage_04',
    waves: [
      ['mech_overlord', 'shadow_samurai', 'cyber_witch'],
      ['void_archon', 'cyber_oni', 'network_spider'],
    ],
    rewards: { exp: 1200, currency: 3000 },
  },
];
