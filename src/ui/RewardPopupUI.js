/**
 * RewardPopupUI.js
 * Popup animée affichée après une victoire de combat.
 * Montre les récompenses (EXP + monnaie) avec un compte à rebours.
 */

import { gsap } from 'gsap';
import { audio } from '../audio/AudioManager.js';

export class RewardPopupUI {
  constructor() {
    this._popup = document.getElementById('reward-popup');
    this._box   = document.getElementById('reward-box');
    this._cb    = null;

    document.getElementById('reward-continue-btn')
      ?.addEventListener('click', () => this._dismiss());
  }

  /**
   * Affiche la popup et lance les animations.
   * @param {object} stage      - Objet stage (name, subtitle, rewards)
   * @param {number} expGained  - EXP distribuée à chaque personnage
   * @param {Function} onContinue - Callback une fois fermé
   */
  show(stage, expGained, onContinue) {
    this._cb = onContinue;

    const currency = stage.rewards?.currency ?? 0;

    // Remplir le contenu
    document.getElementById('reward-stage-name').textContent =
      `${stage.name}  —  ${stage.subtitle}`;
    document.getElementById('rval-exp').textContent = '+0';
    document.getElementById('rval-cur').textContent = '+0';

    // Afficher l'overlay
    gsap.set(this._popup, { display: 'flex', opacity: 0 });
    gsap.set(this._box,   { y: -50, scale: 0.82, opacity: 0 });
    gsap.set('#reward-stars', { opacity: 0, scale: 0.4 });
    gsap.set('#reward-items', { opacity: 0 });
    gsap.set('#reward-continue-btn', { opacity: 0 });

    const expObj = { val: 0 };
    const curObj = { val: 0 };

    const tl = gsap.timeline();

    tl
      // Fondu overlay
      .to(this._popup, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      // Boîte qui descend
      .to(this._box, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.15')
      // Étoiles
      .to('#reward-stars', { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.5)' }, '-=0.25')
      // Lignes de récompenses
      .to('#reward-items', { opacity: 1, duration: 0.25 }, '+=0.1')
      // Count-up EXP
      .to(expObj, {
        val: expGained,
        duration: 0.75,
        ease: 'power2.out',
        onUpdate: () => {
          document.getElementById('rval-exp').textContent =
            '+' + Math.round(expObj.val).toLocaleString();
        },
      }, '-=0.05')
      // Count-up Monnaie (en chevauchement)
      .to(curObj, {
        val: currency,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => {
          document.getElementById('rval-cur').textContent =
            '+' + Math.round(curObj.val).toLocaleString();
        },
      }, '-=0.4')
      // Bouton continuer
      .to('#reward-continue-btn', { opacity: 1, duration: 0.3 }, '+=0.1');
  }

  _dismiss() {
    const cb = this._cb;
    this._cb = null;

    gsap.to(this._box, {
      y: 25, scale: 0.9, opacity: 0, duration: 0.28, ease: 'power2.in',
      onComplete: () => {
        gsap.set(this._popup, { display: 'none' });
        cb?.();
      },
    });
  }
}
