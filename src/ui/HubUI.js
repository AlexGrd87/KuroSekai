/**
 * HubUI.js — Écran d'accueil / navigation centrale de KuroSekai.
 *
 * Deux vues à l'intérieur de #hub-screen :
 *   #hub-home      → icônes de navigation + ressources (vue par défaut)
 *   #hub-map-panel → carte des stages (ouverte via COMBAT, slide-up)
 */

import { gsap }       from 'gsap';
import { STAGES }     from '../data/enemies.js';
import { audio }      from '../audio/AudioManager.js';
import { transition } from './TransitionUI.js';
import { toast }      from './ToastUI.js';

export class HubUI {
  constructor(playerData, onDeploy, onSummon, onCollection, onSettings, onCampaign, onShop) {
    this.playerData   = playerData;
    this.onDeploy     = onDeploy;
    this.onSummon     = onSummon;
    this.onCollection = onCollection;
    this.onSettings   = onSettings;
    this.onCampaign   = onCampaign;
    this.onShop       = onShop;

    this.screen      = document.getElementById('hub-screen');
    this.homeView    = document.getElementById('hub-home');
    this.mapPanel    = document.getElementById('hub-map-panel');
    this.mapWrap     = document.getElementById('hub-map-wrap');
    this.detailPanel = document.getElementById('hub-detail');

    this._activeStage    = null;
    this._energyInterval = null;

    this._bindEvents();
  }

  _bindEvents() {
    // Bâtiments cliquables
    document.getElementById('hub-bld-combat')
      ?.addEventListener('click', () => {
        audio.play('ui_navigate');
        if (this.onCampaign) this.onCampaign(() => this._openMap());
        else this._openMap();
      });
    document.getElementById('hub-bld-summon')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this.hide(); this.onSummon?.(); });
    document.getElementById('hub-bld-collection')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this.hide(); this.onCollection?.(); });
    document.getElementById('hub-bld-shop')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this.hide(); this.onShop?.(); });
    document.getElementById('hub-bld-settings')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this.hide(); this.onSettings?.(); });

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
    this._startEnergyTimer();

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
    this._stopEnergyTimer();
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

    transition.sweep('map', () => {
      // Slide-up du panneau carte depuis le bas
      gsap.set(this.mapPanel, { display: 'flex', y: '100%', opacity: 0 });
      gsap.to(this.homeView, {
        opacity: 0, duration: 0.15, ease: 'power2.in',
        onComplete: () => gsap.set(this.homeView, { display: 'none' }),
      });
      gsap.to(this.mapPanel, { y: 0, opacity: 1, duration: 0.38, delay: 0.05, ease: 'power3.out' });
      gsap.fromTo('.map-snode',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, delay: 0.18, ease: 'back.out(1.3)' });
    });
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
     CONSTRUCTION DE LA CARTE (verticale, chapitres)
  ══════════════════════════════════════ */

  _buildMap() {
    this.mapWrap.innerHTML = '';

    const CHAPTERS = [
      { id: 1, name: 'PÉRIPHÉRIE',    subtitle: 'Districts extérieurs de Neo-Osaka',           color: '#0099ff', icon: '◈' },
      { id: 2, name: 'PROFONDEUR',    subtitle: 'Nœuds industriels et réseaux souterrains',    color: '#ffcc00', icon: '◉' },
      { id: 3, name: 'ABÎME',         subtitle: 'Fracturation de la réalité — Fin des temps',  color: '#cc00ff', icon: '◆' },
      { id: 4, name: 'SINGULARITÉ',   subtitle: 'L\'effacement final — Au-delà du vide',        color: '#dd00ff', icon: '✦' },
      { id: 5, name: 'RÉSURGENCE',    subtitle: 'Les fragments du vide s\'éveillent à nouveau', color: '#ff2266', icon: '⚡' },
      { id: 6, name: 'TRANSCENDANCE', subtitle: 'Au-delà des limites de la réalité connue',     color: '#ff8800', icon: '★' },
    ];
    const CHAPTER_STAGE_IDS = {
      1: ['stage_01', 'stage_02', 'stage_03'],
      2: ['stage_04', 'stage_05', 'stage_06'],
      3: ['stage_07', 'stage_08', 'stage_09'],
      4: ['stage_10', 'stage_11', 'stage_12'],
      5: ['stage_13', 'stage_14', 'stage_15'],
      6: ['stage_16', 'stage_17', 'stage_18'],
    };

    for (const chapter of CHAPTERS) {
      const chStages = (CHAPTER_STAGE_IDS[chapter.id] || [])
        .map(id => STAGES.find(s => s.id === id))
        .filter(Boolean);

      const allDone = chStages.every(s => this.playerData.isStageCompleted(s.id));

      // En-tête de chapitre
      this.mapWrap.appendChild(this._buildChapterHeader(chapter, allDone));

      // Stages du chapitre
      chStages.forEach((stage, idx) => {
        // Connecteur vertical entre deux stages
        if (idx > 0) {
          const prevDone = this.playerData.isStageCompleted(chStages[idx - 1].id);
          const conn = document.createElement('div');
          conn.className = `map-vconn${prevDone ? ' map-vconn--active' : ''}`;
          conn.style.setProperty('--glow', stage.glow);
          this.mapWrap.appendChild(conn);
        }

        const unlocked  = this.playerData.isStageUnlocked(stage);
        const completed = this.playerData.isStageCompleted(stage.id);
        this.mapWrap.appendChild(
          this._buildMapStageNode(stage, unlocked, completed)
        );
      });
    }
  }

  _buildChapterHeader(chapter, allDone) {
    const el = document.createElement('div');
    el.className = `map-chapter${allDone ? ' map-chapter--done' : ''}`;
    el.style.setProperty('--cc', chapter.color);
    el.innerHTML = `
      <div class="map-ch-bar"></div>
      <div class="map-ch-content">
        <div class="map-ch-top">
          <span class="map-ch-icon">${chapter.icon || '◈'}</span>
          <span class="map-ch-label">CHAPITRE ${chapter.id}${allDone ? ' <span class="map-ch-check">✓</span>' : ''}</span>
        </div>
        <span class="map-ch-name">${chapter.name}</span>
        <span class="map-ch-sub">${chapter.subtitle}</span>
      </div>
      <div class="map-ch-bar"></div>`;
    return el;
  }

  _buildMapStageNode(stage, unlocked, completed) {
    const diffStars = '★'.repeat(stage.difficulty) + '☆'.repeat(5 - stage.difficulty);
    const perfStars = this.playerData.getStageStars(stage.id);
    const perfHtml  = completed
      ? `<span class="msn-perf-stars">${'★'.repeat(perfStars)}${'☆'.repeat(3 - perfStars)}</span>`
      : '';
    const orderPad  = stage.order < 10 ? `0${stage.order}` : `${stage.order}`;
    const energyCost = stage.energyCost ?? 1;
    const energyHtml = `<span class="msn-energy-cost">⚡${energyCost}</span>`;

    const node = document.createElement('div');
    node.className = [
      'map-snode',
      unlocked  ? '' : 'map-snode--locked',
      completed ? 'map-snode--done' : '',
      stage.isBoss ? 'map-snode--boss' : '',
    ].filter(Boolean).join(' ');
    node.dataset.stageId = stage.id;
    node.style.setProperty('--el',   stage.color);
    node.style.setProperty('--glow', stage.glow);

    node.innerHTML = `
      <div class="msn-glow-bg"></div>
      <div class="msn-el-kanji">${this._elementKanji(stage.element)}</div>
      <div class="msn-body">
        <div class="msn-head">
          <span class="msn-order">${orderPad}</span>
          <span class="msn-name">${stage.name}</span>
          ${stage.isBoss ? '<span class="msn-boss-badge">BOSS</span>' : ''}
          ${completed ? perfHtml : ''}
        </div>
        <div class="msn-subtitle">${stage.subtitle}</div>
        <div class="msn-diff">${diffStars}</div>
      </div>
      <div class="msn-meta">
        <div class="msn-rewards">
          <span>+${stage.rewards.exp} EXP</span>
          <span class="msn-cur">+${stage.rewards.currency} ◈</span>
        </div>
        <div class="msn-right-meta">
          ${energyHtml}
          <div class="msn-waves">${stage.waves.length}V</div>
        </div>
      </div>
      ${!unlocked ? '<div class="msn-lock-overlay"><span>🔒</span></div>' : ''}`;

    node.addEventListener('click', unlocked
      ? () => this._openDetail(stage)
      : () => this._shakeNode(node));

    return node;
  }

  /* ══════════════════════════════════════
     TIMER ÉNERGIE
  ══════════════════════════════════════ */

  _startEnergyTimer() {
    this._stopEnergyTimer();
    this._updateEnergyTimer();
    this._energyInterval = setInterval(() => this._updateEnergyTimer(), 10_000);
  }

  _stopEnergyTimer() {
    clearInterval(this._energyInterval);
    this._energyInterval = null;
  }

  _updateEnergyTimer() {
    const el = document.getElementById('hub-energy-timer');
    if (!el) return;

    const REGEN_MS = 30 * 60 * 1000; // 30 min
    const ENERGY_MAX = 10;
    const { current } = this.playerData.getEnergy();

    if (current >= ENERGY_MAX) {
      el.textContent = '';
      el.title = 'Énergie au maximum';
      return;
    }

    const lastTime  = this.playerData.lastEnergyTime ?? Date.now();
    const elapsed   = Date.now() - lastTime;
    const msToNext  = REGEN_MS - (elapsed % REGEN_MS);
    const totalSec  = Math.ceil(msToNext / 1000);
    const mm        = Math.floor(totalSec / 60);
    const ss        = totalSec % 60;
    el.textContent  = `→ ${mm}:${String(ss).padStart(2, '0')}`;
    el.title        = `Prochain +1 dans ${mm}m ${ss}s`;
  }

  /* ══════════════════════════════════════
     STATS / RESSOURCES
  ══════════════════════════════════════ */

  _updateStats() {
    const done  = this.playerData.completedStages.size;
    const owned = this.playerData.uniqueCount();
    const curr  = this.playerData.currency;

    // Hub home — monnaie
    const currEl = document.getElementById('hub-nav-currency-val');
    if (currEl) currEl.textContent = curr.toLocaleString();

    // Hub home — zones
    const zoneEl = document.getElementById('hub-player-stages');
    if (zoneEl) zoneEl.textContent = `${done} / ${STAGES.length} zones`;

    // Énergie hub header
    const { current: energyCurr } = this.playerData.getEnergy();
    const energyHubEl = document.getElementById('hub-energy-val');
    if (energyHubEl) energyHubEl.textContent = energyCurr;
    const energyHubBar = document.getElementById('hub-energy-bar');
    if (energyHubBar) energyHubBar.style.width = `${(energyCurr / 10) * 100}%`;

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

    // Étoiles de performance
    const perfStars = this.playerData.getStageStars(stage.id);
    const perfEl    = document.getElementById('hd-perf-stars');
    if (perfEl) {
      const done = this.playerData.isStageCompleted(stage.id);
      perfEl.innerHTML = done
        ? `${'★'.repeat(perfStars)}${'☆'.repeat(3 - perfStars)}`
        : '- - -';
      perfEl.style.color = done ? '#ffd700' : 'rgba(200,220,255,0.25)';
    }

    // Énergie
    const energyCost = stage.energyCost ?? 1;
    const { current: energyCurr } = this.playerData.getEnergy();
    const hasEnergy = energyCurr >= energyCost;
    const energyEl = document.getElementById('hd-energy-cost');
    if (energyEl) {
      energyEl.textContent = `⚡ ${energyCurr} / 10  (coût : ${energyCost})`;
      energyEl.style.color = hasEnergy ? '#88ff88' : '#ff6666';
    }

    const btn = document.getElementById('hd-deploy-btn');
    btn.style.setProperty('--el',   stage.color);
    btn.style.setProperty('--glow', stage.glow);
    btn.disabled = !hasEnergy;
    btn.innerHTML = !hasEnergy
      ? `⚡ Énergie insuffisante (${energyCurr}/${energyCost})`
      : this.playerData.isStageCompleted(stage.id) ? '⚔ REJOUER' : '⚔ DÉPLOYER';

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
    const stage      = this._activeStage;
    const energyCost = stage.energyCost ?? 1;
    if (!this.playerData.spendEnergy(energyCost)) {
      toast.show('Énergie insuffisante', 'warning', { sub: `Il te faut ${energyCost} ⚡` });
      return;
    }
    this._closeDetail();
    transition.sweep('combat', () => {
      gsap.set(this.screen, { display: 'none' });
      this.onDeploy(stage);
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
