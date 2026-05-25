/**
 * accountLevel.js — Progression de compte de KuroSekai.
 * Niveau 1–50, XP gagnée sur chaque action clé du jeu.
 */

/** XP requise pour passer du niveau N au niveau N+1. */
export function xpForLevel(level) {
  // Courbe douce : ~100 XP au niveau 1, ~2000 XP au niveau 49
  return Math.floor(100 + (level - 1) * 38 + Math.pow(level - 1, 1.6) * 3);
}

/** XP totale cumulée pour atteindre un niveau donné. */
export function totalXpForLevel(level) {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total;
}

export const ACCOUNT_MAX_LEVEL = 50;

/** XP accordée selon l'action. */
export const ACCOUNT_XP_REWARDS = {
  COMBAT_WIN:     20,
  COMBAT_LOSS:     8,
  STAGE_COMPLETE: 35,
  SUMMON:         10,
  QUEST_CLAIM:    15,
  DAILY_LOGIN:    25,
  DUNGEON_CLEAR: 120,
  BOSS_FIGHT:     30,
};

/**
 * Récompenses de palier (données à la montée de niveau).
 * Les niveaux non listés donnent uniquement un toast.
 */
export const LEVEL_MILESTONES = {
   2: { currency: 500 },
   3: { currency: 500 },
   4: { currency: 1000 },
   5: { currency: 1000, freeRolls: 1, label: 'Rang ★ Débloqué' },
  10: { currency: 2000, freeRolls: 2, label: 'Rang ★★ Débloqué' },
  15: { currency: 2000, freeRolls: 1 },
  20: { currency: 3000, freeRolls: 3, label: 'Rang ★★★ Débloqué' },
  25: { currency: 3000, freeRolls: 2 },
  30: { currency: 5000, freeRolls: 3, label: 'Rang ★★★★ Débloqué' },
  35: { currency: 5000, freeRolls: 2 },
  40: { currency: 8000, freeRolls: 4, label: 'Rang ★★★★★ Débloqué' },
  45: { currency: 8000, freeRolls: 3 },
  50: { currency: 15000, freeRolls: 5, label: '☆ COMMANDANT LÉGENDAIRE ☆' },
};

/** Calcule niveau + progression depuis le XP total brut. */
export function getAccountLevel(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (level < ACCOUNT_MAX_LEVEL) {
    const needed = xpForLevel(level);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
  }
  const needed = level < ACCOUNT_MAX_LEVEL ? xpForLevel(level) : xpForLevel(ACCOUNT_MAX_LEVEL);
  return {
    level,
    currentXp: level < ACCOUNT_MAX_LEVEL ? remaining : needed,
    neededXp:  needed,
    pct:       level < ACCOUNT_MAX_LEVEL ? Math.min(100, Math.round((remaining / needed) * 100)) : 100,
    isMaxed:   level >= ACCOUNT_MAX_LEVEL,
  };
}

/** Label de rang selon le niveau. */
export function getAccountRankLabel(level) {
  if (level >= 40) return 'COMMANDANT';
  if (level >= 30) return 'ÉLITE';
  if (level >= 20) return 'VÉTÉRAN';
  if (level >= 10) return 'AGENT';
  return 'RECRUE';
}
