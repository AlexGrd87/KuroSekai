/**
 * ToastUI.js — Système de notifications in-game
 * Singleton : import { toast } from './ToastUI.js'
 * Usage : toast.show(message, type?, { icon?, sub?, duration? })
 * Types : 'info' | 'success' | 'warning' | 'error' | 'reward' | 'energy' | 'level'
 */
import { gsap } from 'gsap';

const TYPE_META = {
  info:    { icon: 'ℹ',  color: '#00d4ff' },
  success: { icon: '✓',  color: '#00ee88' },
  warning: { icon: '⚠',  color: '#ffcc00' },
  error:   { icon: '✕',  color: '#ff4444' },
  reward:  { icon: '✦',  color: '#f0c040' },
  energy:  { icon: '⚡', color: '#44ee88' },
  level:   { icon: '⬆',  color: '#a855f7' },
};

class ToastManager {
  constructor() { this._container = null; }

  _ensure() {
    if (this._container) return;
    this._container = document.createElement('div');
    this._container.id = 'toast-container';
    document.body.appendChild(this._container);
  }

  /**
   * @param {string} message  — Texte principal
   * @param {string} type     — 'info' | 'success' | 'warning' | 'error' | 'reward' | 'energy' | 'level'
   * @param {{ icon?: string, sub?: string, duration?: number }} opts
   */
  show(message, type = 'info', { icon, sub, duration = 3500 } = {}) {
    this._ensure();
    const meta = TYPE_META[type] || TYPE_META.info;
    const ic   = icon ?? meta.icon;

    const el = document.createElement('div');
    el.className = `kuro-toast kuro-toast--${type}`;
    el.style.setProperty('--tc', meta.color);
    el.innerHTML = `
      <div class="kt-icon">${ic}</div>
      <div class="kt-body">
        <div class="kt-msg">${message}</div>
        ${sub ? `<div class="kt-sub">${sub}</div>` : ''}
      </div>
      <div class="kt-bar"><div class="kt-bar-fill"></div></div>`;

    this._container.appendChild(el);

    // Slide-in depuis la droite
    gsap.fromTo(el,
      { x: 90, opacity: 0 },
      { x: 0,  opacity: 1, duration: 0.3, ease: 'power3.out' }
    );

    // Barre de progression qui se vide
    const bar = el.querySelector('.kt-bar-fill');
    gsap.to(bar, { width: '0%', duration: duration / 1000, ease: 'none' });

    // Auto-dismiss
    const tid = setTimeout(() => this._dismiss(el), duration);
    el.addEventListener('click', () => { clearTimeout(tid); this._dismiss(el); });

    return el;
  }

  _dismiss(el) {
    if (el._dismissed) return;
    el._dismissed = true;
    gsap.to(el, {
      x: 90, opacity: 0, height: 0, marginBottom: 0, padding: 0,
      duration: 0.22, ease: 'power2.in',
      onComplete: () => el.remove(),
    });
  }
}

export const toast = new ToastManager();
