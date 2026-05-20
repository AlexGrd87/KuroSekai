/**
 * MenuUI.js
 * Animations d'entrée (GSAP) et interactions boutons du menu principal.
 *
 * Améliorations DA :
 *  - Intro avec effet glitch sur le titre
 *  - Boutons slide-in avec back.out plus dramatique
 *  - Compteur de synchronisation HUD animé
 */

import { gsap } from 'gsap';

export class MenuUI {
  constructor() {
    this.title    = document.getElementById('game-title');
    this.subtitle = document.getElementById('game-subtitle');
    this.menu     = document.getElementById('main-menu');
    this.buttons  = document.querySelectorAll('.menu-btn');
    this._bindButtons();
  }

  /* ── Animation d'entrée splash — glitch titre puis fade-in éléments ── */
  playIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (this.title) {
      // Titre : apparaît puis subit un glitch rapide avant de se stabiliser
      tl.set(this.title, { opacity: 0, y: -20 })
        .to(this.title, { opacity: 1, y: 0, duration: 0.06, delay: 0.4 })
        .to(this.title, { x: -8, skewX: 6,  opacity: 0.8, duration: 0.05 })
        .to(this.title, { x:  5, skewX: -4, opacity: 1,   duration: 0.05 })
        .to(this.title, { x: -3, skewX: 2,  opacity: 0.6, duration: 0.04 })
        .to(this.title, { x:  2, skewX: -1, opacity: 1,   duration: 0.04 })
        .to(this.title, { x:  0, skewX: 0,  opacity: 0.5, duration: 0.03 })
        .to(this.title, { x:  0, skewX: 0,  opacity: 1,   duration: 0.25, ease: 'power2.out' });
    }

    if (this.subtitle) {
      tl.to(this.subtitle, { opacity: 1, duration: 0.7 }, '-=0.15');
    }

    // Décoration circuit gauche
    tl.to('#deco-left', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.4');

    // HUD bar apparaît en dernier
    tl.to('#hud-bar', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.1');

    // Dots de chargement
    tl.to('.splash-dot', { opacity: 1, duration: 0.3 }, '-=0.2');

    // Compteur de sync
    tl.add(() => this._animateSyncCounter(), '<');
  }

  /* ── Compteur de synchronisation (0 → 98.7%) ── */
  _animateSyncCounter() {
    const el = document.getElementById('hud-sync');
    if (!el) return;
    let val = 0;
    const target = 98.7;
    const step = () => {
      val += 4.5 + Math.random() * 8;
      if (val >= target) {
        el.textContent = target.toFixed(1) + '%';
        return;
      }
      el.textContent = val.toFixed(1) + '%';
      setTimeout(step, 40 + Math.random() * 30);
    };
    step();
  }

  /* ── Liaison des boutons (no-op, les boutons menu sont supprimés) ── */
  _bindButtons() {}

  /* ── Feedback visuel au clic ── */
  _onButtonClick(label) {
    console.log(`[KuroSekai] Menu → ${label}`);
    gsap.to('#ui-overlay', {
      background: 'radial-gradient(ellipse at center, rgba(0,180,255,0.12) 0%, rgba(0,0,0,0.6) 100%)',
      duration: 0.12,
      yoyo: true,
      repeat: 1,
    });
  }
}
