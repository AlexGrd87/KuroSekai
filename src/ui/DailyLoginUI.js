/**
 * DailyLoginUI.js
 * Popup de récompenses de connexion quotidienne (7 jours cycliques).
 */

import { gsap } from 'gsap';
import { audio } from '../audio/AudioManager.js';

export class DailyLoginUI {
  /**
   * @param {import('../data/PlayerData.js').PlayerData} playerData
   * @param {() => void} onClose  — callback quand la popup est fermée
   */
  constructor(playerData, onClose) {
    this.playerData = playerData;
    this.onClose    = onClose;

    this._overlay   = document.getElementById('daily-login-overlay');
    this._box       = document.getElementById('daily-login-box');
    this._grid      = document.getElementById('dlb-grid');
    this._claimBtn  = document.getElementById('dlb-claim-btn');
    this._closeBtn  = document.getElementById('dlb-close-btn');
    this._streakVal = document.getElementById('dlb-streak-val');
    this._spotIcon  = document.getElementById('dlb-reward-icon');
    this._spotDesc  = document.getElementById('dlb-reward-desc');

    this._bind();
  }

  _bind() {
    this._claimBtn?.addEventListener('click', () => this._claim());
    this._closeBtn?.addEventListener('click', () => this.hide());
  }

  /* ── Affichage ─────────────────────────────────────────── */

  /**
   * Affiche la popup.
   * @param {boolean} [force=false] — affiche même si déjà réclamé aujourd'hui
   */
  show(force = false) {
    const state = this.playerData.getDailyLoginState();
    if (!force && state.claimedToday) return;   // déjà réclamé : ne pas afficher

    this._render(state);

    gsap.set(this._overlay, { display: 'flex', opacity: 0 });
    gsap.set(this._box,     { scale: 0.85, y: 30, opacity: 0 });
    gsap.to(this._overlay,  { opacity: 1, duration: 0.25 });
    gsap.to(this._box,      { scale: 1, y: 0, opacity: 1,
                               duration: 0.4, ease: 'back.out(1.6)', delay: 0.05 });

    // Stagger des cartes
    gsap.fromTo('.dlb-day-card',
      { opacity: 0, y: 16, scale: 0.88 },
      { opacity: 1, y: 0,  scale: 1,
        duration: 0.25, stagger: 0.06, ease: 'power2.out', delay: 0.2 });
  }

  hide() {
    gsap.to(this._box, {
      scale: 0.88, opacity: 0, y: 20, duration: 0.22, ease: 'power2.in',
      onComplete: () => {
        gsap.set(this._overlay, { display: 'none' });
        this.onClose?.();
      },
    });
  }

  /* ── Rendu ─────────────────────────────────────────────── */

  _render(state) {
    const { streak, dayInCycle, reward, claimedToday, allRewards } = state;

    // Streak
    if (this._streakVal) this._streakVal.textContent = streak;

    // Mise en avant récompense du jour
    if (reward) {
      if (this._spotIcon) this._spotIcon.textContent = reward.icon;
      if (this._spotDesc) this._spotDesc.textContent = claimedToday
        ? '✓ Récompense déjà réclamée aujourd\'hui'
        : reward.desc;
    }

    // Bouton
    if (this._claimBtn) {
      this._claimBtn.disabled      = claimedToday;
      this._claimBtn.textContent   = claimedToday ? '✓ Réclamé' : '✦ RÉCLAMER';
      this._claimBtn.classList.toggle('dlb-claim-btn--done', claimedToday);
    }

    // Grille 7 jours
    if (!this._grid) return;
    this._grid.innerHTML = '';
    allRewards.forEach(r => {
      const isPast     = r.day < dayInCycle;
      const isCurrent  = r.day === dayInCycle;
      const isFuture   = r.day > dayInCycle;
      const isClaimed  = isPast || (isCurrent && claimedToday);

      const card = document.createElement('div');
      card.className = [
        'dlb-day-card',
        isCurrent ? 'dlb-day-card--current' : '',
        isClaimed ? 'dlb-day-card--claimed' : '',
        isFuture  ? 'dlb-day-card--future'  : '',
        r.special ? 'dlb-day-card--special' : '',
      ].filter(Boolean).join(' ');

      card.innerHTML = `
        <div class="dlb-day-label">${r.label}</div>
        <div class="dlb-day-icon">${isClaimed ? '✓' : r.icon}</div>
        <div class="dlb-day-desc">${r.desc}</div>
      `;

      this._grid.appendChild(card);
    });
  }

  /* ── Claim ─────────────────────────────────────────────── */

  _claim() {
    const reward = this.playerData.claimDailyLogin();
    if (!reward) return;

    audio.play('shop_buy');

    // Animation flash sur la carte courante
    const currentCard = this._grid?.querySelector('.dlb-day-card--current');
    if (currentCard) {
      gsap.timeline()
        .to(currentCard,  { scale: 1.12, duration: 0.15, ease: 'power2.out' })
        .to(currentCard,  { scale: 1,    duration: 0.25, ease: 'back.out(2)' });
    }

    // Animation sur l'icône spotlight
    if (this._spotIcon) {
      gsap.fromTo(this._spotIcon,
        { scale: 1 },
        { scale: 1.5, duration: 0.2, ease: 'power2.out',
          onComplete: () => gsap.to(this._spotIcon, { scale: 1, duration: 0.3, ease: 'back.out(2)' }) });
    }

    // Re-render pour mettre à jour l'état
    const newState = this.playerData.getDailyLoginState();
    this._render(newState);

    // Particules de confettis légers (étoiles flottantes)
    this._burstParticles();

    // Fermeture auto après 2.5 s
    gsap.delayedCall(2.5, () => this.hide());
  }

  /* ── Particules cosmétiques ──────────────────────────────── */

  _burstParticles() {
    if (!this._box) return;
    const symbols = ['✦', '◈', '★', '✦', '◈'];
    symbols.forEach((sym, i) => {
      const el = document.createElement('div');
      el.className    = 'dlb-particle';
      el.textContent  = sym;
      el.style.cssText = `
        position: absolute;
        left: ${30 + Math.random() * 40}%;
        top:  ${20 + Math.random() * 40}%;
        font-size: ${0.7 + Math.random() * 0.6}rem;
        pointer-events: none; z-index: 20;
        color: ${['#00d4ff','#f0c040','#ffffff','#00ff88'][i % 4]};
      `;
      this._box.style.position = 'relative';
      this._box.appendChild(el);

      gsap.fromTo(el,
        { opacity: 1, y: 0, scale: 1 },
        {
          opacity: 0,
          y: -(40 + Math.random() * 60),
          x: (Math.random() - 0.5) * 80,
          scale: 0.3,
          duration: 0.9 + Math.random() * 0.5,
          ease: 'power1.out',
          delay: i * 0.08,
          onComplete: () => el.remove(),
        }
      );
    });
  }
}
