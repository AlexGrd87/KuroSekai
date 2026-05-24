/**
 * achievements.js — Hauts faits de KuroSekai
 *
 * ctx passé aux conditions :
 *   combatsWon, totalSummons, uniqueCount, completedStages (Set),
 *   stageStars (obj), currency, totalEnergySpent, dailyStreak,
 *   totalChars, dungeonClears
 */

export const ACHIEVEMENTS = [

  /* ══ COMBAT ══ */
  {
    id: 'first_blood', cat: 'combat', icon: '⚔',
    name: 'Premier Sang',
    desc: 'Remporter un premier combat',
    reward: { currency: 200 },
    condition: ctx => ctx.combatsWon >= 1,
  },
  {
    id: 'warrior', cat: 'combat', icon: '🗡',
    name: 'Guerrier',
    desc: 'Remporter 10 combats',
    reward: { currency: 500 },
    condition: ctx => ctx.combatsWon >= 10,
  },
  {
    id: 'veteran', cat: 'combat', icon: '🏅',
    name: 'Vétéran',
    desc: 'Remporter 50 combats',
    reward: { currency: 1500 },
    condition: ctx => ctx.combatsWon >= 50,
  },
  {
    id: 'perfect_star', cat: 'combat', icon: '★',
    name: 'Perfection',
    desc: 'Obtenir 3★ sur un stage',
    reward: { currency: 300 },
    condition: ctx => Object.values(ctx.stageStars).some(s => s >= 3),
  },
  {
    id: 'perfect_10', cat: 'combat', icon: '✦',
    name: 'Sans Faille',
    desc: 'Obtenir 3★ sur 10 stages',
    reward: { currency: 2000, freeRolls: 1 },
    condition: ctx => Object.values(ctx.stageStars).filter(s => s >= 3).length >= 10,
    hidden: true,
  },
  {
    id: 'dungeon_clear', cat: 'combat', icon: '奈',
    name: 'Conquérant du Donjon',
    desc: 'Terminer le Donjon Abyssal une fois',
    reward: { currency: 1000 },
    condition: ctx => (ctx.dungeonClears ?? 0) >= 1,
  },

  /* ══ COLLECTION ══ */
  {
    id: 'first_summon', cat: 'collection', icon: '🔮',
    name: 'Portail Ouvert',
    desc: 'Effectuer une invocation',
    reward: { currency: 200 },
    condition: ctx => ctx.totalSummons >= 1,
  },
  {
    id: 'summon_10', cat: 'collection', icon: '✦',
    name: 'Portail Assidu',
    desc: 'Effectuer 10 invocations',
    reward: { currency: 400 },
    condition: ctx => ctx.totalSummons >= 10,
  },
  {
    id: 'collector_5', cat: 'collection', icon: '📚',
    name: 'Collectionneur',
    desc: 'Obtenir 5 personnages différents',
    reward: { currency: 600 },
    condition: ctx => ctx.uniqueCount >= 5,
  },
  {
    id: 'summon_50', cat: 'collection', icon: '🌀',
    name: 'Maître du Portail',
    desc: 'Effectuer 50 invocations',
    reward: { currency: 2000, freeRolls: 1 },
    condition: ctx => ctx.totalSummons >= 50,
    hidden: true,
  },
  {
    id: 'collector_all', cat: 'collection', icon: '💎',
    name: 'Légion Complète',
    desc: 'Débloquer tous les personnages du jeu',
    reward: { currency: 5000, freeRolls: 3 },
    condition: ctx => ctx.totalChars > 0 && ctx.uniqueCount >= ctx.totalChars,
    hidden: true,
  },

  /* ══ CAMPAGNE ══ */
  {
    id: 'first_stage', cat: 'campagne', icon: '🗺',
    name: 'Premier Pas',
    desc: 'Compléter le stage 1',
    reward: { currency: 150 },
    condition: ctx => ctx.completedStages.has('stage_01'),
  },
  {
    id: 'chapter1_clear', cat: 'campagne', icon: '🔵',
    name: 'Périphérie Purifiée',
    desc: 'Compléter les 3 stages du Chapitre 1',
    reward: { currency: 500 },
    condition: ctx => ['stage_01','stage_02','stage_03'].every(id => ctx.completedStages.has(id)),
  },
  {
    id: 'chapter3_clear', cat: 'campagne', icon: '🟣',
    name: 'Descente dans l\'Abîme',
    desc: 'Compléter le Chapitre 3',
    reward: { currency: 1000 },
    condition: ctx => ['stage_07','stage_08','stage_09'].every(id => ctx.completedStages.has(id)),
  },
  {
    id: 'chapter6_clear', cat: 'campagne', icon: '🌌',
    name: 'Transcendant',
    desc: 'Compléter le Chapitre 6 en entier',
    reward: { currency: 3000, freeRolls: 2 },
    condition: ctx => ['stage_16','stage_17','stage_18'].every(id => ctx.completedStages.has(id)),
    hidden: true,
  },
  {
    id: 'all_stages', cat: 'campagne', icon: '🏆',
    name: 'Conquérant',
    desc: 'Compléter la totalité des 18 stages',
    reward: { currency: 5000, freeRolls: 3 },
    condition: ctx => ctx.completedStages.size >= 18,
    hidden: true,
  },

  /* ══ DIVERS ══ */
  {
    id: 'daily_7', cat: 'divers', icon: '🔥',
    name: 'Connexion Fidèle',
    desc: 'Maintenir un streak de connexion de 7 jours',
    reward: { currency: 500 },
    condition: ctx => ctx.dailyStreak >= 7,
  },
  {
    id: 'energy_spent', cat: 'divers', icon: '⚡',
    name: 'Infatigable',
    desc: 'Dépenser 50 ⚡ d\'énergie au total',
    reward: { currency: 300 },
    condition: ctx => (ctx.totalEnergySpent ?? 0) >= 50,
  },
  {
    id: 'rich', cat: 'divers', icon: '◈',
    name: 'Commerçant',
    desc: 'Accumuler 10 000 ◈ en poche',
    reward: { freeRolls: 1 },
    condition: ctx => ctx.currency >= 10000,
  },
  {
    id: 'daily_30', cat: 'divers', icon: '💫',
    name: 'Dévotion Totale',
    desc: 'Maintenir un streak de 30 jours',
    reward: { currency: 3000, freeRolls: 2 },
    condition: ctx => ctx.dailyStreak >= 30,
    hidden: true,
  },
  {
    id: 'energy_200', cat: 'divers', icon: '⚡⚡',
    name: 'Épuisement Total',
    desc: 'Dépenser 200 ⚡ au total',
    reward: { currency: 1000 },
    condition: ctx => (ctx.totalEnergySpent ?? 0) >= 200,
    hidden: true,
  },
];

export const ACH_CATS = [
  { id: 'all',        label: 'TOUS',       icon: '✦' },
  { id: 'combat',     label: 'COMBAT',     icon: '⚔' },
  { id: 'collection', label: 'COLLECTION', icon: '🔮' },
  { id: 'campagne',   label: 'CAMPAGNE',   icon: '🗺' },
  { id: 'divers',     label: 'DIVERS',     icon: '⚙' },
];
