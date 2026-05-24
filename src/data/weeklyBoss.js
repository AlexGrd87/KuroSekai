/**
 * weeklyBoss.js — Boss Hebdomadaire de KuroSekai.
 * Combat de raid contre NEXUS, boss ultime hebdomadaire.
 */

/* ════════════════════════════════
   DÉFINITION DU BOSS
════════════════════════════════ */

export const WEEKLY_BOSS = {
  id:          'nexus_destroyer',
  name:        'NEXUS',
  title:       'L\'Éradicateur Absolu',
  kanji:       '皇',
  lore:        'Un titan du Vide qui se reconstruit chaque semaine. Ses serviteurs le gardent avec une dévotion aveugle. Chaque combattant lui inflige des dommages permanents — mais seule une équipe d\'élite peut le terrasser.',
  element:     'Void',
  color:       '#8800ff',
  glow:        '#4400aa',
  phaseColors: ['#8800ff', '#ff4400', '#ff0066'],
};

/** Stage CombatUI pour le boss hebdo. */
export const WEEKLY_BOSS_STAGE = {
  id:          'weekly_boss',
  name:        'NEXUS',
  subtitle:    'Boss Hebdomadaire',
  lore:        WEEKLY_BOSS.lore,
  element:     'Void',
  color:       WEEKLY_BOSS.color,
  glow:        WEEKLY_BOSS.glow,
  difficulty:  5,
  unlockAfter: null,
  waves: [
    ['origin_guardian', 'void_herald',    'chrono_breaker'],    // Serviteurs Phase 1
    ['nexus_destroyer', 'null_fragment',  'void_herald'],       // NEXUS Phase 2
    ['nexus_destroyer', 'origin_guardian','null_sovereign'],    // NEXUS Phase finale
  ],
  rewards:     { exp: 0, currency: 0 },   // géré par WeeklyBossUI
  isBoss:      true,
  isWeeklyBoss: true,
};

/* ════════════════════════════════
   CALCUL DES DÉGÂTS
════════════════════════════════ */

export const BOSS_MAX_HP = 100_000;

/**
 * Calcule les dégâts infligés au boss en fonction du résultat de combat.
 * @param {'player'|'enemy'} winner
 * @param {number} teamHpPct  — pourcentage de PV restants de l'équipe (0–1)
 */
export function calcBossDamage(winner, teamHpPct = 0) {
  if (winner === 'player') {
    if (teamHpPct >= 0.6) return 50_000;
    if (teamHpPct >= 0.3) return 35_000;
    return 20_000;
  }
  // Défaite : dégâts partiels
  return Math.round(5_000 + teamHpPct * 10_000);
}

/* ════════════════════════════════
   PALIERS DE RÉCOMPENSES
════════════════════════════════ */

export const BOSS_REWARD_TIERS = [
  {
    id:       'participant',
    label:    'PARTICIPANT',
    kanji:    '参',
    minDmg:   1,
    color:    '#aaaaaa',
    rewards:  { currency: 500 },
    desc:     '500 ◈',
  },
  {
    id:       'challenger',
    label:    'CHALLENGER',
    kanji:    '挑',
    minDmg:   25_000,
    color:    '#44aaff',
    rewards:  { currency: 1_500, freeRolls: 1 },
    desc:     '1 500 ◈ · 1 tirage',
  },
  {
    id:       'conqueror',
    label:    'CONQUÉRANT',
    kanji:    '征',
    minDmg:   50_000,
    color:    '#ffcc00',
    rewards:  { currency: 3_000, freeRolls: 2, shard_basic: 5 },
    desc:     '3 000 ◈ · 2 tirages · 5× Fragment Basique',
  },
  {
    id:       'destroyer',
    label:    'DESTRUCTEUR',
    kanji:    '壊',
    minDmg:   75_000,
    color:    '#ff8800',
    rewards:  { currency: 5_000, freeRolls: 3, shard_elite: 2 },
    desc:     '5 000 ◈ · 3 tirages · 2× Fragment Élite',
  },
  {
    id:       'exterminator',
    label:    'EXTERMINATEUR',
    kanji:    '滅',
    minDmg:   100_000,
    color:    '#cc00ff',
    rewards:  { currency: 8_000, freeRolls: 5, shard_elite: 3, crystal_void: 1 },
    desc:     '8 000 ◈ · 5 tirages · 3× Fragment Élite · 1× Cristal du Vide',
  },
];

/** Retourne le palier de récompense pour un montant de dégâts donné. */
export function getBossRewardTier(totalDamage) {
  if (totalDamage <= 0) return null;
  let best = null;
  for (const t of BOSS_REWARD_TIERS) {
    if (totalDamage >= t.minDmg) best = t;
  }
  return best;
}

/* ════════════════════════════════
   UTILITAIRES D'ÉTAT HEBDOMADAIRE
════════════════════════════════ */

/** Minuit du lundi le plus récent (début de semaine ISO). */
export function weekStart() {
  const now  = new Date();
  const day  = now.getDay(); // 0=dim, 1=lun, ..., 6=sam
  const diff = (day === 0 ? -6 : 1 - day);
  const mon  = new Date(now);
  mon.setDate(now.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon.getTime();
}

/** Retourne le nombre d'attaques restantes, la HP bar %, et si la récompense est réclamable. */
export function getBossState(playerData) {
  const reset = weekStart();
  const needsReset = (playerData.weeklyBossLastReset ?? 0) < reset;

  if (needsReset) {
    // Auto-reset (pas de sauvegarde ici — sera fait au premier accès dans PlayerData)
    return {
      attemptsLeft:    3,
      totalDamage:     0,
      rewardClaimed:   false,
      hpBarPct:        0,
      tier:            null,
      needsReset:      true,
    };
  }

  const totalDamage   = playerData.weeklyBossDamage    ?? 0;
  const attemptsLeft  = playerData.weeklyBossAttempts  ?? 3;
  const rewardClaimed = playerData.weeklyBossRewardClaimed ?? false;
  const hpBarPct      = Math.min(100, Math.round((totalDamage / BOSS_MAX_HP) * 100));
  const tier          = getBossRewardTier(totalDamage);

  return { attemptsLeft, totalDamage, rewardClaimed, hpBarPct, tier, needsReset: false };
}
