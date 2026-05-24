/**
 * RewardPopupUI.js
 * Popup animée affichée après une victoire de combat.
 * Montre les récompenses (EXP + monnaie + artefacts droppés).
 */

import { gsap } from 'gsap';
import { audio } from '../audio/AudioManager.js';
import { ARTIFACT_SETS } from '../data/artifacts.js';

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
   * @param {object}   stage       - Objet stage (name, subtitle, rewards)
   * @param {number}   expGained   - EXP distribuée à chaque personnage
   * @param {Function} onContinue  - Callback une fois fermé
   * @param {Array}    [artDrops]  - Artefacts droppés (optionnel)
   */
  show(stage, expGained, onContinue, artDrops = []) {
    this._cb = onContinue;

    const currency = stage.rewards?.currency ?? 0;

    // Remplir le contenu textuel
    document.getElementById('reward-stage-name').textContent =
      `${stage.name}  —  ${stage.subtitle}`;
    document.getElementById('rval-exp').textContent = '+0';
    document.getElementById('rval-cur').textContent = '+0';

    // Section artefacts — injecter ou vider
    this._injectArtifactRows(artDrops);

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
      .to(this._popup, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      .to(this._box,   { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.15')
      .to('#reward-stars', { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.5)' }, '-=0.25')
      .to('#reward-items', { opacity: 1, duration: 0.25 }, '+=0.1')
      .to(expObj, {
        val: expGained,
        duration: 0.75,
        ease: 'power2.out',
        onUpdate: () => {
          document.getElementById('rval-exp').textContent =
            '+' + Math.round(expObj.val).toLocaleString();
        },
      }, '-=0.05')
      .to(curObj, {
        val: currency,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => {
          document.getElementById('rval-cur').textContent =
            '+' + Math.round(curObj.val).toLocaleString();
        },
      }, '-=0.4');

    // Animer les rangées d'artefacts si présentes
    if (artDrops.length > 0) {
      tl.fromTo('.rrow-art',
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, stagger: 0.12, duration: 0.3, ease: 'power2.out' },
        '-=0.2'
      );
    }

    tl.to('#reward-continue-btn', { opacity: 1, duration: 0.3 }, '+=0.1');
  }

  _injectArtifactRows(artDrops) {
    // Supprimer les anciennes lignes artefact
    document.querySelectorAll('.rrow-art').forEach(el => el.remove());

    if (!artDrops || artDrops.length === 0) return;

    const container = document.getElementById('reward-items');
    if (!container) return;

    artDrops.forEach(art => {
      const set    = ARTIFACT_SETS[art.setId];
      const stars  = '★'.repeat(art.rarity);
      const color  = _rarityColor(art.rarity);

      const row = document.createElement('div');
      row.className = 'reward-row rrow-art';
      row.innerHTML = `
        <span class="rr-icon" style="font-size:16px">${set?.icon ?? '?'}</span>
        <span class="rr-label">${set?.name ?? art.setId}</span>
        <span class="rr-val" style="color:${color};font-size:11px;letter-spacing:-1px">${stars}</span>
      `;
      container.appendChild(row);
    });
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

function _rarityColor(rarity) {
  return { 1: '#aaaaaa', 2: '#44ff88', 3: '#44aaff', 4: '#cc44ff', 5: '#ffcc00' }[rarity] ?? '#aaaaaa';
}
