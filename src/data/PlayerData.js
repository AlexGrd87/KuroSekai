/**
 * PlayerData.js
 * Gestion de la collection du joueur via localStorage.
 * Stocke les personnages obtenus, leur nombre de copies, et le niveau.
 */

const STORAGE_KEY = 'kuro_player_collection';

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
  }

  /* ── Sauvegarde dans localStorage ── */
  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.collection));
  }

  /* ── Ajouter un personnage (ou une copie) ── */
  addCharacter(id) {
    if (!this.collection[id]) {
      this.collection[id] = { count: 1, level: 1, obtainedAt: Date.now() };
    } else {
      this.collection[id].count += 1;
    }
    this._save();
  }

  /* ── Vérifier si le joueur possède un personnage ── */
  has(id) {
    return !!this.collection[id];
  }

  /* ── Nombre de copies d'un personnage ── */
  countOf(id) {
    return this.collection[id]?.count ?? 0;
  }

  /* ── Nombre total de personnages uniques obtenus ── */
  uniqueCount() {
    return Object.keys(this.collection).length;
  }

  /* ── Réinitialiser (debug) ── */
  reset() {
    this.collection = {};
    this._save();
  }

  /* ── Données de démo : pré-rempli pour le développement ── */
  seedDemo(characters) {
    if (this.uniqueCount() > 0) return; // déjà des données
    // Le joueur commence avec quelques personnages de démonstration
    ['kira', 'ryuu', 'akane', 'taka', 'suki', 'jin'].forEach(id => {
      this.addCharacter(id);
    });
    // Kira a 2 copies (doublon de démo)
    this.addCharacter('kira');
  }
}
