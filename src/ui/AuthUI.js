/**
 * AuthUI.js
 * Écran de connexion / inscription KuroSekai.
 * Affiché avant le hub si l'utilisateur n'est pas connecté.
 */

import { gsap }       from 'gsap';
import { apiService } from '../data/ApiService.js';

export class AuthUI {
  /**
   * @param {Function} onSuccess  Callback appelé une fois connecté
   */
  constructor(onSuccess) {
    this._onSuccess = onSuccess;
    this._screen    = document.getElementById('auth-screen');
    this._mode      = 'login'; // 'login' | 'register'
    this._bind();
  }

  /* ── Affichage ── */

  show() {
    const s = this._screen;
    s.style.display = 'flex';
    s.style.opacity = '0';
    s.style.transform = 'translateY(20px)';
    s.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    // Force reflow
    void s.offsetHeight;
    s.style.opacity   = '1';
    s.style.transform = 'translateY(0)';
    this._setMode('login');
  }

  hide() {
    const s = this._screen;
    s.style.transition  = 'opacity 0.35s ease, transform 0.35s ease';
    s.style.opacity     = '0';
    s.style.transform   = 'translateY(-20px)';
    s.style.pointerEvents = 'none';
    setTimeout(() => {
      s.style.display = 'none';
      s.style.pointerEvents = '';
      s.style.transition = '';
    }, 380);
  }

  /* ── Mode login / register ── */

  _setMode(mode) {
    this._mode = mode;
    const isReg = mode === 'register';

    document.getElementById('auth-title').textContent =
      isReg ? 'CRÉER UN COMPTE' : 'CONNEXION';
    document.getElementById('auth-submit-btn').textContent =
      isReg ? 'Créer le compte' : 'Se connecter';
    document.getElementById('auth-toggle-btn').textContent =
      isReg ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire';

    this._clearError();
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-username').focus();
  }

  /* ── Bind ── */

  _bind() {
    document.getElementById('auth-form')?.addEventListener('submit', e => {
      e.preventDefault();
      this._submit();
    });

    document.getElementById('auth-toggle-btn')?.addEventListener('click', () => {
      this._setMode(this._mode === 'login' ? 'register' : 'login');
    });

    document.getElementById('auth-guest-btn')?.addEventListener('click', () => {
      this._onSuccess(null); // null = mode invité (localStorage seul)
    });

    // Enter sur les champs
    ['auth-username', 'auth-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') this._submit();
      });
    });
  }

  /* ── Soumission ── */

  async _submit() {
    const username = document.getElementById('auth-username')?.value.trim();
    const password = document.getElementById('auth-password')?.value;
    this._clearError();

    if (!username || !password) {
      this._showError('Remplis les deux champs.');
      return;
    }

    this._setLoading(true);
    try {
      if (this._mode === 'register') {
        await apiService.register(username, password);
      } else {
        await apiService.login(username, password);
      }
      this._setLoading(false);
      this._onSuccess(apiService.username);
    } catch (err) {
      this._setLoading(false);
      this._showError(err.message);
    }
  }

  /* ── Helpers ── */

  _showError(msg) {
    const el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.4)' });
  }

  _clearError() {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  _setLoading(on) {
    const btn = document.getElementById('auth-submit-btn');
    if (!btn) return;
    btn.disabled    = on;
    btn.textContent = on
      ? '...'
      : this._mode === 'register' ? 'Créer le compte' : 'Se connecter';
  }
}
