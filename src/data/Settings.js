/**
 * Settings.js
 * Gestion des préférences joueur — persistance localStorage.
 */

const SETTINGS_KEY = 'kuro_settings_v1';

const DEFAULTS = {
  musicVolume:      0.7,       // 0.0 → 1.0
  sfxVolume:        0.8,       // 0.0 → 1.0
  combatSpeed:      'normal',  // 'slow' | 'normal' | 'fast'
  scanlines:        true,
  reducedMotion:    false,
  combatLog:        true,
};

class Settings {
  constructor() {
    this._data = { ...DEFAULTS };
    this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) this._data = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      this._data = { ...DEFAULTS };
    }
  }

  _save() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this._data));
  }

  get(key)       { return this._data[key]; }
  set(key, value) {
    this._data[key] = value;
    this._save();
    this._apply(key, value);
  }

  /* Applique immédiatement les effets visuels */
  _apply(key, value) {
    if (key === 'scanlines') {
      const el = document.getElementById('scanline-overlay');
      if (el) el.style.opacity = value ? '1' : '0';
    }
    if (key === 'reducedMotion') {
      document.documentElement.classList.toggle('reduce-motion', value);
    }
  }

  /* Applique tous les settings au démarrage */
  applyAll() {
    Object.entries(this._data).forEach(([k, v]) => this._apply(k, v));
  }

  /* Délai ennemi selon vitesse de combat */
  get enemyDelay()     { return { slow: 1400, normal: 900,  fast: 350  }[this._data.combatSpeed] ?? 900;  }
  get enemyChainDelay(){ return { slow: 1100, normal: 750,  fast: 250  }[this._data.combatSpeed] ?? 750;  }
}

/* Singleton exporté */
export const settings = new Settings();
