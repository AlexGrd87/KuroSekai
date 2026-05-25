/**
 * EventUI.js — Écran des événements temporaires de KuroSekai.
 * Vue liste : toutes les events actives / à venir.
 * Vue détail : quêtes + complétion + countdown temps réel.
 */

import { gsap }   from 'gsap';
import { audio }  from '../audio/AudioManager.js';
import { toast }  from './ToastUI.js';
import {
  EVENTS, getActiveEvents, getUpcomingEvents, getEventById, formatEventCountdown,
} from '../data/events.js';

export class EventUI {
  constructor(playerData, onBack) {
    this.playerData     = playerData;
    this.onBack         = onBack;
    this.screen         = document.getElementById('event-screen');
    this._view          = 'list';   // 'list' | 'detail'
    this._activeEventId = null;
    this._timerInt      = null;

    document.addEventListener('kuro:events-updated', () => {
      if (this.screen?.style.display === 'none') return;
      if (this._view === 'detail') this._renderDetail();
      else                          this._renderList();
      this._updateBadge();
    });
  }

  /* ════════════════════════════════
     SHOW / HIDE
  ════════════════════════════════ */

  show() {
    this._view = 'list';
    this._activeEventId = null;
    this._renderFull();
    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 24 });
    gsap.to(this.screen, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
    audio.play?.('ui_navigate');
    this._startTimer();
  }

  hide() {
    this._stopTimer();
    gsap.to(this.screen, {
      opacity: 0, y: 16, duration: 0.28, ease: 'power2.in',
      onComplete: () => { if (this.screen) this.screen.style.display = 'none'; },
    });
  }

  _startTimer() {
    this._stopTimer();
    this._timerInt = setInterval(() => this._tickTimer(), 1000);
  }

  _stopTimer() {
    clearInterval(this._timerInt);
    this._timerInt = null;
  }

  _tickTimer() {
    if (!this.screen || this.screen.style.display === 'none') return;
    const now = Date.now();

    if (this._view === 'detail' && this._activeEventId) {
      const ev = getEventById(this._activeEventId);
      if (!ev) return;
      const el = this.screen.querySelector('.ev-countdown');
      if (el) el.textContent = `Fin dans ${formatEventCountdown(ev.endTime - now)}`;
    } else {
      // Mise à jour des mini-timers dans les cartes de la liste
      this.screen.querySelectorAll('.ev-card-timer[data-end]').forEach(el => {
        const end = parseInt(el.dataset.end, 10);
        const rem = end - now;
        el.textContent = rem > 0 ? `Fin dans ${formatEventCountdown(rem)}` : 'Terminé';
      });
    }
  }

  /* ════════════════════════════════
     RENDU PRINCIPAL
  ════════════════════════════════ */

  _renderFull() {
    if (!this.screen) return;
    this.screen.innerHTML = `
      <div id="ev-topbar">
        <button id="ev-back-btn" class="ev-back-btn">← RETOUR</button>
        <div class="ev-topbar-center">
          <span class="ev-topbar-kanji">祭</span>
          <span class="ev-topbar-title">ÉVÉNEMENTS</span>
        </div>
        <div></div>
      </div>
      <div id="ev-content"></div>`;

    document.getElementById('ev-back-btn')
      ?.addEventListener('click', () => this._handleBack());

    this._renderList();
  }

  _renderList() {
    const wrap = this.screen?.querySelector('#ev-content');
    if (!wrap) return;

    const active   = getActiveEvents();
    const upcoming = getUpcomingEvents();

    if (!active.length && !upcoming.length) {
      wrap.innerHTML = this._emptyHTML();
      return;
    }

    let html = '';

    if (active.length) {
      html += `<div class="ev-section-title">EN COURS</div>
               <div class="ev-list">`;
      for (const ev of active) {
        html += this._eventCardHTML(ev, false);
      }
      html += `</div>`;
    }

    if (upcoming.length) {
      html += `<div class="ev-section-title ev-section-title--upcoming">À VENIR</div>
               <div class="ev-list">`;
      for (const ev of upcoming) {
        html += this._eventCardHTML(ev, true);
      }
      html += `</div>`;
    }

    wrap.innerHTML = html;

    // Bind les boutons "détails"
    wrap.querySelectorAll('[data-ev-detail]').forEach(btn => {
      btn.addEventListener('click', () => {
        const evId = btn.dataset.evDetail;
        audio.play?.('ui_navigate');
        this._openDetail(evId);
      });
    });

    // Stagger entrée
    gsap.fromTo(wrap.querySelectorAll('.ev-card'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.1, ease: 'power2.out' });
  }

  _eventCardHTML(ev, upcoming) {
    const now      = Date.now();
    const rem      = ev.endTime - now;
    const start    = ev.startTime - now;
    const states   = this.playerData.getEventQuestState(ev.id);
    const done     = states.filter(s => s.done).length;
    const claimable = states.filter(s => s.done && !s.claimed).length;
    const allDone  = done === states.length && states.length > 0;
    const compProg = this.playerData.eventProgress?.[ev.id];
    const compClaimable = allDone && !compProg?.completionClaimed;

    const totalClaimable = claimable + (compClaimable ? 1 : 0);

    const timerStr = upcoming
      ? `Début dans ${formatEventCountdown(start)}`
      : rem > 0 ? `Fin dans ${formatEventCountdown(rem)}` : 'Terminé';

    return `
      <div class="ev-card ${upcoming ? 'ev-card--upcoming' : ''}" style="--ec:${ev.color};--ecd:${ev.colorDim}">
        <div class="ev-card-head">
          <span class="ev-card-kanji">${ev.kanji}</span>
          <div class="ev-card-info">
            <div class="ev-card-name">${ev.name}</div>
            <div class="ev-card-namejp">${ev.nameJp}</div>
          </div>
          ${totalClaimable > 0
            ? `<span class="ev-card-claimable-badge">${totalClaimable} à réclamer</span>`
            : ''}
        </div>
        <div class="ev-card-body">
          <p class="ev-card-desc">${ev.description}</p>
          <div class="ev-card-footer">
            <span class="ev-card-timer" data-end="${ev.endTime}">${timerStr}</span>
            <div class="ev-card-progress-mini">${done}/${ev.quests.length} quêtes</div>
            ${!upcoming
              ? `<button class="ev-card-btn" data-ev-detail="${ev.id}">VOIR DÉTAILS →</button>`
              : `<div class="ev-card-upcoming-label">Bientôt</div>`}
          </div>
        </div>
      </div>`;
  }

  _emptyHTML() {
    return `
      <div class="ev-empty">
        <div class="ev-empty-kanji">無</div>
        <div class="ev-empty-title">Aucun événement actif</div>
        <div class="ev-empty-sub">Les prochains événements seront annoncés bientôt.</div>
      </div>`;
  }

  /* ════════════════════════════════
     VUE DÉTAIL
  ════════════════════════════════ */

  _openDetail(eventId) {
    this._view          = 'detail';
    this._activeEventId = eventId;
    this._renderDetail();
    // Scroll en haut
    const content = this.screen?.querySelector('#ev-content');
    if (content) content.scrollTop = 0;
  }

  _renderDetail() {
    const wrap = this.screen?.querySelector('#ev-content');
    if (!wrap) return;

    const ev = getEventById(this._activeEventId);
    if (!ev) { this._view = 'list'; this._renderList(); return; }

    const now     = Date.now();
    const rem     = ev.endTime - now;
    const states  = this.playerData.getEventQuestState(ev.id);
    const prog    = this.playerData.eventProgress?.[ev.id] ?? {};

    const allClaimed     = states.every(s => s.claimed);
    const compClaimable  = allClaimed && !prog.completionClaimed;
    const compClaimed    = !!prog.completionClaimed;

    wrap.innerHTML = `
      <div class="ev-detail">
        <!-- Banner -->
        <div class="ev-detail-banner" style="--ec:${ev.color};--ecd:${ev.colorDim}">
          <span class="ev-detail-kanji">${ev.kanji}</span>
          <div class="ev-detail-names">
            <div class="ev-detail-name">${ev.name}</div>
            <div class="ev-detail-namejp">${ev.nameJp}</div>
          </div>
          <div class="ev-countdown">Fin dans ${formatEventCountdown(rem)}</div>
        </div>

        <!-- Description -->
        <p class="ev-detail-desc">${ev.description}</p>

        <!-- Quêtes -->
        <div class="ev-qs-header">QUÊTES DE L'ÉVÉNEMENT</div>
        <div class="ev-quest-list">
          ${states.map(s => this._questRowHTML(s)).join('')}
        </div>

        <!-- Complétion -->
        <div class="ev-completion ${compClaimable ? 'ev-completion--ready' : ''} ${compClaimed ? 'ev-completion--claimed' : ''}">
          <div class="ev-comp-left">
            <div class="ev-comp-title">🏆 RÉCOMPENSE DE COMPLÉTION</div>
            <div class="ev-comp-sub">Réclamez toutes les quêtes pour débloquer</div>
            <div class="ev-comp-rewards">${this._rewardsLabel(ev.completion)}</div>
          </div>
          <div class="ev-comp-action">
            ${compClaimed
              ? `<div class="ev-comp-done">✓</div>`
              : compClaimable
                ? `<button class="ev-comp-claim-btn">RÉCLAMER</button>`
                : `<div class="ev-comp-locked">🔒</div>`}
          </div>
        </div>
      </div>`;

    // Bind claim quêtes
    wrap.querySelectorAll('.evq-claim-btn[data-quest-id]').forEach(btn => {
      btn.addEventListener('click', () => this._claimQuest(ev.id, btn.dataset.questId));
    });

    // Bind claim complétion
    wrap.querySelector('.ev-comp-claim-btn')
      ?.addEventListener('click', () => this._claimCompletion(ev.id));

    // Stagger
    gsap.fromTo(wrap.querySelectorAll('.ev-quest-row'),
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.07, ease: 'power2.out' });
    gsap.fromTo(wrap.querySelector('.ev-completion'),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, delay: 0.25, ease: 'power2.out' });
  }

  _questRowHTML({ quest, current, claimed, done }) {
    const pct = Math.round((current / quest.target) * 100);
    const cls = [
      'ev-quest-row',
      done && !claimed ? 'ev-quest-row--ready'   : '',
      claimed          ? 'ev-quest-row--claimed'  : '',
    ].filter(Boolean).join(' ');

    return `
      <div class="${cls}">
        <div class="evq-icon">${quest.icon}</div>
        <div class="evq-body">
          <div class="evq-head">
            <span class="evq-name">${quest.name}</span>
            ${claimed ? '<span class="evq-claimed-badge">✓ RÉCLAMÉ</span>' : ''}
          </div>
          <div class="evq-desc">${quest.desc}</div>
          <div class="evq-progress">
            <div class="evq-bar-track">
              <div class="evq-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="evq-count">${current} / ${quest.target}</span>
          </div>
          <div class="evq-rewards">${this._rewardsLabel(quest.rewards)}</div>
        </div>
        <div class="evq-action">
          ${claimed
            ? `<div class="evq-done-icon">✓</div>`
            : done
              ? `<button class="evq-claim-btn" data-quest-id="${quest.id}">RÉCLAMER</button>`
              : ''}
        </div>
      </div>`;
  }

  _rewardsLabel(rewards) {
    const parts = [];
    if (rewards?.currency)  parts.push(`<span class="ev-rew ev-rew--cur">◈ ${rewards.currency.toLocaleString()}</span>`);
    if (rewards?.freeRolls) parts.push(`<span class="ev-rew ev-rew--roll">✦ ×${rewards.freeRolls} tirage${rewards.freeRolls > 1 ? 's' : ''}</span>`);
    return parts.join('');
  }

  /* ════════════════════════════════
     CLAIM
  ════════════════════════════════ */

  _claimQuest(eventId, questId) {
    const rewards = this.playerData.claimEventQuest(eventId, questId);
    if (!rewards) return;
    audio.play?.('shop_buy');

    const parts = [];
    if (rewards.currency)  parts.push(`+${rewards.currency.toLocaleString()} ◈`);
    if (rewards.freeRolls) parts.push(`+${rewards.freeRolls} tirage${rewards.freeRolls > 1 ? 's' : ''}`);
    toast.show('Récompense réclamée !', 'reward', { sub: parts.join(' · ') });

    const currEl = document.getElementById('hub-nav-currency-val');
    if (currEl) currEl.textContent = this.playerData.currency.toLocaleString();

    this._renderDetail();
    this._updateBadge();
  }

  _claimCompletion(eventId) {
    const rewards = this.playerData.claimEventCompletion(eventId);
    if (!rewards) return;
    audio.play?.('shop_buy');

    const parts = [];
    if (rewards.currency)  parts.push(`+${rewards.currency.toLocaleString()} ◈`);
    if (rewards.freeRolls) parts.push(`+${rewards.freeRolls} tirage${rewards.freeRolls > 1 ? 's' : ''}`);
    toast.show('🏆 Complétion débloquée !', 'reward', { sub: parts.join(' · '), duration: 5000 });

    const currEl = document.getElementById('hub-nav-currency-val');
    if (currEl) currEl.textContent = this.playerData.currency.toLocaleString();

    this._renderDetail();
    this._updateBadge();
  }

  /* ════════════════════════════════
     NAVIGATION
  ════════════════════════════════ */

  _handleBack() {
    audio.play?.('ui_navigate');
    if (this._view === 'detail') {
      this._view = 'list';
      this._activeEventId = null;
      gsap.fromTo(this.screen?.querySelector('#ev-content'),
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out',
          onStart: () => this._renderList() });
    } else {
      this.hide();
      this.onBack?.();
    }
  }

  /* ════════════════════════════════
     BADGE HUB
  ════════════════════════════════ */

  _updateBadge() {
    const badge = document.getElementById('hub-event-badge');
    if (!badge) return;
    const has = this.playerData.hasClaimableEventRewards();
    badge.style.display = has ? 'block' : 'none';
  }

  /** Appelé depuis l'extérieur (ex : goHub) */
  refreshBadge() {
    this._updateBadge();
  }
}
