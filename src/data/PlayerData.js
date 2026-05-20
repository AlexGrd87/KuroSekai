/**
 * PlayerData.js
 * Gestion de la collection et de la progression du joueur via localStorage.
 */

const STORAGE_KEY  = 'kuro_player_collection';
const PROGRESS_KEY = 'kuro_player_progress';

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
      this.completedStages = new Set(data.completedStages || []);
      this.currency        = data.currency || 0;
    } catch {
      this.completedStages = new Set();
      this.currency        = 0;
    }
  }

  /* ── Sauvegarde ── */
  _save()         { localStorage.setItem(STORAGE_KEY,  JSON.stringify(this.collection)); }
  _saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      completedStages: [...this.completedStages],
      currency: this.currency,
    }));
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

  /** Stats du personnage scalées selon son niveau actuel */
  getScaledStats(char) {
    const level = this.getLevel(char.id);
    const mult  = statMultiplier(level);
    return {
      hp:  Math.round(char.stats.hp  * mult),
      atk: Math.round(char.stats.atk * mult),
      def: Math.round(char.stats.def * mult),
      spd: char.stats.spd,              // SPD ne scale pas
    };
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
