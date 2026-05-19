/**
 * characters.js
 * Base de données des personnages pullables.
 * Chaque perso a : id, nom, classe, rareté (1-5), couleur de carte, description.
 * Les sprites seront ajoutés quand les assets seront téléchargés.
 */

export const RARITIES = {
  5: { label: 'LÉGENDAIRE', color: '#ffd700', glow: '#ffaa00', rate: 0.02 },
  4: { label: 'ÉPIQUE',     color: '#b44fff', glow: '#7b2fff', rate: 0.13 },
  3: { label: 'RARE',       color: '#00d4ff', glow: '#0099bb', rate: 0.85 },
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

  // ── 3★ additionnels ──
  {
    id: 'jin',
    name: 'JIN',
    title: 'Recrue Augmentée',
    class: 'Guerrier',
    rarity: 3,
    element: 'Fire',
    description: 'Nouvelle recrue de la résistance. Prometteur, il progresse vite.',
    color: '#00d4ff',
  },
  {
    id: 'mira',
    name: 'MIRA',
    title: 'Espionne de Bas-Fond',
    class: 'Assassin',
    rarity: 3,
    element: 'Dark',
    description: 'Infiltrée dans les rangs démoniques. Ses vraies allégeances restent floues.',
    color: '#00d4ff',
  },
];
