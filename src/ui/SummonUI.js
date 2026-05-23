/**
 * SummonUI.js
 * Écran d'invocation — gacha avec :
 *  - Cinématique plein-écran pour les tirages 5★ (x1)
 *  - Flip carte par carte sur le x10 (rareté croissante = suspense)
 *  - Panneau historique des 100 derniers pulls avec stats
 *  - Indication dynamique "4★ dans N pulls" sur le bouton x10
 */

import { gsap }        from 'gsap';
import { GachaEngine } from '../gacha/GachaEngine.js';
import { RARITIES }    from '../data/characters.js';
import { audio }       from '../audio/AudioManager.js';

const COST_X1  = 300;
const COST_X10 = 2700;

/* Couleurs élémentaires pour la cinématique 5★ */
const ELEMENT_COLORS = {
  Fire:    { color: '#ff5500', glow: '#ff2200', kanji: '火', bg: 'rgba(255,60,0,0.18)'    },
  Dark:    { color: '#8800ff', glow: '#5500cc', kanji: '闇', bg: 'rgba(120,0,200,0.22)'   },
  Wind:    { color: '#00cc66', glow: '#00ff88', kanji: '風', bg: 'rgba(0,200,100,0.18)'   },
  Water:   { color: '#0099cc', glow: '#00ccff', kanji: '水', bg: 'rgba(0,160,220,0.18)'   },
  Thunder: { color: '#cccc00', glow: '#ffff00', kanji: '雷', bg: 'rgba(200,200,0,0.18)'   },
  Earth:   { color: '#886600', glow: '#bbaa00', kanji: '土', bg: 'rgba(140,110,0,0.18)'   },
  Light:   { color: '#ccccff', glow: '#ffffff', kanji: '光', bg: 'rgba(180,180,255,0.18)' },
  Void:    { color: '#cc00ff', glow: '#880099', kanji: '虚', bg: 'rgba(180,0,240,0.22)'   },
  Neutral: { color: '#99aacc', glow: '#667799', kanji: '無', bg: 'rgba(100,130,180,0.15)' },
};

export class SummonUI {
  constructor(playerData) {
    this.playerData  = playerData;
    this.engine      = new GachaEngine(playerData);
    this.overlay     = null;
    this._cinematic  = null;
    this._histPanel  = null;
    this.isAnimating = false;
    this._build();
    this._buildCinematic();
    this._buildHistoryPanel();
  }

  /* ══════════════════════════════════════════
     BUILD DOM
  ══════════════════════════════════════════ */

  _build() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'summon-screen';
    this.overlay.innerHTML = `
      <div id="summon-bg-flash"></div>

      <!-- Header -->
      <div id="summon-header">
        <button id="summon-back">← Retour</button>
        <h2 id="summon-title">
          <span class="s-kanji">召喚</span>
          <span class="s-roman">INVOCATION</span>
        </h2>
        <div id="summon-header-right">
          <div id="summon-currency">
            <span class="currency-icon">◈</span>
            <span id="summon-currency-val">0</span>
          </div>
          <button id="summon-history-btn" title="Historique des tirages">歴</button>
        </div>
      </div>

      <!-- Zone de résultats (cartes) -->
      <div id="cards-area"></div>

      <!-- Pity + Boutons de pull -->
      <div id="summon-bottom">
        <div id="pity-display">
          <div class="pity-bar">
            <span class="pity-label">5★ LÉGENDAIRE</span>
            <div class="pity-track">
              <div class="pity-fill pity-fill-5" id="pity5-bar"></div>
            </div>
            <span class="pity-count" id="pity5-txt">90</span>
          </div>
          <div class="pity-bar">
            <span class="pity-label">4★ ÉPIQUE</span>
            <div class="pity-track">
              <div class="pity-fill pity-fill-4" id="pity4-bar"></div>
            </div>
            <span class="pity-count" id="pity4-txt">10</span>
          </div>
        </div>

        <div id="summon-free-rolls">
          <span class="sfr-icon">🔮</span>
          <span id="sfr-count">0</span>&nbsp;tirage<span id="sfr-plural"></span> gratuit<span id="sfr-plural2"></span>
        </div>

        <div id="summon-actions">
          <button class="pull-btn" id="pull-x1">
            <span class="pull-count">×1</span>
            <span class="pull-label">INVOQUER</span>
            <span class="pull-cost"><span class="pull-cost-icon">◈</span> ${COST_X1}</span>
          </button>
          <button class="pull-btn pull-x10" id="pull-x10">
            <span class="pull-count">×10</span>
            <span class="pull-label">INVOQUER</span>
            <span class="pull-cost"><span class="pull-cost-icon">◈</span> ${COST_X10} <em class="pull-discount">−10%</em></span>
            <span class="pull-guarantee" id="pull-x10-guarantee">3★ GARANTI</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this._bindEvents();
  }

  _buildCinematic() {
    this._cinematic = document.createElement('div');
    this._cinematic.id = 'summon-cinematic';
    this._cinematic.innerHTML = `
      <!-- Flash blanc initial -->
      <div id="cin-flash"></div>
      <!-- Vignette pulsante -->
      <div id="cin-vignette"></div>
      <!-- Rayons de lumière (18 = plus dense) -->
      <div class="cin-rays">
        ${Array.from({ length: 18 }, (_, i) =>
          `<div class="cin-ray" style="--angle:${i * 20}deg"></div>`
        ).join('')}
      </div>
      <!-- Grand kanji de l'élément -->
      <div id="cin-element-kanji"></div>
      <!-- Particules flottantes -->
      <div id="cin-particles"></div>
      <!-- Particules burst (sortant du centre) -->
      <div id="cin-burst"></div>
      <!-- Grande carte -->
      <div id="cin-card-wrap"></div>
      <!-- Texte personnage -->
      <div id="cin-info">
        <div id="cin-rarity-label">LÉGENDAIRE</div>
        <div id="cin-char-name"></div>
        <div id="cin-char-title"></div>
      </div>
      <!-- Invite à continuer -->
      <div id="cin-continue">
        <span>Appuyez pour continuer</span>
        <span class="cin-continue-arrow">▼</span>
      </div>
    `;
    document.body.appendChild(this._cinematic);
  }

  _buildHistoryPanel() {
    this._histPanel = document.createElement('div');
    this._histPanel.id = 'summon-history-panel';
    this._histPanel.innerHTML = `
      <div id="hist-header">
        <div id="hist-title">
          <span class="hist-kanji">歴</span>
          <span class="hist-roman">HISTORIQUE</span>
        </div>
        <button id="hist-close">✕</button>
      </div>
      <div id="hist-stats"></div>
      <div id="hist-list"></div>
    `;
    document.body.appendChild(this._histPanel);
    this._histPanel.querySelector('#hist-close')
      .addEventListener('click', () => this._hideHistory());
  }

  /* ══════════════════════════════════════════
     EVENTS
  ══════════════════════════════════════════ */

  _bindEvents() {
    this.overlay.querySelector('#summon-back')
      .addEventListener('click', () => this.hide());
    this.overlay.querySelector('#pull-x1')
      .addEventListener('click', () => this._doPull(1));
    this.overlay.querySelector('#pull-x10')
      .addEventListener('click', () => this._doPull(10));
    this.overlay.querySelector('#summon-history-btn')
      .addEventListener('click', () => this._showHistory());
  }

  /* ══════════════════════════════════════════
     LOGIQUE DE TIRAGE
  ══════════════════════════════════════════ */

  async _doPull(count) {
    if (this.isAnimating) return;

    const freeRolls = this.playerData.freeRolls ?? 0;
    const isFree    = freeRolls >= count;
    const cost      = isFree ? 0 : (count === 1 ? COST_X1 : COST_X10);

    if (!isFree && this.playerData.currency < cost) {
      this._showInsufficientFunds(cost);
      return;
    }

    this.isAnimating = true;

    if (isFree) {
      this.playerData.freeRolls -= count;
      this.playerData._saveProgress();
    } else {
      this.playerData.currency -= cost;
      this.playerData._saveProgress();
    }
    this._updateCurrencyDisplay();
    this._updateButtonStates();

    const results = this.engine.pull(count);
    this._updatePityDisplay();

    // Enregistre dans l'historique joueur
    this.playerData.addPullHistory(results);

    // Dispatch des personnages obtenus
    results.forEach(char => {
      document.dispatchEvent(
        new CustomEvent('kuro:character-obtained', { detail: { id: char.id } })
      );
    });

    const bestRarity = Math.max(...results.map(r => r.rarity));

    if (count === 1 && bestRarity >= 5) {
      // x1 + 5★ → flash PUIS cinématique
      audio.play('summon_legendary');
      await this._playFlash(5);
      await this._playCinematic5star(results[0]);
    } else if (count === 1) {
      // x1 normal → flash + révélation simple
      if (bestRarity >= 4) audio.play('summon_rare');
      else                  audio.play('summon_pull');
      await this._playFlash(bestRarity);
    } else {
      // x10 → flash muet (sons joués pendant le flip)
      await this._playFlash(bestRarity);
    }

    await this._revealCards(results);

    this.isAnimating = false;
    this._updateButtonStates();
  }

  /* ══════════════════════════════════════════
     CINÉMATIQUE 5★
  ══════════════════════════════════════════ */

  _playCinematic5star(char) {
    return new Promise(resolve => {
      const el      = this._cinematic;
      const rarity  = RARITIES[char.rarity];
      const elData  = ELEMENT_COLORS[char.element] || ELEMENT_COLORS.Neutral;

      /* ── Éléments DOM ── */
      const wrap       = el.querySelector('#cin-card-wrap');
      const flashEl    = el.querySelector('#cin-flash');
      const kanjiEl    = el.querySelector('#cin-element-kanji');
      const vignetteEl = el.querySelector('#cin-vignette');
      const burstEl    = el.querySelector('#cin-burst');

      /* ── Grande carte ── */
      wrap.innerHTML = '';
      const bigCard = this._createCard(char);
      bigCard.classList.add('cin-card--big');
      wrap.appendChild(bigCard);

      /* ── Textes ── */
      const rarityLabel = el.querySelector('#cin-rarity-label');
      rarityLabel.textContent      = rarity.label.toUpperCase();
      rarityLabel.style.color      = rarity.color;
      rarityLabel.style.textShadow = `0 0 20px ${rarity.glow}, 0 0 40px ${rarity.glow}`;
      el.querySelector('#cin-char-name').textContent  = char.name;
      el.querySelector('#cin-char-title').textContent = char.title;

      /* ── Kanji élément ── */
      kanjiEl.textContent  = elData.kanji;
      kanjiEl.style.color  = elData.color;
      kanjiEl.style.textShadow = `0 0 60px ${elData.glow}, 0 0 120px ${elData.glow}`;

      /* ── Rayons teintés élément ── */
      el.querySelectorAll('.cin-ray').forEach(r => {
        r.style.background = `linear-gradient(to right,
          transparent 0%, ${elData.color}44 40%,
          ${elData.color}99 70%, transparent 100%)`;
      });

      /* ── Couleur background dynamique ── */
      el.style.background = `
        radial-gradient(ellipse 60% 60% at 50% 50%, ${elData.bg} 0%, transparent 70%),
        radial-gradient(ellipse at 50% 50%, #050218 0%, #020010 100%)
      `;

      /* ── Particules flottantes ── */
      this._spawnParticles(el.querySelector('#cin-particles'), elData.glow);

      /* ── États initiaux ── */
      gsap.set(el,     { display: 'flex', opacity: 1 });
      gsap.set(flashEl,  { opacity: 1 });
      gsap.set(kanjiEl,  { opacity: 0, scale: 3, y: 0 });
      gsap.set(vignetteEl, { opacity: 0 });
      gsap.set(el.querySelectorAll('.cin-ray'), { scaleX: 0 });
      gsap.set(wrap,   { opacity: 0, scale: 0.15, rotateY: 180 });
      gsap.set('#cin-info', { opacity: 0, y: 32 });
      gsap.set('#cin-continue', { opacity: 0 });
      if (burstEl) burstEl.innerHTML = '';

      const tl = gsap.timeline();

      /* ── Phase 1 : Flash blanc ── */
      tl.to(flashEl, { opacity: 0, duration: 0.55, ease: 'power3.in' });

      /* ── Phase 2 : Vignette + shake ── */
      tl.to(vignetteEl, { opacity: 1, duration: 0.3 }, '<+=0.15');
      tl.to(el, { x: -10, duration: 0.06, yoyo: true, repeat: 5, ease: 'none' }, '<');

      /* ── Phase 3 : Kanji élément (monte et s'évanouit) ── */
      tl.to(kanjiEl, {
        opacity: 0.85, scale: 1.2, duration: 0.45, ease: 'back.out(2)',
      });
      tl.to(kanjiEl, {
        opacity: 0, scale: 0.8, y: -40, duration: 0.7, ease: 'power2.in',
      }, '+=0.25');

      /* ── Phase 4 : Rayons explosent ── */
      tl.to(el.querySelectorAll('.cin-ray'), {
        scaleX: 1,
        duration: 0.5,
        stagger: { each: 0.025, from: 'random' },
        ease: 'power3.out',
      }, '-=0.6');

      /* ── Phase 5 : Burst de particules ── */
      tl.call(() => {
        if (burstEl) this._spawnBurstParticles(burstEl, elData.color, elData.glow);
      }, [], '-=0.3');

      /* ── Phase 6 : Carte flip-in dramatique ── */
      tl.to(wrap, {
        opacity: 1, scale: 1, rotateY: 0,
        duration: 0.9,
        ease: 'back.out(1.8)',
      }, '-=0.2');

      /* ── Phase 7 : Glow pulsant sur la carte ── */
      tl.call(() => this._addGlowPulse(bigCard), [], '-=0.3');

      /* ── Phase 8 : Nom (scale dramatique) → titre ── */
      tl.set('#cin-info', { opacity: 1, y: 0 }, '-=0.1');
      tl.fromTo('#cin-rarity-label',
        { opacity: 0, letterSpacing: '1em' },
        { opacity: 1, letterSpacing: '0.5em', duration: 0.4, ease: 'power2.out' }, '-=0.1');
      tl.fromTo('#cin-char-name',
        { opacity: 0, scale: 1.6, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.6)' }, '-=0.2');
      tl.fromTo('#cin-char-title',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.15');

      /* ── Phase 9 : Prompt continuer ── */
      tl.to('#cin-continue', { opacity: 1, duration: 0.5 }, '+=0.2');

      /* ── Fermeture au clic/tap ── */
      const finish = () => {
        el.removeEventListener('click', finish);
        gsap.killTweensOf(bigCard);
        gsap.killTweensOf(el);
        gsap.to(el, {
          opacity: 0, scale: 1.04, duration: 0.4, ease: 'power2.in',
          onComplete: () => {
            el.style.display = 'none';
            el.style.transform = '';
            el.querySelector('#cin-particles').innerHTML = '';
            if (burstEl) burstEl.innerHTML = '';
            gsap.set(el, { scale: 1, opacity: 1, x: 0 });
            resolve();
          },
        });
      };
      // Permettre la fermeture après un délai minimum
      setTimeout(() => el.addEventListener('click', finish), 1200);
    });
  }

  _spawnBurstParticles(container, color, glow) {
    container.innerHTML = '';
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * 360;
      const dist  = 80 + Math.random() * 160;
      const p     = document.createElement('div');
      p.className = 'cin-burst-particle';
      p.style.cssText = [
        `--bx:${Math.cos((angle * Math.PI) / 180) * dist}px`,
        `--by:${Math.sin((angle * Math.PI) / 180) * dist}px`,
        `--bc:${color}`,
        `--bg:${glow}`,
        `--bd:${0.4 + Math.random() * 0.5}s`,
        `--bs:${3 + Math.random() * 7}px`,
      ].join(';');
      container.appendChild(p);
    }
  }

  _spawnParticles(container, color) {
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'cin-particle';
      p.style.cssText = [
        `--px:${10 + Math.random() * 80}%`,
        `--py:${10 + Math.random() * 80}%`,
        `--pc:${color}`,
        `--pd:${0.4 + Math.random() * 2.5}s`,
        `--ps:${2 + Math.random() * 6}px`,
        `--pdelay:${Math.random() * 1.5}s`,
      ].join(';');
      container.appendChild(p);
    }
  }

  /* ══════════════════════════════════════════
     RÉVÉLATION DES CARTES
  ══════════════════════════════════════════ */

  async _revealCards(results) {
    const area = this.overlay.querySelector('#cards-area');
    area.innerHTML = '';
    area.dataset.count = results.length;

    if (results.length === 1) {
      /* ── x1 : entrée simple ── */
      const card = this._createCard(results[0]);
      area.appendChild(card);
      await new Promise(resolve => {
        gsap.fromTo(card,
          { y: 50, opacity: 0, scale: 0.85 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)',
            onComplete: () => {
              if (results[0].rarity >= 4) this._addGlowPulse(card);
              resolve();
            },
          }
        );
      });
      return;
    }

    /* ── x10 : toutes face cachée → flip une par une (suspense) ── */
    const cards = results.map(char => this._createCard(char));

    // Ordre de révélation : rareté croissante (les meilleures en dernier)
    const revealOrder = cards
      .map((card, i) => ({ card, char: results[i] }))
      .sort((a, b) => a.char.rarity - b.char.rarity);

    // 1. Pose toutes les cartes côté dos, simultanément
    cards.forEach(card => {
      card.classList.add('card-facedown');
      gsap.set(card, { opacity: 0, y: 18, scale: 0.9 });
      area.appendChild(card);
    });

    await new Promise(resolve => {
      gsap.to(cards, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.28, stagger: 0.04,
        ease: 'power2.out', onComplete: resolve,
      });
    });

    // Courte pause avant le début des retournements
    await this._wait(180);

    // 2. Retourne chaque carte une par une
    for (const { card, char } of revealOrder) {
      const isHigh = char.rarity >= 5;
      const isMid  = char.rarity >= 4;

      // Demi-tour 1 : carte se ferme (→ 90°)
      await new Promise(resolve => {
        gsap.to(card, {
          rotateY: 90,
          duration: isHigh ? 0.22 : 0.16,
          ease: 'power2.in',
          onComplete: resolve,
        });
      });

      // Au moment de l'angle plat : retire le "dos"
      card.classList.remove('card-facedown');

      // Demi-tour 2 : carte s'ouvre (← 0°)
      await new Promise(resolve => {
        gsap.to(card, {
          rotateY: 0,
          duration: isHigh ? 0.28 : 0.2,
          ease: 'power2.out',
          onComplete: resolve,
        });
      });

      // Effets post-flip
      if (isHigh) {
        audio.play('summon_legendary');
        this._addGlowPulse(card);
        gsap.fromTo(card,
          { filter: 'brightness(3.5)' },
          { filter: 'brightness(1)', duration: 0.55, ease: 'power2.out' }
        );
        // Légère animation de rebond
        gsap.fromTo(card,
          { scale: 1.12 },
          { scale: 1, duration: 0.4, ease: 'back.out(2)' }
        );
        await this._wait(280);
      } else if (isMid) {
        audio.play('summon_rare');
        this._addGlowPulse(card);
        gsap.fromTo(card,
          { scale: 1.07 },
          { scale: 1, duration: 0.3, ease: 'back.out(1.8)' }
        );
        await this._wait(100);
      } else {
        audio.play('summon_pull');
        await this._wait(45);
      }
    }
  }

  _wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ══════════════════════════════════════════
     HISTORIQUE
  ══════════════════════════════════════════ */

  _showHistory() {
    this._populateHistory();
    gsap.set(this._histPanel, { display: 'flex', x: '100%' });
    gsap.to(this._histPanel, { x: '0%', duration: 0.32, ease: 'power3.out' });
  }

  _hideHistory() {
    gsap.to(this._histPanel, {
      x: '100%', duration: 0.26, ease: 'power3.in',
      onComplete: () => { this._histPanel.style.display = 'none'; },
    });
  }

  _populateHistory() {
    const history = this.playerData.pullHistory || [];
    const total   = history.length;
    const by5     = history.filter(h => h.rarity === 5).length;
    const by4     = history.filter(h => h.rarity === 4).length;
    const by3     = history.filter(h => h.rarity === 3).length;
    const rate5   = total > 0 ? ((by5 / total) * 100).toFixed(1) : '0.0';
    const rate4   = total > 0 ? ((by4 / total) * 100).toFixed(1) : '0.0';

    this._histPanel.querySelector('#hist-stats').innerHTML = `
      <div class="hist-stat-grid">
        <div class="hist-stat">
          <div class="hist-stat-val">${total}</div>
          <div class="hist-stat-lbl">TIRAGES</div>
        </div>
        <div class="hist-stat hist-stat--5">
          <div class="hist-stat-val">${by5}</div>
          <div class="hist-stat-lbl">5★ · ${rate5}%</div>
        </div>
        <div class="hist-stat hist-stat--4">
          <div class="hist-stat-val">${by4}</div>
          <div class="hist-stat-lbl">4★ · ${rate4}%</div>
        </div>
        <div class="hist-stat hist-stat--3">
          <div class="hist-stat-val">${by3}</div>
          <div class="hist-stat-lbl">3★</div>
        </div>
      </div>
    `;

    const list = this._histPanel.querySelector('#hist-list');
    if (total === 0) {
      list.innerHTML = '<div class="hist-empty">Aucun tirage enregistré</div>';
      return;
    }

    list.innerHTML = history.map(entry => {
      const rarity  = RARITIES[entry.rarity];
      const d       = new Date(entry.timestamp);
      const timeStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="hist-entry hist-entry--r${entry.rarity}" style="--hc:${rarity.color};--hg:${rarity.glow}">
          <div class="hist-entry-stars">${'★'.repeat(entry.rarity)}</div>
          <div class="hist-entry-info">
            <div class="hist-entry-name">${entry.name}</div>
            <div class="hist-entry-sub">${entry.element} · ${rarity.label}</div>
          </div>
          <div class="hist-entry-time">${timeStr}</div>
        </div>
      `;
    }).join('');
  }

  /* ══════════════════════════════════════════
     HELPERS UI
  ══════════════════════════════════════════ */

  _updateCurrencyDisplay() {
    const el = this.overlay.querySelector('#summon-currency-val');
    if (el) el.textContent = (this.playerData?.currency ?? 0).toLocaleString();
  }

  _updateButtonStates() {
    const currency  = this.playerData?.currency  ?? 0;
    const freeRolls = this.playerData?.freeRolls ?? 0;
    const btn1  = this.overlay.querySelector('#pull-x1');
    const btn10 = this.overlay.querySelector('#pull-x10');

    // ×1
    if (btn1) {
      btn1.disabled = currency < COST_X1 && freeRolls < 1;
      const costEl = btn1.querySelector('.pull-cost');
      if (costEl) {
        costEl.innerHTML = freeRolls >= 1
          ? '<span class="pull-free-badge">GRATUIT</span>'
          : `<span class="pull-cost-icon">◈</span> ${COST_X1}`;
      }
    }

    // ×10
    if (btn10) {
      btn10.disabled = currency < COST_X10 && freeRolls < 10;
      const costEl = btn10.querySelector('.pull-cost');
      if (costEl) {
        costEl.innerHTML = freeRolls >= 10
          ? '<span class="pull-free-badge">GRATUIT</span>'
          : `<span class="pull-cost-icon">◈</span> ${COST_X10} <em class="pull-discount">−10%</em>`;
      }
    }

    // Badge free rolls
    const freeEl = this.overlay.querySelector('#summon-free-rolls');
    if (freeEl) {
      freeEl.style.display = freeRolls > 0 ? 'flex' : 'none';
      const countEl   = freeEl.querySelector('#sfr-count');
      const pluralEl  = freeEl.querySelector('#sfr-plural');
      const plural2El = freeEl.querySelector('#sfr-plural2');
      if (countEl)   countEl.textContent   = freeRolls;
      if (pluralEl)  pluralEl.textContent  = freeRolls > 1 ? 's' : '';
      if (plural2El) plural2El.textContent = freeRolls > 1 ? 's' : '';
    }

    // Label dynamique "4★ dans N pulls" sur le bouton x10
    const g = this.overlay.querySelector('#pull-x10-guarantee');
    if (g) {
      const { next4Guaranteed } = this.engine.getPityInfo();
      if (next4Guaranteed <= 10) {
        g.textContent      = `4★ DANS ${next4Guaranteed} PULLS`;
        g.style.color      = '#b44fff';
        g.style.textShadow = '0 0 8px rgba(180,79,255,0.6)';
      } else {
        g.textContent      = '3★ GARANTI';
        g.style.color      = '';
        g.style.textShadow = '';
      }
    }
  }

  _showInsufficientFunds(cost) {
    const needed = cost - (this.playerData?.currency ?? 0);
    const msg    = document.createElement('div');
    msg.className    = 'summon-toast summon-toast--error';
    msg.textContent  = `◈ insuffisantes — il vous manque ${needed} ◈`;
    this.overlay.appendChild(msg);
    gsap.fromTo(msg,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.3,
        onComplete: () => gsap.to(msg, {
          opacity: 0, y: -20, delay: 1.8, duration: 0.3,
          onComplete: () => msg.remove(),
        }),
      }
    );
  }

  _playFlash(bestRarity) {
    return new Promise(resolve => {
      const flash    = this.overlay.querySelector('#summon-bg-flash');
      const color    = RARITIES[bestRarity].glow;
      const duration = bestRarity >= 4 ? 0.8 : 0.4;
      gsap.timeline({ onComplete: resolve })
        .set(flash, { background: color, opacity: 0 })
        .to(flash, { opacity: bestRarity >= 5 ? 1 : 0.7, duration: duration * 0.4, ease: 'power2.in' })
        .to(flash, { opacity: 0, duration: duration * 0.6, ease: 'power2.out' });
    });
  }

  /* ── Crée une carte au design cyberpunk ── */
  _createCard(char) {
    const rarity  = RARITIES[char.rarity];
    const stars   = '★'.repeat(char.rarity);
    const empties = '★'.repeat(5 - char.rarity);
    const elColor = this._elementColor(char.element);
    const card    = document.createElement('div');

    card.className      = `summon-card rarity-${char.rarity}`;
    card.dataset.rarity = char.rarity;
    card.style.setProperty('--card-color',  rarity.color);
    card.style.setProperty('--card-glow',   rarity.glow);
    card.style.setProperty('--elem-color',  elColor.main);
    card.style.setProperty('--elem-glow',   elColor.glow);

    card.innerHTML = `
      <div class="card-holo"></div>
      <div class="card-scanline"></div>
      <div class="card-corner card-corner--tl"></div>
      <div class="card-corner card-corner--tr"></div>
      <div class="card-corner card-corner--bl"></div>
      <div class="card-corner card-corner--br"></div>
      <!-- Dos de carte (masqué sauf state facedown) -->
      <div class="card-back">
        <div class="card-back-symbol">召</div>
        <div class="card-back-grid"></div>
      </div>
      <div class="card-portrait">
        <div class="card-portrait-bg"></div>
        <div class="card-circuit">
          <div class="circuit-h circuit-h1"></div>
          <div class="circuit-h circuit-h2"></div>
          <div class="circuit-v circuit-v1"></div>
        </div>
        <div class="card-element-bg">${this._elementSymbol(char.element)}</div>
        <div class="card-initial">${char.name.charAt(0)}</div>
        <div class="card-rarity-badge">
          <span class="stars-lit">${stars}</span><span class="stars-dim">${empties}</span>
        </div>
        <div class="card-portrait-foot">
          <span class="card-elem-tag">${char.element}</span>
          <span class="card-class-tag">${char.class}</span>
        </div>
      </div>
      <div class="card-info">
        <div class="card-accent-line"></div>
        <div class="card-rarity-label">${rarity.label}</div>
        <div class="card-name">${char.name}</div>
        <div class="card-title-text">${char.title}</div>
        <div class="card-info-foot">
          <div class="card-id">ID_${char.id.toUpperCase()}</div>
          <div class="card-dot"></div>
        </div>
      </div>
    `;

    this._addTiltEffect(card);
    return card;
  }

  _addTiltEffect(card) {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(card, { rotateY: x * 18, rotateX: -y * 18, duration: 0.3, ease: 'power2.out', transformPerspective: 800 });
      const holo = card.querySelector('.card-holo');
      if (holo) holo.style.backgroundPosition = `${(x + 0.5) * 100}% ${(y + 0.5) * 100}%`;
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power3.out' });
    });
  }

  _elementColor(el) {
    const map = {
      Fire:    { main: '#ff5500', glow: '#ff2200' },
      Dark:    { main: '#8800ff', glow: '#5500cc' },
      Wind:    { main: '#00ffaa', glow: '#00cc88' },
      Water:   { main: '#00aaff', glow: '#0077cc' },
      Thunder: { main: '#ffee00', glow: '#ccaa00' },
      Earth:   { main: '#886600', glow: '#554400' },
      Light:   { main: '#ffffcc', glow: '#ffdd88' },
      Void:    { main: '#cc00ff', glow: '#880099' },
      Neutral: { main: '#99aacc', glow: '#667799' },
    };
    return map[el] || map.Neutral;
  }

  _elementSymbol(el) {
    const map = { Fire: '火', Dark: '闇', Wind: '風', Water: '水', Thunder: '雷', Earth: '土', Light: '光', Void: '虚', Neutral: '無' };
    return map[el] || '？';
  }

  _addGlowPulse(card) {
    const rarity = parseInt(card.dataset.rarity || '3');
    if (rarity >= 5) {
      gsap.to(card, {
        filter: `drop-shadow(0 0 28px var(--card-glow)) drop-shadow(0 0 70px var(--card-glow)) brightness(1.12)`,
        duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut',
      });
    } else {
      gsap.to(card, {
        filter: `drop-shadow(0 0 14px var(--card-glow)) drop-shadow(0 0 30px var(--card-glow))`,
        duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut',
      });
    }
  }

  _updatePityDisplay() {
    const { pity5, pity4, next5Guaranteed, next4Guaranteed } = this.engine.getPityInfo();
    const txt5 = this.overlay.querySelector('#pity5-txt');
    const txt4 = this.overlay.querySelector('#pity4-txt');
    const bar5 = this.overlay.querySelector('#pity5-bar');
    const bar4 = this.overlay.querySelector('#pity4-bar');
    if (txt5) txt5.textContent = next5Guaranteed;
    if (txt4) txt4.textContent = next4Guaranteed;
    if (bar5) gsap.to(bar5, { width: `${(pity5 / 90) * 100}%`, duration: 0.4, ease: 'power2.out' });
    if (bar4) gsap.to(bar4, { width: `${(pity4 / 10) * 100}%`, duration: 0.4, ease: 'power2.out' });
  }

  /* ══════════════════════════════════════════
     SHOW / HIDE
  ══════════════════════════════════════════ */

  show() {
    this.overlay.style.display = 'flex';
    this.overlay.querySelector('#cards-area').innerHTML = '';
    this._updatePityDisplay();
    this._updateCurrencyDisplay();
    this._updateButtonStates();
    gsap.fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  }

  hide() {
    this._hideHistory();
    gsap.to(this.overlay, {
      opacity: 0, duration: 0.3,
      onComplete: () => { this.overlay.style.display = 'none'; },
    });
  }
}
