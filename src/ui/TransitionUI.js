/**
 * TransitionUI.js — Transitions cinématiques entre écrans
 * Singleton : import { transition } from './TransitionUI.js'
 * Usage : transition.sweep('combat', () => { /* lance le combat *\/ })
 * Presets : 'combat' | 'summon' | 'collection' | 'shop' | 'map' | 'hub' | 'dungeon'
 */
import { gsap } from 'gsap';

const PRESETS = {
  combat:     { color: '#1a0008', accent: '#cc0022', kanji: '戦', label: 'COMBAT' },
  summon:     { color: '#0d0020', accent: '#7722ff', kanji: '召', label: 'INVOCATION' },
  collection: { color: '#000e22', accent: '#0066cc', kanji: '蒐', label: 'COLLECTION' },
  shop:       { color: '#1a0d00', accent: '#cc6600', kanji: '店', label: 'BOUTIQUE' },
  map:        { color: '#000a1e', accent: '#0044bb', kanji: '作', label: 'CAMPAGNE' },
  dungeon:    { color: '#0a0010', accent: '#660099', kanji: '奈', label: 'DONJON' },
  hub:        { color: '#030810', accent: '#003366', kanji: '基', label: 'HUB' },
};

class TransitionManager {
  constructor() { this._el = null; }

  _ensure() {
    if (this._el) return;
    this._el = document.createElement('div');
    this._el.id = 'tr-overlay';
    this._el.innerHTML = `
      <div class="tr-panel tr-panel--accent"></div>
      <div class="tr-panel tr-panel--main"></div>
      <div class="tr-info">
        <div class="tr-kanji"></div>
        <div class="tr-label"></div>
      </div>`;
    document.body.appendChild(this._el);
    gsap.set(this._el, { display: 'none' });
  }

  /**
   * @param {string}   preset    — clé du preset (voir PRESETS)
   * @param {Function} callback  — appelé au milieu de la transition (écran invisible)
   * @param {object}   opts
   * @param {number}   opts.duration  — durée du sweep en secondes (défaut 0.24)
   * @param {number}   opts.hold      — pause au milieu en ms (défaut 60)
   */
  sweep(preset = 'hub', callback, { duration = 0.24, hold = 60 } = {}) {
    this._ensure();
    const meta = PRESETS[preset] || PRESETS.hub;

    this._el.style.setProperty('--trc',  meta.color);
    this._el.style.setProperty('--trca', meta.accent);
    this._el.querySelector('.tr-kanji').textContent = meta.kanji;
    this._el.querySelector('.tr-label').textContent  = meta.label;

    const main   = this._el.querySelector('.tr-panel--main');
    const accent = this._el.querySelector('.tr-panel--accent');

    gsap.set(this._el, { display: 'flex', pointerEvents: 'all' });
    gsap.set(main,   { scaleX: 0, transformOrigin: 'left center' });
    gsap.set(accent, { scaleX: 0, transformOrigin: 'left center' });

    const tl = gsap.timeline();

    // ── Sweep IN ──
    tl.to(accent, { scaleX: 1, duration: duration * 0.75, ease: 'power3.in' }, 0)
      .to(main,   { scaleX: 1, duration: duration,         ease: 'power3.in' }, 0.035)
      .call(() => callback?.(), [], `+=${hold / 1000}`)

    // ── Sweep OUT (origine droite) ──
      .set(main,   { transformOrigin: 'right center' })
      .set(accent, { transformOrigin: 'right center' })
      .to(main,   { scaleX: 0, duration: duration,         ease: 'power3.out' })
      .to(accent, { scaleX: 0, duration: duration * 0.75,  ease: 'power3.out',
        onComplete: () => gsap.set(this._el, { display: 'none', pointerEvents: 'none' }) },
        `-=${duration * 0.45}`);
  }
}

export const transition = new TransitionManager();
