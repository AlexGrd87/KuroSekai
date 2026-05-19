/**
 * GachaEngine.js
 * Moteur de tirage gacha avec système de pity (garantie).
 *
 * Règles :
 *  - Taux de base selon RARITIES
 *  - Pity 5★ : garanti au bout de 90 pulls sans 5★
 *  - Pity 4★ : garanti au bout de 10 pulls sans 4★
 *  - Pull x10 : au moins un 3★ ou plus garanti
 */

import { CHARACTERS, RARITIES } from '../data/characters.js';

export class GachaEngine {
  constructor() {
    this.pity5 = 0; // compteur depuis le dernier 5★
    this.pity4 = 0; // compteur depuis le dernier 4★
  }

  /* ── Effectue N tirages et retourne un tableau de personnages ── */
  pull(count = 1) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(this._singlePull(i, count));
    }
    // Garantie x10 : remplace le dernier résultat si aucun 3★+ tiré
    if (count === 10) {
      const hasFeatured = results.some(r => r.rarity >= 3);
      if (!hasFeatured) {
        results[9] = this._pullAtLeastRarity(3);
      }
    }
    return results;
  }

  /* ── Tirage unique avec pity ── */
  _singlePull(index, total) {
    this.pity5++;
    this.pity4++;

    let rarity;

    // Pity 5★ déclenché
    if (this.pity5 >= 90) {
      rarity = 5;
    }
    // Pity 4★ déclenché
    else if (this.pity4 >= 10) {
      rarity = 4;
    }
    // Tirage aléatoire selon les taux
    else {
      rarity = this._rollRarity();
    }

    // Réinitialise les pity selon la rareté obtenue
    if (rarity === 5) { this.pity5 = 0; this.pity4 = 0; }
    if (rarity === 4) { this.pity4 = 0; }

    return this._pickCharacter(rarity);
  }

  /* ── Détermine la rareté par tirage aléatoire (système 3-5★) ── */
  _rollRarity() {
    const roll = Math.random();
    let cumul = 0;
    for (const r of [5, 4, 3]) {
      cumul += RARITIES[r].rate;
      if (roll < cumul) return r;
    }
    return 3; // fallback minimum 3★
  }

  /* ── Sélectionne un personnage aléatoire de la rareté donnée ── */
  _pickCharacter(rarity) {
    const pool = CHARACTERS.filter(c => c.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ── Garantit au moins une rareté minimum ── */
  _pullAtLeastRarity(minRarity) {
    const rarity = Math.max(this._rollRarity(), minRarity);
    return this._pickCharacter(rarity);
  }

  /* ── Stats de pity (pour l'affichage) ── */
  getPityInfo() {
    return {
      pity5: this.pity5,
      pity4: this.pity4,
      next5Guaranteed: 90 - this.pity5,
      next4Guaranteed: 10 - this.pity4,
    };
  }
}
