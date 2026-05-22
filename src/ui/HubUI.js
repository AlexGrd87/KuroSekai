/**
 * HubUI.js — Écran d'accueil / navigation centrale de KuroSekai.
 *
 * Deux vues à l'intérieur de #hub-screen :
 *   #hub-home      → icônes de navigation + ressources (vue par défaut)
 *   #hub-map-panel → carte des stages (ouverte via COMBAT, slide-up)
 */

import { gsap }   from 'gsap';
import { STAGES } from '../data/enemies.js';

export class HubUI {
  constructor(playerData, onDeploy, onSummon, onCollection, onSettings, onCampaign) {
    this.playerData   = playerData;
    this.onDeploy     = onDeploy;
    this.onSummon     = onSummon;
    this.onCollection = onCollection;
    this.onSettings   = onSettings;
    this.onCampaign   = onCampaign;

    this.screen      = document.getElementById('hub-screen');
    this.homeView    = document.getElementById('hub-home');
    this.mapPanel    = document.getElementById('hub-map-panel');
    this.mapWrap     = document.getElementById('hub-map-wrap');
    this.detailPanel = document.getElementById('hub-detail');

    this._activeStage = null;

    this._bindEvents();
  }

  _bindEvents() {
    // Bâtiments cliquables
    document.getElementById('hub-bld-combat')
      ?.addEventListener('click', () => {
        if (this.onCampaign) this.onCampaign(() => this._openMap());
        else this._openMap();
      });
    document.getElementById('hub-bld-summon')
      ?.addEventListener('click', () => { this.hide(); this.onSummon?.(); });
    document.getElementById('hub-bld-collection')
      ?.addEventListener('click', () => { this.hide(); this.onCollection?.(); });
    document.getElementById('hub-bld-settings')
      ?.addEventListener('click', () => { this.hide(); this.onSettings?.(); });

    // Carte des stages
    document.getElementById('hub-map-back-btn')
      ?.addEventListener('click', () => this._closeMap());
    document.getElementById('hd-close-btn')
      ?.addEventListener('click', () => this._closeDetail());
    document.getElementById('hd-deploy-btn')
      ?.addEventListener('click', () => this._deploy());
  }

  /* ══════════════════════════════════════
     SHOW / HIDE / REFRESH
  ══════════════════════════════════════ */

  /** Affiche le hub-home (vue icônes). */
  show() {
    this._updateStats();

    gsap.set(this.screen,   { display: 'flex', opacity: 0 });
    gsap.set(this.homeView, { display: 'flex', opacity: 1 });
    gsap.set(this.mapPanel, { display: 'none' });

    gsap.to(this.screen, { opacity: 1, duration: 0.4, ease: 'power2.out' });

    // Lune + ciel
    gsap.fromTo('#hub-moon',
      { opacity: 0, scale: 0.7 },
      { opacity: 1, scale: 1, duration: 0.9, delay: 0.1, ease: 'power2.out' });

    // Bâtiments qui montent depuis le sol
    gsap.fromTo('.hub-bld',
      { opacity: 0, y: 55, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.1,
        delay: 0.2, ease: 'power3.out' });
  }

  /** Masque le hub (navigation vers un autre écran plein-écran). */
  hide() {
    this._closeDetail();
    gsap.to(this.screen, {
      opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => gsap.set(this.screen, { display: 'none' }),
    });
  }

  /** Rafraîchit les stats et ré-affiche le hub-home si caché. */
  refresh() {
    this._updateStats();
    const hidden = !this.screen.style.display || this.screen.style.display === 'none';
    if (hidden) this.show();
  }

  /* ══════════════════════════════════════
     NAVIGATION HOME ↔ CARTE
  ══════════════════════════════════════ */

  _openMap() {
    this._buildMap();
    this._updateStats();

    // Slide-up du panneau carte depuis le bas
    gsap.set(this.mapPanel, { display: 'flex', y: '100%', opacity: 0 });
    gsap.to(this.homeView, {
      opacity: 0, duration: 0.18, ease: 'power2.in',
      onComplete: () => gsap.set(this.homeView, { display: 'none' }),
    });
    gsap.to(this.mapPanel, { y: 0, opacity: 1, duration: 0.42, delay: 0.1, ease: 'power3.out' });

    gsap.fromTo('.hub-node',
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.09, delay: 0.3, ease: 'back.out(1.3)' });
  }

  _closeMap() {
    this._closeDetail();

    gsap.to(this.mapPanel, {
      y: '100%', opacity: 0, duration: 0.35, ease: 'power3.in',
      onComplete: () => {
        gsap.set(this.mapPanel, { display: 'none' });
        gsap.set(this.homeView, { display: 'flex', opacity: 0 });
        gsap.to(this.homeView, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo('.hub-bld',
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.42, stagger: 0.09, ease: 'power3.out' });
        gsap.fromTo('#hub-moon',
          { opacity: 0, scale: 0.75 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' });
      },
    });
  }

  /* ══════════════════════════════════════
     CONSTRUCTION DE LA CARTE
  ══════════════════════════════════════ */

  _buildMap() {
    this.mapWrap.innerHTML = '';

    STAGES.forEach((stage, i) => {
      const unlocked  = this.playerData.isStageUnlocked(stage);
      const completed = this.playerData.isStageCompleted(stage.id);
      const diffStars = '★'.repeat(stage.difficulty) + '☆'.repeat(5 - stage.difficulty);

      const node = document.createElement('div');
      node.className = `hub-node${unlocked ? '' : ' hub-node--locked'}${completed ? ' hub-node--done' : ''}`;
      node.dataset.stageId = stage.id;
      node.style.setProperty('--el',   stage.color);
      node.style.setProperty('--glow', stage.glow);
      node.innerHTML = `
        <div class="hub-node-order">0${stage.order}</div>
        <div class="hub-node-card">
          <div class="hub-node-bg"></div>
          ${completed ? '<div class="hub-node-done-badge">✓</div>' : ''}
          ${!unlocked  ? '<div class="hub-node-lock">🔒</div>' : ''}
          <div class="hub-node-element">${this._elementKanji(stage.element)}</div>
          <div class="hub-node-info">
            <div class="hub-node-name">${stage.name}</div>
            <div class="hub-node-subtitle">${stage.subtitle}</div>
            <div class="hub-node-diff" style="color:${stage.glow}">${diffStars}</div>
          </div>
        </div>`;

      node.addEventListener('click', unlocked
        ? () => this._openDetail(stage)
        : () => this._shakeNode(node));

      this.mapWrap.appendChild(node);

      if (i < STAGES.length - 1) {
        const conn = document.createElement('div');
        conn.className = `hub-connector${completed ? ' hub-connector--active' : ''}`;
        conn.style.setProperty('--from', stage.color);
        conn.style.setProperty('--to',   STAGES[i + 1].color);
        this.mapWrap.appendChild(conn);
      }
    });
  }

  /* ══════════════════════════════════════
     STATS / RESSOURCES
  ══════════════════════════════════════ */

  _updateStats() {
    const done  = this.playerData.completedStages.size;
    const owned = this.playerData.collection.size;
    const curr  = this.playerData.currency;

    // Hub home — monnaie
    const currEl = document.getElementById('hub-nav-currency-val');
    if (currEl) currEl.textContent = curr.toLocaleString();

    // Hub home — zones
    const zoneEl = document.getElementById('hub-player-stages');
    if (zoneEl) zoneEl.textContent = `${done} / ${STAGES.length} zones`;

    // Carte header — stats complètes
    const statsEl = document.getElementById('hub-player-stats');
    if (statsEl) statsEl.innerHTML = `
      <span class="hub-stat">⚔ ${done}/${STAGES.length}</span>
      <span class="hub-stat">✦ ${owned} perso.</span>
      <span class="hub-stat" style="color:#f0c040">◈ ${curr.toLocaleString()}</span>`;
  }

  /* ══════════════════════════════════════
     DÉTAIL STAGE
  ══════════════════════════════════════ */

  _openDetail(stage) {
    this._activeStage = stage;

    document.getElementById('hd-name').textContent       = stage.name;
    document.getElementById('hd-subtitle').textContent   = stage.subtitle;
    document.getElementById('hd-lore').textContent       = stage.lore;
    document.getElementById('hd-element').textContent    = this._elementLabel(stage.element);
    document.getElementById('hd-element').style.color    = stage.glow;
    document.getElementById('hd-diff-stars').textContent = '★'.repeat(stage.difficulty) + '☆'.repeat(5 - stage.difficulty);
    document.getElementById('hd-diff-stars').style.color = stage.glow;
    document.getElementById('hd-exp').textContent        = `+${stage.rewards.exp} EXP`;
    document.getElementById('hd-currency').textContent   = `+${stage.rewards.currency} ◈`;

    const wavesEl = document.getElementById('hd-waves-list');
    wavesEl.innerHTML = '';
    stage.waves.forEach((wave, i) => {
      const li = document.createElement('div');
      li.className = 'hd-wave';
      li.innerHTML = `<span class="hd-wave-label">Vague ${i + 1}</span>
        <span class="hd-wave-enemies">${wave.join(' · ')}</span>`;
      wavesEl.appendChild(li);
    });

    const btn = document.getElementById('hd-deploy-btn');
    btn.style.setProperty('--el',   stage.color);
    btn.style.setProperty('--glow', stage.glow);
    btn.innerHTML = this.playerData.isStageCompleted(stage.id) ? '⚔ REJOUER' : '⚔ DÉPLOYER';

    gsap.set(this.detailPanel, { display: 'flex' });
    gsap.fromTo(this.detailPanel, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo('#hub-detail-box',
      { y: 60, scale: 0.92 }, { y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.6)' });
  }

  _closeDetail() {
    if (!this.detailPanel || this.detailPanel.style.display === 'none') return;
    gsap.to(this.detailPanel, {
      opacity: 0, duration: 0.2,
      onComplete: () => gsap.set(this.detailPanel, { display: 'none' }),
    });
    this._activeStage = null;
  }

  _deploy() {
    if (!this._activeStage) return;
    const stage = this._activeStage;
    this._closeDetail();
    gsap.to(this.screen, {
      opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        gsap.set(this.screen, { display: 'none' });
        this.onDeploy(stage);
      },
    });
  }

  /* ══════════════════════════════════════
     UTILITAIRES
  ══════════════════════════════════════ */

  _shakeNode(node) {
    gsap.to(node, { x: -8, duration: 0.05, yoyo: true, repeat: 5,
      onComplete: () => gsap.set(node, { x: 0 }) });
  }

  _elementKanji(el) {
    return { Fire:'火', Dark:'闇', Wind:'風', Water:'水', Thunder:'雷',
             Earth:'土', Light:'光', Void:'虚', Neutral:'無' }[el] || '無';
  }

  _elementLabel(el) {
    return { Fire:'Feu', Dark:'Ténèbres', Wind:'Vent', Water:'Eau',
             Thunder:'Foudre', Earth:'Terre', Light:'Lumière',
             Void:'Vide', Neutral:'Neutre' }[el] || el;
  }
}
