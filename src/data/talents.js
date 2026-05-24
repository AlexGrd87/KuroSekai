/**
 * talents.js — Arbres de talents des personnages de KuroSekai.
 * Chaque perso a 6 nœuds : 2 rangées × 3 niveaux (col 0 et col 1).
 * Branche A : nœud 0 → 2 → 4   |   Branche B : nœud 1 → 3 → 5
 *
 * Effets supportés (identiques aux constellations) :
 *   atk_pct, hp_pct, def_pct, spd_pct,
 *   crit_rate, crit_dmg, all_pct, cd0, cd1
 */

/** Coût en ◈ selon la rangée du nœud */
export const TALENT_COST_BY_ROW = { 0: 300, 1: 800, 2: 2000 };

/**
 * Retourne l'arbre de talents pour un personnage.
 * Si aucun arbre spécifique n'existe, génère un arbre par classe.
 */
export function getTalentTree(char) {
  return TALENT_TREES[char.id] ?? _defaultTree(char);
}

/** Résumé textuel des effets d'un nœud. */
export function formatTalentEffect(effect) {
  const parts = [];
  if (effect.atk_pct)   parts.push(`ATK +${Math.round(effect.atk_pct   * 100)}%`);
  if (effect.hp_pct)    parts.push(`PV +${Math.round(effect.hp_pct    * 100)}%`);
  if (effect.def_pct)   parts.push(`DEF +${Math.round(effect.def_pct   * 100)}%`);
  if (effect.spd_pct)   parts.push(`VIT +${Math.round(effect.spd_pct   * 100)}%`);
  if (effect.crit_rate) parts.push(`Crit +${Math.round(effect.crit_rate * 100)}%`);
  if (effect.crit_dmg)  parts.push(`Crit DMG +${Math.round(effect.crit_dmg * 100)}%`);
  if (effect.all_pct)   parts.push(`Tous +${Math.round(effect.all_pct  * 100)}%`);
  if (effect.cd0)       parts.push(`Skill 1 CD ${effect.cd0}`);
  if (effect.cd1)       parts.push(`Skill 2 CD ${effect.cd1}`);
  return parts.join(' · ');
}

/* ══════════════════════════════════════════════════════
   ARBRES INDIVIDUELS — 5★ LÉGENDAIRES
══════════════════════════════════════════════════════ */

const TALENT_TREES = {

  /* ── KIRA — Shinigami / Void ── */
  kira: { nodes: [
    { id: 0, row: 0, col: 0, icon: '⚔', label: 'Tranchant',          effect: { atk_pct: 0.06 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '💀', label: 'Acuité',             effect: { crit_rate: 0.05 },                  requires: [] },
    { id: 2, row: 1, col: 0, icon: '🌀', label: 'Vide Acéré',         effect: { atk_pct: 0.10 },                    requires: [0] },
    { id: 3, row: 1, col: 1, icon: '👁', label: 'Précision Mortelle', effect: { crit_dmg: 0.15 },                   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '✦', label: 'Fente Ultime',        effect: { atk_pct: 0.12, cd0: -1 },           requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🔮', label: 'Exécution Absolue',  effect: { crit_rate: 0.08, crit_dmg: 0.20 },  requires: [3] },
  ]},

  /* ── SERAPH — Gardien / Light ── */
  seraph: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🛡', label: 'Résistance',         effect: { hp_pct: 0.08 },                     requires: [] },
    { id: 1, row: 0, col: 1, icon: '✦', label: 'Grâce',               effect: { def_pct: 0.06 },                    requires: [] },
    { id: 2, row: 1, col: 0, icon: '💚', label: 'Soins Renforcés',    effect: { hp_pct: 0.12, cd0: -1 },            requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🌟', label: 'Bénédiction',        effect: { def_pct: 0.10 },                    requires: [1] },
    { id: 4, row: 2, col: 0, icon: '⚕', label: 'Sanctuaire Éternel', effect: { hp_pct: 0.10, cd1: -1 },            requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🕊', label: 'Armure Céleste',     effect: { def_pct: 0.12, all_pct: 0.05 },    requires: [3] },
  ]},

  /* ── ZHEN — Shinigami / Water ── */
  zhen: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🌊', label: 'Marée Bleue',        effect: { atk_pct: 0.06 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '💧', label: 'Voile Froid',        effect: { hp_pct: 0.08 },                     requires: [] },
    { id: 2, row: 1, col: 0, icon: '🔱', label: 'Purification',       effect: { atk_pct: 0.10, cd1: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🧊', label: 'Résilience',         effect: { hp_pct: 0.15 },                     requires: [1] },
    { id: 4, row: 2, col: 0, icon: '⭐', label: 'Tueuse de Démons',   effect: { atk_pct: 0.15 },                    requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🌀', label: 'Corps Voilé',        effect: { hp_pct: 0.10, def_pct: 0.08 },     requires: [3] },
  ]},

  /* ── KAGE — Assassin / Dark ── */
  kage: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🌑', label: 'Ombre Rapide',       effect: { spd_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '💀', label: 'Lame Mortelle',      effect: { crit_rate: 0.06 },                  requires: [] },
    { id: 2, row: 1, col: 0, icon: '👤', label: 'Dissimulation',      effect: { spd_pct: 0.08, cd1: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '⚡', label: 'Instinct de Tuer',   effect: { crit_dmg: 0.18 },                   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🌑', label: 'Exécution Silencieuse', effect: { spd_pct: 0.06, cd0: -1 },        requires: [2] },
    { id: 5, row: 2, col: 1, icon: '✦', label: 'L\'Ombre Éternelle', effect: { crit_rate: 0.08, crit_dmg: 0.20 }, requires: [3] },
  ]},

  /* ── ARAI — Tank / Fire ── */
  arai: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🔥', label: 'Cœur de Métal',      effect: { hp_pct: 0.10 },                     requires: [] },
    { id: 1, row: 0, col: 1, icon: '🛡', label: 'Armure Démonique',   effect: { def_pct: 0.08 },                    requires: [] },
    { id: 2, row: 1, col: 0, icon: '⚒', label: 'Forgeron de Guerre', effect: { hp_pct: 0.15 },                     requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🔩', label: 'Blindage Absolu',    effect: { def_pct: 0.12 },                    requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🌋', label: 'Titan des Flammes',  effect: { hp_pct: 0.10, cd0: -1 },            requires: [2] },
    { id: 5, row: 2, col: 1, icon: '⚙', label: 'Métal Vivant',       effect: { def_pct: 0.10, hp_pct: 0.08 },     requires: [3] },
  ]},

  /* ══ 4★ ÉPIQUES ══ */

  /* ── RYUU — Guerrier / Fire ── */
  ryuu: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🔥', label: 'Rage Ardente',       effect: { atk_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '💪', label: 'Bras d\'Acier',      effect: { hp_pct: 0.07 },                     requires: [] },
    { id: 2, row: 1, col: 0, icon: '⚡', label: 'Canon Surchargé',    effect: { atk_pct: 0.08, crit_rate: 0.04 },  requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🛡', label: 'Furie Blindée',      effect: { hp_pct: 0.10, def_pct: 0.05 },     requires: [1] },
    { id: 4, row: 2, col: 0, icon: '💥', label: 'Explosion Finale',   effect: { atk_pct: 0.12, cd1: -1 },           requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🔩', label: 'Acier Vivant',       effect: { hp_pct: 0.12, def_pct: 0.08 },     requires: [3] },
  ]},

  /* ── NYX — Assassin / Dark ── */
  nyx: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🌑', label: 'Fantôme',            effect: { spd_pct: 0.06 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '👤', label: 'Cyberpirate',        effect: { crit_rate: 0.05 },                  requires: [] },
    { id: 2, row: 1, col: 0, icon: '💻', label: 'Matrix Noire',       effect: { spd_pct: 0.08, cd0: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '⚡', label: 'Exécution Ghost',    effect: { crit_dmg: 0.15 },                   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🌐', label: 'Intégration Totale', effect: { spd_pct: 0.06, atk_pct: 0.08 },    requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🔮', label: 'Zero-Day Éternel',   effect: { crit_rate: 0.06, crit_dmg: 0.18 }, requires: [3] },
  ]},

  /* ── AKANE — Soutien / Water ── */
  akane: { nodes: [
    { id: 0, row: 0, col: 0, icon: '⚕', label: 'Nanobots',           effect: { hp_pct: 0.08 },                     requires: [] },
    { id: 1, row: 0, col: 1, icon: '💊', label: 'Protocole Médical', effect: { def_pct: 0.06 },                    requires: [] },
    { id: 2, row: 1, col: 0, icon: '🔬', label: 'Régén. Avancée',    effect: { hp_pct: 0.12, cd0: -1 },            requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🛡', label: 'Armure Chimique',   effect: { def_pct: 0.10 },                    requires: [1] },
    { id: 4, row: 2, col: 0, icon: '💉', label: 'Médecin de Guerre', effect: { hp_pct: 0.10, cd1: -1 },            requires: [2] },
    { id: 5, row: 2, col: 1, icon: '✦', label: 'Soins d\'Urgence',   effect: { def_pct: 0.08, hp_pct: 0.08 },     requires: [3] },
  ]},

  /* ── SORA — Tireur / Wind ── */
  sora: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🌪', label: 'Aile Libre',         effect: { spd_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '🎯', label: 'Drone Jumeau',       effect: { crit_rate: 0.05 },                  requires: [] },
    { id: 2, row: 1, col: 0, icon: '🌬', label: 'Frappe Éolienne',    effect: { spd_pct: 0.08, atk_pct: 0.05 },   requires: [0] },
    { id: 3, row: 1, col: 1, icon: '⚡', label: 'Cible Verrouillée', effect: { crit_dmg: 0.15 },                   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🦅', label: 'Vol en Piqué',       effect: { spd_pct: 0.06, cd0: -1 },           requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🎯', label: 'Rafale de Précision',effect: { crit_rate: 0.06, atk_pct: 0.08 },  requires: [3] },
  ]},

  /* ── BAEL — Guerrier / Thunder ── */
  bael: { nodes: [
    { id: 0, row: 0, col: 0, icon: '⚡', label: 'Surcharge',           effect: { atk_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '🔌', label: 'Implants Hackés',    effect: { hp_pct: 0.08 },                     requires: [] },
    { id: 2, row: 1, col: 0, icon: '⚡', label: 'Arc Électrique',      effect: { atk_pct: 0.08, crit_rate: 0.04 },  requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🛡', label: 'Cage de Foudre',     effect: { hp_pct: 0.12, def_pct: 0.05 },     requires: [1] },
    { id: 4, row: 2, col: 0, icon: '💥', label: 'Tempête Intérieure', effect: { atk_pct: 0.10, cd1: -1 },           requires: [2] },
    { id: 5, row: 2, col: 1, icon: '⚡', label: 'Foudre Permanente',  effect: { crit_dmg: 0.12, atk_pct: 0.08 },   requires: [3] },
  ]},

  /* ── LOTUS — Soutien / Light ── */
  lotus: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🌸', label: 'Bioluminescence',    effect: { hp_pct: 0.08 },                     requires: [] },
    { id: 1, row: 0, col: 1, icon: '✦', label: 'Lumière Pure',        effect: { def_pct: 0.06 },                    requires: [] },
    { id: 2, row: 1, col: 0, icon: '💚', label: 'Guérison Totale',    effect: { hp_pct: 0.12, cd0: -1 },            requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🌟', label: 'Bouclier de Lumière',effect: { def_pct: 0.10 },                    requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🌸', label: 'Pureté Éternelle',   effect: { hp_pct: 0.08, cd1: -1 },            requires: [2] },
    { id: 5, row: 2, col: 1, icon: '☀', label: 'Flamme Sacrée',       effect: { all_pct: 0.06 },                    requires: [3] },
  ]},

  /* ── DUSK — Assassin / Void ── */
  dusk: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🌀', label: 'Dématérialisation',  effect: { spd_pct: 0.06 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '✦', label: 'Lame Spectrale',      effect: { crit_rate: 0.05 },                  requires: [] },
    { id: 2, row: 1, col: 0, icon: '👻', label: 'Phase Quantique',    effect: { spd_pct: 0.08, cd0: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '💀', label: 'Instinct Spectral',  effect: { crit_dmg: 0.16 },                   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🌑', label: 'Vide Permanent',     effect: { spd_pct: 0.06, atk_pct: 0.08 },    requires: [2] },
    { id: 5, row: 2, col: 1, icon: '⚡', label: 'Exéc. Holographique',effect: { crit_rate: 0.06, crit_dmg: 0.18 }, requires: [3] },
  ]},

  /* ── KATO — Tank / Earth ── */
  kato: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🪨', label: 'Exo-Blindage',       effect: { def_pct: 0.07 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '💪', label: 'Corps de Titan',     effect: { hp_pct: 0.10 },                     requires: [] },
    { id: 2, row: 1, col: 0, icon: '⚙', label: 'Fortification',       effect: { def_pct: 0.12 },                    requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🛡', label: 'Résistance Absolue', effect: { hp_pct: 0.15 },                     requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🔩', label: 'Bastion de Guerre',  effect: { def_pct: 0.10, cd0: -1 },           requires: [2] },
    { id: 5, row: 2, col: 1, icon: '⚒', label: 'Titan Invincible',   effect: { hp_pct: 0.10, def_pct: 0.08 },     requires: [3] },
  ]},

  /* ══ 3★ RARES ══ */

  /* ── TAKA — Tireur / Wind ── */
  taka: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🎯', label: 'Viseur Thermique',   effect: { crit_rate: 0.05 },                  requires: [] },
    { id: 1, row: 0, col: 1, icon: '🌪', label: 'Réflexes',           effect: { spd_pct: 0.05 },                    requires: [] },
    { id: 2, row: 1, col: 0, icon: '💀', label: 'Tir de Précision',   effect: { crit_dmg: 0.12 },                   requires: [0] },
    { id: 3, row: 1, col: 1, icon: '⚡', label: 'Agilité Tactique',   effect: { spd_pct: 0.07 },                    requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🎯', label: 'Sniper Parfait',     effect: { crit_rate: 0.06, atk_pct: 0.08 },  requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🏃', label: 'Fantôme Mobile',    effect: { spd_pct: 0.06, crit_dmg: 0.10 },   requires: [3] },
  ]},

  /* ── GOLEM — Tank / Earth ── */
  golem: { nodes: [
    { id: 0, row: 0, col: 0, icon: '⚙', label: 'Blindage Renforcé',  effect: { def_pct: 0.07 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '🔋', label: 'Batterie Auxiliaire',effect: { hp_pct: 0.10 },                     requires: [] },
    { id: 2, row: 1, col: 0, icon: '🤖', label: 'Protocole Défense',  effect: { def_pct: 0.10 },                    requires: [0] },
    { id: 3, row: 1, col: 1, icon: '💪', label: 'Châssis Renforcé',   effect: { hp_pct: 0.12 },                     requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🏗', label: 'Forteresse Mobile',  effect: { def_pct: 0.08, cd0: -1 },           requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🔧', label: 'Réparation Auto',    effect: { hp_pct: 0.10, def_pct: 0.05 },     requires: [3] },
  ]},

  /* ── SUKI — Mage / Thunder ── */
  suki: { nodes: [
    { id: 0, row: 0, col: 0, icon: '⚡', label: 'Implants Nerveux',   effect: { atk_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '🔮', label: 'Amplitude',          effect: { crit_rate: 0.05 },                  requires: [] },
    { id: 2, row: 1, col: 0, icon: '⚡', label: 'Surcharge Nerveuse', effect: { atk_pct: 0.08, cd0: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '💥', label: 'Éclat Critique',     effect: { crit_dmg: 0.14 },                   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🌩', label: 'Foudre Perpétuelle', effect: { atk_pct: 0.10, crit_rate: 0.04 },  requires: [2] },
    { id: 5, row: 2, col: 1, icon: '⚡', label: 'Tempête Électrique', effect: { crit_dmg: 0.16, atk_pct: 0.06 },   requires: [3] },
  ]},

  /* ── JIN — Guerrier / Fire ── */
  jin: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🔥', label: 'Rage Juvénile',      effect: { atk_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '❤', label: 'Instinct de Survie', effect: { hp_pct: 0.08 },                     requires: [] },
    { id: 2, row: 1, col: 0, icon: '💪', label: 'Furie Ardente',      effect: { atk_pct: 0.08, cd0: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🔰', label: 'Résilience Recrue', effect: { hp_pct: 0.12 },                     requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🔥', label: 'Flamme du Destin',   effect: { atk_pct: 0.10, crit_rate: 0.04 },  requires: [2] },
    { id: 5, row: 2, col: 1, icon: '⚔', label: 'Jeune Héros',         effect: { hp_pct: 0.10, atk_pct: 0.06 },    requires: [3] },
  ]},

  /* ── MIRA — Assassin / Dark ── */
  mira: { nodes: [
    { id: 0, row: 0, col: 0, icon: '👤', label: 'Déguisement',        effect: { spd_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '🗡', label: 'Lame Cachée',        effect: { crit_rate: 0.05 },                  requires: [] },
    { id: 2, row: 1, col: 0, icon: '🕵', label: 'Espion Double',      effect: { spd_pct: 0.07, cd0: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '💀', label: 'Coup Fatal',         effect: { crit_dmg: 0.14 },                   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🌑', label: 'Maîtrise du Mensonge',effect: { spd_pct: 0.06, atk_pct: 0.08 },  requires: [2] },
    { id: 5, row: 2, col: 1, icon: '✦', label: 'Survivante Née',      effect: { crit_rate: 0.05, crit_dmg: 0.16 }, requires: [3] },
  ]},

  /* ── HANA — Mage / Fire ── */
  hana: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🔥', label: 'Tatouages Enflammés',effect: { atk_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '🌸', label: 'Pétale de Feu',      effect: { crit_rate: 0.04 },                  requires: [] },
    { id: 2, row: 1, col: 0, icon: '🌺', label: 'Pluie Ardente',      effect: { atk_pct: 0.08, cd1: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '💥', label: 'Explosion Critique', effect: { crit_dmg: 0.12 },                   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🔥', label: 'Incandescence',      effect: { atk_pct: 0.10, crit_rate: 0.04 },  requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🌋', label: 'Pyromancienne Absolue',effect: { crit_dmg: 0.15, atk_pct: 0.06 }, requires: [3] },
  ]},

  /* ── RIKU — Guerrier / Earth ── */
  riku: { nodes: [
    { id: 0, row: 0, col: 0, icon: '⛏', label: 'Pillage',             effect: { hp_pct: 0.07 },                     requires: [] },
    { id: 1, row: 0, col: 1, icon: '💪', label: 'Endurance',           effect: { def_pct: 0.06 },                    requires: [] },
    { id: 2, row: 1, col: 0, icon: '🏗', label: 'Récup. Tactique',    effect: { hp_pct: 0.10, atk_pct: 0.05 },    requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🪨', label: 'Blindage de Fortune',effect: { def_pct: 0.10 },                    requires: [1] },
    { id: 4, row: 2, col: 0, icon: '⚒', label: 'Frappe Ravageuse',    effect: { atk_pct: 0.08, cd0: -1 },           requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🛡', label: 'Survivant des Ruines',effect: { hp_pct: 0.08, def_pct: 0.08 },    requires: [3] },
  ]},

  /* ── NAGI — Soutien / Water ── */
  nagi: { nodes: [
    { id: 0, row: 0, col: 0, icon: '💧', label: 'Onde Douce',          effect: { hp_pct: 0.08 },                     requires: [] },
    { id: 1, row: 0, col: 1, icon: '🌊', label: 'Flux Calme',          effect: { def_pct: 0.05 },                    requires: [] },
    { id: 2, row: 1, col: 0, icon: '⚕', label: 'Soins Silencieux',    effect: { hp_pct: 0.12, cd0: -1 },            requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🧊', label: 'Froideur Tactique',  effect: { def_pct: 0.08 },                    requires: [1] },
    { id: 4, row: 2, col: 0, icon: '💙', label: 'Vague Curative',      effect: { hp_pct: 0.10, cd1: -1 },            requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🌊', label: 'Marée Éternelle',    effect: { hp_pct: 0.08, def_pct: 0.06 },     requires: [3] },
  ]},

  /* ── VOLT — Tireur / Thunder ── */
  volt: { nodes: [
    { id: 0, row: 0, col: 0, icon: '⚡', label: 'Balles Chargées',    effect: { atk_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '🔧', label: 'Bricoleur Génial',   effect: { crit_rate: 0.04 },                  requires: [] },
    { id: 2, row: 1, col: 0, icon: '⚡', label: 'Surcharge Balistique',effect: { atk_pct: 0.08, crit_rate: 0.04 }, requires: [0] },
    { id: 3, row: 1, col: 1, icon: '💥', label: 'Tir Double Tension', effect: { crit_dmg: 0.14 },                   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '⚡', label: 'Chaîne Électrique',  effect: { atk_pct: 0.10, cd0: -1 },           requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🔌', label: 'Expert en Armement', effect: { crit_rate: 0.05, crit_dmg: 0.14 }, requires: [3] },
  ]},

  /* ── EMBER — Assassin / Fire ── */
  ember: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🔥', label: 'Sang Brûlant',       effect: { atk_pct: 0.05 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '⚡', label: 'Réflexes Thermiques',effect: { spd_pct: 0.05 },                    requires: [] },
    { id: 2, row: 1, col: 0, icon: '🔥', label: 'Embrasement',        effect: { atk_pct: 0.08, cd0: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '🏃', label: 'Chaleur Vitale',     effect: { spd_pct: 0.07 },                    requires: [1] },
    { id: 4, row: 2, col: 0, icon: '💥', label: 'Explosion Critique', effect: { atk_pct: 0.08, crit_rate: 0.05 },  requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🌡', label: 'Fièvre Permanente',  effect: { spd_pct: 0.06, atk_pct: 0.06 },   requires: [3] },
  ]},

  /* ── KEEL — Tank / Wind ── */
  keel: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🌪', label: 'Déflexion',          effect: { def_pct: 0.07 },                    requires: [] },
    { id: 1, row: 0, col: 1, icon: '🛡', label: 'Résistance au Vent', effect: { hp_pct: 0.08 },                     requires: [] },
    { id: 2, row: 1, col: 0, icon: '🌬', label: 'Bouclier Éolien',    effect: { def_pct: 0.10, cd0: -1 },           requires: [0] },
    { id: 3, row: 1, col: 1, icon: '💪', label: 'Forteresse Mobile',  effect: { hp_pct: 0.12 },                     requires: [1] },
    { id: 4, row: 2, col: 0, icon: '🌪', label: 'Gardien Éternel',    effect: { def_pct: 0.08, hp_pct: 0.06 },     requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🌀', label: 'Tempête Défensive',  effect: { hp_pct: 0.10, def_pct: 0.06 },    requires: [3] },
  ]},

  /* ── ECHO — Mage / Dark ── */
  echo: { nodes: [
    { id: 0, row: 0, col: 0, icon: '🪞', label: 'Reflet',             effect: { crit_rate: 0.04 },                  requires: [] },
    { id: 1, row: 0, col: 1, icon: '👁', label: 'Mémoire Fragmentée', effect: { atk_pct: 0.05 },                    requires: [] },
    { id: 2, row: 1, col: 0, icon: '🌑', label: 'Écho Parfait',       effect: { crit_dmg: 0.12 },                   requires: [0] },
    { id: 3, row: 1, col: 1, icon: '💀', label: 'Miroir Obscur',      effect: { atk_pct: 0.08, cd0: -1 },           requires: [1] },
    { id: 4, row: 2, col: 0, icon: '✦', label: 'Identité Multiple',   effect: { crit_rate: 0.05, crit_dmg: 0.12 }, requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🔮', label: 'Néant Vivant',       effect: { atk_pct: 0.08, crit_dmg: 0.15 },  requires: [3] },
  ]},
};

/* ══════════════════════════════════════════════════════
   ARBRE PAR DÉFAUT (fallback selon la classe)
══════════════════════════════════════════════════════ */

function _defaultTree(char) {
  const cls = char.class?.toLowerCase() ?? '';
  if (['assassin'].includes(cls)) {
    return { nodes: [
      { id: 0, row: 0, col: 0, icon: '⚡', label: 'Agilité',         effect: { spd_pct: 0.05 },    requires: [] },
      { id: 1, row: 0, col: 1, icon: '💀', label: 'Instinct',        effect: { crit_rate: 0.05 },  requires: [] },
      { id: 2, row: 1, col: 0, icon: '🌑', label: 'Ombre',            effect: { spd_pct: 0.08 },    requires: [0] },
      { id: 3, row: 1, col: 1, icon: '⚔', label: 'Lame Acérée',      effect: { crit_dmg: 0.14 },   requires: [1] },
      { id: 4, row: 2, col: 0, icon: '✦', label: 'Exécution',        effect: { spd_pct: 0.06, atk_pct: 0.08 }, requires: [2] },
      { id: 5, row: 2, col: 1, icon: '💥', label: 'Coup Mortel',     effect: { crit_rate: 0.05, crit_dmg: 0.15 }, requires: [3] },
    ]};
  }
  if (['tank'].includes(cls)) {
    return { nodes: [
      { id: 0, row: 0, col: 0, icon: '🛡', label: 'Cuirasse',        effect: { def_pct: 0.07 },    requires: [] },
      { id: 1, row: 0, col: 1, icon: '💪', label: 'Endurance',        effect: { hp_pct: 0.08 },     requires: [] },
      { id: 2, row: 1, col: 0, icon: '⚙', label: 'Blindage',          effect: { def_pct: 0.10 },    requires: [0] },
      { id: 3, row: 1, col: 1, icon: '🔩', label: 'Résistance',       effect: { hp_pct: 0.12 },     requires: [1] },
      { id: 4, row: 2, col: 0, icon: '🏰', label: 'Forteresse',       effect: { def_pct: 0.08, cd0: -1 }, requires: [2] },
      { id: 5, row: 2, col: 1, icon: '⚒', label: 'Titan',             effect: { hp_pct: 0.10, def_pct: 0.06 }, requires: [3] },
    ]};
  }
  if (['soutien', 'support'].includes(cls)) {
    return { nodes: [
      { id: 0, row: 0, col: 0, icon: '⚕', label: 'Soins',            effect: { hp_pct: 0.08 },     requires: [] },
      { id: 1, row: 0, col: 1, icon: '🛡', label: 'Protection',       effect: { def_pct: 0.06 },    requires: [] },
      { id: 2, row: 1, col: 0, icon: '💚', label: 'Régénération',     effect: { hp_pct: 0.12, cd0: -1 }, requires: [0] },
      { id: 3, row: 1, col: 1, icon: '✦', label: 'Bouclier',          effect: { def_pct: 0.10 },    requires: [1] },
      { id: 4, row: 2, col: 0, icon: '🌟', label: 'Aura Curative',    effect: { hp_pct: 0.10, cd1: -1 }, requires: [2] },
      { id: 5, row: 2, col: 1, icon: '☀', label: 'Lumière Totale',    effect: { all_pct: 0.06 },    requires: [3] },
    ]};
  }
  // Défaut universel (guerrier / mage / tireur)
  return { nodes: [
    { id: 0, row: 0, col: 0, icon: '⚔', label: 'Force',              effect: { atk_pct: 0.05 },    requires: [] },
    { id: 1, row: 0, col: 1, icon: '🔮', label: 'Précision',          effect: { crit_rate: 0.04 },  requires: [] },
    { id: 2, row: 1, col: 0, icon: '💪', label: 'Puissance',          effect: { atk_pct: 0.08 },    requires: [0] },
    { id: 3, row: 1, col: 1, icon: '⚡', label: 'Acuité',             effect: { crit_dmg: 0.12 },   requires: [1] },
    { id: 4, row: 2, col: 0, icon: '✦', label: 'Maîtrise',            effect: { atk_pct: 0.10, cd0: -1 }, requires: [2] },
    { id: 5, row: 2, col: 1, icon: '🔥', label: 'Apothéose',          effect: { atk_pct: 0.08, crit_rate: 0.05 }, requires: [3] },
  ]};
}
