/**
 * ProfileUI.js — Écran profil joueur de KuroSekai.
 *
 *  • Nom modifiable inline
 *  • Sélecteur d'avatar (10 kanjis, 5 gratuits + 5 débloquables)
 *  • Sélecteur de cadre  (7 cadres, 2 gratuits + 5 débloquables)
 *  • Grille de stats globales
 *  • Historique des 10 derniers tirages
 */

import { gsap } from 'gsap';
import { STAGES } from '../data/enemies.js';
import { audio  } from '../audio/AudioManager.js';
import {
  loadProfile, saveProfile,
  AVATAR_OPTIONS, FRAME_OPTIONS,
  getAvatar, getFrame,
} from '../data/profileData.js';
import { ACH_CATS } from '../data/achievements.js';

/* ─── Système de titres ─── */
const TITLES = [
  { label: 'Légende',       condition: p => p.stages >= STAGES.length },
  { label: 'Commandant',    condition: p => p.stages >= 9 },
  { label: 'Collectionneur',condition: p => p.chars  >= 10 },
  { label: 'Invocateur',    condition: p => p.summons >= 20 },
  { label: 'Vétéran',       condition: p => p.stages >= 6 },
  { label: 'Guerrier',      condition: p => p.wins   >= 10 },
  { label: 'Explorateur',   condition: p => p.stages >= 3 },
  { label: 'Recrue',        condition: () => true },
];

const RARITY_COLORS = { 5:'#f0c040', 4:'#aa66ff', 3:'#44aaff' };

export class ProfileUI {
  constructor(playerData, onBack) {
    this.playerData = playerData;
    this.onBack     = onBack;
    this.screen     = document.getElementById('profile-screen');
    this._profile   = loadProfile();
    this._picker    = null; // overlay modal picker
    this._editing   = false;
    this._bindStaticEvents();
  }

  /* ══════════════════════════════════════
     SHOW / HIDE
  ══════════════════════════════════════ */

  show() {
    this._profile = loadProfile(); // toujours re-lire
    this._render();

    gsap.set(this.screen, { display: 'flex', opacity: 0 });
    gsap.to(this.screen,  { opacity: 1, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo('#profile-hero',
      { y: -28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, delay: 0.05, ease: 'power3.out' });
    gsap.fromTo('.profile-section',
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.32, stagger: 0.1, delay: 0.12, ease: 'power2.out' });
  }

  hide() {
    this._closePicker();
    gsap.to(this.screen, {
      opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => gsap.set(this.screen, { display: 'none' }),
    });
  }

  /* ══════════════════════════════════════
     EVENTS STATIQUES (bouton retour)
  ══════════════════════════════════════ */

  _bindStaticEvents() {
    document.getElementById('profile-back-btn')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this.hide(); this.onBack?.(); });
  }

  /* ══════════════════════════════════════
     RENDU PRINCIPAL
  ══════════════════════════════════════ */

  _render() {
    this._renderHero();
    this._renderStats();
    this._renderAchievements('all');
    this._renderPullHistory();
  }

  /* ─── Hero ─── */
  _renderHero() {
    const el = document.getElementById('profile-hero');
    if (!el) return;

    const av    = getAvatar(this._profile.avatarId);
    const fr    = getFrame(this._profile.frameId);
    const title = this._computeTitle();

    el.innerHTML = `
      <div class="prf-avatar-area">
        <div id="prf-av-wrap" class="prf-avatar-wrap frame-${fr.id}"
             style="--av-color:${av.color};--av-glow:${av.glow}">
          <div class="prf-avatar-ring"></div>
          <div class="prf-avatar-kanji">${av.kanji}</div>
        </div>
        <div class="prf-av-btns">
          <button class="prf-mini-btn" id="btn-open-av-picker">AVATAR</button>
          <button class="prf-mini-btn" id="btn-open-fr-picker">CADRE</button>
        </div>
      </div>
      <div class="prf-identity">
        <div class="prf-title-badge">${title}</div>
        <div class="prf-name-row">
          <span id="prf-name-display" class="prf-name">${this._profile.name}</span>
          <button id="prf-name-edit-btn" class="prf-edit-btn" title="Modifier le nom">✎</button>
        </div>
        <div id="prf-name-form" class="prf-name-form" style="display:none">
          <input id="prf-name-input" class="prf-name-input" maxlength="16"
                 placeholder="Votre nom…" value="${this._esc(this._profile.name)}"/>
          <button id="prf-name-save" class="prf-name-save-btn">✓</button>
          <button id="prf-name-cancel" class="prf-name-cancel-btn">✕</button>
        </div>
        <div class="prf-since">Actif depuis ${this._daysActive()} jour${this._daysActive() > 1 ? 's' : ''}</div>
        <div id="prf-av-label" class="prf-av-label">${av.label} · ${fr.label}</div>
      </div>`;

    this._bindHeroEvents();
  }

  _bindHeroEvents() {
    document.getElementById('btn-open-av-picker')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this._openPicker('avatar'); });
    document.getElementById('btn-open-fr-picker')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this._openPicker('frame'); });

    // Nom — mode édition
    document.getElementById('prf-name-edit-btn')
      ?.addEventListener('click', () => this._startNameEdit());
    document.getElementById('prf-name-save')
      ?.addEventListener('click', () => this._saveNameEdit());
    document.getElementById('prf-name-cancel')
      ?.addEventListener('click', () => this._cancelNameEdit());
    document.getElementById('prf-name-input')
      ?.addEventListener('keydown', e => {
        if (e.key === 'Enter')  this._saveNameEdit();
        if (e.key === 'Escape') this._cancelNameEdit();
      });
  }

  /* ─── Stats ─── */
  _renderStats() {
    const p     = this.playerData;
    const best  = parseInt(localStorage.getItem('kuro_lb_dungeon_best') ?? '-1', 10);
    const qData = JSON.parse(localStorage.getItem('kuro_quests') ?? '{}');
    const claimed = this._countClaimed(qData);

    const stats = [
      { icon: '⚔',  label: 'Combats gagnés',   value: (p.combatsWon  ?? 0).toLocaleString() },
      { icon: '✦',  label: 'Invocations',       value: (p.totalSummons ?? 0).toLocaleString() },
      { icon: '🗾', label: 'Stages complétés',  value: `${p.completedStages.size} / ${STAGES.length}` },
      { icon: '奈落',label: 'Meilleur donjon',  value: best >= 0 ? `Salle ${best + 1}` : '—' },
      { icon: '📋', label: 'Quêtes réclamées',  value: claimed.toLocaleString() },
      { icon: '◈',  label: 'Monnaie actuelle',  value: p.currency.toLocaleString() },
    ];

    const wrap = document.getElementById('profile-stats-grid');
    if (!wrap) return;
    wrap.innerHTML = stats.map(s => `
      <div class="prf-stat-card">
        <span class="prf-stat-icon">${s.icon}</span>
        <span class="prf-stat-val">${s.value}</span>
        <span class="prf-stat-label">${s.label}</span>
      </div>`).join('');
  }

  _countClaimed(qData) {
    let n = 0;
    for (const tab of ['daily','weekly']) {
      for (const p of Object.values(qData[tab]?.progress ?? {})) {
        if (p.claimed) n++;
      }
    }
    return n;
  }

  /* ─── Achievements ─── */
  _renderAchievements(activeCat = 'all') {
    const wrap = document.getElementById('profile-ach-list');
    const countEl = document.getElementById('profile-ach-count');
    if (!wrap) return;

    const all     = this.playerData.getAchievementsState();
    const total   = all.length;
    const done    = all.filter(a => a.unlocked).length;
    if (countEl) countEl.textContent = `${done} / ${total}`;

    // Barre de progression globale
    const bar = document.getElementById('prf-ach-progress-bar');
    if (bar) {
      const pct = total > 0 ? (done / total) * 100 : 0;
      gsap.to(bar, { width: `${pct}%`, duration: 0.6, ease: 'power2.out' });
    }

    // Tabs
    document.querySelectorAll('.prf-ach-tab').forEach(btn => {
      btn.classList.toggle('prf-ach-tab--active', btn.dataset.cat === activeCat);
      btn.onclick = () => {
        audio.play('ui_navigate');
        this._renderAchievements(btn.dataset.cat);
      };
    });

    const list = activeCat === 'all' ? all : all.filter(a => a.cat === activeCat);

    // Tri : débloqués d'abord, puis par catégorie
    const sorted = [
      ...list.filter(a => a.unlocked),
      ...list.filter(a => !a.unlocked && !a.hidden),
      ...list.filter(a => !a.unlocked && a.hidden),
    ];

    wrap.innerHTML = '';
    sorted.forEach((ach, i) => {
      const row = document.createElement('div');
      row.className = `prf-ach-row${ach.unlocked ? ' prf-ach-row--done' : ''}`;

      const rewardStr = ach.reward
        ? [
            ach.reward.currency  ? `+${ach.reward.currency.toLocaleString()} ◈`  : '',
            ach.reward.freeRolls ? `+${ach.reward.freeRolls} tirage${ach.reward.freeRolls > 1 ? 's' : ''}` : '',
          ].filter(Boolean).join(' · ')
        : '';

      const hidden = ach.hidden && !ach.unlocked;
      row.innerHTML = `
        <div class="prf-ach-icon ${ach.unlocked ? '' : 'prf-ach-icon--locked'}">${hidden ? '?' : ach.icon}</div>
        <div class="prf-ach-body">
          <div class="prf-ach-name">${hidden ? '??? (secret)' : ach.name}</div>
          <div class="prf-ach-desc">${hidden ? 'Condition secrète' : ach.desc}</div>
          ${rewardStr ? `<div class="prf-ach-reward">${rewardStr}</div>` : ''}
        </div>
        ${ach.unlocked ? '<div class="prf-ach-check">✓</div>' : ''}`;

      wrap.appendChild(row);
      gsap.fromTo(row,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.25, delay: i * 0.03, ease: 'power2.out' });
    });
  }

  /* ─── Pull history ─── */
  _renderPullHistory() {
    const wrap = document.getElementById('profile-pulls-list');
    if (!wrap) return;
    const history = (this.playerData.pullHistory ?? []).slice(0, 10);
    if (!history.length) {
      wrap.innerHTML = '<div class="prf-pulls-empty">Aucune invocation enregistrée</div>';
      return;
    }
    wrap.innerHTML = history.map(entry => {
      const stars = '★'.repeat(entry.rarity) + '☆'.repeat(5 - entry.rarity);
      const color = RARITY_COLORS[entry.rarity] ?? '#aabbcc';
      return `
        <div class="prf-pull-row">
          <span class="prf-pull-stars" style="color:${color}">${stars}</span>
          <span class="prf-pull-name">${entry.name}</span>
          <span class="prf-pull-element prf-pull-el--${(entry.element ?? '').toLowerCase()}">${entry.element ?? ''}</span>
          <span class="prf-pull-ago">${this._timeAgo(entry.timestamp)}</span>
        </div>`;
    }).join('');
  }

  /* ══════════════════════════════════════
     NOM — ÉDITION INLINE
  ══════════════════════════════════════ */

  _startNameEdit() {
    if (this._editing) return;
    this._editing = true;
    document.getElementById('prf-name-display')?.style.setProperty('display','none');
    document.getElementById('prf-name-edit-btn')?.style.setProperty('display','none');
    const form = document.getElementById('prf-name-form');
    if (form) form.style.display = 'flex';
    setTimeout(() => document.getElementById('prf-name-input')?.focus(), 50);
  }

  _saveNameEdit() {
    const val = (document.getElementById('prf-name-input')?.value ?? '').trim();
    if (val) {
      this._profile.name = val.toUpperCase().slice(0, 16);
      saveProfile(this._profile);
    }
    this._cancelNameEdit();
    // Mise à jour du texte sans re-render complet
    const disp = document.getElementById('prf-name-display');
    if (disp) disp.textContent = this._profile.name;
    // Sync hub badge nom (si affiché)
    const hubName = document.getElementById('hub-account-name');
    // (hub-account-name c'est le pseudo de connexion cloud, on laisse intact)
  }

  _cancelNameEdit() {
    this._editing = false;
    document.getElementById('prf-name-form')?.style.setProperty('display','none');
    const d = document.getElementById('prf-name-display');
    const b = document.getElementById('prf-name-edit-btn');
    if (d) d.style.removeProperty('display');
    if (b) b.style.removeProperty('display');
  }

  /* ══════════════════════════════════════
     PICKER MODAL (Avatar / Cadre)
  ══════════════════════════════════════ */

  _openPicker(tab) {
    this._closePicker(); // ferme si déjà ouvert
    this._buildPicker(tab);
  }

  _closePicker() {
    if (!this._picker) return;
    gsap.to(this._picker, {
      opacity: 0, y: 30, duration: 0.22, ease: 'power2.in',
      onComplete: () => { this._picker?.remove(); this._picker = null; },
    });
  }

  _buildPicker(activeTab) {
    const overlay = document.createElement('div');
    overlay.className = 'prf-picker-overlay';
    overlay.innerHTML = `
      <div class="prf-picker-box">
        <div class="prf-picker-header">
          <button class="prf-picker-tab${activeTab==='avatar'?' prf-picker-tab--active':''}" data-tab="avatar">AVATAR</button>
          <button class="prf-picker-tab${activeTab==='frame' ?' prf-picker-tab--active':''}" data-tab="frame">CADRE</button>
          <button class="prf-picker-close">✕</button>
        </div>
        <div id="prf-picker-currency" class="prf-picker-currency">
          ◈ <span id="prf-picker-cur-val">${this.playerData.currency.toLocaleString()}</span>
        </div>
        <div id="prf-picker-grid" class="prf-picker-grid"></div>
      </div>`;

    document.getElementById('profile-screen')?.appendChild(overlay);
    this._picker = overlay;

    // Tabs
    overlay.querySelectorAll('.prf-picker-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.prf-picker-tab').forEach(t => t.classList.remove('prf-picker-tab--active'));
        btn.classList.add('prf-picker-tab--active');
        audio.play('ui_navigate');
        this._renderPickerGrid(overlay, btn.dataset.tab);
      });
    });
    overlay.querySelector('.prf-picker-close')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this._closePicker(); });
    // Clic hors de la box
    overlay.addEventListener('click', e => { if (e.target === overlay) this._closePicker(); });

    this._renderPickerGrid(overlay, activeTab);

    gsap.fromTo(overlay,
      { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
    gsap.fromTo(overlay.querySelector('.prf-picker-box'),
      { y: 50, scale: 0.94 },
      { y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
  }

  _renderPickerGrid(overlay, tab) {
    const grid = overlay.querySelector('#prf-picker-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const options  = tab === 'avatar' ? AVATAR_OPTIONS : FRAME_OPTIONS;
    const unlocked = tab === 'avatar' ? this._profile.unlockedAvatars : this._profile.unlockedFrames;
    const selected = tab === 'avatar' ? this._profile.avatarId : this._profile.frameId;

    options.forEach(opt => {
      const isUnlocked = unlocked.includes(opt.id);
      const isSelected = opt.id === selected;
      const canAfford  = this.playerData.currency >= opt.cost;

      const card = document.createElement('div');
      card.className = [
        'prf-pick-card',
        isSelected  ? 'prf-pick-card--selected' : '',
        !isUnlocked ? 'prf-pick-card--locked'   : '',
      ].filter(Boolean).join(' ');

      if (tab === 'avatar') {
        const av = opt;
        card.innerHTML = `
          <div class="prf-pick-av" style="color:${av.color};text-shadow:0 0 10px ${av.glow}">
            ${av.kanji}
          </div>
          <div class="prf-pick-label">${av.label}</div>
          ${isSelected  ? '<div class="prf-pick-check">✓</div>' : ''}
          ${!isUnlocked ? `<div class="prf-pick-lock">
            <span class="prf-pick-lock-price">◈ ${av.cost.toLocaleString()}</span>
            <button class="prf-pick-goto-shop">→ Boutique</button>
          </div>` : ''}`;
      } else {
        const fr = opt;
        card.innerHTML = `
          <div class="prf-pick-frame-preview frame-${fr.id}" style="--av-color:#00d4ff;--av-glow:rgba(0,212,255,0.4)">
            <div class="prf-avatar-ring"></div>
            <span class="prf-pick-frame-kanji">黒</span>
          </div>
          <div class="prf-pick-label">${fr.label}</div>
          ${isSelected  ? '<div class="prf-pick-check">✓</div>' : ''}
          ${!isUnlocked ? `<div class="prf-pick-lock">
            <span class="prf-pick-lock-price">◈ ${fr.cost.toLocaleString()}</span>
            <button class="prf-pick-goto-shop">→ Boutique</button>
          </div>` : ''}`;
      }

      // Sélection si débloqué
      if (isUnlocked) {
        card.addEventListener('click', () => {
          audio.play('ui_navigate');
          if (tab === 'avatar') this._selectAvatar(opt.id);
          else                  this._selectFrame(opt.id);
          this._renderPickerGrid(overlay, tab);
          this._renderHero();
        });
      }
      // Verrouillé → redirige vers la boutique
      card.querySelector('.prf-pick-goto-shop')
        ?.addEventListener('click', e => {
          e.stopPropagation();
          this._closePicker();
          this.hide();
          document.dispatchEvent(new CustomEvent('kuro:open-shop-cosmetique'));
        });

      grid.appendChild(card);
    });

    // Stagger cards
    gsap.fromTo('.prf-pick-card',
      { opacity: 0, scale: 0.88 },
      { opacity: 1, scale: 1, duration: 0.22, stagger: 0.04, ease: 'power2.out' });
  }

  /* ══════════════════════════════════════
     SÉLECTION / ACHAT
  ══════════════════════════════════════ */

  _selectAvatar(id) {
    this._profile.avatarId = id;
    saveProfile(this._profile);
    this._flashSaved();
  }

  _selectFrame(id) {
    this._profile.frameId = id;
    saveProfile(this._profile);
    this._flashSaved();
  }

  /** Appelée depuis ShopUI après un achat cosmetique */
  notifyUnlock() {
    this._profile = loadProfile();
    if (this.screen.style.display !== 'none') this._renderHero();
  }

  _flashSaved() {
    const wrap = document.getElementById('prf-av-wrap');
    if (!wrap) return;
    gsap.to(wrap, { scale: 1.12, duration: 0.1, yoyo: true, repeat: 1 });
  }

  /* ══════════════════════════════════════
     UTILITAIRES
  ══════════════════════════════════════ */

  _computeTitle() {
    const p   = this.playerData;
    const ctx = {
      stages:  p.completedStages.size,
      chars:   p.uniqueCount(),
      wins:    p.combatsWon   ?? 0,
      summons: p.totalSummons ?? 0,
    };
    return (TITLES.find(t => t.condition(ctx)) ?? TITLES.at(-1)).label;
  }

  _daysActive() {
    return Math.max(1, Math.floor((Date.now() - (this.playerData.firstPlayDate ?? Date.now())) / 86_400_000));
  }

  _timeAgo(ts) {
    const diff  = Date.now() - ts;
    const m = Math.floor(diff / 60_000);
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (d > 0)  return `il y a ${d}j`;
    if (h > 0)  return `il y a ${h}h`;
    if (m > 0)  return `il y a ${m}m`;
    return 'à l\'instant';
  }

  _esc(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }
}
