/**
 * characters.js
 * Base de données des personnages pullables.
 * Chaque perso a : id, nom, classe, rareté (1-5), couleur de carte, description.
 * Les sprites seront ajoutés quand les assets seront téléchargés.
 */

export const RARITIES = {
  5: { label: 'LÉGENDAIRE', color: '#ffd700', glow: '#ffaa00', rate: 0.02 },
  4: { label: 'ÉPIQUE',     color: '#b44fff', glow: '#7b2fff', rate: 0.08 },
  3: { label: 'RARE',       color: '#00d4ff', glow: '#0099bb', rate: 0.25 },
  2: { label: 'PEU COMMUN', color: '#44ff88', glow: '#00aa44', rate: 0.35 },
  1: { label: 'COMMUN',     color: '#aabbcc', glow: '#556677', rate: 0.30 },
};

export const CHARACTERS = [
  // ── 5★ LÉGENDAIRES ──
  {
    id: 'kira',
    name: 'KIRA',
    title: 'La Faucheuse Bionique',
    class: 'Shinigami',
    rarity: 5,
    element: 'Void',
    description: 'Ex-capitaine corrompue par une augmentation illégale. Sa lame tranche entre les dimensions.',
    color: '#ffd700',
  },
  {
    id: 'seraph',
    name: 'SERAPH',
    title: 'L\'Ange de l\'Apocalypse',
    class: 'Gardien',
    rarity: 5,
    element: 'Light',
    description: 'Humain augmenté avec des ailes cybernétiques. Seul survivant de la Purge de Neo-Osaka.',
    color: '#ffffff',
  },

  // ── 4★ ÉPIQUES ──
  {
    id: 'ryuu',
    name: 'RYUU',
    title: 'Le Dragon d\'Acier',
    class: 'Guerrier',
    rarity: 4,
    element: 'Fire',
    description: 'Bras droit remplacé par un canon plasma de dernière génération.',
    color: '#ff6600',
  },
  {
    id: 'nyx',
    name: 'NYX',
    title: 'Fantôme du Réseau',
    class: 'Assassin',
    rarity: 4,
    element: 'Dark',
    description: 'Hackeuse dont le cerveau est relié directement à la matrice démonique.',
    color: '#aa00ff',
  },
  {
    id: 'akane',
    name: 'AKANE',
    title: 'La Médecin de Guerre',
    class: 'Soutien',
    rarity: 4,
    element: 'Water',
    description: 'Chirurgienne de combat. Ses nanobots réparent aussi bien qu\'ils détruisent.',
    color: '#00ccff',
  },

  // ── 3★ RARES ──
  {
    id: 'taka',
    name: 'TAKA',
    title: 'Le Tireur d\'Élite',
    class: 'Tireur',
    rarity: 3,
    element: 'Wind',
    description: 'Yeux remplacés par des viseurs thermiques. Ne rate jamais sa cible.',
    color: '#00ff88',
  },
  {
    id: 'golem',
    name: 'GOLEM-7',
    title: 'Unité de Choc',
    class: 'Tank',
    rarity: 3,
    element: 'Earth',
    description: 'Ancien robot industriel reconverti en machine de guerre par la résistance.',
    color: '#888888',
  },
  {
    id: 'suki',
    name: 'SUKI',
    title: 'L\'Électromancienne',
    class: 'Mage',
    rarity: 3,
    element: 'Thunder',
    description: 'Maîtrise les courants électriques grâce à ses implants nerveux sur-chargés.',
    color: '#ffff00',
  },

  // ── 2★ PEU COMMUNS ──
  {
    id: 'jin',
    name: 'JIN',
    title: 'Recrue Augmentée',
    class: 'Guerrier',
    rarity: 2,
    element: 'Fire',
    description: 'Nouvelle recrue de la résistance. Prometteur mais encore inexpérimenté.',
    color: '#ff8844',
  },
  {
    id: 'mira',
    name: 'MIRA',
    title: 'Espionne de Bas-Fond',
    class: 'Assassin',
    rarity: 2,
    element: 'Dark',
    description: 'Infiltrée dans les rangs démoniques. Ses vraies allégeances restent floues.',
    color: '#cc44aa',
  },

  // ── 1★ COMMUNS ──
  {
    id: 'grunt1',
    name: 'SOLDAT-K',
    title: 'Fantassin de Base',
    class: 'Guerrier',
    rarity: 1,
    element: 'Neutral',
    description: 'Soldat standard de la résistance. Fiable, sans éclat.',
    color: '#778899',
  },
  {
    id: 'grunt2',
    name: 'DRONE-3',
    title: 'Unité de Reconnaissance',
    class: 'Tireur',
    rarity: 1,
    element: 'Wind',
    description: 'Drone de surveillance reconverti. Utile en début de partie.',
    color: '#667788',
  },
];
