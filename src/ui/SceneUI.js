/**
 * SceneUI.js
 * Lecteur de scènes narratives style visual novel pour KuroSekai.
 *
 * Gère : cartes cinématiques plein écran, titres d'acte,
 *        narration, dialogues avec portrait, effet machine à écrire.
 */

import { gsap } from 'gsap';

/* Couleurs de fond selon mood */
const MOOD_BG = {
  dark:     'linear-gradient(to bottom, #030611, #06101e)',
  corp:     'linear-gradient(160deg, #050f08, #081a0d)',
  red:      'linear-gradient(to bottom, #0f0305, #1a0408)',
  void:     'linear-gradient(to bottom, #06030f, #120820)',
  epilogue: 'linear-gradient(to bottom, #030811, #080f20)',
};

export class SceneUI {
  constructor() {
    this.screen   = document.getElementById('scene-screen');
    this.queue    = [];
    this.index    = 0;
    this._typing  = false;
    this._onDone  = null;
    this._skipBound = this._onSkipClick.bind(this);

    this.screen.addEventListener('click', this._skipBound);
    document.getElementById('scene-skip-btn')
      ?.addEventListener('click', (e) => { e.stopPropagation(); this._skipAll(); });
  }

  /* ════════════════════════════════
     API PUBLIQUE
  ════════════════════════════════ */

  play(scenes, onDone) {
    this.queue   = scenes;
    this.index   = 0;
    this._onDone = onDone;

    gsap.set(this.screen, { display: 'flex', opacity: 0 });
    gsap.to(this.screen, { opacity: 1, duration: 0.5, ease: 'power2.out',
      onComplete: () => this._showScene(this.index),
    });
  }

  /* ════════════════════════════════
     AFFICHAGE D'UNE SCÈNE
  ════════════════════════════════ */

  _showScene(i) {
    if (i >= this.queue.length) { this._end(); return; }
    const scene = this.queue[i];

    // Reset des zones
    this._reset();

    switch (scene.type) {
      case 'card':      this._showCard(scene);      break;
      case 'title':     this._showTitle(scene);     break;
      case 'narration': this._showNarration(scene); break;
      case 'dialogue':  this._showDialogue(scene);  break;
      default:          this._next();
    }
  }

  /* ── Carte cinématique plein écran ── */
  _showCard(scene) {
    const bg = MOOD_BG[scene.mood] || MOOD_BG.dark;
    this.screen.style.background = bg;

    const el = document.getElementById('scene-card');
    el.style.display = 'flex';
    el.innerHTML = `<p class="scene-card-text"></p>`;

    const p = el.querySelector('p');
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6 });
    this._typeText(p, scene.text.replace(/\n/g, '\n'), () => {
      this._showContinue();
    });
  }

  /* ── Titre d'acte ── */
  _showTitle(scene) {
    this.screen.style.background = MOOD_BG.void;
    const el = document.getElementById('scene-title-block');
    el.style.display = 'flex';

    document.getElementById('scene-acte').textContent    = scene.acte;
    document.getElementById('scene-subtitle').textContent = scene.subtitle;

    gsap.fromTo('#scene-acte',    { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.1 });
    gsap.fromTo('#scene-subtitle',{ opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.6, delay: 0.35 });
    gsap.fromTo('#scene-title-line', { scaleX: 0 }, { scaleX: 1, duration: 0.7, delay: 0.55, ease: 'power2.out',
      onComplete: () => this._showContinue(),
    });
  }

  /* ── Narration (sans personnage) ── */
  _showNarration(scene) {
    this.screen.style.background = MOOD_BG.dark;
    const el = document.getElementById('scene-narration');
    el.style.display = 'flex';

    const p = el.querySelector('p');
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    this._typeText(p, scene.text, () => this._showContinue());
  }

  /* ── Dialogue avec portrait ── */
  _showDialogue(scene) {
    this.screen.style.background = MOOD_BG.dark;

    // Portrait
    const portrait = document.getElementById('scene-portrait');
    portrait.style.display = 'flex';
    portrait.style.setProperty('--char-color', scene.char.color);
    portrait.style.setProperty('--char-glow',  scene.char.glow);
    document.getElementById('scene-portrait-symbol').textContent = scene.char.symbol;
    document.getElementById('scene-portrait-name').textContent   = scene.char.name;
    const titleEl = document.getElementById('scene-portrait-title');
    if (titleEl) titleEl.textContent = scene.char.title;

    // Boîte de dialogue
    const box = document.getElementById('scene-dialogue-box');
    box.style.display = 'flex';
    box.style.setProperty('--char-color', scene.char.color);
    document.getElementById('scene-speaker').textContent = scene.char.name;
    document.getElementById('scene-speaker').style.color = scene.char.color;
    document.getElementById('scene-text').textContent = '';

    // Animations entrée
    gsap.fromTo(portrait, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(box,      { opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.35, delay: 0.1, ease: 'power2.out',
      onComplete: () => {
        this._typeText(document.getElementById('scene-text'), scene.text, () => this._showContinue());
      },
    });
  }

  /* ════════════════════════════════
     MACHINE À ÉCRIRE
  ════════════════════════════════ */

  _typeText(el, text, onDone) {
    this._typing   = true;
    this._fullText = text;
    this._typeEl   = el;
    this._typeCb   = onDone;

    let i = 0;
    el.textContent = '';

    // Remplace les \n par des sauts de ligne réels dans le DOM
    const lines = text.split('\n');
    el.innerHTML = '';

    const write = () => {
      if (!this._typing) return;
      const flat = text.replace(/\n/g, ' ');
      if (i < text.length) {
        // Reconstruction avec \n → <br>
        let html = '';
        let charCount = 0;
        for (const line of lines) {
          for (let c = 0; c < line.length; c++) {
            if (charCount <= i) html += line[c];
            charCount++;
          }
          if (charCount <= i) html += '<br>';
          charCount++;
        }
        el.innerHTML = html;
        i++;
        this._typeTimer = setTimeout(write, i < 3 ? 0 : 28);
      } else {
        this._typing = false;
        if (onDone) onDone();
      }
    };
    write();
  }

  _finishTyping() {
    clearTimeout(this._typeTimer);
    this._typing = false;
    if (this._typeEl) {
      this._typeEl.innerHTML = this._fullText.replace(/\n/g, '<br>');
    }
    if (this._typeCb) {
      const cb = this._typeCb;
      this._typeCb = null;
      cb();
    }
  }

  /* ════════════════════════════════
     NAVIGATION
  ════════════════════════════════ */

  _showContinue() {
    const btn = document.getElementById('scene-continue');
    btn.style.display = 'block';
    gsap.fromTo(btn, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  }

  _onSkipClick() {
    if (this._typing) {
      this._finishTyping();
      return;
    }
    const btn = document.getElementById('scene-continue');
    if (btn.style.display === 'block') this._next();
  }

  _next() {
    this.index++;
    gsap.to(this.screen, {
      opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        gsap.set(this.screen, { opacity: 1 });
        this._showScene(this.index);
      },
    });
  }

  _skipAll() {
    clearTimeout(this._typeTimer);
    this._typing = false;
    this._end();
  }

  _reset() {
    document.getElementById('scene-card').style.display          = 'none';
    document.getElementById('scene-title-block').style.display   = 'none';
    document.getElementById('scene-narration').style.display     = 'none';
    document.getElementById('scene-portrait').style.display      = 'none';
    document.getElementById('scene-dialogue-box').style.display  = 'none';
    document.getElementById('scene-continue').style.display      = 'none';
    this._typing = false;
    clearTimeout(this._typeTimer);
  }

  _end() {
    gsap.to(this.screen, {
      opacity: 0, duration: 0.4, ease: 'power2.in',
      onComplete: () => {
        this.screen.style.display = 'none';
        this.screen.style.background = '';
        this._reset();
        if (this._onDone) {
          const cb = this._onDone;
          this._onDone = null;
          cb();
        }
      },
    });
  }
}
