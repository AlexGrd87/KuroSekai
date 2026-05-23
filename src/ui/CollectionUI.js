/**
 * CollectionUI.js
 * Écran de collection KuroSekai.
 *
 * Fonctionnalités :
 *  - Grille de personnages (possédés = couleur, non possédés = silhouette)
 *  - Filtres par rareté et par élément
 *  - Modale centrée au clic : carte full design + stats animées + skills + lore
 *  - Transition GSAP depuis/vers le menu
 */

import { gsap }                      from 'gsap';
import { CHARACTERS, RARITIES }      from '../data/characters.js';

/* ── Icônes SVG par classe de personnage ── */
const CLASS_ICONS = {
  Shinigami: `
    <path d="M62 20 Q18 28 28 68 Q38 54 50 58" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>
    <line x1="50" y1="58" x2="68" y2="84" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>
    <line x1="60" y1="74" x2="74" y2="70" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="62" cy="20" r="4" fill="currentColor"/>`,
  Gardien: `
    <path d="M50 18 L72 30 L72 54 Q72 72 50 83 Q28 72 28 54 L28 30 Z" fill="none" stroke="currentColor" stroke-width="2.6"/>
    <line x1="50" y1="34" x2="50" y2="68" stroke="currentColor" stroke-width="1.8" opacity="0.7"/>
    <line x1="36" y1="51" x2="64" y2="51" stroke="currentColor" stroke-width="1.8" opacity="0.7"/>`,
  Guerrier: `
    <line x1="33" y1="24" x2="67" y2="76" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="67" y1="24" x2="33" y2="76" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="26" y1="38" x2="40" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="74" y1="38" x2="60" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  Assassin: `
    <path d="M50 16 L54 52 L50 58 L46 52 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <line x1="50" y1="58" x2="50" y2="78" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <line x1="41" y1="66" x2="59" y2="66" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="40" y1="46" x2="60" y2="46" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  Soutien: `
    <line x1="50" y1="22" x2="50" y2="78" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
    <line x1="24" y1="48" x2="76" y2="48" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="50" cy="48" r="6" fill="currentColor"/>
    <circle cx="50" cy="48" r="11" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>`,
  Tireur: `
    <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="50" cy="50" r="13" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <circle cx="50" cy="50" r="3.5" fill="currentColor"/>
    <line x1="50" y1="20" x2="50" y2="26" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="50" y1="74" x2="50" y2="80" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="20" y1="50" x2="26" y2="50" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="74" y1="50" x2="80" y2="50" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  Tank: `
    <path d="M50 16 L76 30 L80 58 L50 84 L20 58 L24 30 Z" fill="none" stroke="currentColor" stroke-width="2.6"/>
    <path d="M50 28 L66 37 L68 56 L50 70 L32 56 L34 37 Z" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.55"/>
    <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.7"/>`,
  Mage: `
    <line x1="50" y1="30" x2="50" y2="80" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M50 18 L53 26 L62 26 L55 32 L58 40 L50 35 L42 40 L45 32 L38 26 L47 26 Z" fill="currentColor" opacity="0.9"/>
    <line x1="40" y1="72" x2="60" y2="72" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="44" y1="78" x2="56" y2="78" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
};

const ELEMENT_DATA = {
  Fire:    { color: '#ff5500', glow: '#ff2200', kanji: '火' },
  Dark:    { color: '#8800ff', glow: '#5500cc', kanji: '闇' },
  Wind:    { color: '#00cc66', glow: '#00ff88', kanji: '風' },
  Water:   { color: '#0099cc', glow: '#00ccff', kanji: '水' },
  Thunder: { color: '#cccc00', glow: '#ffff00', kanji: '雷' },
  Earth:   { color: '#886600', glow: '#bbaa00', kanji: '土' },
  Light:   { color: '#ccccff', glow: '#ffffff', kanji: '光' },
  Void:    { color: '#cc00ff', glow: '#880099', kanji: '虚' },
  Neutral: { color: '#99aacc', glow: '#667799', kanji: '無' },
};

export class CollectionUI {
  constructor(playerData) {
    this.playerData    = playerData;
    this.screen        = document.getElementById('collection-screen');
    this.grid          = document.getElementById('col-grid');
    this.modal         = document.getElementById('col-modal');
    this.modalCardWrap = document.getElementById('col-modal-card-wrap');
    this._activeFilter  = 'all';
    this._activeElement = 'all';
    this._tiltCleanup   = null;

    this._bindFilters();
    this._bindBack();
    this._bindModalClose();
  }

  /* ════════════════════════════════
     AFFICHAGE / MASQUAGE DE L'ÉCRAN
  ════════════════════════════════ */

  show() {
    this._updateCount();
    this._buildGrid();

    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 30 });
    gsap.to(this.screen, {
      opacity: 1, y: 0, duration: 0.45, ease: 'power3.out',
      onComplete: () => {
        gsap.from('.col-card', {
          opacity: 0, scale: 0.88, y: 20,
          stagger: 0.04, duration: 0.35, ease: 'back.out(1.4)',
        });
      },
    });
  }

  hide() {
    this._closeModal();
    gsap.to(this.screen, {
      opacity: 0, y: 20, duration: 0.3, ease: 'power2.in',
      onComplete: () => { this.screen.style.display = 'none'; },
    });
  }

  /* ════════════════════════════════
     GRILLE
  ════════════════════════════════ */

  _buildGrid() {
    this.grid.innerHTML = '';

    const filtered = CHARACTERS.filter(c => {
      const rarOk = this._activeFilter  === 'all' || String(c.rarity)  === this._activeFilter;
      const elOk  = this._activeElement === 'all' || c.element === this._activeElement;
      return rarOk && elOk;
    });

    filtered.sort((a, b) => {
      const ownA = this.playerData.has(a.id) ? 1 : 0;
      const ownB = this.playerData.has(b.id) ? 1 : 0;
      if (ownA !== ownB) return ownB - ownA;
      return b.rarity - a.rarity;
    });

    filtered.forEach(char => {
      const owned  = this.playerData.has(char.id);
      const copies = this.playerData.countOf(char.id);
      const el     = ELEMENT_DATA[char.element] || ELEMENT_DATA.Neutral;
      const rar    = RARITIES[char.rarity];
      const stars  = '★'.repeat(char.rarity) + '☆'.repeat(5 - char.rarity);

      const card = document.createElement('div');
      card.className   = `col-card${owned ? ' col-card--owned' : ' col-card--locked'}`;
      card.dataset.id  = char.id;

      card.innerHTML = `
        <div class="col-card-bg"
             style="--card-el-color:${el.color};--card-el-glow:${el.glow};--card-rarity-color:${rar.color}">
          <div class="col-card-el-badge">${el.kanji}</div>
          ${copies > 1 ? `<div class="col-card-copies">×${copies}</div>` : ''}
          <div class="col-card-portrait">
            ${owned
              ? this._buildPortraitSVG(char)
              : '<span class="col-card-initial">?</span>'}
          </div>
          <div class="col-card-footer">
            <div class="col-card-stars" style="color:${rar.color}">${stars}</div>
            <div class="col-card-name">${owned ? char.name : '???'}</div>
            <div class="col-card-class">${owned ? char.class : '——'}</div>
          </div>
          ${!owned ? '<div class="col-card-lock">🔒</div>' : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        if (owned) this._openModal(char);
        else       this._shakeCard(card);
      });

      this.grid.appendChild(card);
    });
  }

  /* ════════════════════════════════
     MODALE
  ════════════════════════════════ */

  _openModal(char) {
    const el  = ELEMENT_DATA[char.element] || ELEMENT_DATA.Neutral;
    const rar = RARITIES[char.rarity];
    const copies = this.playerData.countOf(char.id);

    /* -- Variables CSS de couleur -- */
    this.modal.style.setProperty('--det-el-color',  el.color);
    this.modal.style.setProperty('--det-el-glow',   el.glow);
    this.modal.style.setProperty('--det-rar-color',  rar.color);

    /* -- Contenu textuel -- */
    document.getElementById('det-stars').textContent   = '★'.repeat(char.rarity);
    document.getElementById('det-stars').style.color   = rar.color;
    document.getElementById('det-name').textContent    = char.name;
    document.getElementById('det-title-text').textContent = char.title;
    document.getElementById('det-class').textContent   = char.class;
    document.getElementById('det-el').textContent      = `${el.kanji} ${char.element}`;
    document.getElementById('det-el').style.color      = el.color;
    document.getElementById('det-copies').textContent  = copies > 1
      ? `Possédé — ${copies} exemplaires`
      : 'Possédé';
    document.getElementById('det-copies').style.color  = rar.color;
    document.getElementById('det-skill1-name').textContent = char.skills[0].name;
    document.getElementById('det-skill1-desc').textContent = char.skills[0].desc;
    document.getElementById('det-skill2-name').textContent = char.skills[1].name;
    document.getElementById('det-skill2-desc').textContent = char.skills[1].desc;
    document.getElementById('det-desc').textContent    = char.description;
    document.getElementById('det-lore').textContent    = char.lore;

    /* -- Carte full design -- */
    this._buildModalCard(char);

    /* -- Affichage modale -- */
    gsap.set(this.modal, { display: 'flex' });
    const box = document.getElementById('col-modal-box');
    gsap.fromTo(this.modal,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: 'power2.out' }
    );
    gsap.fromTo(box,
      { scale: 0.88, y: 20 },
      { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' }
    );

    /* -- Stats animées -- */
    const maxStats = { hp: 12000, atk: 1700, def: 1800, spd: 180 };
    [
      ['hp',  char.stats.hp,  maxStats.hp],
      ['atk', char.stats.atk, maxStats.atk],
      ['def', char.stats.def, maxStats.def],
      ['spd', char.stats.spd, maxStats.spd],
    ].forEach(([stat, val, max], i) => {
      const bar = document.getElementById(`det-${stat}-bar`);
      const txt = document.getElementById(`det-${stat}-val`);
      if (!bar) return;
      bar.style.background = el.color;
      bar.style.boxShadow  = `0 0 8px ${el.glow}`;
      gsap.fromTo(bar, { width: '0%' }, {
        width: `${Math.min((val / max) * 100, 100)}%`,
        duration: 0.65, ease: 'power2.out', delay: 0.35 + i * 0.08,
      });
      if (txt) txt.textContent = stat === 'spd' ? val : val.toLocaleString();
    });

    /* -- Stagger des blocs de droite -- */
    const infoSections = ['#det-header', '#det-stats', '#det-skills', '#det-lore-block'];
    gsap.fromTo(infoSections.map(s => document.querySelector(s)).filter(Boolean),
      { opacity: 0, x: 18 },
      { opacity: 1, x: 0, stagger: 0.07, duration: 0.35, ease: 'power2.out', delay: 0.15 }
    );
  }

  _closeModal() {
    if (!this.modal || this.modal.style.display === 'none') return;
    if (this._tiltCleanup) { this._tiltCleanup(); this._tiltCleanup = null; }
    gsap.to(this.modal, {
      opacity: 0, duration: 0.22, ease: 'power2.in',
      onComplete: () => {
        this.modal.style.display = 'none';
        if (this.modalCardWrap) this.modalCardWrap.innerHTML = '';
      },
    });
  }

  /* ════════════════════════════════
     CARTE FULL DESIGN DANS LA MODALE
  ════════════════════════════════ */

  _buildModalCard(char) {
    if (!this.modalCardWrap) return;
    this.modalCardWrap.innerHTML = '';

    const rar    = RARITIES[char.rarity];
    const el     = ELEMENT_DATA[char.element] || ELEMENT_DATA.Neutral;
    const stars  = '★'.repeat(char.rarity);
    const empty  = '★'.repeat(5 - char.rarity);
    const sym    = el.kanji;

    const card = document.createElement('div');
    card.className = `summon-card rarity-${char.rarity}`;
    card.dataset.rarity = char.rarity;
    card.style.setProperty('--card-color',  rar.color);
    card.style.setProperty('--card-glow',   rar.glow);
    card.style.setProperty('--elem-color',  el.color);
    card.style.setProperty('--elem-glow',   el.glow);

    card.innerHTML = `
      <div class="card-holo"></div>
      <div class="card-scanline"></div>
      <div class="card-corner card-corner--tl"></div>
      <div class="card-corner card-corner--tr"></div>
      <div class="card-corner card-corner--bl"></div>
      <div class="card-corner card-corner--br"></div>
      <div class="card-portrait">
        <div class="card-portrait-bg"></div>
        <div class="card-circuit">
          <div class="circuit-h circuit-h1"></div>
          <div class="circuit-h circuit-h2"></div>
          <div class="circuit-v circuit-v1"></div>
        </div>
        <div class="card-element-bg">${sym}</div>
        ${this._buildPortraitSVG(char, 'card')}
        <div class="card-rarity-badge">
          <span class="stars-lit">${stars}</span><span class="stars-dim">${empty}</span>
        </div>
        <div class="card-portrait-foot">
          <span class="card-elem-tag">${char.element}</span>
          <span class="card-class-tag">${char.class}</span>
        </div>
      </div>
      <div class="card-info">
        <div class="card-accent-line"></div>
        <div class="card-rarity-label">${rar.label}</div>
        <div class="card-name">${char.name}</div>
        <div class="card-title-text">${char.title}</div>
        <div class="card-info-foot">
          <div class="card-id">ID_${char.id.toUpperCase()}</div>
          <div class="card-dot"></div>
        </div>
      </div>
    `;

    this.modalCardWrap.appendChild(card);

    /* Flip d'entrée */
    gsap.fromTo(card,
      { rotateY: -90, opacity: 0 },
      { rotateY: 0, opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.1,
        transformPerspective: 900 }
    );

    /* Glow pulse pour 5★ */
    if (char.rarity >= 5) {
      gsap.to(card, {
        filter: `drop-shadow(0 0 14px ${rar.glow}) brightness(1.08)`,
        duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut',
      });
    }

    /* Tilt 3D */
    const onMove = e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(card, { rotateY: x * 20, rotateX: -y * 20, duration: 0.3, ease: 'power2.out', transformPerspective: 900 });
      const holo = card.querySelector('.card-holo');
      if (holo) holo.style.backgroundPosition = `${(x + 0.5) * 100}% ${(y + 0.5) * 100}%`;
    };
    const onLeave = () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power3.out' });

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    this._tiltCleanup = () => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
    };
  }

  /* ════════════════════════════════
     SVG PORTRAIT GÉNÉRATIF
  ════════════════════════════════ */

  _buildPortraitSVG(char, variant = 'grid') {
    const el   = ELEMENT_DATA[char.element] || ELEMENT_DATA.Neutral;
    const icon = CLASS_ICONS[char.class]    || CLASS_ICONS.Guerrier;
    const uid  = `${char.id}-${variant}`;

    // Étoiles rareté (petits points en bas du SVG, sur variante grid seulement)
    const rarDots = variant === 'grid'
      ? Array.from({ length: char.rarity }, (_, i) =>
          `<circle cx="${50 - (char.rarity - 1) * 5 + i * 10}" cy="91" r="2.2" fill="${el.color}" opacity="0.85"/>`
        ).join('')
      : '';

    return `
      <svg class="char-portrait-svg char-portrait-svg--${variant}"
           viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pg-${uid}" cx="50%" cy="38%" r="62%">
            <stop offset="0%"   stop-color="${el.color}" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="${el.color}" stop-opacity="0"/>
          </radialGradient>
          <filter id="glow-${uid}" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- Fond radial élément -->
        <rect width="100" height="100" fill="url(#pg-${uid})"/>

        <!-- Lignes circuit décoratives -->
        <g stroke="${el.color}" stroke-width="0.5" fill="none" opacity="0.18">
          <polyline points="8,22 22,22 22,10"/>
          <polyline points="92,78 78,78 78,90"/>
          <polyline points="8,65 8,80 20,80"/>
          <polyline points="92,35 92,20 80,20"/>
          <line x1="28" y1="22" x2="38" y2="22"/>
          <line x1="62" y1="78" x2="72" y2="78"/>
        </g>

        <!-- Kanji élément en filigrane -->
        <text x="50" y="64" text-anchor="middle"
              font-size="54" fill="${el.color}" opacity="0.07"
              font-family="serif" font-weight="900">${el.kanji}</text>

        <!-- Icône de classe avec filtre glow -->
        <g color="${el.color}" filter="url(#glow-${uid})">
          ${icon}
        </g>

        <!-- Dots rareté -->
        ${rarDots}
      </svg>`;
  }

  /* ════════════════════════════════
     HELPERS
  ════════════════════════════════ */

  _shakeCard(card) {
    gsap.to(card, { x: -8, duration: 0.05, yoyo: true, repeat: 5, ease: 'none',
      onComplete: () => gsap.set(card, { x: 0 }) });
  }

  _updateCount() {
    const el = document.getElementById('col-count');
    if (el) el.textContent = `${this.playerData.uniqueCount()} / ${CHARACTERS.length}`;
  }

  _bindFilters() {
    document.querySelectorAll('.col-filter-rar').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.col-filter-rar').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._activeFilter = btn.dataset.filter;
        this._closeModal();
        this._buildGrid();
        gsap.from('.col-card', { opacity: 0, scale: 0.9, stagger: 0.03, duration: 0.25, ease: 'power2.out' });
      });
    });
    document.querySelectorAll('.col-filter-el').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.col-filter-el').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._activeElement = btn.dataset.element;
        this._closeModal();
        this._buildGrid();
        gsap.from('.col-card', { opacity: 0, scale: 0.9, stagger: 0.03, duration: 0.25, ease: 'power2.out' });
      });
    });
  }

  _bindBack() {
    document.getElementById('col-back')?.addEventListener('click', () => this.hide());
  }

  _bindModalClose() {
    document.getElementById('col-modal-close')?.addEventListener('click', () => this._closeModal());
    document.getElementById('col-modal-backdrop')?.addEventListener('click', () => this._closeModal());
  }
}
