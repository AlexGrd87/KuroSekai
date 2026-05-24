/**
 * PlayerData.js
 * Gestion de la collection et de la progression du joueur via localStorage.
 */

import { CONSTELLATION_BONUSES }                         from './characters.js';
import { apiService }                                    from './ApiService.js';
import { DAILY_QUESTS, WEEKLY_QUESTS,
         todayMidnight, weekStart }                      from './quests.js';
import { DAILY_REWARDS, getDayInCycle }                  from './dailyRewards.js';
import { ACHIEVEMENTS }                                  from './achievements.js';
import { calcArtifactStats, generateArtifact,
         ARTIFACT_SLOTS, DISMANTLE_REWARDS }             from './artifacts.js';
import { getTalentTree }                                 from './talents.js';
import { ASCENSION_RANKS, ASCENSION_COSTS,
         getNextAscensionCost }                          from './ascension.js';

const STORAGE_KEY   = 'kuro_player_collection';
const PROGRESS_KEY  = 'kuro_player_progress';
const HISTORY_KEY   = 'kuro_pull_history';
const QUESTS_KEY    = 'kuro_quests';
const DAILY_KEY     = 'kuro_daily_login';
const HISTORY_MAX   = 100;

export const ENERGY_MAX     = 10;
export const ENERGY_REGEN_MS = 30 * 60 * 1000; // 30 minutes

export const MAX_LEVEL   = 50;
export const STAT_GROWTH = 0.04; // +4% par niveau sur HP, ATK, DEF

/** XP nécessaire pour passer du niveau `level` au suivant */
export function xpToNextLevel(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.floor(100 * Math.pow(level, 1.4));
}

/** Multiplicateur de stats au niveau donné */
export function statMultiplier(level) {
  return 1 + (level - 1) * STAT_GROWTH;
}

export class PlayerData {
  constructor() {
    this._load();
  }

  /* ── Chargement ── */
  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.collection = raw ? JSON.parse(raw) : {};
      // Migration : s'assurer que tous les persos ont exp
      Object.values(this.collection).forEach(e => {
        if (e.exp === undefined) e.exp = 0;
        if (!e.level) e.level = 1;
      });
    } catch {
      this.collection = {};
    }
    try {
      const raw  = localStorage.getItem(PROGRESS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      this.completedStages  = new Set(data.completedStages || []);
      this.currency         = data.currency         || 0;
      this.pity5            = data.pity5             ?? 0;
      this.pity4            = data.pity4             ?? 0;
      this.freeRolls        = data.freeRolls         ?? 0;
      this.xpBoostCombats   = data.xpBoostCombats    ?? 0;
      this.combatsWon       = data.combatsWon        ?? 0;
      this.totalSummons     = data.totalSummons      ?? 0;
      this.firstPlayDate    = data.firstPlayDate     ?? Date.now();
      this.stageStars       = data.stageStars        ?? {};
      this.energy           = data.energy            ?? ENERGY_MAX;
      this.lastEnergyTime   = data.lastEnergyTime    ?? Date.now();
      this.achievements     = data.achievements      ?? [];
      this.totalEnergySpent = data.totalEnergySpent  ?? 0;
      this.dungeonClears    = data.dungeonClears      ?? 0;
      // Artefacts & Équipement
      this.artifactInventory  = data.artifactInventory  ?? [];
      this.characterEquipment = data.characterEquipment ?? {};
      // Ascension
      this.ascensionRanks     = data.ascensionRanks     ?? {};
      this.ascensionMaterials = data.ascensionMaterials ?? {
        shard_basic: 0, shard_elite: 0, crystal_void: 0, stone_ascension: 0,
      };
      // Arène PvP
      this.arenaRating        = data.arenaRating        ?? 1000;
      this.arenaAttemptsLeft  = data.arenaAttemptsLeft  ?? 5;
      this.arenaLastReset     = data.arenaLastReset      ?? 0;
      this.arenaWins          = data.arenaWins           ?? 0;
      this.arenaLosses        = data.arenaLosses         ?? 0;
      // Bannières gacha — suivi du 50/50 par bannière
      this.bannerLostLast     = data.bannerLostLast      ?? {};
      // Forge — Matériaux
      this.forgeFragment      = data.forgeFragment        ?? 0;
      this.crystalEssence     = data.crystalEssence       ?? 0;
      this.primalShard        = data.primalShard          ?? 0;
      // Tour Infinie
      this.towerCurrentFloor  = data.towerCurrentFloor   ?? 1;
      this.towerBestFloor     = data.towerBestFloor       ?? 0;
      this.towerWeeklyFloor   = data.towerWeeklyFloor     ?? 0;
      this.towerLastReset     = data.towerLastReset       ?? 0;
      // Boss Hebdomadaire
      this.weeklyBossLastReset    = data.weeklyBossLastReset    ?? 0;
      this.weeklyBossDamage       = data.weeklyBossDamage       ?? 0;
      this.weeklyBossAttempts     = data.weeklyBossAttempts     ?? 3;
      this.weeklyBossRewardClaimed = data.weeklyBossRewardClaimed ?? false;
      // Talents & passifs
      this.unlockedTalents        = data.unlockedTalents        ?? {};
    } catch {
      this.completedStages  = new Set();
      this.currency         = 0;
      this.pity5            = 0;
      this.pity4            = 0;
      this.freeRolls        = 0;
      this.xpBoostCombats   = 0;
      this.stageStars       = {};
      this.energy           = ENERGY_MAX;
      this.lastEnergyTime   = Date.now();
      this.achievements     = [];
      this.totalEnergySpent = 0;
      this.dungeonClears    = 0;
      this.artifactInventory  = [];
      this.characterEquipment = {};
      this.ascensionRanks     = {};
      this.ascensionMaterials = { shard_basic: 0, shard_elite: 0, crystal_void: 0, stone_ascension: 0 };
      this.arenaRating        = 1000;
      this.arenaAttemptsLeft  = 5;
      this.arenaLastReset     = 0;
      this.arenaWins          = 0;
      this.arenaLosses        = 0;
      this.bannerLostLast     = {};
      this.forgeFragment      = 0;
      this.crystalEssence     = 0;
      this.primalShard        = 0;
      this.towerCurrentFloor  = 1;
      this.towerBestFloor     = 0;
      this.towerWeeklyFloor   = 0;
      this.towerLastReset     = 0;
      this.weeklyBossLastReset = 0;
      this.weeklyBossDamage    = 0;
      this.weeklyBossAttempts  = 3;
      this.weeklyBossRewardClaimed = false;
      this.unlockedTalents     = {};
    }
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      this.pullHistory = raw ? JSON.parse(raw) : [];
    } catch {
      this.pullHistory = [];
    }
    this._loadQuests();
    this._loadDailyLogin();
  }

  /* ── Quêtes ── */
  _loadQuests() {
    try {
      const raw  = localStorage.getItem(QUESTS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      this._quests = {
        daily: {
          lastReset: data.daily?.lastReset ?? 0,
          progress:  data.daily?.progress  ?? {},
        },
        weekly: {
          lastReset: data.weekly?.lastReset ?? 0,
          progress:  data.weekly?.progress  ?? {},
        },
      };
    } catch {
      this._quests = {
        daily:  { lastReset: 0, progress: {} },
        weekly: { lastReset: 0, progress: {} },
      };
    }
  }

  _saveQuests() {
    localStorage.setItem(QUESTS_KEY, JSON.stringify(this._quests));
  }

  /** Réinitialise la progression des quêtes si le jour / la semaine a changé. */
  _resetIfNeeded() {
    const today = todayMidnight();
    const week  = weekStart();

    if (this._quests.daily.lastReset < today) {
      this._quests.daily = { lastReset: today, progress: {} };
    }
    if (this._quests.weekly.lastReset < week) {
      this._quests.weekly = { lastReset: week, progress: {} };
    }
  }

  /**
   * Retourne l'état de toutes les quêtes pour un tab ('daily' | 'weekly').
   * @returns {{ quest, current, claimed, done }[]}
   */
  getQuestState(tab) {
    this._resetIfNeeded();
    const defs     = tab === 'daily' ? DAILY_QUESTS : WEEKLY_QUESTS;
    const progress = this._quests[tab].progress;
    return defs.map(quest => {
      const p = progress[quest.id] ?? { current: 0, claimed: false };
      return {
        quest,
        current: Math.min(p.current, quest.target),
        claimed: p.claimed,
        done:    p.current >= quest.target,
      };
    });
  }

  /**
   * Incrémente la progression de toutes les quêtes actives du type donné.
   * @param {'COMBAT_WIN'|'SUMMON'|'STAGE_COMPLETE'} type
   * @param {number} amount
   */
  incrementQuest(type, amount = 1) {
    this._resetIfNeeded();
    let changed = false;

    for (const tab of ['daily', 'weekly']) {
      const defs     = tab === 'daily' ? DAILY_QUESTS : WEEKLY_QUESTS;
      const progress = this._quests[tab].progress;

      for (const quest of defs) {
        if (quest.type !== type) continue;
        if (!progress[quest.id]) progress[quest.id] = { current: 0, claimed: false };
        const p = progress[quest.id];
        if (p.current < quest.target) {
          p.current = Math.min(quest.target, p.current + amount);
          changed = true;
        }
      }
    }

    if (changed) {
      this._saveQuests();
      document.dispatchEvent(new CustomEvent('kuro:quests-updated'));
    }
  }

  /**
   * Réclame les récompenses d'une quête terminée.
   * @param {string} questId
   * @param {'daily'|'weekly'} tab
   * @returns {{ currency?, freeRolls? } | null} récompenses ou null si non réclamable
   */
  claimQuest(questId, tab) {
    this._resetIfNeeded();
    const defs = tab === 'daily' ? DAILY_QUESTS : WEEKLY_QUESTS;
    const quest = defs.find(q => q.id === questId);
    if (!quest) return null;

    const progress = this._quests[tab].progress;
    if (!progress[questId]) progress[questId] = { current: 0, claimed: false };
    const p = progress[questId];

    if (p.current < quest.target || p.claimed) return null;

    p.claimed = true;

    // Applique les récompenses
    if (quest.rewards.currency) {
      this.currency += quest.rewards.currency;
      this._saveProgress();
    }
    if (quest.rewards.freeRolls) {
      this.addFreeRolls(quest.rewards.freeRolls);
    }

    this._saveQuests();
    document.dispatchEvent(new CustomEvent('kuro:quests-updated'));
    return quest.rewards;
  }

  /** Nombre de quêtes réclamables (badge notification) */
  claimableQuestCount() {
    this._resetIfNeeded();
    let count = 0;
    for (const tab of ['daily', 'weekly']) {
      const defs     = tab === 'daily' ? DAILY_QUESTS : WEEKLY_QUESTS;
      const progress = this._quests[tab].progress;
      for (const quest of defs) {
        const p = progress[quest.id] ?? { current: 0, claimed: false };
        if (p.current >= quest.target && !p.claimed) count++;
      }
    }
    return count;
  }

  /* ── Sauvegarde ── */
  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.collection));
    this._scheduleCloudSync();
  }

  _saveProgress() {
    const progress = {
      completedStages: [...this.completedStages],
      currency:       this.currency,
      pity5:          this.pity5,
      pity4:          this.pity4,
      freeRolls:      this.freeRolls,
      xpBoostCombats: this.xpBoostCombats,
      combatsWon:     this.combatsWon,
      totalSummons:   this.totalSummons,
      firstPlayDate:  this.firstPlayDate,
      stageStars:       this.stageStars,
      energy:           this.energy,
      lastEnergyTime:   this.lastEnergyTime,
      achievements:       this.achievements,
      totalEnergySpent:   this.totalEnergySpent,
      dungeonClears:      this.dungeonClears,
      artifactInventory:  this.artifactInventory,
      characterEquipment: this.characterEquipment,
      ascensionRanks:     this.ascensionRanks,
      ascensionMaterials: this.ascensionMaterials,
      arenaRating:        this.arenaRating,
      arenaAttemptsLeft:  this.arenaAttemptsLeft,
      arenaLastReset:     this.arenaLastReset,
      arenaWins:          this.arenaWins,
      arenaLosses:        this.arenaLosses,
      bannerLostLast:     this.bannerLostLast    ?? {},
      // Forge
      forgeFragment:      this.forgeFragment     ?? 0,
      crystalEssence:     this.crystalEssence    ?? 0,
      primalShard:        this.primalShard       ?? 0,
      // Tour Infinie
      towerCurrentFloor:  this.towerCurrentFloor ?? 1,
      towerBestFloor:     this.towerBestFloor    ?? 0,
      towerWeeklyFloor:   this.towerWeeklyFloor  ?? 0,
      towerLastReset:     this.towerLastReset    ?? 0,
      // Boss Hebdomadaire
      weeklyBossLastReset:     this.weeklyBossLastReset     ?? 0,
      weeklyBossDamage:        this.weeklyBossDamage        ?? 0,
      weeklyBossAttempts:      this.weeklyBossAttempts      ?? 3,
      weeklyBossRewardClaimed: this.weeklyBossRewardClaimed ?? false,
      // Talents & passifs
      unlockedTalents:         this.unlockedTalents         ?? {},
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    this._scheduleCloudSync();
  }

  /** Envoie une synchro cloud dé-bouncée */
  _scheduleCloudSync() {
    apiService.scheduleSync(this.collection, {
      completedStages: [...this.completedStages],
      currency:       this.currency,
      pity5:          this.pity5,
      pity4:          this.pity4,
      freeRolls:      this.freeRolls,
      xpBoostCombats: this.xpBoostCombats,
      pullHistory:    this.pullHistory,
    });
  }

  /** Remplace la progression locale par des données cloud */
  loadFromCloud(data) {
    if (!data) return;
    try {
      this.collection = data.collection || {};
      Object.values(this.collection).forEach(e => {
        if (e.exp   === undefined) e.exp   = 0;
        if (!e.level)              e.level = 1;
      });
      const p = data.progress || {};
      this.completedStages = new Set(p.completedStages || []);
      this.currency        = p.currency      || 0;
      this.pity5           = p.pity5         ?? 0;
      this.pity4           = p.pity4         ?? 0;
      this.combatsWon      = p.combatsWon    ?? 0;
      this.totalSummons    = p.totalSummons  ?? 0;
      this.firstPlayDate   = p.firstPlayDate ?? Date.now();
      this.stageStars      = p.stageStars    ?? {};
      this.energy          = p.energy        ?? ENERGY_MAX;
      this.lastEnergyTime  = p.lastEnergyTime ?? Date.now();
      if (p.pullHistory) {
        this.pullHistory = p.pullHistory;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(this.pullHistory));
      }
      // Persiste en local aussi
      localStorage.setItem(STORAGE_KEY,  JSON.stringify(this.collection));
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    } catch (e) {
      console.warn('[PlayerData] loadFromCloud error:', e);
    }
  }

  /** Enregistre un lot de tirages dans l'historique (100 derniers). */
  addPullHistory(results) {
    const entries = results.map(char => ({
      id:        char.id,
      name:      char.name,
      rarity:    char.rarity,
      element:   char.element,
      timestamp: Date.now(),
    }));
    this.pullHistory = [...entries, ...this.pullHistory].slice(0, HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.pullHistory));
  }

  /** Met à jour les compteurs pity gacha et sauvegarde. */
  updatePity(pity5, pity4) {
    this.pity5 = pity5;
    this.pity4 = pity4;
    this._saveProgress();
  }

  /* ════════════════════════════════
     PERSONNAGES
  ════════════════════════════════ */

  addCharacter(id) {
    if (!this.collection[id]) {
      this.collection[id] = { count: 1, level: 1, exp: 0, obtainedAt: Date.now() };
    } else {
      this.collection[id].count += 1;
    }
    this._save();
  }

  has(id)       { return !!this.collection[id]; }
  countOf(id)   { return this.collection[id]?.count ?? 0; }
  uniqueCount() { return Object.keys(this.collection).length; }

  getLevel(id)  { return this.collection[id]?.level ?? 1; }
  getExp(id)    { return this.collection[id]?.exp   ?? 0; }

  /**
   * Ajoute de l'EXP à un personnage.
   * @returns {{ levelsGained: number[], oldLevel: number, newLevel: number }}
   */
  addExp(id, amount) {
    const entry = this.collection[id];
    if (!entry) return { levelsGained: [], oldLevel: 1, newLevel: 1 };

    const oldLevel    = entry.level;
    const levelsGained = [];

    entry.exp += amount;
    while (entry.level < MAX_LEVEL && entry.exp >= xpToNextLevel(entry.level)) {
      entry.exp -= xpToNextLevel(entry.level);
      entry.level++;
      levelsGained.push(entry.level);
    }
    // Plafond niveau max
    if (entry.level >= MAX_LEVEL) entry.exp = 0;

    this._save();
    return { levelsGained, oldLevel, newLevel: entry.level };
  }

  /** Progression EXP vers le prochain niveau */
  expProgress(id) {
    const entry  = this.collection[id];
    const level  = entry?.level ?? 1;
    const exp    = entry?.exp   ?? 0;
    const needed = xpToNextLevel(level);
    return {
      level,
      exp,
      needed:  needed === Infinity ? 0 : needed,
      pct:     needed === Infinity ? 100 : Math.min(100, (exp / needed) * 100),
      maxed:   level >= MAX_LEVEL,
    };
  }

  /* ════════════════════════════════
     CONSTELLATION
  ════════════════════════════════ */

  /** Niveau de constellation (0–6) basé sur le nombre de dupes */
  getConstellationLevel(id) {
    return Math.min(6, Math.max(0, (this.countOf(id) - 1)));
  }

  /** Applique les bonus de constellation sur des stats de base */
  applyConstellationBonuses(char, baseStats) {
    const level = this.getConstellationLevel(char.id);
    if (level === 0) return { ...baseStats };
    const bonuses = CONSTELLATION_BONUSES[char.rarity] || [];
    let { hp, atk, def, spd } = baseStats;
    for (let i = 0; i < level; i++) {
      const b = bonuses[i]?.effect || {};
      if (b.hp_pct)  hp  = Math.round(hp  * (1 + b.hp_pct));
      if (b.atk_pct) atk = Math.round(atk * (1 + b.atk_pct));
      if (b.def_pct) def = Math.round(def * (1 + b.def_pct));
      if (b.all_pct) {
        hp  = Math.round(hp  * (1 + b.all_pct));
        atk = Math.round(atk * (1 + b.all_pct));
        def = Math.round(def * (1 + b.all_pct));
      }
    }
    return { hp, atk, def, spd };
  }

  /** Retourne les réductions de cooldown cumulées (cd0, cd1) — constellation + talents */
  getCooldownReductions(char) {
    const level   = this.getConstellationLevel(char.id);
    const bonuses = CONSTELLATION_BONUSES[char.rarity] || [];
    let cd0 = 0, cd1 = 0;
    for (let i = 0; i < level; i++) {
      const b = bonuses[i]?.effect || {};
      if (b.cd0) cd0 += b.cd0;
      if (b.cd1) cd1 += b.cd1;
    }
    // Talents
    const talentFx = this.getTalentEffects(char);
    if (talentFx.cd0) cd0 += talentFx.cd0;
    if (talentFx.cd1) cd1 += talentFx.cd1;
    return { cd0, cd1 };
  }

  /* ════════════════════════════════
     TALENTS & PASSIFS
  ════════════════════════════════ */

  /** Ensemble des nodeIds débloqués pour ce perso. */
  getUnlockedTalents(charId) {
    return new Set(this.unlockedTalents[charId] ?? []);
  }

  /**
   * Tente de débloquer un nœud de talent (dépense ◈).
   * @returns {boolean} succès
   */
  unlockTalentNode(charId, nodeId, cost) {
    if (!this.spendCurrency(cost)) return false;
    if (!this.unlockedTalents[charId]) this.unlockedTalents[charId] = [];
    if (!this.unlockedTalents[charId].includes(nodeId)) {
      this.unlockedTalents[charId].push(nodeId);
    }
    this._saveProgress();
    return true;
  }

  /**
   * Retourne l'objet d'effets fusionnés de tous les talents débloqués.
   * @param {Object} char - objet personnage (doit avoir .id)
   */
  getTalentEffects(char) {
    const tree     = getTalentTree(char);
    const unlocked = this.getUnlockedTalents(char.id);
    const merged   = {};
    for (const node of tree.nodes) {
      if (!unlocked.has(node.id)) continue;
      for (const [k, v] of Object.entries(node.effect)) {
        merged[k] = (merged[k] ?? 0) + v;
      }
    }
    return merged;
  }

  /** Stats du personnage scalées selon son niveau, constellation, ascension et artefacts. */
  getScaledStats(char) {
    const ascRank = this.getAscensionRank(char.id);
    const rankData = ASCENSION_RANKS[ascRank];
    const level   = this.getLevel(char.id);
    const mult    = statMultiplier(level);
    const base    = {
      hp:  Math.round(char.stats.hp  * mult * rankData.statMult),
      atk: Math.round(char.stats.atk * mult * rankData.statMult),
      def: Math.round(char.stats.def * mult * rankData.statMult),
      spd: char.stats.spd,
    };
    let stats = this.applyConstellationBonuses(char, base);

    // Talents
    const talentFx = this.getTalentEffects(char);
    const tp = talentFx.all_pct ?? 0;
    stats = {
      hp:  Math.round(stats.hp  * (1 + (talentFx.hp_pct  ?? 0) + tp)),
      atk: Math.round(stats.atk * (1 + (talentFx.atk_pct ?? 0) + tp)),
      def: Math.round(stats.def * (1 + (talentFx.def_pct ?? 0) + tp)),
      spd: Math.round(stats.spd * (1 + (talentFx.spd_pct ?? 0) + tp)),
    };

    // Artefacts
    const artBonus = this.getArtifactBonusStats(char.id);
    const ap = artBonus.all_pct ?? 0;
    stats = {
      hp:  Math.round(stats.hp  * (1 + (artBonus.hp_pct  ?? 0) + ap) + (artBonus.hp_flat  ?? 0)),
      atk: Math.round(stats.atk * (1 + (artBonus.atk_pct ?? 0) + ap) + (artBonus.atk_flat ?? 0)),
      def: Math.round(stats.def * (1 + (artBonus.def_pct ?? 0) + ap) + (artBonus.def_flat ?? 0)),
      spd: Math.round(stats.spd * (1 + (artBonus.spd_pct ?? 0))     + (artBonus.spd_flat ?? 0)),
    };
    return stats;
  }

  /* ════════════════════════════════
     STAGES
  ════════════════════════════════ */

  completeStage(stageId, rewards = {}) {
    this.completedStages.add(stageId);
    if (rewards.currency) this.currency += rewards.currency;
    this._saveProgress();
  }

  isStageCompleted(stageId) { return this.completedStages.has(stageId); }

  isStageUnlocked(stage) {
    if (!stage.unlockAfter) return true;
    return this.completedStages.has(stage.unlockAfter);
  }

  /* ════════════════════════════════
     BOUTIQUE
  ════════════════════════════════ */

  /**
   * Déduit `amount` de la monnaie. Retourne false si fonds insuffisants.
   */
  spendCurrency(amount) {
    if (this.currency < amount) return false;
    this.currency -= amount;
    this._saveProgress();
    return true;
  }

  /** Ajoute des tirages gratuits (utilisables dans SummonUI). */
  addFreeRolls(n) {
    this.freeRolls = (this.freeRolls ?? 0) + n;
    this._saveProgress();
  }

  /**
   * Ajoute `combats` combats au boost ×2 EXP.
   */
  addXpBoost(combats) {
    this.xpBoostCombats = (this.xpBoostCombats ?? 0) + combats;
    this._saveProgress();
  }

  /**
   * Consomme 1 charge de boost EXP.
   * @returns {number} 2 si boost actif, 1 sinon.
   */
  consumeXpBoost() {
    if ((this.xpBoostCombats ?? 0) > 0) {
      this.xpBoostCombats--;
      this._saveProgress();
      return 2;
    }
    return 1;
  }

  /* ════════════════════════════════
     STATS GLOBALES
  ════════════════════════════════ */

  incrementCombatsWon() {
    this.combatsWon = (this.combatsWon ?? 0) + 1;
    this._saveProgress();
  }

  incrementSummons(n = 1) {
    this.totalSummons = (this.totalSummons ?? 0) + n;
    this._saveProgress();
  }

  incrementDungeonClears() {
    this.dungeonClears = (this.dungeonClears ?? 0) + 1;
    this._saveProgress();
  }

  /* ════════════════════════════════
     ACHIEVEMENTS (HAUTS FAITS)
  ════════════════════════════════ */

  /**
   * Construit le contexte d'évaluation des conditions d'achievements.
   * @param {number} totalChars  — nombre total de persos dans le jeu
   */
  _achCtx(totalChars = 0) {
    return {
      combatsWon:       this.combatsWon       ?? 0,
      totalSummons:     this.totalSummons      ?? 0,
      uniqueCount:      this.uniqueCount(),
      completedStages:  this.completedStages,
      stageStars:       this.stageStars        ?? {},
      currency:         this.currency,
      totalEnergySpent: this.totalEnergySpent  ?? 0,
      dailyStreak:      this._daily?.streak    ?? 0,
      dungeonClears:    this.dungeonClears      ?? 0,
      totalChars,
    };
  }

  /**
   * Vérifie tous les achievements et retourne les nouveaux déblocages.
   * @param {number} totalChars — taille totale du roster
   * @returns {Array} achievements nouvellement débloqués
   */
  checkAchievements(totalChars = 0) {
    const unlocked = new Set(this.achievements ?? []);
    const newOnes  = [];
    const ctx      = this._achCtx(totalChars);

    for (const ach of ACHIEVEMENTS) {
      if (unlocked.has(ach.id)) continue;
      try {
        if (ach.condition(ctx)) {
          newOnes.push(ach);
          this._unlockAchievement(ach);
        }
      } catch { /* condition peut throw si données manquantes */ }
    }

    return newOnes;
  }

  /** Débloque un achievement et applique ses récompenses (usage interne). */
  _unlockAchievement(ach) {
    if (!this.achievements) this.achievements = [];
    if (this.achievements.includes(ach.id)) return;
    this.achievements.push(ach.id);
    if (ach.reward?.currency)  this.currency   += ach.reward.currency;
    if (ach.reward?.freeRolls) this.addFreeRolls(ach.reward.freeRolls);
    this._saveProgress();
  }

  /** Retourne la liste des achievements avec leur état (débloqué / verrouillé). */
  getAchievementsState() {
    const unlocked = new Set(this.achievements ?? []);
    return ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: unlocked.has(ach.id),
    }));
  }

  /** Nombre d'achievements débloqués. */
  unlockedAchievementsCount() {
    return (this.achievements ?? []).length;
  }

  /* ════════════════════════════════
     ÉTOILES PAR STAGE
  ════════════════════════════════ */

  /**
   * Calcule les étoiles obtenues selon le % HP restant de l'équipe.
   * 3★ ≥ 70% | 2★ ≥ 35% | 1★ > 0%
   */
  static calcStars(teamHpPct) {
    if (teamHpPct >= 0.70) return 3;
    if (teamHpPct >= 0.35) return 2;
    return 1;
  }

  /** Enregistre le meilleur score d'étoiles pour un stage. */
  setStageStars(stageId, stars) {
    const prev = this.stageStars[stageId] ?? 0;
    if (stars > prev) {
      this.stageStars[stageId] = stars;
      this._saveProgress();
    }
  }

  getStageStars(stageId) {
    return this.stageStars[stageId] ?? 0;
  }

  /* ════════════════════════════════
     ÉNERGIE (STAMINA)
  ════════════════════════════════ */

  /** Régénère l'énergie selon le temps écoulé puis retourne l'état. */
  _regenEnergy() {
    const now     = Date.now();
    const elapsed = now - (this.lastEnergyTime ?? now);
    const gained  = Math.floor(elapsed / ENERGY_REGEN_MS);
    if (gained > 0 && (this.energy ?? 0) < ENERGY_MAX) {
      this.energy = Math.min(ENERGY_MAX, (this.energy ?? 0) + gained);
      this.lastEnergyTime = this.lastEnergyTime + gained * ENERGY_REGEN_MS;
      this._saveProgress();
    }
  }

  /** Retourne l'état courant de l'énergie (après regen). */
  getEnergy() {
    this._regenEnergy();
    const full    = (this.energy ?? 0) >= ENERGY_MAX;
    const nextMs  = full ? null
      : ENERGY_REGEN_MS - ((Date.now() - (this.lastEnergyTime ?? Date.now())) % ENERGY_REGEN_MS);
    return {
      current: this.energy ?? 0,
      max:     ENERGY_MAX,
      full,
      nextRegenMs: nextMs,  // ms avant la prochaine +1
    };
  }

  /**
   * Consomme `cost` points d'énergie.
   * @returns {boolean} false si pas assez d'énergie
   */
  spendEnergy(cost) {
    this._regenEnergy();
    if ((this.energy ?? 0) < cost) return false;
    if (this.lastEnergyTime === Date.now() || (this.energy ?? 0) >= ENERGY_MAX) {
      // On démarre le timer de regen au moment de la 1ère dépense depuis max
      this.lastEnergyTime = Date.now();
    }
    this.energy = (this.energy ?? 0) - cost;
    this.totalEnergySpent = (this.totalEnergySpent ?? 0) + cost;
    this._saveProgress();
    return true;
  }

  /** Ajoute de l'énergie (achat boutique, récompense quotidienne). */
  addEnergy(amount) {
    this._regenEnergy();
    this.energy = Math.min(ENERGY_MAX, (this.energy ?? 0) + amount);
    this._saveProgress();
  }

  /* ════════════════════════════════
     CONNEXION QUOTIDIENNE
  ════════════════════════════════ */

  _loadDailyLogin() {
    try {
      const raw  = localStorage.getItem(DAILY_KEY);
      const data = raw ? JSON.parse(raw) : {};
      this._daily = {
        streak:        data.streak        ?? 0,
        lastClaimDate: data.lastClaimDate ?? 0,  // timestamp minuit du dernier claim
        claimedToday:  false,                     // recalculé ci-dessous
      };
      // Vérifie si le claim d'aujourd'hui a déjà été fait
      const today = todayMidnight();
      this._daily.claimedToday = (this._daily.lastClaimDate >= today);

      // Si plus d'un jour s'est écoulé sans claim → streak cassé (repart à 0)
      const yesterday = today - 86_400_000;
      if (this._daily.lastClaimDate < yesterday && this._daily.streak > 0) {
        // Le streak ne se reset qu'au moment du claim, pour ne pas pénaliser en
        // affichage : on laisse streak tel quel jusqu'au prochain claim.
      }
    } catch {
      this._daily = { streak: 0, lastClaimDate: 0, claimedToday: false };
    }
  }

  _saveDailyLogin() {
    localStorage.setItem(DAILY_KEY, JSON.stringify({
      streak:        this._daily.streak,
      lastClaimDate: this._daily.lastClaimDate,
    }));
  }

  /**
   * Retourne l'état courant pour l'UI de connexion journalière.
   * @returns {{ streak, dayInCycle, reward, claimedToday, streakBroken }}
   */
  getDailyLoginState() {
    const today     = todayMidnight();
    const yesterday = today - 86_400_000;

    // Streak cassé si dernier claim avant hier (pas aujourd'hui ni hier)
    const streakBroken = (
      this._daily.streak > 0 &&
      this._daily.lastClaimDate < yesterday
    );
    const effectiveStreak = streakBroken ? 0 : this._daily.streak;
    const nextDay         = getDayInCycle(effectiveStreak + 1);
    const reward          = DAILY_REWARDS.find(r => r.day === nextDay);

    return {
      streak:       effectiveStreak,
      dayInCycle:   nextDay,
      reward,
      claimedToday: this._daily.claimedToday,
      streakBroken,
      allRewards:   DAILY_REWARDS,
    };
  }

  /**
   * Réclame la récompense de connexion du jour.
   * @returns {Object|null} récompenses appliquées, ou null si déjà réclamé
   */
  claimDailyLogin() {
    if (this._daily.claimedToday) return null;

    const today     = todayMidnight();
    const yesterday = today - 86_400_000;

    // Reset du streak si cassé
    if (this._daily.lastClaimDate < yesterday && this._daily.streak > 0) {
      this._daily.streak = 0;
    }

    this._daily.streak++;
    this._daily.lastClaimDate = today;
    this._daily.claimedToday  = true;

    const dayInCycle = getDayInCycle(this._daily.streak);
    const reward     = DAILY_REWARDS.find(r => r.day === dayInCycle);

    // Applique les récompenses
    if (reward) {
      if (reward.type === 'currency') {
        this.currency += reward.amount;
      } else if (reward.type === 'pulls') {
        this.addFreeRolls(reward.amount);
      } else if (reward.type === 'xpBoost') {
        this.addXpBoost(reward.amount);
      } else if (reward.type === 'grand') {
        if (reward.currency) this.currency += reward.currency;
        if (reward.pulls)    this.addFreeRolls(reward.pulls);
      }
    }

    this._saveProgress();
    this._saveDailyLogin();
    return reward;
  }

  /* ════════════════════════════════
     ARTEFACTS
  ════════════════════════════════ */

  /** Ajoute un artefact à l'inventaire. */
  addArtifactToInventory(art) {
    if (!this.artifactInventory) this.artifactInventory = [];
    this.artifactInventory.push(art);
    this._saveProgress();
  }

  /** Équipe un artefact sur un slot d'un personnage. L'ancien est renvoyé en inventaire. */
  equipArtifact(charId, slot, artId) {
    if (!this.characterEquipment) this.characterEquipment = {};
    if (!this.characterEquipment[charId]) this.characterEquipment[charId] = {};
    // Remettre l'ancien en inventaire si présent
    const oldId = this.characterEquipment[charId][slot];
    if (oldId) {
      const oldArt = (this.artifactInventory ?? []).find(a => a.id === oldId);
      if (!oldArt) {
        // L'artefact n'est pas en inventaire, on le recrée ou on ignore
      }
    }
    // Vérifier que l'artefact existe en inventaire
    const artIdx = (this.artifactInventory ?? []).findIndex(a => a.id === artId);
    if (artIdx === -1) return false;
    // Détacher de tout autre perso
    for (const [cid, slots] of Object.entries(this.characterEquipment)) {
      for (const [sl, eid] of Object.entries(slots)) {
        if (eid === artId && (cid !== charId || sl !== slot)) {
          delete this.characterEquipment[cid][sl];
        }
      }
    }
    this.characterEquipment[charId][slot] = artId;
    this._saveProgress();
    return true;
  }

  /** Déséquipe un slot d'un personnage. */
  unequipArtifact(charId, slot) {
    if (!this.characterEquipment?.[charId]) return;
    delete this.characterEquipment[charId][slot];
    this._saveProgress();
  }

  /** Retourne les 4 artefacts équipés sur un personnage (null si vide). */
  getEquippedArtifacts(charId) {
    const equip = this.characterEquipment?.[charId] ?? {};
    return ARTIFACT_SLOTS.map(slot => {
      const artId = equip[slot];
      if (!artId) return null;
      return (this.artifactInventory ?? []).find(a => a.id === artId) ?? null;
    });
  }

  /** Retourne les bonus de stats totaux des artefacts équipés sur un personnage. */
  getArtifactBonusStats(charId) {
    const arts = this.getEquippedArtifacts(charId);
    return calcArtifactStats(arts);
  }

  /** Génère 8 artefacts de démo et les ajoute à l'inventaire. */
  seedDemoArtifacts() {
    if ((this.artifactInventory ?? []).length > 0) return;
    const setIds = ['fureur', 'gardien', 'foudre', 'vitalite', 'ombre', 'neant'];
    const slots  = ['arme', 'armure', 'accessoire', 'relique'];
    // 2 sets complets pour avoir les bonus 2-pièces
    ['fureur', 'gardien'].forEach(setId => {
      slots.forEach(slot => {
        this.addArtifactToInventory(generateArtifact(slot, setId, 3));
      });
    });
    // 4 artefacts random supplémentaires
    for (let i = 0; i < 4; i++) {
      const setId = setIds[i % setIds.length];
      const slot  = slots[i % slots.length];
      this.addArtifactToInventory(generateArtifact(slot, setId, 4));
    }
  }

  /* ════════════════════════════════
     ASCENSION
  ════════════════════════════════ */

  /** Rang d'ascension actuel (0–5). */
  getAscensionRank(charId) {
    return Math.min(5, Math.max(0, this.ascensionRanks?.[charId] ?? 0));
  }

  /** Vérifie si le personnage peut monter en ascension. */
  canAscend(charId) {
    const rank = this.getAscensionRank(charId);
    if (rank >= 5) return { ok: false, reason: 'Rang maximum atteint.' };
    const costs = getNextAscensionCost(rank);
    if (!costs) return { ok: false, reason: 'Impossible.' };
    const mats  = this.ascensionMaterials ?? {};
    for (const [mat, qty] of Object.entries(costs)) {
      if ((mats[mat] ?? 0) < qty) {
        return { ok: false, reason: `Matériaux insuffisants (${mat}).`, costs };
      }
    }
    return { ok: true, costs };
  }

  /** Effectue l'ascension du personnage si possible. */
  ascendCharacter(charId) {
    const check = this.canAscend(charId);
    if (!check.ok) return check;
    const rank  = this.getAscensionRank(charId);
    const costs = check.costs;
    for (const [mat, qty] of Object.entries(costs)) {
      this.ascensionMaterials[mat] = (this.ascensionMaterials[mat] ?? 0) - qty;
    }
    this.ascensionRanks[charId] = rank + 1;
    this._saveProgress();
    return { ok: true, newRank: rank + 1 };
  }

  /** Ajoute des matériaux d'ascension (récompenses de combat). */
  addAscensionMaterials(mats = {}) {
    if (!this.ascensionMaterials) {
      this.ascensionMaterials = { shard_basic: 0, shard_elite: 0, crystal_void: 0, stone_ascension: 0 };
    }
    for (const [k, v] of Object.entries(mats)) {
      this.ascensionMaterials[k] = (this.ascensionMaterials[k] ?? 0) + v;
    }
    this._saveProgress();
  }

  /* ════════════════════════════════
     ARÈNE PVP
  ════════════════════════════════ */

  /** Réinitialise les tentatives si le jour a changé. */
  _resetArenaIfNeeded() {
    const today = todayMidnight();
    if ((this.arenaLastReset ?? 0) < today) {
      this.arenaAttemptsLeft = 5;
      this.arenaLastReset    = today;
      this._saveProgress();
    }
  }

  /** Retourne l'état de l'arène. */
  getArenaState() {
    this._resetArenaIfNeeded();
    const rating  = this.arenaRating ?? 1000;
    const tier    = this._getArenaTier(rating);
    return {
      rating,
      tier,
      attemptsLeft: this.arenaAttemptsLeft ?? 5,
      wins:         this.arenaWins    ?? 0,
      losses:       this.arenaLosses  ?? 0,
    };
  }

  _getArenaTier(rating) {
    const tiers = [
      { name: 'Bronze',  minRating: 0,    color: '#cd7f32', icon: '🥉' },
      { name: 'Argent',  minRating: 1100, color: '#aaaacc', icon: '🥈' },
      { name: 'Or',      minRating: 1250, color: '#ffd700', icon: '🥇' },
      { name: 'Platine', minRating: 1400, color: '#00e5ff', icon: '💎' },
      { name: 'Diamant', minRating: 1600, color: '#8844ff', icon: '◆' },
    ];
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (rating >= tiers[i].minRating) return tiers[i];
    }
    return tiers[0];
  }

  /**
   * Enregistre le résultat d'un combat d'arène.
   * @param {boolean} won
   * @returns {{ newRating, ratingChange }}
   */
  recordArenaFight(won) {
    this._resetArenaIfNeeded();
    const ratingChange    = won ? 20 : -10;
    this.arenaRating      = Math.max(0, (this.arenaRating ?? 1000) + ratingChange);
    this.arenaAttemptsLeft = Math.max(0, (this.arenaAttemptsLeft ?? 5) - 1);
    if (won) this.arenaWins    = (this.arenaWins   ?? 0) + 1;
    else     this.arenaLosses  = (this.arenaLosses ?? 0) + 1;
    this._saveProgress();
    return { newRating: this.arenaRating, ratingChange };
  }

  /* ════════════════════════════════
     RESET
  ════════════════════════════════ */

  reset() {
    this.collection      = {};
    this.completedStages = new Set();
    this.currency        = 0;
    this._save();
    this._saveProgress();
  }

  /* ── Données de démo ── */
  seedDemo(characters) {
    if (this.uniqueCount() > 0) return;
    ['kira', 'ryuu', 'akane', 'taka', 'suki', 'jin'].forEach(id => this.addCharacter(id));
    this.addCharacter('kira');
    // Matériaux d'ascension de démo
    if (!this.ascensionMaterials || Object.values(this.ascensionMaterials).every(v => v === 0)) {
      this.ascensionMaterials = { shard_basic: 15, shard_elite: 6, crystal_void: 2, stone_ascension: 0 };
      this._saveProgress();
    }
    this.seedDemoArtifacts();
    // Matériaux de forge de démo (si non initialisés)
    if ((this.forgeFragment ?? 0) === 0 && (this.crystalEssence ?? 0) === 0) {
      this.forgeFragment  = 35;
      this.crystalEssence = 15;
      this.primalShard    = 4;
      this._saveProgress();
    }
  }

  /* ════════════════════════════════
     HELPERS — FORGE
  ════════════════════════════════ */

  /** Vérifie si un artefact est actuellement équipé par un personnage. */
  isArtifactEquipped(artId) {
    return Object.values(this.characterEquipment ?? {}).some(
      slots => Object.values(slots).includes(artId)
    );
  }

  /** Retourne les matériaux de forge actuels. */
  getForgeMaterials() {
    return {
      forge_fragment:  this.forgeFragment  ?? 0,
      crystal_essence: this.crystalEssence ?? 0,
      primal_shard:    this.primalShard    ?? 0,
    };
  }

  /** Vérifie si les matériaux suffisent pour un coût donné. */
  canAffordForge(cost) {
    const mats = this.getForgeMaterials();
    return Object.entries(cost).every(([k, v]) => (mats[k] ?? 0) >= v);
  }

  /** Déduit les matériaux de forge (sans vérification). */
  spendForgeMaterials(cost) {
    if (cost.forge_fragment)  this.forgeFragment  = Math.max(0, (this.forgeFragment  ?? 0) - cost.forge_fragment);
    if (cost.crystal_essence) this.crystalEssence = Math.max(0, (this.crystalEssence ?? 0) - cost.crystal_essence);
    if (cost.primal_shard)    this.primalShard    = Math.max(0, (this.primalShard    ?? 0) - cost.primal_shard);
    this._saveProgress();
  }

  /** Ajoute des matériaux de forge. */
  addForgeMaterials(rewards) {
    if (rewards.forge_fragment)  this.forgeFragment  = (this.forgeFragment  ?? 0) + rewards.forge_fragment;
    if (rewards.crystal_essence) this.crystalEssence = (this.crystalEssence ?? 0) + rewards.crystal_essence;
    if (rewards.primal_shard)    this.primalShard    = (this.primalShard    ?? 0) + rewards.primal_shard;
    this._saveProgress();
  }

  /** Retire un artefact de l'inventaire (après vérification équipement). */
  removeArtifact(artId) {
    if (this.isArtifactEquipped(artId)) return false;
    const idx = (this.artifactInventory ?? []).findIndex(a => a.id === artId);
    if (idx < 0) return false;
    this.artifactInventory.splice(idx, 1);
    this._saveProgress();
    return true;
  }

  /** Applique un niveau de renforcement à un sub-stat d'artefact. */
  enhanceArtifactSub(artId, subIdx) {
    const art = (this.artifactInventory ?? []).find(a => a.id === artId);
    if (!art) return false;
    if (!art.enhancements) art.enhancements = [];
    const current = art.enhancements[subIdx] ?? 0;
    if (current >= 3) return false; // max niveau 3
    art.enhancements[subIdx] = current + 1;
    this._saveProgress();
    return true;
  }
}
