/**
 * PlayerData.js
 * Gestion de la collection et de la progression du joueur via localStorage.
 */

const STORAGE_KEY       = 'kuro_player_collection';
const PROGRESS_KEY      = 'kuro_player_progress';

export class PlayerData {
  constructor() {
    this._load();
  }

  /* ── Chargement depuis localStorage ── */
  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.collection = raw ? JSON.parse(raw) : {};
    } catch {
      this.collection = {};
    }
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      this.completedStages = new Set(data.completedStages || []);
      this.exp             = data.exp      || 0;
      this.currency        = data.currency || 0;
    } catch {
      this.completedStages = new Set();
      this.exp             = 0;
      this.currency        = 0;
    }
  }

  /* ── Sauvegarde dans localStorage ── */
  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.collection));
  }

  _saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      completedStages: [...this.completedStages],
      exp:      this.exp,
      currency: this.currency,
    }));
  }

  /* ── Personnages ── */
  addCharacter(id) {
    if (!this.collection[id]) {
      this.collection[id] = { count: 1, level: 1, obtainedAt: Date.now() };
    } else {
      this.collection[id].count += 1;
    }
    this._save();
  }

  has(id)      { return !!this.collection[id]; }
  countOf(id)  { return this.collection[id]?.count ?? 0; }
  uniqueCount(){ return Object.keys(this.collection).length; }

  /* ── Stages ── */
  completeStage(stageId, rewards = {}) {
    this.completedStages.add(stageId);
    if (rewards.exp)      this.exp      += rewards.exp;
    if (rewards.currency) this.currency += rewards.currency;
    this._saveProgress();
  }

  isStageCompleted(stageId) {
    return this.completedStages.has(stageId);
  }

  isStageUnlocked(stage) {
    if (!stage.unlockAfter) return true;              // premier stage toujours dispo
    return this.completedStages.has(stage.unlockAfter);
  }

  /* ── Reset (debug) ── */
  reset() {
    this.collection      = {};
    this.completedStages = new Set();
    this.exp             = 0;
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
