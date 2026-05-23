/**
 * SettingsUI.js
 * Écran des paramètres de KuroSekai.
 * Sections : Audio, Affichage, Données.
 */

import { gsap }     from 'gsap';
import { settings } from '../data/Settings.js';
import { audio }    from '../audio/AudioManager.js';

export class SettingsUI {
  constructor(playerData, onBack) {
    this.playerData = playerData;
    this.onBack     = onBack;
    this.screen     = document.getElementById('settings-screen');

    document.getElementById('settings-back-btn')
      ?.addEventListener('click', () => this.hide());

    this._bindControls();
  }

  /* ════════════════════════════════
     AFFICHAGE
  ════════════════════════════════ */

  show() {
    this._syncUI();
    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 20 });
    gsap.to(this.screen, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' });

    // Stagger des sections
    gsap.fromTo('.settings-section',
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.08, delay: 0.15, ease: 'power2.out' }
    );
  }

  hide() {
    gsap.to(this.screen, {
      opacity: 0, y: 12, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        this.screen.style.display = 'none';
        if (this.onBack) this.onBack();
      },
    });
  }

  /* ════════════════════════════════
     SYNC VALEURS → UI
  ════════════════════════════════ */

  _syncUI() {
    // Audio
    this._setSlider('set-music-vol',   settings.get('musicVolume') * 100);
    this._setSlider('set-sfx-vol',     settings.get('sfxVolume')   * 100);
    this._setSliderLabel('set-music-label', Math.round(settings.get('musicVolume') * 100));
    this._setSliderLabel('set-sfx-label',   Math.round(settings.get('sfxVolume')   * 100));

    // Affichage
    this._setToggle('set-scanlines',  settings.get('scanlines'));
    this._setToggle('set-reduced',    settings.get('reducedMotion'));
    this._setToggle('set-combatlog',  settings.get('combatLog'));

    // Combat speed
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('speed-btn--active', btn.dataset.speed === settings.get('combatSpeed'));
    });
  }

  /* ════════════════════════════════
     BINDING DES CONTRÔLES
  ════════════════════════════════ */

  _bindControls() {

    /* ── Sliders audio ── */
    document.getElementById('set-music-vol')?.addEventListener('input', e => {
      const v = parseInt(e.target.value);
      settings.set('musicVolume', v / 100);
      audio.setBgmVolume(v);
      this._setSliderLabel('set-music-label', v);
      this._updateSliderFill(e.target);
    });

    document.getElementById('set-sfx-vol')?.addEventListener('input', e => {
      const v = parseInt(e.target.value);
      settings.set('sfxVolume', v / 100);
      audio.setSfxVolume(v);
      this._setSliderLabel('set-sfx-label', v);
      this._updateSliderFill(e.target);
      // Joue un son de test
      audio.play('ui_click');
    });

    /* ── Toggles ── */
    this._bindToggle('set-scanlines', 'scanlines');
    this._bindToggle('set-reduced',   'reducedMotion');
    this._bindToggle('set-combatlog', 'combatLog');

    /* ── Vitesse de combat ── */
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.set('combatSpeed', btn.dataset.speed);
        document.querySelectorAll('.speed-btn').forEach(b =>
          b.classList.toggle('speed-btn--active', b === btn)
        );
        this._flash(btn);
      });
    });

    /* ── Données ── */
    document.getElementById('set-reset-progress')?.addEventListener('click', () => {
      this._confirm(
        'Réinitialiser la progression ?',
        'Tous les stages complétés et l\'EXP seront perdus.',
        () => {
          this.playerData.completedStages = new Set();
          this.playerData.exp      = 0;
          this.playerData.currency = 0;
          this.playerData._saveProgress?.();
          this._toast('Progression réinitialisée.');
        }
      );
    });

    document.getElementById('set-reset-collection')?.addEventListener('click', () => {
      this._confirm(
        'Réinitialiser la collection ?',
        'Tous vos personnages seront perdus. Irréversible.',
        () => {
          this.playerData.reset();
          this._toast('Collection réinitialisée.');
        }
      );
    });

    document.getElementById('set-replay-intro')?.addEventListener('click', () => {
      localStorage.removeItem('kuro_campaign_v1');
      this._toast('L\'intro sera rejouée au prochain lancement.');
    });

    document.getElementById('set-reset-all')?.addEventListener('click', () => {
      this._confirm(
        'Tout réinitialiser ?',
        'Collection, progression, paramètres — tout sera effacé.',
        () => {
          this.playerData.reset();
          localStorage.removeItem('kuro_campaign_v1');
          localStorage.removeItem('kuro_settings_v1');
          this._toast('Données effacées. Rechargez la page.');
        }
      );
    });
  }

  /* ════════════════════════════════
     HELPERS
  ════════════════════════════════ */

  _bindToggle(id, key) {
    document.getElementById(id)?.addEventListener('click', () => {
      const val = !settings.get(key);
      settings.set(key, val);
      this._setToggle(id, val);
    });
  }

  _setToggle(id, active) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('toggle--on', active);
    el.setAttribute('aria-checked', active);
  }

  _setSlider(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value;
    this._updateSliderFill(el);
  }

  _setSliderLabel(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = `${value}%`;
  }

  _updateSliderFill(input) {
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty('--fill', `${pct}%`);
  }

  _flash(el) {
    gsap.fromTo(el, { scale: 0.92 }, { scale: 1, duration: 0.2, ease: 'back.out(3)' });
  }

  _toast(msg) {
    const toast = document.getElementById('settings-toast');
    if (!toast) return;
    toast.textContent = msg;
    gsap.killTweensOf(toast);
    gsap.fromTo(toast,
      { opacity: 0, y: 10, display: 'block' },
      { opacity: 1, y: 0, duration: 0.25,
        onComplete: () => gsap.to(toast, { opacity: 0, y: -10, duration: 0.3, delay: 2,
          onComplete: () => { toast.style.display = 'none'; } })
      }
    );
  }

  _confirm(title, desc, onConfirm) {
    const box = document.getElementById('settings-confirm');
    document.getElementById('sc-title').textContent = title;
    document.getElementById('sc-desc').textContent  = desc;

    gsap.set(box, { display: 'flex' });
    gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.2 });

    const yes = document.getElementById('sc-yes');
    const no  = document.getElementById('sc-no');

    const cleanup = () => {
      gsap.to(box, { opacity: 0, duration: 0.15,
        onComplete: () => { box.style.display = 'none'; } });
      yes.replaceWith(yes.cloneNode(true));
      no.replaceWith(no.cloneNode(true));
    };

    document.getElementById('sc-yes').addEventListener('click', () => { cleanup(); onConfirm(); });
    document.getElementById('sc-no') .addEventListener('click', () => cleanup());
  }
}
