/**
 * dailyRewards.js — Récompenses de connexion quotidienne (cycle 30 jours)
 *
 * Progression cohérente :
 *  - Petite monnaie les jours ordinaires (croissant semaine par semaine)
 *  - Tirages sur les jours 3, 10, 17, 23, 27
 *  - Boosts EXP aux jours 5, 12, 19, 25
 *  - Paliers hebdomadaires (7, 14, 21, 28) : grand coffre monnaie + tirage(s)
 *  - Jour 30 : récompense finale ★★
 */

export const CYCLE_LENGTH = 30;

export const DAILY_REWARDS = [
  /* ── SEMAINE 1 ── */
  { day:  1, label: 'Jour 1',  icon: '◈',  type: 'currency', amount:  500, desc: '+500 ◈' },
  { day:  2, label: 'Jour 2',  icon: '◈',  type: 'currency', amount:  600, desc: '+600 ◈' },
  { day:  3, label: 'Jour 3',  icon: '🔮', type: 'pulls',    amount:    1, desc: '×1 Tirage' },
  { day:  4, label: 'Jour 4',  icon: '◈',  type: 'currency', amount:  700, desc: '+700 ◈' },
  { day:  5, label: 'Jour 5',  icon: '⚡',  type: 'xpBoost',  amount:    3, desc: 'Boost EXP ×2 · 3 combats' },
  { day:  6, label: 'Jour 6',  icon: '◈',  type: 'currency', amount:  800, desc: '+800 ◈' },
  {
    day:  7, label: 'JOUR 7',  icon: '★',  type: 'grand',
    currency: 2000, pulls: 1,
    desc: '+2 000 ◈ + ×1 Tirage', special: true, milestone: 'S1',
  },

  /* ── SEMAINE 2 ── */
  { day:  8, label: 'Jour 8',  icon: '◈',  type: 'currency', amount:  700, desc: '+700 ◈' },
  { day:  9, label: 'Jour 9',  icon: '◈',  type: 'currency', amount:  800, desc: '+800 ◈' },
  { day: 10, label: 'Jour 10', icon: '🔮', type: 'pulls',    amount:    1, desc: '×1 Tirage' },
  { day: 11, label: 'Jour 11', icon: '◈',  type: 'currency', amount:  900, desc: '+900 ◈' },
  { day: 12, label: 'Jour 12', icon: '⚡',  type: 'xpBoost',  amount:    5, desc: 'Boost EXP ×2 · 5 combats' },
  { day: 13, label: 'Jour 13', icon: '◈',  type: 'currency', amount: 1000, desc: '+1 000 ◈' },
  {
    day: 14, label: 'JOUR 14', icon: '★',  type: 'grand',
    currency: 3000, pulls: 2,
    desc: '+3 000 ◈ + ×2 Tirages', special: true, milestone: 'S2',
  },

  /* ── SEMAINE 3 ── */
  { day: 15, label: 'Jour 15', icon: '◈',  type: 'currency', amount:  900, desc: '+900 ◈' },
  { day: 16, label: 'Jour 16', icon: '◈',  type: 'currency', amount: 1000, desc: '+1 000 ◈' },
  { day: 17, label: 'Jour 17', icon: '🔮', type: 'pulls',    amount:    1, desc: '×1 Tirage' },
  { day: 18, label: 'Jour 18', icon: '◈',  type: 'currency', amount: 1100, desc: '+1 100 ◈' },
  { day: 19, label: 'Jour 19', icon: '⚡',  type: 'xpBoost',  amount:    5, desc: 'Boost EXP ×2 · 5 combats' },
  { day: 20, label: 'Jour 20', icon: '◈',  type: 'currency', amount: 1200, desc: '+1 200 ◈' },
  {
    day: 21, label: 'JOUR 21', icon: '★',  type: 'grand',
    currency: 3000, pulls: 2,
    desc: '+3 000 ◈ + ×2 Tirages', special: true, milestone: 'S3',
  },

  /* ── SEMAINE 4 ── */
  { day: 22, label: 'Jour 22', icon: '◈',  type: 'currency', amount: 1000, desc: '+1 000 ◈' },
  { day: 23, label: 'Jour 23', icon: '🔮', type: 'pulls',    amount:    2, desc: '×2 Tirages' },
  { day: 24, label: 'Jour 24', icon: '◈',  type: 'currency', amount: 1200, desc: '+1 200 ◈' },
  { day: 25, label: 'Jour 25', icon: '⚡',  type: 'xpBoost',  amount:    8, desc: 'Boost EXP ×2 · 8 combats' },
  { day: 26, label: 'Jour 26', icon: '◈',  type: 'currency', amount: 1500, desc: '+1 500 ◈' },
  { day: 27, label: 'Jour 27', icon: '🔮', type: 'pulls',    amount:    1, desc: '×1 Tirage' },
  {
    day: 28, label: 'JOUR 28', icon: '★',  type: 'grand',
    currency: 4000, pulls: 2,
    desc: '+4 000 ◈ + ×2 Tirages', special: true, milestone: 'S4',
  },

  /* ── FIN DE CYCLE ── */
  { day: 29, label: 'Jour 29', icon: '◈',  type: 'currency', amount: 2000, desc: '+2 000 ◈' },
  {
    day: 30, label: 'JOUR 30', icon: '★★', type: 'grand',
    currency: 6000, pulls: 3,
    desc: '+6 000 ◈ + ×3 Tirages', special: true, grand: true, milestone: 'FIN',
  },
];

/** Retourne le numéro de jour courant dans le cycle 1-30 (basé sur le streak) */
export function getDayInCycle(streak) {
  return ((streak - 1) % CYCLE_LENGTH) + 1;
}
