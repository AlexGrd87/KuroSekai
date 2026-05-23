/**
 * AudioManager.js
 * Moteur audio KuroSekai.
 * BGM   → Howler.js (fichiers MP3 Suno, fallback procédural si absent)
 * SFX   → Web Audio API procédural (aucun fichier requis)
 */

import { Howl, Howler } from 'howler';

/* ── Catalogue BGM ──────────────────────────────────────
   Ajoute ici chaque fichier téléchargé depuis Suno.
   Si le fichier est absent, le fallback procédural est utilisé.
────────────────────────────────────────────────────────── */
const BGM_FILES = {
  hub:    '/audio/bgm_hub.mp3',
  combat: '/audio/bgm_combat.mp3',
};

/* ── Catalogue SFX (fichiers optionnels) ──────────────── */
const SFX_FILES = {
  victory:           '/audio/sfx_victory.mp3',
  defeat:            '/audio/sfx_defeat.mp3',
  level_up:          '/audio/sfx_levelup.mp3',
  summon_legendary:  '/audio/sfx_summon_legendary.mp3',
  summon_rare:       '/audio/sfx_summon_rare.mp3',
};

class AudioManager {
  constructor() {
    // ── BGM ──
    this._bgmHowl    = null;   // Howl actif
    this._bgmTheme   = null;
    this._bgmVol     = 0.5;
    this._bgmActive  = false;
    this._bgmFading  = false;

    // ── BGM fallback procédural ──
    this._bgmNodes   = [];
    this._bgmTimer   = null;
    this._bgmTick    = 0;

    // ── SFX Howl cache ──
    this._sfxHowls   = {};

    // ── Web Audio (SFX procéduraux) ──
    this._ctx        = null;
    this._sfxGain    = null;
    this._sfxVol     = 0.8;

    this._enabled    = true;
    this._ready      = false;

    // Init sur premier geste utilisateur (requis par les navigateurs)
    ['click', 'keydown', 'touchstart'].forEach(ev =>
      window.addEventListener(ev, () => this._init(), { once: true })
    );
  }

  /* ════════════════════════════════
     INIT
  ════════════════════════════════ */

  _init() {
    if (this._ready) return;
    try {
      this._ctx     = new (window.AudioContext || window.webkitAudioContext)();
      this._sfxGain = this._ctx.createGain();
      this._sfxGain.gain.value = this._sfxVol;
      this._sfxGain.connect(this._ctx.destination);
      this._ready = true;
    } catch (e) {
      console.warn('[Audio] Web Audio API indisponible:', e);
    }

    // Démarre la BGM en attente
    if (this._bgmActive && this._bgmTheme) {
      this._startBgm(this._bgmTheme);
    }
  }

  get ready() { return this._ready; }

  /* ════════════════════════════════
     VOLUME
  ════════════════════════════════ */

  setSfxVolume(v) {
    this._sfxVol = v / 100;
    if (this._sfxGain) this._sfxGain.gain.value = this._sfxVol;
    Howler.volume(this._sfxVol); // affecte aussi les SFX Howl
  }

  setBgmVolume(v) {
    this._bgmVol = v / 100;
    if (this._bgmHowl) this._bgmHowl.volume(this._bgmVol);
  }

  setEnabled(on) {
    this._enabled = on;
    Howler.mute(!on);
    if (this._sfxGain) this._sfxGain.gain.value = on ? this._sfxVol : 0;
  }

  /* ════════════════════════════════
     BGM
  ════════════════════════════════ */

  playBgm(theme = 'hub') {
    if (this._bgmTheme === theme && this._bgmHowl?.playing()) return;
    this._bgmTheme  = theme;
    this._bgmActive = true;
    if (this._ready) this._startBgm(theme);
  }

  stopBgm(fadeMs = 1200) {
    this._bgmActive = false;
    clearTimeout(this._bgmTimer);

    // Arrêt Howl avec fondu
    if (this._bgmHowl) {
      const h = this._bgmHowl;
      this._bgmHowl = null;
      this._bgmTheme = null;
      h.fade(h.volume(), 0, fadeMs);
      setTimeout(() => h.stop(), fadeMs + 50);
    }

    // Arrêt procédural
    this._bgmNodes.forEach(n => { try { n.stop(); } catch {} });
    this._bgmNodes = [];
  }

  _startBgm(theme) {
    // Arrête l'ancienne BGM proprement
    if (this._bgmHowl) {
      const old = this._bgmHowl;
      this._bgmHowl = null;
      old.fade(old.volume(), 0, 600);
      setTimeout(() => old.stop(), 650);
    }
    this._bgmNodes.forEach(n => { try { n.stop(); } catch {} });
    this._bgmNodes = [];
    clearTimeout(this._bgmTimer);

    const src = BGM_FILES[theme];
    if (!src) { this._startFallbackBgm(theme); return; }

    // Précharge + joue avec Howler
    const h = new Howl({
      src:    [src],
      loop:   true,
      volume: 0,
      html5:  false,
      onloaderror: () => {
        console.warn(`[Audio] BGM ${theme} introuvable, fallback procédural`);
        this._startFallbackBgm(theme);
      },
      onplayerror: () => {
        console.warn(`[Audio] BGM ${theme} lecture échouée, fallback`);
        this._startFallbackBgm(theme);
      },
    });

    this._bgmHowl = h;
    h.play();
    // Fondu d'entrée
    h.fade(0, this._bgmVol, 1200);
  }

  /* ── Fallback procédural si le fichier MP3 est absent ── */
  _startFallbackBgm(theme) {
    if (!this._ready) return;
    this._bgmTick = 0;
    if (theme === 'hub')    this._scheduleBgmHub();
    if (theme === 'combat') this._scheduleBgmCombat();
  }

  /* ── Hub : ambient synthwave ── */
  _scheduleBgmHub() {
    if (!this._bgmActive || !this._ready) return;
    const ctx  = this._ctx;
    const out  = this._sfxGain;           // fallback sur sfxGain
    const BPM  = 72, BEAT = 60 / BPM;
    const now  = ctx.currentTime;
    const CHORDS = [
      [174.61, 207.65, 261.63],
      [130.81, 155.56, 196.00],
      [103.83, 130.81, 155.56],
      [155.56, 196.00, 233.08],
    ];
    const chord = CHORDS[this._bgmTick % 4];
    chord.forEach(freq => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = freq * 0.5;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.03, now + BEAT * 0.5);
      g.gain.linearRampToValueAtTime(0, now + BEAT * 4);
      osc.connect(g); g.connect(out);
      osc.start(now); osc.stop(now + BEAT * 4.1);
      this._bgmNodes.push(osc);
    });
    this._bgmTick++;
    this._bgmTimer = setTimeout(() => this._scheduleBgmHub(), BEAT * 4 * 1000 - 20);
  }

  /* ── Combat : rythme tendu ── */
  _scheduleBgmCombat() {
    if (!this._bgmActive || !this._ready) return;
    const ctx  = this._ctx, out = this._sfxGain;
    const BPM  = 140, BEAT = 60 / BPM, now = ctx.currentTime;
    [0, BEAT * 2].forEach(offset => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = 55;
      g.gain.setValueAtTime(0.12, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + BEAT * 1.8);
      osc.connect(g); g.connect(out);
      osc.start(now + offset); osc.stop(now + offset + BEAT * 1.9);
      this._bgmNodes.push(osc);
    });
    const PENTA = [220, 261.63, 293.66, 349.23, 392, 440];
    [0, 1, 3, 4, 5, 7].forEach((step, i) => {
      const t = now + BEAT * 0.5 * i;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = PENTA[(this._bgmTick * 3 + step) % PENTA.length];
      g.gain.setValueAtTime(0.025, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + BEAT * 0.4);
      osc.connect(g); g.connect(out);
      osc.start(t); osc.stop(t + BEAT * 0.45);
      this._bgmNodes.push(osc);
    });
    this._bgmTick++;
    this._bgmTimer = setTimeout(() => this._scheduleBgmCombat(), BEAT * 4 * 1000 - 20);
  }

  /* ════════════════════════════════
     SFX
  ════════════════════════════════ */

  play(name) {
    if (!this._enabled) return;
    // Essaie d'abord un fichier Howl si dispo
    if (SFX_FILES[name]) {
      this._playHowlSfx(name);
      return;
    }
    // Sinon procédural
    if (!this._ready) return;
    const fn = this._sfxProc[name];
    if (fn) fn.call(this);
  }

  _playHowlSfx(name) {
    if (!this._sfxHowls[name]) {
      this._sfxHowls[name] = new Howl({
        src: [SFX_FILES[name]],
        volume: this._sfxVol,
        onloaderror: () => {
          // Fallback procédural si fichier manquant
          delete this._sfxHowls[name];
          if (this._ready) this._sfxProc[name]?.call(this);
        },
      });
    }
    this._sfxHowls[name].volume(this._sfxVol);
    this._sfxHowls[name].play();
  }

  /* ════════════════════════════════
     SFX PROCÉDURAUX (fallback)
  ════════════════════════════════ */

  _sfxProc = {
    ui_click()      { this._blip(1200, 0.06, 0.06, 'square'); },
    ui_navigate()   { this._blip(900, 0.05, 0.08, 'sine'); },
    ui_open()       { this._sweep(400, 900, 0.07, 0.18, 'sine'); },
    ui_close()      { this._sweep(900, 300, 0.06, 0.14, 'sine'); },
    ui_error()      { this._blip(220, 0.1, 0.25, 'sawtooth'); },

    hit_normal() {
      this._noise(0.15, 0.08, 400, 'lowpass');
      this._blip(180, 0.06, 0.06, 'square');
    },
    hit_crit() {
      this._noise(0.22, 0.12, 600, 'lowpass');
      this._sweep(400, 800, 0.12, 0.15, 'sawtooth');
    },
    skill_activate() {
      this._sweep(300, 1200, 0.1, 0.3, 'sawtooth');
      setTimeout(() => this._blip(800, 0.08, 0.15, 'sine'), 120);
    },
    skill_aoe() {
      this._noise(0.3, 0.25, 200, 'lowpass');
      this._sweep(100, 600, 0.14, 0.4, 'sawtooth');
    },
    heal() {
      [0, 100, 220].forEach((delay, i) => {
        setTimeout(() => {
          this._blip([523.25, 659.25, 783.99][i], 0.08, 0.22, 'sine');
        }, delay);
      });
    },
    buff_apply()    { this._sweep(400, 700, 0.07, 0.2, 'sine'); },
    debuff_apply()  { this._sweep(600, 200, 0.07, 0.2, 'sawtooth'); },
    unit_ko() {
      this._sweep(350, 80, 0.14, 0.5, 'sawtooth');
      setTimeout(() => this._noise(0.18, 0.3, 150, 'lowpass'), 100);
    },

    victory() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        setTimeout(() => this._blip(f, 0.1, 0.3, 'sine'), i * 120)
      );
      setTimeout(() => this._chord([523.25, 659.25, 783.99], 0.12, 0.8), 560);
    },
    defeat() {
      [392, 349.23, 293.66, 220].forEach((f, i) =>
        setTimeout(() => this._blip(f, 0.1, 0.35, 'sawtooth'), i * 160)
      );
    },
    level_up() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        setTimeout(() => this._blip(f, 0.09, 0.25, 'sine'), i * 80)
      );
      setTimeout(() => this._chord([783.99, 987.77, 1174.66], 0.12, 0.6), 450);
    },

    summon_pull() {
      this._sweep(200, 1400, 0.12, 0.45, 'sawtooth');
      setTimeout(() => this._noise(0.15, 0.15, 1000, 'bandpass'), 200);
    },
    summon_rare() {
      this._sweep(300, 1600, 0.14, 0.5, 'sawtooth');
      setTimeout(() => this._chord([659.25, 830.61, 987.77], 0.12, 0.6), 300);
    },
    summon_legendary() {
      this._sweep(100, 2000, 0.18, 0.7, 'sawtooth');
      setTimeout(() => this._noise(0.2, 0.2, 1500, 'bandpass'), 300);
      setTimeout(() => this._chord([783.99, 987.77, 1174.66, 1567.98], 0.15, 1.0), 500);
      setTimeout(() => this._blip(2093.0, 0.1, 0.4, 'sine'), 900);
    },
  };

  /* ════════════════════════════════
     PRIMITIVES WEB AUDIO
  ════════════════════════════════ */

  _blip(freq, vol, dur, type = 'sine') {
    if (!this._ready) return;
    const ctx = this._ctx, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(this._sfxGain);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  _sweep(f0, f1, vol, dur, type = 'sine') {
    if (!this._ready) return;
    const ctx = this._ctx, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(this._sfxGain);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  _noise(vol, dur, filterFreq = 800, filterType = 'lowpass') {
    if (!this._ready) return;
    const ctx    = this._ctx;
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf    = ctx.createBuffer(1, length, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src  = ctx.createBufferSource(), filt = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; filt.type = filterType; filt.frequency.value = filterFreq;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt); filt.connect(g); g.connect(this._sfxGain);
    src.start(t); src.stop(t + dur + 0.01);
  }

  _chord(freqs, vol, dur) {
    freqs.forEach(f => this._blip(f, vol / freqs.length, dur, 'sine'));
  }
}

export const audio = new AudioManager();
