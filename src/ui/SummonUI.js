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
        <div style="width:120px"></div>
      </div>

      <!-- Zone de résultats (cartes) -->
      <div id="cards-area"></div>

      <!-- Pity + Boutons de pull regroupés en bas -->
      <div id="summon-bottom">

        <!-- Compteurs de pity au-dessus des boutons -->
        <div id="pity-display">
          <div class="pity-bar">
            <span class="pity-label">5★ LÉGENDAIRE</span>
            <div class="pity-track">
              <div class="pity-fill pity-fill-5" id="pity5-bar"></div>
            </div>
            <span class="pity-count" id="pity5-txt">90</span>
          </div>
          <div class="pity-bar">
            <span class="pity-label">4★ ÉPIQUE</span>
            <div class="pity-track">
              <div class="pity-fill pity-fill-4" id="pity4-bar"></div>
            </div>
            <span class="pity-count" id="pity4-txt">10</span>
          </div>
        </div>

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

    // Sauvegarde chaque personnage tiré dans la collection du joueur
    results.forEach(char => {
      document.dispatchEvent(new CustomEvent('kuro:character-obtained', { detail: { id: char.id } }));
    });

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

  /* ── Crée une carte au design cyberpunk détaillé ── */
  _createCard(char) {
    const rarity  = RARITIES[char.rarity];
    const stars   = '★'.repeat(char.rarity);
    const empties = '★'.repeat(5 - char.rarity);
    const elColor = this._elementColor(char.element);
    const card    = document.createElement('div');

    card.className       = `summon-card rarity-${char.rarity}`;
    card.dataset.rarity  = char.rarity;
    card.style.setProperty('--card-color',   rarity.color);
    card.style.setProperty('--card-glow',    rarity.glow);
    card.style.setProperty('--elem-color',   elColor.main);
    card.style.setProperty('--elem-glow',    elColor.glow);

    card.innerHTML = `
      <!-- Shimmer holographique (visible au hover) -->
      <div class="card-holo"></div>

      <!-- Ligne de scan (cyberpunk) -->
      <div class="card-scanline"></div>

      <!-- Coins décoratifs -->
      <div class="card-corner card-corner--tl"></div>
      <div class="card-corner card-corner--tr"></div>
      <div class="card-corner card-corner--bl"></div>
      <div class="card-corner card-corner--br"></div>

      <!-- Portrait (zone haute de la carte) -->
      <div class="card-portrait">
        <!-- Fond gradient par élément -->
        <div class="card-portrait-bg"></div>

        <!-- Lignes circuit déco -->
        <div class="card-circuit">
          <div class="circuit-h circuit-h1"></div>
          <div class="circuit-h circuit-h2"></div>
          <div class="circuit-v circuit-v1"></div>
        </div>

        <!-- Grand symbole d'élément -->
        <div class="card-element-bg">${this._elementSymbol(char.element)}</div>

        <!-- Initiale du personnage (placeholder sprite) -->
        <div class="card-initial">${char.name.charAt(0)}</div>

        <!-- Badge de rareté en bas du portrait -->
        <div class="card-rarity-badge">
          <span class="stars-lit">${stars}</span><span class="stars-dim">${empties}</span>
        </div>

        <!-- Bande déco bas portrait -->
        <div class="card-portrait-foot">
          <span class="card-elem-tag">${char.element}</span>
          <span class="card-class-tag">${char.class}</span>
        </div>
      </div>

      <!-- Zone infos personnage -->
      <div class="card-info">
        <!-- Ligne accent rareté -->
        <div class="card-accent-line"></div>

        <div class="card-rarity-label">${rarity.label}</div>
        <div class="card-name">${char.name}</div>
        <div class="card-title-text">${char.title}</div>

        <!-- Ligne déco bas -->
        <div class="card-info-foot">
          <div class="card-id">ID_${char.id.toUpperCase()}</div>
          <div class="card-dot"></div>
        </div>
      </div>
    `;

    // Effet tilt 3D au survol de la souris
    this._addTiltEffect(card);
    return card;
  }

  /* ── Tilt 3D dynamique selon la position de la souris ── */
  _addTiltEffect(card) {
    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const x   = (e.clientX - r.left) / r.width  - 0.5; // -0.5 à 0.5
      const y   = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(card, {
        rotateY: x * 18,
        rotateX: -y * 18,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 800,
      });
      // Déplace le reflet holographique selon la souris
      const holo = card.querySelector('.card-holo');
      if (holo) {
        holo.style.backgroundPosition = `${(x + 0.5) * 100}% ${(y + 0.5) * 100}%`;
      }
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power3.out' });
    });
  }

  /* ── Couleur par élément pour le portrait ── */
  _elementColor(el) {
    const map = {
      Fire:    { main: '#ff5500', glow: '#ff2200' },
      Dark:    { main: '#8800ff', glow: '#5500cc' },
      Wind:    { main: '#00ffaa', glow: '#00cc88' },
      Water:   { main: '#00aaff', glow: '#0077cc' },
      Thunder: { main: '#ffee00', glow: '#ccaa00' },
      Earth:   { main: '#886600', glow: '#554400' },
      Light:   { main: '#ffffcc', glow: '#ffdd88' },
      Void:    { main: '#cc00ff', glow: '#880099' },
      Neutral: { main: '#99aacc', glow: '#667799' },
    };
    return map[el] || map.Neutral;
  }

  /* ── Grand symbole d'élément pour le fond portrait ── */
  _elementSymbol(el) {
    const map = {
      Fire: '火', Dark: '闇', Wind: '風', Water: '水',
      Thunder: '雷', Earth: '土', Light: '光', Void: '虚', Neutral: '無',
    };
    return map[el] || '？';
  }

  /* ── Icône classe (conservé pour compatibilité) ── */
  _classIcon(cls) {
    const icons = {
      'Shinigami': '⚡', 'Guerrier': '⚔', 'Assassin': '🗡',
      'Mage': '✦', 'Tireur': '◎', 'Tank': '🛡', 'Soutien': '✚', 'Gardien': '⬡',
    };
    return icons[cls] || '◆';
  }

  /* ── Glow pulsant pour 4★ et 5★ ── */
  _addGlowPulse(card) {
    const rarity = parseInt(card.dataset.rarity);
    if (rarity === 5) {
      // 5★ : effet de lumière plus dramatique avec double couche
      gsap.to(card, {
        filter: `drop-shadow(0 0 25px var(--card-glow)) drop-shadow(0 0 60px var(--card-glow)) brightness(1.1)`,
        duration: 1.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
    } else {
      gsap.to(card, {
        filter: `drop-shadow(0 0 14px var(--card-glow)) drop-shadow(0 0 28px var(--card-glow))`,
        duration: 0.9,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
    }
  }

  /* ── Met à jour le pity : compteurs + barres de progression ── */
  _updatePityDisplay() {
    const { pity5, pity4, next5Guaranteed, next4Guaranteed } = this.engine.getPityInfo();

    const txt5  = this.overlay.querySelector('#pity5-txt');
    const txt4  = this.overlay.querySelector('#pity4-txt');
    const bar5  = this.overlay.querySelector('#pity5-bar');
    const bar4  = this.overlay.querySelector('#pity4-bar');

    if (txt5) txt5.textContent = next5Guaranteed;
    if (txt4) txt4.textContent = next4Guaranteed;

    // Largeur de la barre = progression vers la garantie
    if (bar5) gsap.to(bar5, { width: `${(pity5 / 90) * 100}%`, duration: 0.4, ease: 'power2.out' });
    if (bar4) gsap.to(bar4, { width: `${(pity4 / 10) * 100}%`, duration: 0.4, ease: 'power2.out' });
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
