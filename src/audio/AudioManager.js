/**
 * AudioManager.js
 * Moteur audio procédural KuroSekai — Web Audio API, aucun fichier requis.
 * BGM générative (synthwave cyberpunk) + SFX pour chaque événement de jeu.
 */

class AudioManager {
  constructor() {
    this._ctx       = null;
    this._masterGain = null;
    this._sfxGain    = null;
    this._bgmGain    = null;

    this._bgmNodes  = [];
    this._bgmTimer  = null;
    this._bgmTick   = 0;
    this._bgmActive = false;
    this._bgmTheme  = 'hub';

    this._sfxVol    = 0.8;
    this._bgmVol    = 0.5;
    this._enabled   = true;

    // Init sur premier geste utilisateur
    this._ready = false;
    ['click', 'keydown', 'touchstart'].forEach(ev =>
      window.addEventListener(ev, () => this._init(), { once: true })
    );
  }

  /* ── Init contexte ── */
  _init() {
    if (this._ready) return;
    try {
      this._ctx        = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._sfxGain    = this._ctx.createGain();
      this._bgmGain    = this._ctx.createGain();

      this._sfxGain.connect(this._masterGain);
      this._bgmGain.connect(this._masterGain);
      this._masterGain.connect(this._ctx.destination);

      this._masterGain.gain.value = 1;
      this._sfxGain.gain.value    = this._sfxVol;
      this._bgmGain.gain.value    = this._bgmVol;

      this._ready = true;
      // Lance la BGM hub si on est déjà sur le hub
      if (this._bgmActive) this._startBgm(this._bgmTheme);
    } catch (e) {
      console.warn('[Audio] Web Audio API non disponible :', e);
    }
  }

  get ctx() { return this._ctx; }
  get ready() { return this._ready; }

  /* ════════════════════════════════
     VOLUME
  ════════════════════════════════ */

  setSfxVolume(v)  {
    this._sfxVol = v / 100;
    if (this._sfxGain) this._sfxGain.gain.value = this._sfxVol;
  }
  setBgmVolume(v)  {
    this._bgmVol = v / 100;
    if (this._bgmGain) this._bgmGain.gain.value = this._bgmVol;
  }
  setEnabled(on) {
    this._enabled = on;
    if (this._masterGain) this._masterGain.gain.value = on ? 1 : 0;
  }

  /* ════════════════════════════════
     BGM GÉNÉRATIVE
  ════════════════════════════════ */

  playBgm(theme = 'hub') {
    this._bgmTheme  = theme;
    this._bgmActive = true;
    if (this._ready) this._startBgm(theme);
  }

  stopBgm(fadeMs = 1200) {
    this._bgmActive = false;
    clearTimeout(this._bgmTimer);
    if (!this._ready) return;
    const gain = this._bgmGain;
    const t    = this._ctx.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + fadeMs / 1000);
    setTimeout(() => {
      this._bgmNodes.forEach(n => { try { n.stop(); } catch {} });
      this._bgmNodes = [];
      gain.gain.value = this._bgmVol;
    }, fadeMs + 50);
  }

  _startBgm(theme) {
    this._bgmNodes.forEach(n => { try { n.stop(); } catch {} });
    this._bgmNodes = [];
    clearTimeout(this._bgmTimer);
    this._bgmTick = 0;
    if (theme === 'hub')    this._scheduleBgmHub();
    if (theme === 'combat') this._scheduleBgmCombat();
  }

  /* ── HUB BGM : ambient synthwave lent ── */
  _scheduleBgmHub() {
    if (!this._bgmActive || !this._ready) return;

    const ctx  = this._ctx;
    const out  = this._bgmGain;
    const BPM  = 72;
    const BEAT = 60 / BPM;
    const now  = ctx.currentTime;

    // Progression d'accords Fm - Cm - Ab - Eb en boucle
    const CHORDS = [
      [174.61, 207.65, 261.63], // Fm
      [130.81, 155.56, 196.00], // Cm
      [103.83, 130.81, 155.56], // Ab
      [155.56, 196.00, 233.08], // Eb
    ];
    const chord = CHORDS[this._bgmTick % CHORDS.length];

    // Pad lent (3 oscillateurs par note)
    chord.forEach(freq => {
      [freq, freq * 0.5, freq * 2].forEach((f, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const filt = ctx.createBiquadFilter();
        osc.type      = i === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(f, now);
        // Légère modulation LFO
        const lfo      = ctx.createOscillator();
        const lfoGain  = ctx.createGain();
        lfo.frequency.value  = 0.3 + i * 0.1;
        lfoGain.gain.value   = 2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);

        filt.type            = 'lowpass';
        filt.frequency.value = 800;

        const vol = 0.04 / chord.length;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + BEAT * 0.4);
        gain.gain.setValueAtTime(vol, now + BEAT * 3);
        gain.gain.linearRampToValueAtTime(0, now + BEAT * 4.1);

        osc.connect(filt);
        filt.connect(gain);
        gain.connect(out);
        osc.start(now);
        osc.stop(now + BEAT * 4.2);
        this._bgmNodes.push(osc, lfo);
      });
    });

    // Basse arpeggée
    const bassNote = chord[0] * 0.25;
    [0, BEAT * 1.5, BEAT * 2.5].forEach(offset => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(bassNote, now + offset);
      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + BEAT * 0.7);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + offset);
      osc.stop(now + offset + BEAT * 0.8);
      this._bgmNodes.push(osc);
    });

    this._bgmTick++;
    this._bgmTimer = setTimeout(
      () => this._scheduleBgmHub(),
      BEAT * 4 * 1000 - 20
    );
  }

  /* ── COMBAT BGM : rythme tendu ── */
  _scheduleBgmCombat() {
    if (!this._bgmActive || !this._ready) return;

    const ctx  = this._ctx;
    const out  = this._bgmGain;
    const BPM  = 140;
    const BEAT = 60 / BPM;
    const now  = ctx.currentTime;

    // Basse pulsée (beat 1 et 3)
    [0, BEAT * 2].forEach(offset => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();
      dist.curve = this._makeDistCurve(60);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now + offset);
      osc.frequency.exponentialRampToValueAtTime(45, now + offset + BEAT * 0.3);
      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + BEAT * 1.8);
      osc.connect(dist); dist.connect(gain); gain.connect(out);
      osc.start(now + offset); osc.stop(now + offset + BEAT * 1.9);
      this._bgmNodes.push(osc);
    });

    // Hi-hat procédural
    for (let i = 0; i < 8; i++) {
      const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < data.length; j++) data[j] = Math.random() * 2 - 1;
      const src  = ctx.createBufferSource();
      const filt = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = buf;
      filt.type  = 'highpass'; filt.frequency.value = 8000;
      const t    = now + BEAT * i * 0.5;
      gain.gain.setValueAtTime(i % 2 === 0 ? 0.06 : 0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      src.connect(filt); filt.connect(gain); gain.connect(out);
      src.start(t); src.stop(t + 0.05);
    }

    // Mélodie tension (arp pentatonique mineur)
    const PENTA = [220, 261.63, 293.66, 349.23, 392, 440];
    const tick  = this._bgmTick;
    [0, 1, 3, 4, 5, 7].forEach((step, i) => {
      const t   = now + BEAT * 0.5 * i;
      const idx = (tick * 3 + step) % PENTA.length;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = PENTA[idx];
      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + BEAT * 0.4);
      osc.connect(gain); gain.connect(out);
      osc.start(t); osc.stop(t + BEAT * 0.45);
      this._bgmNodes.push(osc);
    });

    this._bgmTick++;
    this._bgmTimer = setTimeout(
      () => this._scheduleBgmCombat(),
      BEAT * 4 * 1000 - 20
    );
  }

  /* ════════════════════════════════
     SFX
  ════════════════════════════════ */

  play(name) {
    if (!this._enabled || !this._ready) return;
    const fn = this._sfx[name];
    if (fn) fn.call(this);
  }

  _sfx = {

    /* ── UI ── */
    ui_click() {
      this._blip(1200, 0.06, 0.06, 'square');
    },
    ui_navigate() {
      this._blip(900, 0.05, 0.08, 'sine');
    },
    ui_open() {
      this._sweep(400, 900, 0.07, 0.18, 'sine');
    },
    ui_close() {
      this._sweep(900, 300, 0.06, 0.14, 'sine');
    },
    ui_error() {
      this._blip(220, 0.1, 0.25, 'sawtooth');
    },

    /* ── Combat ── */
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
          const freqs = [523.25, 659.25, 783.99];
          this._blip(freqs[i], 0.08, 0.22, 'sine');
        }, delay);
      });
    },
    buff_apply() {
      this._sweep(400, 700, 0.07, 0.2, 'sine');
    },
    debuff_apply() {
      this._sweep(600, 200, 0.07, 0.2, 'sawtooth');
    },
    unit_ko() {
      this._sweep(350, 80, 0.14, 0.5, 'sawtooth');
      setTimeout(() => this._noise(0.18, 0.3, 150, 'lowpass'), 100);
    },

    /* ── Résultats ── */
    victory() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        setTimeout(() => this._blip(f, 0.1, 0.3, 'sine'), i * 120);
      });
      setTimeout(() => this._chord([523.25, 659.25, 783.99], 0.12, 0.8), 560);
    },
    defeat() {
      const notes = [392, 349.23, 293.66, 220];
      notes.forEach((f, i) => {
        setTimeout(() => this._blip(f, 0.1, 0.35, 'sawtooth'), i * 160);
      });
    },
    level_up() {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((f, i) => {
        setTimeout(() => this._blip(f, 0.09, 0.25, 'sine'), i * 80);
      });
      setTimeout(() => this._chord([783.99, 987.77, 1174.66], 0.12, 0.6), 450);
    },

    /* ── Gacha ── */
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
     PRIMITIVES AUDIO
  ════════════════════════════════ */

  _blip(freq, vol, dur, type = 'sine') {
    if (!this._ready) return;
    const ctx  = this._ctx;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  _sweep(freqFrom, freqTo, vol, dur, type = 'sine') {
    if (!this._ready) return;
    const ctx  = this._ctx;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(freqFrom, t);
    osc.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  _noise(vol, dur, filterFreq = 800, filterType = 'lowpass') {
    if (!this._ready) return;
    const ctx    = this._ctx;
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf    = ctx.createBuffer(1, length, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src    = ctx.createBufferSource();
    const filt   = ctx.createBiquadFilter();
    const gain   = ctx.createGain();
    src.buffer         = buf;
    filt.type          = filterType;
    filt.frequency.value = filterFreq;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(this._sfxGain);
    src.start(t);
    src.stop(t + dur + 0.01);
  }

  _chord(freqs, vol, dur) {
    freqs.forEach(f => this._blip(f, vol / freqs.length, dur, 'sine'));
  }

  _makeDistCurve(amount) {
    const n = 256, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }
}

export const audio = new AudioManager();
