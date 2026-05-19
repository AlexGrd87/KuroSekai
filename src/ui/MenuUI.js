/**
 * MenuUI.js
 * Gère les animations d'entrée du menu (GSAP) et les interactions boutons.
 * Séparé de la scène 3D pour garder chaque fichier focalisé sur un rôle.
 */

import { gsap } from 'gsap';

export class MenuUI {
  constructor() {
    // Références aux éléments DOM du menu
    this.title    = document.getElementById('game-title');
    this.subtitle = document.getElementById('game-subtitle');
    this.menu     = document.getElementById('main-menu');
    this.buttons  = document.querySelectorAll('.menu-btn');

    this._bindButtons();
  }

  /* ── Animation d'entrée (appelée au chargement) ── */
  playIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Le titre descend et apparaît
    tl.to(this.title, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      delay: 0.5,
    });

    // La ligne d'accroche suit
    tl.to(this.subtitle, {
      opacity: 1,
      duration: 0.8,
    }, '-=0.3');

    // Les boutons apparaissent un par un (stagger)
    tl.to(this.menu, {
      opacity: 1,
      duration: 0.4,
    }, '-=0.2');

    tl.from(this.buttons, {
      x: -30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.12,
    }, '-=0.3');
  }

  /* ── Liaison des boutons aux actions ── */
  _bindButtons() {
    document.getElementById('btn-play')?.addEventListener('click', () => {
      this._onButtonClick('Commencer');
      // TODO Sprint 2 : transition vers l'écran de combat
    });

    document.getElementById('btn-summon')?.addEventListener('click', () => {
      this._onButtonClick('Invocation');
      // TODO Sprint 2 : ouvrir l'écran de gacha pull
    });

    document.getElementById('btn-collection')?.addEventListener('click', () => {
      this._onButtonClick('Collection');
      // TODO Sprint 3 : afficher la collection de personnages
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this._onButtonClick('Paramètres');
      // TODO : panneau paramètres
    });
  }

  /* ── Feedback visuel au clic (flash + console) ── */
  _onButtonClick(label) {
    console.log(`[KuroSekai] Menu → ${label}`);

    // Flash rouge sur l'overlay pour feedback immédiat
    gsap.to('#ui-overlay', {
      background: 'radial-gradient(ellipse at center, rgba(192,21,42,0.15) 0%, rgba(0,0,0,0.6) 100%)',
      duration: 0.15,
      yoyo: true,
      repeat: 1,
    });
  }
}
