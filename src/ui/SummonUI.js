/**
 * SummonUI.js
 * Écran d'invocation complet — le cœur du gacha.
 *
 * Flow :
 *  1. Écran d'invocation avec boutons x1 et x10
 *  2. Animation flash + transition
 *  3. Révélation des cartes une par une (ou toutes en x10)
 *  4. Effets spéciaux selon la rareté (glow, particules CSS)
 *  5. Bouton retour vers le menu
 */

import { gsap } from 'gsap';
import { GachaEngine } from '../gacha/GachaEngine.js';
import { RARITIES } from '../data/characters.js';

export class SummonUI {
  constructor() {
    this.engine  = new GachaEngine();
    this.overlay = null; // div principale de l'écran de summon
    this.isAnimating = false;
    this._build();
  }

  /* ── Construit le DOM de l'écran d'invocation ── */
  _build() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'summon-screen';
    this.overlay.innerHTML = `
      <div id="summon-bg-flash"></div>

      <!-- Header -->
      <div id="summon-header">
        <button id="summon-back">← Retour</button>
        <h2 id="summon-title">
          <span class="s-kanji">召喚</span>
          <span class="s-roman">INVOCATION</span>
        </h2>
        <div id="pity-display">
          <span id="pity5-txt">5★ dans <b>90</b> pulls</span>
          <span id="pity4-txt">4★ dans <b>10</b> pulls</span>
        </div>
      </div>

      <!-- Zone de résultats (cartes) -->
      <div id="cards-area"></div>

      <!-- Boutons de pull -->
      <div id="summon-actions">
        <button class="pull-btn" id="pull-x1">
          <span class="pull-count">×1</span>
          <span class="pull-label">INVOQUER</span>
        </button>
        <button class="pull-btn pull-x10" id="pull-x10">
          <span class="pull-count">×10</span>
          <span class="pull-label">INVOQUER</span>
          <span class="pull-guarantee">3★ GARANTI</span>
        </button>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this._bindEvents();
  }

  /* ── Lie les boutons aux actions ── */
  _bindEvents() {
    this.overlay.querySelector('#summon-back').addEventListener('click', () => this.hide());
    this.overlay.querySelector('#pull-x1').addEventListener('click', () => this._doPull(1));
    this.overlay.querySelector('#pull-x10').addEventListener('click', () => this._doPull(10));
  }

  /* ── Lance un tirage et anime la révélation ── */
  async _doPull(count) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const results = this.engine.pull(count);
    this._updatePityDisplay();

    // Détermine la meilleure rareté pour calibrer l'effet flash
    const bestRarity = Math.max(...results.map(r => r.rarity));

    await this._playFlash(bestRarity);
    await this._revealCards(results);

    this.isAnimating = false;
  }

  /* ── Animation de flash lumineuse avant la révélation ── */
  _playFlash(bestRarity) {
    return new Promise(resolve => {
      const flash = this.overlay.querySelector('#summon-bg-flash');
      const color = RARITIES[bestRarity].glow;

      // Flash plus dramatique pour les hautes raretés
      const duration = bestRarity >= 4 ? 0.8 : 0.4;

      gsap.timeline({ onComplete: resolve })
        .set(flash, { background: color, opacity: 0 })
        .to(flash, { opacity: bestRarity >= 5 ? 1 : 0.7, duration: duration * 0.4, ease: 'power2.in' })
        .to(flash, { opacity: 0, duration: duration * 0.6, ease: 'power2.out' });
    });
  }

  /* ── Affiche et anime les cartes une par une ── */
  async _revealCards(results) {
    const area = this.overlay.querySelector('#cards-area');
    area.innerHTML = '';

    // Adapte la taille des cartes selon le nombre
    area.dataset.count = results.length;

    const cards = results.map(char => this._createCard(char));
    cards.forEach(card => area.appendChild(card));

    // Animation d'entrée en cascade
    const delay = results.length === 1 ? 0 : 0.08;

    for (let i = 0; i < cards.length; i++) {
      await new Promise(resolve => {
        gsap.fromTo(cards[i],
          { y: 60, opacity: 0, scale: 0.85, rotateY: 90 },
          {
            y: 0, opacity: 1, scale: 1, rotateY: 0,
            duration: results.length === 1 ? 0.7 : 0.45,
            ease: 'back.out(1.4)',
            delay: results.length === 1 ? 0 : i * delay,
            onComplete: () => {
              // Effet glow pulsant sur les hautes raretés
              if (cards[i].dataset.rarity >= 4) {
                this._addGlowPulse(cards[i]);
              }
              resolve();
            }
          }
        );
      });
      // Pour le pull x10, on n'attend pas chaque carte individuellement
      if (results.length > 1 && i === 0) break;
    }

    // Pour x10 : on anime tout en même temps après le premier
    if (results.length > 1) {
      await new Promise(resolve => {
        gsap.fromTo(cards.slice(1),
          { y: 60, opacity: 0, scale: 0.85, rotateY: 90 },
          {
            y: 0, opacity: 1, scale: 1, rotateY: 0,
            duration: 0.45,
            ease: 'back.out(1.4)',
            stagger: delay,
            onComplete: () => {
              cards.forEach(card => {
                if (card.dataset.rarity >= 4) this._addGlowPulse(card);
              });
              resolve();
            }
          }
        );
      });
    }
  }

  /* ── Crée l'élément DOM d'une carte personnage ── */
  _createCard(char) {
    const rarity   = RARITIES[char.rarity];
    const stars    = '★'.repeat(char.rarity) + '☆'.repeat(5 - char.rarity);
    const card     = document.createElement('div');
    card.className = 'summon-card';
    card.dataset.rarity = char.rarity;

    card.style.setProperty('--card-color', rarity.color);
    card.style.setProperty('--card-glow',  rarity.glow);

    card.innerHTML = `
      <div class="card-inner">
        <!-- Bordure lumineuse de rareté -->
        <div class="card-border"></div>

        <!-- Portrait (placeholder jusqu'aux vrais sprites) -->
        <div class="card-portrait" style="background: linear-gradient(135deg, #0a0e18 0%, ${rarity.glow}33 100%)">
          <div class="card-class-icon">${this._classIcon(char.class)}</div>
          <div class="card-initial">${char.name.charAt(0)}</div>
        </div>

        <!-- Infos personnage -->
        <div class="card-info">
          <div class="card-rarity-label" style="color: ${rarity.color}">${rarity.label}</div>
          <div class="card-stars">${stars}</div>
          <div class="card-name">${char.name}</div>
          <div class="card-title">${char.title}</div>
          <div class="card-class">${char.class} · ${char.element}</div>
        </div>
      </div>
    `;

    return card;
  }

  /* ── Icône selon la classe du personnage ── */
  _classIcon(cls) {
    const icons = {
      'Shinigami': '⚡', 'Guerrier': '⚔', 'Assassin': '🗡',
      'Mage': '✦', 'Tireur': '◎', 'Tank': '🛡', 'Soutien': '✚', 'Gardien': '⬡',
    };
    return icons[cls] || '◆';
  }

  /* ── Effet de glow pulsant pour les raretés 4★+ ── */
  _addGlowPulse(card) {
    gsap.to(card, {
      filter: `drop-shadow(0 0 20px var(--card-glow)) drop-shadow(0 0 40px var(--card-glow))`,
      duration: 0.8,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
  }

  /* ── Met à jour l'affichage du pity ── */
  _updatePityDisplay() {
    const { next5Guaranteed, next4Guaranteed } = this.engine.getPityInfo();
    const p5 = this.overlay.querySelector('#pity5-txt b');
    const p4 = this.overlay.querySelector('#pity4-txt b');
    if (p5) p5.textContent = next5Guaranteed;
    if (p4) p4.textContent = next4Guaranteed;
  }

  /* ── Affiche l'écran avec animation d'entrée ── */
  show() {
    this.overlay.style.display = 'flex';
    this.overlay.querySelector('#cards-area').innerHTML = '';
    this._updatePityDisplay();
    gsap.fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  }

  /* ── Cache l'écran avec animation de sortie ── */
  hide() {
    gsap.to(this.overlay, {
      opacity: 0, duration: 0.3,
      onComplete: () => { this.overlay.style.display = 'none'; }
    });
  }
}
