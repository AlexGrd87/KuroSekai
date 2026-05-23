/**
 * PlayerData.js
 * Gestion de la collection et de la progression du joueur via localStorage.
 */

import { CONSTELLATION_BONUSES } from './characters.js';

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
      this.pity5           = data.pity5    ?? 0;
      this.pity4           = data.pity4    ?? 0;
    } catch {
      this.completedStages = new Set();
      this.currency        = 0;
      this.pity5           = 0;
      this.pity4           = 0;
    }
  }

  /* ── Sauvegarde ── */
  _save()         { localStorage.setItem(STORAGE_KEY,  JSON.stringify(this.collection)); }
  _saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      completedStages: [...this.completedStages],
      currency: this.currency,
      pity5:    this.pity5,
      pity4:    this.pity4,
    }));
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
