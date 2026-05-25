/**
 * QuestsUI.js — Panneau Missions & Quêtes de KuroSekai.
 *
 * Deux onglets dans #quests-screen :
 *   JOURNALIÈRES — réinitialisées à minuit
 *   HEBDOMADAIRES — réinitialisées le lundi
 */

import { gsap }              from 'gsap';
import { formatTimeLeft, todayMidnight, weekStart } from '../data/quests.js';
import { audio }             from '../audio/AudioManager.js';

export class QuestsUI {
  constructor(playerData, onBack) {
    this.playerData = playerData;
    this.onBack     = onBack;

    this.screen     = document.getElementById('quests-screen');
    this._tab       = 'daily';
    this._timerInterval = null;

    this._bindEvents();

    // Actualise l'UI quand la progression change depuis ailleurs
    document.addEventListener('kuro:quests-updated', () => {
      if (this.screen.style.display !== 'none') this._renderList();
    });
  }

  /* ══════════════════════════════════════
     SHOW / HIDE
  ══════════════════════════════════════ */

  show() {
    this._tab = 'daily';
    this._renderTabs();
    this._renderList();
    this._startTimer();

    gsap.set(this.screen, { display: 'flex', opacity: 0 });
    gsap.to(this.screen,  { opacity: 1, duration: 0.35, ease: 'power2.out' });

    gsap.fromTo('#quests-header',
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, delay: 0.05, ease: 'power3.out' });

    gsap.fromTo('#quests-tab-bar',
      { y: -15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, delay: 0.1, ease: 'power2.out' });
  }

  hide() {
    this._stopTimer();
    gsap.to(this.screen, {
      opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => gsap.set(this.screen, { display: 'none' }),
    });
  }

  /* ══════════════════════════════════════
     EVENTS
  ══════════════════════════════════════ */

  _bindEvents() {
    document.getElementById('quests-back-btn')
      ?.addEventListener('click', () => { audio.play('ui_navigate'); this.hide(); this.onBack?.(); });

    document.getElementById('tab-daily')
      ?.addEventListener('click', () => this._switchTab('daily'));
    document.getElementById('tab-weekly')
      ?.addEventListener('click', () => this._switchTab('weekly'));
  }

  _switchTab(tab) {
    if (this._tab === tab) return;
    audio.play('ui_navigate');
    this._tab = tab;
    this._renderTabs();
    this._renderList();
    this._updateTimer();
  }

  /* ══════════════════════════════════════
     TABS
  ══════════════════════════════════════ */

  _renderTabs() {
    const daily  = document.getElementById('tab-daily');
    const weekly = document.getElementById('tab-weekly');
    if (!daily || !weekly) return;

    daily.classList.toggle('qt-tab--active',  this._tab === 'daily');
    weekly.classList.toggle('qt-tab--active', this._tab === 'weekly');

    // Indicateur de quêtes réclamables par onglet
    const dailyClaimable  = this._countClaimable('daily');
    const weeklyClaimable = this._countClaimable('weekly');
    const dailyBadge  = daily.querySelector('.qt-tab-badge');
    const weeklyBadge = weekly.querySelector('.qt-tab-badge');
    if (dailyBadge)  { dailyBadge.textContent  = dailyClaimable;  dailyBadge.style.display  = dailyClaimable  ? 'flex' : 'none'; }
    if (weeklyBadge) { weeklyBadge.textContent = weeklyClaimable; weeklyBadge.style.display = weeklyClaimable ? 'flex' : 'none'; }
  }

  _countClaimable(tab) {
    return this.playerData.getQuestState(tab)
      .filter(s => s.done && !s.claimed).length;
  }

  /* ══════════════════════════════════════
     LISTE DES QUÊTES
  ══════════════════════════════════════ */

  _renderList() {
    const wrap = document.getElementById('quests-list');
    if (!wrap) return;

    const states = this.playerData.getQuestState(this._tab);
    wrap.innerHTML = '';

    states.forEach((s, idx) => {
      const row = this._buildQuestRow(s);
      wrap.appendChild(row);
    });

    // Stagger d'entrée
    gsap.fromTo('.quest-row',
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out' });

    // Met à jour le badge du bouton hub
    this._updateHubBadge();
  }

  _buildQuestRow({ quest, current, claimed, done }) {
    const pct = Math.round((current / quest.target) * 100);

    const row = document.createElement('div');
    row.className = [
      'quest-row',
      done && !claimed ? 'quest-row--ready' : '',
      claimed ? 'quest-row--claimed' : '',
    ].filter(Boolean).join(' ');
    row.dataset.questId = quest.id;

    // Rewards label
    const rewardsHtml = this._rewardsHtml(quest.rewards);

    row.innerHTML = `
      <div class="qr-icon">${quest.icon}</div>
      <div class="qr-body">
        <div class="qr-head">
          <span class="qr-name">${quest.name}</span>
          ${claimed ? '<span class="qr-claimed-badge">✓ RÉCLAMÉ</span>' : ''}
        </div>
        <div class="qr-desc">${quest.desc}</div>
        <div class="qr-progress">
          <div class="qr-bar-track">
            <div class="qr-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="qr-count">${current} / ${quest.target}</span>
        </div>
        <div class="qr-rewards">${rewardsHtml}</div>
      </div>
      <div class="qr-action">
        ${this._claimBtnHtml(done, claimed, quest.rewards)}
      </div>`;

    // Bind claim
    if (done && !claimed) {
      row.querySelector('.qr-claim-btn')
        ?.addEventListener('click', () => this._claimQuest(quest.id, row));
    }

    return row;
  }

  _rewardsHtml(rewards) {
    const parts = [];
    if (rewards.currency)  parts.push(`<span class="qr-rew qr-rew--cur">◈ ${rewards.currency}</span>`);
    if (rewards.freeRolls) parts.push(`<span class="qr-rew qr-rew--roll">✦ ×${rewards.freeRolls} tirage${rewards.freeRolls > 1 ? 's' : ''}</span>`);
    return parts.join('');
  }

  _claimBtnHtml(done, claimed, rewards) {
    if (claimed) return `<div class="qr-done-icon">✓</div>`;
    if (done)    return `<button class="qr-claim-btn">RÉCLAMER</button>`;
    return '';
  }

  /* ══════════════════════════════════════
     CLAIM QUEST
  ══════════════════════════════════════ */

  _claimQuest(questId, row) {
    const rewards = this.playerData.claimQuest(questId, this._tab);
    if (!rewards) return;

    audio.play('shop_buy');
    this.playerData.addAccountXP('QUEST_CLAIM');

    // Flash de la carte
    gsap.to(row, { backgroundColor: 'rgba(0,212,255,0.25)', duration: 0.15,
      onComplete: () => gsap.to(row, { backgroundColor: '', duration: 0.4 }) });

    // Toast de récompense
    this._showClaimToast(rewards);

    // Sync monnaie dans le hub
    const currEl = document.getElementById('hub-nav-currency-val');
    if (currEl) currEl.textContent = this.playerData.currency.toLocaleString();

    // Rafraîchit les onglets et la liste après animation
    setTimeout(() => {
      this._renderTabs();
      this._renderList();
    }, 400);
  }

  _showClaimToast(rewards) {
    const toast = document.getElementById('quests-toast');
    if (!toast) return;

    const parts = [];
    if (rewards.currency)  parts.push(`+${rewards.currency} ◈`);
    if (rewards.freeRolls) parts.push(`+${rewards.freeRolls} tirage${rewards.freeRolls > 1 ? 's' : ''}`);
    toast.textContent = parts.join('  ·  ');

    gsap.killTweensOf(toast);
    gsap.fromTo(toast,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out',
        onComplete: () => gsap.to(toast, { opacity: 0, duration: 0.4, delay: 1.8 }) });
  }

  /* ══════════════════════════════════════
     TIMER DE RESET
  ══════════════════════════════════════ */

  _startTimer() {
    this._stopTimer();
    this._updateTimer();
    this._timerInterval = setInterval(() => this._updateTimer(), 30_000); // maj toutes les 30s
  }

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  _updateTimer() {
    const el = document.getElementById('quests-timer');
    if (!el) return;

    const now = Date.now();
    if (this._tab === 'daily') {
      const nextReset = todayMidnight() + 86_400_000; // minuit prochain
      el.textContent  = `Réinitialisation dans ${formatTimeLeft(nextReset - now)}`;
    } else {
      const nextReset = weekStart() + 7 * 86_400_000; // lundi prochain
      el.textContent  = `Réinitialisation dans ${formatTimeLeft(nextReset - now)}`;
    }
  }

  /* ══════════════════════════════════════
     BADGE HUB
  ══════════════════════════════════════ */

  _updateHubBadge() {
    const badge = document.getElementById('hub-missions-badge');
    if (!badge) return;
    const n = this.playerData.claimableQuestCount();
    badge.textContent = n;
    badge.style.display = n > 0 ? 'flex' : 'none';
  }

  /** Appelée depuis l'extérieur pour mettre à jour le badge sans ouvrir le panneau */
  refreshBadge() {
    this._updateHubBadge();
  }
}
