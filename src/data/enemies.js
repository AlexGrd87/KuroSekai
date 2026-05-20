/**
 * enemies.js
 * Base de données des ennemis de KuroSekai.
 * Chaque ennemi a les mêmes stats que les personnages + une IA simple.
 */

export const ENEMIES = [
  {
    id: 'drone_mk1',
    name: 'MK-01 DRONE',
    class: 'Unité',
    element: 'Neutral',
    color: '#445566',
    stats: { hp: 3200, atk: 580,  def: 320, spd: 98  },
    skills: [
      { name: 'Tir Automatique', desc: 'Inflige 100% ATK à une cible.', multiplier: 1.0, target: 'single', cooldown: 0 },
      { name: 'Rafale',          desc: 'Inflige 70% ATK × 2.',          multiplier: 0.7, target: 'single', hits: 2, cooldown: 2 },
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
    stats: { hp: 6800, atk: 720,  def: 880, spd: 72  },
    skills: [
      { name: 'Charge Blindée',   desc: 'Inflige 120% ATK. Réduit DEF ennemie.',  multiplier: 1.2, target: 'single', debuff: 'def_down', cooldown: 0 },
      { name: 'Bouclier Ferro',   desc: 'Crée un bouclier absorbant 20% PV max.', multiplier: 0,   target: 'self',   buff: 'shield',      cooldown: 3 },
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
    stats: { hp: 2800, atk: 960,  def: 240, spd: 145 },
    skills: [
      { name: 'Code Viral',      desc: 'Inflige 140% ATK. Applique Hémorragie.',  multiplier: 1.4, target: 'single', debuff: 'bleed',     cooldown: 0 },
      { name: 'Exécution Zéro',  desc: 'Inflige 280% ATK. Cible le plus faible.', multiplier: 2.8, target: 'weakest',                      cooldown: 3 },
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
    stats: { hp: 5200, atk: 840,  def: 560, spd: 110 },
    skills: [
      { name: 'Lance Plasma',    desc: 'Inflige 150% ATK à une cible.',            multiplier: 1.5, target: 'single',  cooldown: 0 },
      { name: 'Supernova',       desc: 'Inflige 120% ATK à toute l\'équipe.',       multiplier: 1.2, target: 'all',     cooldown: 4 },
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
      { name: 'Foudre Matrix',   desc: 'Inflige 130% ATK. 40% chance paralysie.', multiplier: 1.3, target: 'single', debuff: 'paralyze',  cooldown: 0 },
      { name: 'Tempête de Données', desc: 'Inflige 90% ATK × 3 aléatoirement.', multiplier: 0.9, target: 'random', hits: 3, cooldown: 3 },
    ],
    ai: 'aggressive',
    symbol: '✦',
  },
];

/* ── Vagues de combat par stage ── */
export const STAGES = [
  {
    id: 1,
    name: 'Secteur 7 — Périphérie',
    desc: 'Les drones de surveillance ont été compromis.',
    waves: [
      ['drone_mk1', 'drone_mk1', 'drone_mk1'],
      ['drone_mk1', 'neuro_guard', 'drone_mk1'],
      ['phantom_hacker', 'neuro_guard', 'drone_mk1'],
    ],
    rewards: { exp: 120, currency: 300 },
  },
  {
    id: 2,
    name: 'Secteur 12 — Quartier Démon',
    desc: 'Les entités démoniques s\'infiltrent dans les systèmes.',
    waves: [
      ['phantom_hacker', 'cyber_witch', 'drone_mk1'],
      ['plasma_sentinel', 'neuro_guard', 'phantom_hacker'],
    ],
    rewards: { exp: 280, currency: 600 },
  },
];
