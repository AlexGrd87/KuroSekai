/**
 * quests.js — Définitions des quêtes journalières et hebdomadaires de KuroSekai.
 */

export const DAILY_QUESTS = [
  {
    id: 'daily_combat_3',
    type: 'COMBAT_WIN',
    icon: '⚔',
    name: 'Guerrier Quotidien',
    desc: 'Remporter 3 combats',
    target: 3,
    rewards: { currency: 500 },
  },
  {
    id: 'daily_summon_1',
    type: 'SUMMON',
    icon: '✦',
    name: 'Invocation du Jour',
    desc: 'Effectuer 1 invocation',
    target: 1,
    rewards: { currency: 200, freeRolls: 1 },
  },
  {
    id: 'daily_stage_1',
    type: 'STAGE_COMPLETE',
    icon: '🗾',
    name: 'Opération Terrain',
    desc: 'Compléter 1 stage',
    target: 1,
    rewards: { currency: 300 },
  },
];

export const WEEKLY_QUESTS = [
  {
    id: 'weekly_combat_10',
    type: 'COMBAT_WIN',
    icon: '⚔',
    name: 'Campagne Hebdomadaire',
    desc: 'Remporter 10 combats',
    target: 10,
    rewards: { currency: 2000 },
  },
  {
    id: 'weekly_summon_5',
    type: 'SUMMON',
    icon: '✦',
    name: 'Convocation de la Semaine',
    desc: 'Effectuer 5 invocations',
    target: 5,
    rewards: { currency: 800, freeRolls: 3 },
  },
  {
    id: 'weekly_stage_3',
    type: 'STAGE_COMPLETE',
    icon: '🗾',
    name: 'Explorateur Acharné',
    desc: 'Compléter 3 stages',
    target: 3,
    rewards: { currency: 1500 },
  },
];

/** Timestamp de minuit pour aujourd'hui */
export function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Timestamp du lundi 00:00 de la semaine courante */
export function weekStart() {
  const d = new Date();
  const day  = d.getDay();               // 0 = dim, 1 = lun …
  const diff = day === 0 ? -6 : 1 - day; // recule au lundi
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Formate un temps restant (ms) en "Xh Ym" ou "Xj Xh" */
export function formatTimeLeft(ms) {
  if (ms <= 0) return '0h';
  const totalSec = Math.floor(ms / 1000);
  const days  = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins  = Math.floor((totalSec % 3600)  / 60);
  if (days > 0)  return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
