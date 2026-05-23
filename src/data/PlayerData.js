/**
 * PlayerData.js
 * Gestion de la collection et de la progression du joueur via localStorage.
 */

import { CONSTELLATION_BONUSES }                         from './characters.js';
import { apiService }                                    from './ApiService.js';
import { DAILY_QUESTS, WEEKLY_QUESTS,
         todayMidnight, weekStart }                      from './quests.js';

const STORAGE_KEY  = 'kuro_player_collection';
const PROGRESS_KEY = 'kuro_player_progress';
const HISTORY_KEY  = 'kuro_pull_history';
const QUESTS_KEY   = 'kuro_quests';
const HISTORY_MAX  = 100;

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
    } catch {
      this.completedStages = new Set();
      this.currency        = 0;
      this.pity5           = 0;
      this.pity4           = 0;
      this.freeRolls       = 0;
      this.xpBoostCombats  = 0;
    }
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      this.pullHistory = raw ? JSON.parse(raw) : [];
    } catch {
      this.pullHistory = [];
    }
    this._loadQuests();
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

  /** Retourne les réductions de cooldown cumulées (cd0, cd1) */
  getCooldownReductions(char) {
    const level   = this.getConstellationLevel(char.id);
    const bonuses = CONSTELLATION_BONUSES[char.rarity] || [];
    let cd0 = 0, cd1 = 0;
    for (let i = 0; i < level; i++) {
      const b = bonuses[i]?.effect || {};
      if (b.cd0) cd0 += b.cd0;
      if (b.cd1) cd1 += b.cd1;
    }
    return { cd0, cd1 };
  }

  /** Stats du personnage scalées selon son niveau et constellation */
  getScaledStats(char) {
    const level = this.getLevel(char.id);
    const mult  = statMultiplier(level);
    const base  = {
      hp:  Math.round(char.stats.hp  * mult),
      atk: Math.round(char.stats.atk * mult),
      def: Math.round(char.stats.def * mult),
      spd: char.stats.spd,
    };
    return this.applyConstellationBonuses(char, base);
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
  }
}
