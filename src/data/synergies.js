/**
 * synergies.js — Synergies d'équipe de KuroSekai.
 * Bonuses passifs activés selon la composition de l'équipe (classes / éléments).
 * Appliqués au démarrage du combat par CombatEngine._applySynergies().
 * Affichés dans TeamSelectUI pendant la sélection.
 */

export const SYNERGIES = [

  /* ═══════════════ SYNERGIES DE CLASSE ═══════════════ */

  {
    id:      'dual_assassin',
    name:    'LAMES JUMELÉES',
    nameJp:  '双刃',
    condition: { type: 'class', value: 'Assassin', count: 2 },
    effect:  { crit_rate: 0.15 },
    desc:    '+15% taux de critique (équipe)',
    color:   '#cc00ff',
    icon:    '🗡',
  },
  {
    id:      'dual_warrior',
    name:    'FRAPPE COORDONNÉE',
    nameJp:  '連撃',
    condition: { type: 'class', value: 'Guerrier', count: 2 },
    effect:  { atk_pct: 0.12 },
    desc:    '+12% ATK (équipe)',
    color:   '#ff6600',
    icon:    '⚔',
  },
  {
    id:      'dual_shinigami',
    name:    'DOUBLE FAUCHEUR',
    nameJp:  '双死神',
    condition: { type: 'class', value: 'Shinigami', count: 2 },
    effect:  { spd_pct: 0.10, crit_dmg: 0.20 },
    desc:    '+10% SPD, +20% bonus crit (équipe)',
    color:   '#00d4ff',
    icon:    '💀',
  },
  {
    id:      'guardian_support',
    name:    'BASTION SOIGNEUR',
    nameJp:  '守護癒し',
    condition: { type: 'classes', values: ['Gardien', 'Soutien'] },
    effect:  { hp_pct: 0.18, def_pct: 0.10 },
    desc:    '+18% PV, +10% DEF (équipe)',
    color:   '#44ffaa',
    icon:    '🛡',
  },
  {
    id:      'assassin_shinigami',
    name:    'FAUCHEURS DES OMBRES',
    nameJp:  '影の死神',
    condition: { type: 'classes', values: ['Assassin', 'Shinigami'] },
    effect:  { crit_rate: 0.10, crit_dmg: 0.30 },
    desc:    '+10% taux crit, +30% bonus crit (équipe)',
    color:   '#9933ff',
    icon:    '☠',
  },
  {
    id:      'warrior_tank',
    name:    'VANGUARD',
    nameJp:  '先鋒',
    condition: { type: 'classes', values: ['Guerrier', 'Tank'] },
    effect:  { def_pct: 0.15, atk_pct: 0.08 },
    desc:    '+15% DEF, +8% ATK (équipe)',
    color:   '#ffaa00',
    icon:    '🔱',
  },
  {
    id:      'mage_assassin',
    name:    'MAGIE & SANG',
    nameJp:  '魔刃',
    condition: { type: 'classes', values: ['Mage', 'Assassin'] },
    effect:  { atk_pct: 0.10, crit_rate: 0.08 },
    desc:    '+10% ATK, +8% taux crit (équipe)',
    color:   '#ff44cc',
    icon:    '✦',
  },

  /* ═══════════════ SYNERGIES D'ÉLÉMENT ═══════════════ */

  {
    id:      'dual_dark',
    name:    'TÉNÈBRES DOUBLES',
    nameJp:  '闇二重',
    condition: { type: 'element', value: 'Dark', count: 2 },
    effect:  { atk_pct: 0.15 },
    desc:    '+15% ATK (équipe)',
    color:   '#8800cc',
    icon:    '闇',
  },
  {
    id:      'dual_fire',
    name:    'FOURNAISE',
    nameJp:  '業火',
    condition: { type: 'element', value: 'Fire', count: 2 },
    effect:  { crit_dmg: 0.30 },
    desc:    '+30% bonus critique (équipe)',
    color:   '#ff4400',
    icon:    '火',
  },
  {
    id:      'dual_water',
    name:    'FLOT VITAL',
    nameJp:  '生命流',
    condition: { type: 'element', value: 'Water', count: 2 },
    effect:  { hp_pct: 0.20 },
    desc:    '+20% PV (équipe)',
    color:   '#0099ff',
    icon:    '水',
  },
  {
    id:      'dual_void',
    name:    'BRÈCHE DIMENSIONNELLE',
    nameJp:  '次元亀裂',
    condition: { type: 'element', value: 'Void', count: 2 },
    effect:  { all_pct: 0.10 },
    desc:    '+10% toutes stats (équipe)',
    color:   '#dd00ff',
    icon:    '虚',
  },
  {
    id:      'dual_thunder',
    name:    'ORAGE ÉLECTRIQUE',
    nameJp:  '電撃嵐',
    condition: { type: 'element', value: 'Thunder', count: 2 },
    effect:  { spd_pct: 0.12, crit_rate: 0.08 },
    desc:    '+12% SPD, +8% taux crit (équipe)',
    color:   '#ffff00',
    icon:    '雷',
  },
];

/* ════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════ */

/**
 * Vérifie si une condition de synergie est satisfaite par l'équipe.
 * @param {Object} cond
 * @param {Array}  team - objets avec .class et .element
 */
function _matchCondition(cond, team) {
  switch (cond.type) {
    case 'class':
      return team.filter(c => c.class === cond.value).length >= (cond.count ?? 2);
    case 'element':
      return team.filter(c => c.element === cond.value).length >= (cond.count ?? 2);
    case 'classes':
      // Chaque classe listée doit être présente au moins 1 fois
      return cond.values.every(cls => team.some(c => c.class === cls));
    default:
      return false;
  }
}

/**
 * Retourne les synergies actives pour une équipe donnée.
 * @param {Array} team - objets avec .class et .element (chars ou units)
 * @returns {Array<Object>} synergies actives
 */
export function getActiveSynergies(team) {
  if (!team?.length) return [];
  return SYNERGIES.filter(s => _matchCondition(s.condition, team));
}

/**
 * Fusionne les effets de toutes les synergies actives en un seul objet.
 * Les effets identiques s'additionnent.
 * @param {Array} activeSynergies
 * @returns {Object} effets fusionnés
 */
export function mergeSynergyEffects(activeSynergies) {
  const merged = {};
  for (const syn of activeSynergies) {
    for (const [key, val] of Object.entries(syn.effect)) {
      merged[key] = (merged[key] ?? 0) + val;
    }
  }
  return merged;
}

/**
 * Formate un effet de synergie en texte lisible.
 * Ex : { crit_rate: 0.15, atk_pct: 0.10 } → "+15% crit · +10% ATK"
 */
export function formatSynergyEffect(effect) {
  const parts = [];
  if (effect.all_pct)   parts.push(`+${Math.round(effect.all_pct  * 100)}% toutes stats`);
  if (effect.atk_pct)   parts.push(`+${Math.round(effect.atk_pct  * 100)}% ATK`);
  if (effect.hp_pct)    parts.push(`+${Math.round(effect.hp_pct   * 100)}% PV`);
  if (effect.def_pct)   parts.push(`+${Math.round(effect.def_pct  * 100)}% DEF`);
  if (effect.spd_pct)   parts.push(`+${Math.round(effect.spd_pct  * 100)}% SPD`);
  if (effect.crit_rate) parts.push(`+${Math.round(effect.crit_rate * 100)}% taux crit`);
  if (effect.crit_dmg)  parts.push(`+${Math.round(effect.crit_dmg  * 100)}% bonus crit`);
  return parts.join(' · ') || '—';
}
