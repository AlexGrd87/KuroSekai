/**
 * GachaEngine.js
 * Moteur de tirage gacha avec système de pity (garantie) et support des bannières événement.
 *
 * Règles :
 *  - Taux de base selon RARITIES
 *  - Pity 5★ : garanti au bout de 90 pulls sans 5★
 *  - Pity 4★ : garanti au bout de 10 pulls sans 4★
 *  - Pull x10 : au moins un 3★ ou plus garanti
 *  - Bannière événement : taux 5★ × rateUpMult, 50/50 sur le personnage vedette
 *    (premier 5★ toujours vedette si guarantee5050 = true)
 */

import { CHARACTERS, RARITIES } from '../data/characters.js';

export class GachaEngine {
  constructor(playerData) {
    this._playerData = playerData;
    this.pity5 = playerData.pity5 ?? 0;
    this.pity4 = playerData.pity4 ?? 0;
  }

  /**
   * Effectue N tirages et retourne un tableau de personnages.
   * @param {number} count — 1 ou 10
   * @param {object|null} banner — objet bannière (de banners.js) ou null
   */
  pull(count = 1, banner = null) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(this._singlePull(i, count, banner));
    }
    // Garantie x10 : remplace le dernier résultat si aucun 3★+ tiré
    if (count === 10) {
      const hasFeatured = results.some(r => r.rarity >= 3);
      if (!hasFeatured) {
        results[9] = this._pullAtLeastRarity(3, banner);
      }
    }
    // Persiste les compteurs pity après chaque lot de tirages
    this._playerData.updatePity(this.pity5, this.pity4);
    return results;
  }

  /* ── Tirage unique avec pity ── */
  _singlePull(index, total, banner = null) {
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
    // Tirage aléatoire selon les taux (avec bonus bannière)
    else {
      rarity = this._rollRarity(banner);
    }

    // Réinitialise les pity selon la rareté obtenue
    if (rarity === 5) { this.pity5 = 0; this.pity4 = 0; }
    if (rarity === 4) { this.pity4 = 0; }

    return this._pickCharacter(rarity, banner);
  }

  /* ── Détermine la rareté par tirage aléatoire ── */
  _rollRarity(banner = null) {
    // Taux de base 5★ (0.7%)
    let rate5 = RARITIES[5].rate;

    // Bonus bannière événement : multiplicateur de taux
    if (banner?.rateUpMult > 1) {
      rate5 = rate5 * banner.rateUpMult;
    }

    // Soft pity 5★ : à partir du pull 74, le taux augmente de +6% par pull
    if (this.pity5 >= 74) {
      const extra = (this.pity5 - 73) * 0.06;
      rate5 = Math.min(rate5 + extra, 1);
    }

    const rate4 = RARITIES[4].rate; // 6% base (inchangé)
    const roll  = Math.random();

    if (roll < rate5)           return 5;
    if (roll < rate5 + rate4)   return 4;
    return 3;
  }

  /* ── Sélectionne un personnage de la rareté donnée ── */
  _pickCharacter(rarity, banner = null) {
    // Système 50/50 pour bannières événement avec personnage vedette
    if (rarity === 5 && banner?.guarantee5050 && banner?.featuredId) {
      const lostKey  = banner.id;
      const lostLast = this._playerData.bannerLostLast?.[lostKey] ?? false;

      // Si le joueur avait perdu le 50/50 précédemment → vedette garantie
      // Sinon tirage au sort 50/50
      const getFeatured = lostLast || Math.random() < 0.5;

      if (getFeatured) {
        // Succès — vedette obtenue, réinitialise le flag
        this._playerData.bannerLostLast = {
          ...(this._playerData.bannerLostLast ?? {}),
          [lostKey]: false,
        };
        this._playerData._saveProgress();
        const featured = CHARACTERS.find(c => c.id === banner.featuredId);
        if (featured) return featured;
      } else {
        // Perdu le 50/50 — marquer pour le prochain 5★
        this._playerData.bannerLostLast = {
          ...(this._playerData.bannerLostLast ?? {}),
          [lostKey]: true,
        };
        this._playerData._saveProgress();
        // Continue vers la sélection normale dans le pool 5★
      }
    }

    const pool = CHARACTERS.filter(c => c.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ── Garantit au moins une rareté minimum ── */
  _pullAtLeastRarity(minRarity, banner = null) {
    const rarity = Math.max(this._rollRarity(banner), minRarity);
    return this._pickCharacter(rarity, banner);
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
