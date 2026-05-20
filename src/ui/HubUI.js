/**
 * HubUI.js
 * Carte des opérations — sélection de stage de KuroSekai.
 *
 * Affiche 5 zones cyberpunk connectées, déverrouillables progressivement.
 * Clic sur une zone disponible → panneau de détail → DÉPLOYER → TeamSelect.
 */

import { gsap }   from 'gsap';
import { STAGES } from '../data/enemies.js';

export class HubUI {
  /**
   * @param {PlayerData} playerData
   * @param {Function}   onDeploy      callback(stage) — lance le combat
   * @param {Function}   onSummon      callback() — ouvre l'invocation
   * @param {Function}   onCollection  callback() — ouvre la collection
   * @param {Function}   onSettings    callback() — ouvre les paramètres
   */
  constructor(playerData, onDeploy, onSummon, onCollection, onSettings) {
    this.playerData   = playerData;
    this.onDeploy     = onDeploy;
    this.onSummon     = onSummon;
    this.onCollection = onCollection;
    this.onSettings   = onSettings;

    this.screen       = document.getElementById('hub-screen');
    this.mapWrap      = document.getElementById('hub-map-wrap');
    this.detailPanel  = document.getElementById('hub-detail');
    this._activeStage = null;

    document.getElementById('hd-close-btn')?.addEventListener('click',  () => this._closeDetail());
    document.getElementById('hd-deploy-btn')?.addEventListener('click', () => this._deploy());

    // Navbar
    document.getElementById('hub-nav-summon')?.addEventListener('click',     () => this.onSummon?.());
    document.getElementById('hub-nav-collection')?.addEventListener('click', () => this.onCollection?.());
    document.getElementById('hub-nav-settings')?.addEventListener('click',   () => this.onSettings?.());
  }

  /* ════════════════════════════════
     AFFICHAGE / MASQUAGE
  ════════════════════════════════ */

  show() {
    this._buildMap();
    this._updateStats();

    gsap.set(this.screen, { display: 'flex', opacity: 0 });
    gsap.to(this.screen, { opacity: 1, duration: 0.45, ease: 'power2.out' });

    // Animation en cascade des nœuds
    gsap.fromTo('.hub-node', { opacity: 0, y: 30 }, {
      opacity: 1, y: 0,
      duration: 0.4, stagger: 0.12, delay: 0.2, ease: 'back.out(1.4)',
    });
  }

  /** Masque temporairement le hub (navigation vers un sous-écran). */
  hide() {
    this._closeDetail();
    gsap.to(this.screen, {
      opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => gsap.set(this.screen, { display: 'none' }),
    });
  }

  refresh() {
    this._buildMap();
    this._updateStats();
    // Si le hub est masqué, on le réaffiche
    if (this.screen.style.display === 'none') this.show();
  }

  /* ════════════════════════════════
     CONSTRUCTION DE LA CARTE
  ════════════════════════════════ */

  _buildMap() {
    this.mapWrap.innerHTML = '';

    STAGES.forEach((stage, i) => {
      const unlocked  = this.playerData.isStageUnlocked(stage);
      const completed = this.playerData.isStageCompleted(stage.id);

      /* ── Nœud ── */
      const node = document.createElement('div');
      node.className = `hub-node${unlocked ? '' : ' hub-node--locked'}${completed ? ' hub-node--done' : ''}`;
      node.dataset.stageId = stage.id;
      node.style.setProperty('--el', stage.color);
      node.style.setProperty('--glow', stage.glow);

      const diffStars = '★'.repeat(stage.difficulty) + '☆'.repeat(5 - stage.difficulty);

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
        </div>
      `;

      if (unlocked) {
        node.addEventListener('click', () => this._openDetail(stage));
      } else {
        node.addEventListener('click', () => this._shakeNode(node));
      }

      this.mapWrap.appendChild(node);

      /* ── Connecteur entre nœuds ── */
      if (i < STAGES.length - 1) {
        const next = STAGES[i + 1];
        const conn = document.createElement('div');
        conn.className = `hub-connector${this.playerData.isStageCompleted(stage.id) ? ' hub-connector--active' : ''}`;
        conn.style.setProperty('--from', stage.color);
        conn.style.setProperty('--to', next.color);
        this.mapWrap.appendChild(conn);
      }
    });
  }

  _updateStats() {
    // Header : progression des zones
    const statsEl = document.getElementById('hub-player-stats');
    if (statsEl) {
      const completed = this.playerData.completedStages.size;
      const owned     = this.playerData.collection.size;
      statsEl.innerHTML = `
        <span class="hub-stat">⚔ ${completed}/${STAGES.length} zones</span>
        <span class="hub-stat">✦ ${owned} personnages</span>
      `;
    }
    // Navbar : monnaie en temps réel
    const currEl = document.getElementById('hub-nav-currency-val');
    if (currEl) currEl.textContent = this.playerData.currency.toLocaleString();
  }

  /* ════════════════════════════════
     PANNEAU DE DÉTAIL
  ════════════════════════════════ */

  _openDetail(stage) {
    this._activeStage = stage;

    // Contenu
    document.getElementById('hd-name').textContent     = stage.name;
    document.getElementById('hd-subtitle').textContent = stage.subtitle;
    document.getElementById('hd-lore').textContent     = stage.lore;
    document.getElementById('hd-element').textContent  = this._elementLabel(stage.element);
    document.getElementById('hd-element').style.color  = stage.glow;
    document.getElementById('hd-diff-stars').textContent = '★'.repeat(stage.difficulty) + '☆'.repeat(5 - stage.difficulty);
    document.getElementById('hd-diff-stars').style.color = stage.glow;
    document.getElementById('hd-exp').textContent      = `+${stage.rewards.exp} EXP`;
    document.getElementById('hd-currency').textContent = `+${stage.rewards.currency} ◈`;

    // Vagues
    const wavesEl = document.getElementById('hd-waves-list');
    wavesEl.innerHTML = '';
    stage.waves.forEach((wave, i) => {
      const li = document.createElement('div');
      li.className = 'hd-wave';
      li.innerHTML = `<span class="hd-wave-label">Vague ${i + 1}</span>
        <span class="hd-wave-enemies">${wave.join(' · ')}</span>`;
      wavesEl.appendChild(li);
    });

    // Couleur du bouton deploy
    const deployBtn = document.getElementById('hd-deploy-btn');
    deployBtn.style.setProperty('--el', stage.color);
    deployBtn.style.setProperty('--glow', stage.glow);

    const completed = this.playerData.isStageCompleted(stage.id);
    deployBtn.innerHTML = completed ? '⚔ REJOUER' : '⚔ DÉPLOYER';

    // Affichage animé
    gsap.set(this.detailPanel, { display: 'flex' });
    gsap.fromTo(this.detailPanel, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo('#hub-detail-box',
      { y: 60, scale: 0.92 },
      { y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }
    );
  }

  _closeDetail() {
    if (this.detailPanel.style.display === 'none') return;
    gsap.to(this.detailPanel, {
      opacity: 0, duration: 0.2,
      onComplete: () => { this.detailPanel.style.display = 'none'; },
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

  /* ════════════════════════════════
     UTILITAIRES
  ════════════════════════════════ */

  _shakeNode(node) {
    gsap.to(node, { x: -8, duration: 0.05, yoyo: true, repeat: 5,
      onComplete: () => gsap.set(node, { x: 0 }) });
  }

  _elementKanji(element) {
    const map = { Fire:'火', Dark:'闇', Wind:'風', Water:'水', Thunder:'雷',
                  Earth:'土', Light:'光', Void:'虚', Neutral:'無' };
    return map[element] || '無';
  }

  _elementLabel(element) {
    const map = { Fire:'Feu', Dark:'Ténèbres', Wind:'Vent', Water:'Eau',
                  Thunder:'Foudre', Earth:'Terre', Light:'Lumière',
                  Void:'Vide', Neutral:'Neutre' };
    return map[element] || element;
  }
}
