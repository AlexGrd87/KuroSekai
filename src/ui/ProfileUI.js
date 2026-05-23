/**
 * ProfileUI.js — Écran profil joueur de KuroSekai.
 *
 * Sections :
 *   • Hero card  — avatar kanji sélectionnable + titre + ancienneté
 *   • Stats       — grille de 6 statistiques globales
 *   • Pull history — 10 derniers tirages avec raretés
 */

import { gsap }   from 'gsap';
import { STAGES } from '../data/enemies.js';
import { audio }  from '../audio/AudioManager.js';

const AVATAR_KEY = 'kuro_avatar';

const AVATARS = [
  { kanji: '黒', label: 'Kuro',     color: '#00d4ff', glow: 'rgba(0,212,255,0.4)'   },
  { kanji: '剣', label: 'Ken',      color: '#ff4466', glow: 'rgba(255,50,80,0.4)'    },
  { kanji: '炎', label: 'Honō',     color: '#ff7700', glow: 'rgba(255,120,0,0.4)'    },
  { kanji: '闇', label: 'Yami',     color: '#aa44ff', glow: 'rgba(160,50,255,0.4)'   },
  { kanji: '光', label: 'Hikari',   color: '#ffffaa', glow: 'rgba(255,255,150,0.4)'  },
];

const TITLES = [
  { label: 'Légende',     condition: p => p.stages >= STAGES.length },
  { label: 'Commandant',  condition: p => p.stages >= 9 },
  { label: 'Collectionneur', condition: p => p.chars >= 10 },
  { label: 'Invocateur',  condition: p => p.summons >= 20 },
  { label: 'Vétéran',     condition: p => p.stages >= 6 },
  { label: 'Guerrier',    condition: p => p.wins >= 10 },
  { label: 'Explorateur', condition: p => p.stages >= 3 },
  { label: 'Recrue',      condition: () => true },
];

const RARITY_COLORS = {
  5: '#f0c040',
  4: '#aa66ff',
  3: '#44aaff',
};

export class ProfileUI {
  constructor(playerData, onBack) {
    this.playerData  = playerData;
    this.onBack      = onBack;

    this.screen      = document.getElementById('profile-screen');
    this._avatarIdx  = this._loadAvatar();

    this._bindEvents();
  }

  /* ══════════════════════════════════════
     SHOW / HIDE
  ══════════════════════════════════════ */

  show() {
    this._render();

    gsap.set(this.screen, { display: 'flex', opacity: 0 });
    gsap.to(this.screen, { opacity: 1, duration: 0.35, ease: 'power2.out' });

    gsap.fromTo('#profile-hero',
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, delay: 0.05, ease: 'power3.out' });

    gsap.fromTo('.profile-section',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, stagger: 0.1, delay: 0.15, ease: 'power2.out' });
  }

  hide() {
    gsap.to(this.screen, {
      opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => gsap.set(this.screen, { display: 'none' }),
    });
  }

  /* ══════════════════════════════════════
     EVENTS
  ══════════════════════════════════════ */

  _bindEvents() {
    document.getElementById('profile-back-btn')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this.hide(); this.onBack?.(); });

    // Clic sur l'avatar → cycle
    document.getElementById('profile-avatar-wrap')
      ?.addEventListener('click', () => {
        audio.play('ui_navigate');
        this._avatarIdx = (this._avatarIdx + 1) % AVATARS.length;
        this._saveAvatar();
        this._updateAvatar();
      });
  }

  /* ══════════════════════════════════════
     RENDU PRINCIPAL
  ══════════════════════════════════════ */

  _render() {
    this._renderHero();
    this._renderStats();
    this._renderPullHistory();
  }

  /* ── Hero card ── */
  _renderHero() {
    const av    = AVATARS[this._avatarIdx];
    const title = this._computeTitle();
    const days  = Math.max(1, Math.floor((Date.now() - (this.playerData.firstPlayDate ?? Date.now())) / 86_400_000));

    const el = document.getElementById('profile-hero');
    if (!el) return;

    el.innerHTML = `
      <div id="profile-avatar-wrap" class="prf-avatar-wrap" style="--av-color:${av.color};--av-glow:${av.glow}">
        <div class="prf-avatar-ring"></div>
        <div class="prf-avatar-kanji">${av.kanji}</div>
        <div class="prf-avatar-hint">cliquer pour changer</div>
      </div>
      <div class="prf-identity">
        <div class="prf-title-badge">${title}</div>
        <div class="prf-name">COMMANDANT</div>
        <div class="prf-since">Actif depuis ${days} jour${days > 1 ? 's' : ''}</div>
      </div>`;

    // Re-bind click (innerHTML a recréé les éléments)
    document.getElementById('profile-avatar-wrap')
      ?.addEventListener('click', () => {
        audio.play('ui_navigate');
        this._avatarIdx = (this._avatarIdx + 1) % AVATARS.length;
        this._saveAvatar();
        this._updateAvatar();
      });
  }

  _updateAvatar() {
    const av  = AVATARS[this._avatarIdx];
    const wrap = document.getElementById('profile-avatar-wrap');
    if (!wrap) return;
    wrap.style.setProperty('--av-color', av.color);
    wrap.style.setProperty('--av-glow',  av.glow);
    const kanji = wrap.querySelector('.prf-avatar-kanji');
    if (kanji) {
      gsap.fromTo(kanji,
        { scale: 1.6, opacity: 0 },
        { scale: 1,   opacity: 1, duration: 0.35, ease: 'back.out(1.8)' });
      kanji.textContent = av.kanji;
    }
  }

  /* ── Stats ── */
  _renderStats() {
    const p     = this.playerData;
    const best  = parseInt(localStorage.getItem('kuro_lb_dungeon_best') ?? '-1', 10);
    const qData = JSON.parse(localStorage.getItem('kuro_quests') ?? '{}');
    const claimed = this._countClaimed(qData);

    const stats = [
      { icon: '⚔', label: 'Combats gagnés',   value: (p.combatsWon ?? 0).toLocaleString() },
      { icon: '✦', label: 'Invocations',       value: (p.totalSummons ?? 0).toLocaleString() },
      { icon: '🗾', label: 'Stages complétés', value: `${p.completedStages.size} / ${STAGES.length}` },
      { icon: '奈落', label: 'Meilleur donjon', value: best >= 0 ? `Salle ${best + 1}` : '—' },
      { icon: '📋', label: 'Quêtes réclamées', value: claimed.toLocaleString() },
      { icon: '◈', label: 'Monnaie actuelle', value: p.currency.toLocaleString() },
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
    for (const tab of ['daily', 'weekly']) {
      const prog = qData[tab]?.progress ?? {};
      for (const p of Object.values(prog)) {
        if (p.claimed) n++;
      }
    }
    return n;
  }

  /* ── Pull history ── */
  _renderPullHistory() {
    const wrap = document.getElementById('profile-pulls-list');
    if (!wrap) return;

    const history = (this.playerData.pullHistory ?? []).slice(0, 10);

    if (history.length === 0) {
      wrap.innerHTML = '<div class="prf-pulls-empty">Aucune invocation enregistrée</div>';
      return;
    }

    wrap.innerHTML = history.map(entry => {
      const stars  = '★'.repeat(entry.rarity) + '☆'.repeat(5 - entry.rarity);
      const color  = RARITY_COLORS[entry.rarity] ?? '#aabbcc';
      const ago    = this._timeAgo(entry.timestamp);
      return `
        <div class="prf-pull-row">
          <span class="prf-pull-stars" style="color:${color}">${stars}</span>
          <span class="prf-pull-name">${entry.name}</span>
          <span class="prf-pull-element prf-pull-el--${(entry.element ?? '').toLowerCase()}">${entry.element ?? ''}</span>
          <span class="prf-pull-ago">${ago}</span>
        </div>`;
    }).join('');
  }

  _timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60_000);
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (d > 0)  return `il y a ${d}j`;
    if (h > 0)  return `il y a ${h}h`;
    if (m > 0)  return `il y a ${m}m`;
    return 'à l\'instant';
  }

  /* ══════════════════════════════════════
     TITRE DYNAMIQUE
  ══════════════════════════════════════ */

  _computeTitle() {
    const p = this.playerData;
    const ctx = {
      stages:  p.completedStages.size,
      chars:   p.uniqueCount(),
      wins:    p.combatsWon  ?? 0,
      summons: p.totalSummons ?? 0,
    };
    return (TITLES.find(t => t.condition(ctx)) ?? TITLES.at(-1)).label;
  }

  /* ══════════════════════════════════════
     PERSISTANCE AVATAR
  ══════════════════════════════════════ */

  _loadAvatar() {
    const v = parseInt(localStorage.getItem(AVATAR_KEY) ?? '0', 10);
    return isNaN(v) ? 0 : v % AVATARS.length;
  }

  _saveAvatar() {
    localStorage.setItem(AVATAR_KEY, String(this._avatarIdx));
  }
}
