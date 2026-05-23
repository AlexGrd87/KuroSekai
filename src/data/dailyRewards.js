/**
 * dailyRewards.js — Récompenses de connexion quotidienne (7 jours)
 */

export const DAILY_REWARDS = [
  {
    day: 1,
    label: 'Jour 1',
    icon: '◈',
    type: 'currency',
    amount: 500,
    desc: '+500 Monnaie',
  },
  {
    day: 2,
    label: 'Jour 2',
    icon: '🔮',
    type: 'pulls',
    amount: 1,
    desc: '×1 Tirage',
  },
  {
    day: 3,
    label: 'Jour 3',
    icon: '◈',
    type: 'currency',
    amount: 1000,
    desc: '+1 000 Monnaie',
  },
  {
    day: 4,
    label: 'Jour 4',
    icon: '⚡',
    type: 'xpBoost',
    amount: 3,
    desc: 'Boost EXP ×2 (3 combats)',
  },
  {
    day: 5,
    label: 'Jour 5',
    icon: '◈',
    type: 'currency',
    amount: 2000,
    desc: '+2 000 Monnaie',
  },
  {
    day: 6,
    label: 'Jour 6',
    icon: '🔮',
    type: 'pulls',
    amount: 2,
    desc: '×2 Tirages',
  },
  {
    day: 7,
    label: 'JOUR 7',
    icon: '★',
    type: 'grand',          // multi-récompenses
    currency: 3000,
    pulls: 1,
    desc: '+3 000◈ + ×1 Tirage',
    special: true,
  },
];

/** Retourne le numéro de jour courant dans le cycle 1-7 (basé sur le streak) */
export function getDayInCycle(streak) {
  return ((streak - 1) % 7) + 1;
}
