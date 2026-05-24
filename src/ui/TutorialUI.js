/**
 * TutorialUI.js — Tutoriel interactif pas-à-pas pour KuroSekai.
 * Singleton : import { tutorialUI } from './TutorialUI.js'
 *
 * Affiche un spotlight sur les éléments du hub avec tooltip animé.
 * Se déclenche une seule fois (flag en localStorage).
 */

import { gsap }  from 'gsap';
import { toast } from './ToastUI.js';

const TUTORIAL_KEY = 'kuro_tutorial_v1';

const STEPS = [
  {
    target:   null,
    title:    'Bienvenue, Commandant !',
    text:     'KuroSekai est un RPG gacha cyberpunk se déroulant dans Neo-Osaka 2087. Je vais te guider à travers l\'essentiel.',
    position: 'center',
  },
  {
    target:   '#hub-bld-combat',
    title:    'Zone Combat',
    text:     'Lance ta campagne ici. Chaque stage coûte de l\'⚡ énergie — remporte-les pour gagner de l\'EXP, de la monnaie et des étoiles de performance.',
    position: 'right',
  },
  {
    target:   '#hub-energy-display',
    title:    'Énergie ⚡',
    text:     'L\'énergie se dépense pour lancer des combats. Elle se régénère automatiquement (+1 toutes les 30 min, max 10).',
    position: 'bottom',
  },
  {
    target:   '#hub-bld-summon',
    title:    'Invocation',
    text:     'Invoque de nouveaux personnages ici. Accumule des ◈ et des tirages gratuits via les quêtes et la connexion quotidienne.',
    position: 'right',
  },
  {
    target:   '#hub-missions-btn',
    title:    'Missions & Quêtes',
    text:     'Accomplis des objectifs journaliers et hebdomadaires pour obtenir des récompenses régulières. La pastille rouge indique des récompenses à réclamer.',
    position: 'bottom-left',
  },
  {
    target:   null,
    title:    'À toi de jouer !',
    text:     'Tu es prêt. Commence par la campagne, renforce tes personnages et deviens le maître de Neo-Osaka. Bonne chance !',
    position: 'center',
    isLast:   true,
    reward:   { currency: 500 },
  },
];

class Tutorial {
  constructor() {
    this._overlay  = null;
    this._step     = 0;
    this._onDone   = null;
  }

  /** Retourne true si le tutoriel n'a pas encore été vu. */
  isNew() {
    return !localStorage.getItem(TUTORIAL_KEY);
  }

  /**
   * Lance le tutoriel.
   * @param {PlayerData} playerData
   * @param {Function}   onDone    — appelée à la fin (peut être null)
   */
  start(playerData, onDone = null) {
    if (!this.isNew()) return;
    this._playerData = playerData;
    this._onDone     = onDone;
    this._step       = 0;
    this._buildOverlay();
    this._showStep(0);
  }

  /* ═══ DOM ═══ */

  _buildOverlay() {
    if (this._overlay) this._overlay.remove();
    this._overlay = document.createElement('div');
    this._overlay.id = 'tutorial-overlay';
    this._overlay.innerHTML = `
      <div id="tut-backdrop"></div>
      <div id="tut-spotlight"></div>
      <div id="tut-tooltip">
        <div id="tut-step-dots"></div>
        <div id="tut-title"></div>
        <p  id="tut-text"></p>
        <div id="tut-footer">
          <button id="tut-skip-btn">Passer</button>
          <button id="tut-next-btn">Suivant →</button>
        </div>
      </div>`;
    document.body.appendChild(this._overlay);

    document.getElementById('tut-next-btn')
      ?.addEventListener('click', () => this._nextStep());
    document.getElementById('tut-skip-btn')
      ?.addEventListener('click', () => this._finish(false));

    gsap.fromTo(this._overlay,
      { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
  }

  /* ═══ Étapes ═══ */

  _showStep(index) {
    const step = STEPS[index];
    if (!step) { this._finish(true); return; }

    const totalVisible = STEPS.length;
    const dots = STEPS.map((_, i) =>
      `<span class="tut-dot ${i === index ? 'tut-dot--active' : ''}"></span>`
    ).join('');
    document.getElementById('tut-step-dots').innerHTML = dots;

    // Textes
    gsap.to('#tut-title', { opacity: 0, duration: 0.1, onComplete: () => {
      document.getElementById('tut-title').textContent = step.title;
      gsap.to('#tut-title', { opacity: 1, duration: 0.2 });
    }});
    gsap.to('#tut-text', { opacity: 0, duration: 0.1, onComplete: () => {
      document.getElementById('tut-text').textContent = step.text;
      gsap.to('#tut-text', { opacity: 1, duration: 0.2 });
    }});

    // Bouton suivant / terminer
    const nextBtn = document.getElementById('tut-next-btn');
    if (nextBtn) {
      nextBtn.textContent = step.isLast ? '✓ Commencer !' : 'Suivant →';
    }

    // Spotlight
    this._updateSpotlight(step);
    // Tooltip position
    this._positionTooltip(step);
  }

  _updateSpotlight(step) {
    const spotlight = document.getElementById('tut-spotlight');
    if (!spotlight) return;

    if (!step.target) {
      // Pas de spotlight — plein écran flou
      gsap.to(spotlight, { opacity: 0, duration: 0.3 });
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      gsap.to(spotlight, { opacity: 0, duration: 0.3 });
      return;
    }

    const rect   = el.getBoundingClientRect();
    const pad    = 10;
    const props  = {
      left:   rect.left   - pad,
      top:    rect.top    - pad,
      width:  rect.width  + pad * 2,
      height: rect.height + pad * 2,
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
    };

    gsap.to(spotlight, props);
  }

  _positionTooltip(step) {
    const tooltip = document.getElementById('tut-tooltip');
    if (!tooltip) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tw = 300; // largeur tooltip
    const th = 200; // hauteur estimée

    if (!step.target || step.position === 'center') {
      // Centre de l'écran
      gsap.to(tooltip, {
        left: vw / 2 - tw / 2,
        top:  vh / 2 - th / 2,
        duration: 0.35,
        ease: 'power3.out',
      });
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      gsap.to(tooltip, { left: vw / 2 - tw / 2, top: vh / 2 - th / 2, duration: 0.3 });
      return;
    }

    const rect = el.getBoundingClientRect();
    let x, y;
    const gap = 18;

    switch (step.position) {
      case 'bottom':
        x = rect.left + rect.width / 2 - tw / 2;
        y = rect.bottom + gap;
        break;
      case 'bottom-left':
        x = Math.max(8, rect.right - tw);
        y = rect.bottom + gap;
        break;
      case 'right':
        x = rect.right + gap;
        y = rect.top + rect.height / 2 - th / 2;
        break;
      case 'top':
        x = rect.left + rect.width / 2 - tw / 2;
        y = rect.top - th - gap;
        break;
      default:
        x = vw / 2 - tw / 2;
        y = vh / 2 - th / 2;
    }

    // Clamp dans l'écran
    x = Math.max(8, Math.min(vw - tw - 8, x));
    y = Math.max(8, Math.min(vh - th - 8, y));

    gsap.to(tooltip, { left: x, top: y, duration: 0.4, ease: 'power3.out' });
  }

  _nextStep() {
    this._step++;
    if (this._step >= STEPS.length) {
      this._finish(true);
    } else {
      this._showStep(this._step);
    }
  }

  _finish(completed) {
    localStorage.setItem(TUTORIAL_KEY, '1');

    // Récompense si terminé normalement
    if (completed && this._playerData) {
      const lastStep = STEPS.at(-1);
      if (lastStep?.reward?.currency) {
        this._playerData.currency += lastStep.reward.currency;
        this._playerData._saveProgress?.();
      }
      toast.show('Tutoriel terminé !', 'success',
        { sub: `+${STEPS.at(-1)?.reward?.currency ?? 0} ◈ de bienvenue`, duration: 4000 });
    }

    gsap.to(this._overlay, {
      opacity: 0, duration: 0.35, ease: 'power2.in',
      onComplete: () => {
        this._overlay?.remove();
        this._overlay = null;
        this._onDone?.();
      },
    });
  }
}

export const tutorialUI = new Tutorial();
