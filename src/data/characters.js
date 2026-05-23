/**
 * characters.js
 * Base de données des personnages pullables.
 * Chaque perso a : id, nom, classe, rareté (1-5), couleur de carte, description.
 * Les sprites seront ajoutés quand les assets seront téléchargés.
 */

/**
 * Bonus de constellation par rareté (C1→C6, débloqués par dupes).
 * Chaque entrée = bonus de la constellation à CE niveau précis.
 * Les effets sont cumulatifs (C3 = C1+C2+C3).
 */
export const CONSTELLATION_BONUSES = {
  3: [
    { label: 'ATK +5%',          effect: { atk_pct: 0.05 } },
    { label: 'HP +8%',           effect: { hp_pct: 0.08  } },
    { label: 'Skill 1 — CD -1',  effect: { cd0: -1       } },
    { label: 'DEF +10%',         effect: { def_pct: 0.10 } },
    { label: 'ATK +15%',         effect: { atk_pct: 0.15 } },
    { label: 'Tous stats +20%',  effect: { all_pct: 0.20 } },
  ],
  4: [
    { label: 'HP +8%',           effect: { hp_pct: 0.08  } },
    { label: 'Skill 1 — CD -1',  effect: { cd0: -1       } },
    { label: 'ATK +12%',         effect: { atk_pct: 0.12 } },
    { label: 'HP +15%',          effect: { hp_pct: 0.15  } },
    { label: 'Skill 2 — CD -1',  effect: { cd1: -1       } },
    { label: 'Tous stats +25%',  effect: { all_pct: 0.25 } },
  ],
  5: [
    { label: 'Tous stats +10%',  effect: { all_pct: 0.10 } },
    { label: 'Skill 1 — CD -1',  effect: { cd0: -1       } },
    { label: 'ATK +15%',         effect: { atk_pct: 0.15 } },
    { label: 'HP +15%',          effect: { hp_pct: 0.15  } },
    { label: 'Skill 2 — CD -1',  effect: { cd1: -1       } },
    { label: 'Tous stats +30%',  effect: { all_pct: 0.30 } },
  ],
};

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
    lore: 'Autrefois gardienne de Neo-Osaka, Kira a sacrifié son humanité pour survivre à la Purge. Son bras gauche, remplacé par une lame dimensionnelle, peut fendre la réalité elle-même.',
    color: '#ffd700',
    stats: { hp: 9800, atk: 1620, def: 880, spd: 142 },
    skills: [
      { name: 'Fente Dimensionnelle', desc: 'Inflige 280% ATK à un ennemi. Ignore 40% de la DEF.', multiplier: 2.8, target: 'single', cooldown: 2 },
      { name: 'Vide Absolu', desc: 'Réduit les PV de tous les ennemis de 18%. Annule les boucliers.', multiplier: 1.8, target: 'all', cooldown: 3 },
    ],
  },
  {
    id: 'seraph',
    name: 'SERAPH',
    title: 'L\'Ange de l\'Apocalypse',
    class: 'Gardien',
    rarity: 5,
    element: 'Light',
    description: 'Humain augmenté avec des ailes cybernétiques. Seul survivant de la Purge de Neo-Osaka.',
    lore: 'Les ailes de Seraph ne sont pas une bénédiction — elles sont une condamnation. Chaque déploiement consume 3 ans de sa vie. Il continue quand même.',
    color: '#ffffff',
    stats: { hp: 11200, atk: 1280, def: 1540, spd: 118 },
    skills: [
      { name: 'Aile de Jugement', desc: 'Soigne l\'allié le plus blessé de 35% de ses PV max.', multiplier: 0, target: 'self', cooldown: 2, buff: 'regen' },
      { name: 'Sanctuaire', desc: 'Crée un bouclier sur toute l\'équipe absorbant 20% des PV max.', multiplier: 0, target: 'self', cooldown: 3, buff: 'shield' },
    ],
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
    lore: 'Ryuu a perdu son bras dans l\'explosion de la centrale de Shibuya. La résistance lui a offert un remplacement. Il leur a offert sa loyauté — et sa rage.',
    color: '#ff6600',
    stats: { hp: 8400, atk: 1480, def: 980, spd: 128 },
    skills: [
      { name: 'Canon Plasma', desc: 'Attaque en ligne infligeant 220% ATK à tous les ennemis alignés.', multiplier: 2.2, target: 'all', cooldown: 2 },
      { name: 'Explosion d\'Acier', desc: 'Inflige 340% ATK à un ennemi. Brûlure pendant 2 tours.', multiplier: 3.4, target: 'single', cooldown: 3, debuff: 'burn' },
    ],
  },
  {
    id: 'nyx',
    name: 'NYX',
    title: 'Fantôme du Réseau',
    class: 'Assassin',
    rarity: 4,
    element: 'Dark',
    description: 'Hackeuse dont le cerveau est relié directement à la matrice démonique.',
    lore: 'Nyx n\'a pas de visage dans les archives de la cité. Elle n\'existe officiellement pas. Pourtant, chaque crash du système de surveillance porte sa signature.',
    color: '#aa00ff',
    stats: { hp: 6800, atk: 1560, def: 720, spd: 168 },
    skills: [
      { name: 'Intrusion Neurale', desc: 'Réduit l\'ATK et la SPD d\'un ennemi de 30% pendant 3 tours.', multiplier: 1.2, target: 'single', cooldown: 2, debuff: 'def_down' },
      { name: 'Exécution Fantôme', desc: 'Inflige 380% ATK à un ennemi. Dégâts doublés sous 30% PV.', multiplier: 3.8, target: 'weakest', cooldown: 3 },
    ],
  },
  {
    id: 'akane',
    name: 'AKANE',
    title: 'La Médecin de Guerre',
    class: 'Soutien',
    rarity: 4,
    element: 'Water',
    description: 'Chirurgienne de combat. Ses nanobots réparent aussi bien qu\'ils détruisent.',
    lore: 'Akane opère sous les balles depuis l\'âge de seize ans. Elle ne juge jamais ses patients. Elle juge ceux qui les ont blessés.',
    color: '#00ccff',
    stats: { hp: 7600, atk: 980, def: 1120, spd: 138 },
    skills: [
      { name: 'Protocole Nanobot', desc: 'Régénère 12% PV max à tous les alliés pendant 3 tours.', multiplier: 0, target: 'self', cooldown: 2, buff: 'regen' },
      { name: 'Surcharge Chimique', desc: 'Augmente l\'ATK de l\'allié le plus fort de 45% pendant 2 tours.', multiplier: 1.0, target: 'single', cooldown: 3, buff: 'atk_up' },
    ],
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
    lore: 'Taka ne parle pas de sa vie avant les implants. Il ne parle pas beaucoup de toute façon.',
    color: '#00ff88',
    stats: { hp: 5800, atk: 1340, def: 640, spd: 152 },
    skills: [
      { name: 'Tir de Précision', desc: 'Inflige 260% ATK en ignorant les esquives. Cible toujours le plus faible.', multiplier: 2.6, target: 'weakest', cooldown: 2 },
      { name: 'Rafale Thermique', desc: 'Attaque 3 fois aléatoirement pour 90% ATK chacune.', multiplier: 0.9, target: 'random', hits: 3, cooldown: 3 },
    ],
  },
  {
    id: 'golem',
    name: 'GOLEM-7',
    title: 'Unité de Choc',
    class: 'Tank',
    rarity: 3,
    element: 'Earth',
    description: 'Ancien robot industriel reconverti en machine de guerre par la résistance.',
    lore: 'GOLEM-7 était prévu pour démolir des bâtiments. La résistance l\'a reprogrammé pour en protéger.',
    color: '#888888',
    stats: { hp: 10400, atk: 880, def: 1680, spd: 88 },
    skills: [
      { name: 'Bouclier Blindé', desc: 'Absorbe les prochaines attaques sur les alliés jusqu\'à 25% de ses PV max.', multiplier: 0, target: 'self', cooldown: 2, buff: 'shield' },
      { name: 'Séisme Mécanique', desc: 'Inflige 180% ATK à tous les ennemis. Chance d\'étourdissement 40%.',  multiplier: 1.8, target: 'all', cooldown: 3 },
    ],
  },
  {
    id: 'suki',
    name: 'SUKI',
    title: 'L\'Électromancienne',
    class: 'Mage',
    rarity: 3,
    element: 'Thunder',
    description: 'Maîtrise les courants électriques grâce à ses implants nerveux sur-chargés.',
    lore: 'Ses implants la font vibrer en permanence. Les gens qui s\'approchent trop sentent leurs cheveux se dresser.',
    color: '#ffff00',
    stats: { hp: 5600, atk: 1420, def: 580, spd: 144 },
    skills: [
      { name: 'Arc Électrique', desc: 'Inflige 200% ATK à un ennemi. Rebondit sur 2 ennemis adjacents.', multiplier: 2.0, target: 'single', cooldown: 2 },
      { name: 'Surcharge', desc: 'Inflige 350% ATK à un ennemi. Paralyse pendant 1 tour.', multiplier: 3.5, target: 'single', cooldown: 3, debuff: 'paralyze' },
    ],
  },
  {
    id: 'jin',
    name: 'JIN',
    title: 'Recrue Augmentée',
    class: 'Guerrier',
    rarity: 3,
    element: 'Fire',
    description: 'Nouvelle recrue de la résistance. Prometteur, il progresse vite.',
    lore: 'Jin s\'est engagé après que sa famille a disparu dans le Secteur 7. Il n\'a que dix-neuf ans et des yeux qui en ont vu trop.',
    color: '#ff4400',
    stats: { hp: 6400, atk: 1180, def: 820, spd: 136 },
    skills: [
      { name: 'Frappe Ardente', desc: 'Inflige 220% ATK à un ennemi. +10% ATK à soi-même si KO.', multiplier: 2.2, target: 'single', cooldown: 2, debuff: 'burn' },
      { name: 'Rage Juvénile', desc: 'Augmente l\'ATK de 20% par allié KO (max +60%).', multiplier: 2.8, target: 'single', cooldown: 3, buff: 'atk_up' },
    ],
  },
  {
    id: 'mira',
    name: 'MIRA',
    title: 'Espionne de Bas-Fond',
    class: 'Assassin',
    rarity: 3,
    element: 'Dark',
    description: 'Infiltrée dans les rangs démoniques. Ses vraies allégeances restent floues.',
    lore: 'Mira change de visage plus souvent que de vêtements. La seule constante : elle survit toujours.',
    color: '#8800cc',
    stats: { hp: 5400, atk: 1260, def: 660, spd: 162 },
    skills: [
      { name: 'Double Jeu', desc: 'Copie le dernier buff ennemi et l\'applique à soi-même.', multiplier: 1.5, target: 'single', cooldown: 2, buff: 'atk_up' },
      { name: 'Couteau dans l\'Ombre', desc: 'Inflige 300% ATK à un ennemi. Hémorragie pendant 3 tours.', multiplier: 3.0, target: 'weakest', cooldown: 3, debuff: 'bleed' },
    ],
  },
];
