/**
 * LevelUpUI.js
 * Écran animé de montée de niveau post-combat.
 *
 * Affiche chaque personnage qui a gagné des niveaux,
 * avec stats comparées avant/après et barre EXP.
 */

import { gsap }                     from 'gsap';
import { statMultiplier, xpToNextLevel } from '../data/PlayerData.js';

export class LevelUpUI {
  constructor() {
    this.screen   = document.getElementById('levelup-screen');
    this._onDone  = null;

    document.getElementById('levelup-continue-btn')
      ?.addEventListener('click', () => this._end());
  }

  /**
   * @param {Array}  results   - [{ char, oldLevel, newLevel, newExp, expGained }]
   * @param {Function} onDone
   */
  play(results, onDone) {
    this._onDone = onDone;
    this._buildCards(results);

    gsap.set(this.screen, { display: 'flex', opacity: 0 });
    gsap.to(this.screen, { opacity: 1, duration: 0.4, ease: 'power2.out' });

    // Stagger des cartes
    gsap.fromTo('.lvlup-card',
      { opacity: 0, y: 40, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.12,
        delay: 0.2, ease: 'back.out(1.5)',
        onComplete: () => this._animateStats(),
      }
    );

    gsap.fromTo('#levelup-continue-btn',
      { opacity: 0 },
      { opacity: 1, duration: 0.3, delay: 0.8 + results.length * 0.12 }
    );
  }

  /* ════════════════════════════════
     CONSTRUCTION DES CARTES
  ════════════════════════════════ */

  _buildCards(results) {
    const grid = document.getElementById('levelup-grid');
    grid.innerHTML = '';

    results.forEach(r => {
      const { char, oldLevel, newLevel, newExp, expGained } = r;
      const leveled = newLevel > oldLevel;

      const oldStats = {
        hp:  Math.round(char.stats.hp  * statMultiplier(oldLevel)),
        atk: Math.round(char.stats.atk * statMultiplier(oldLevel)),
        def: Math.round(char.stats.def * statMultiplier(oldLevel)),
      };
      const newStats = {
        hp:  Math.round(char.stats.hp  * statMultiplier(newLevel)),
        atk: Math.round(char.stats.atk * statMultiplier(newLevel)),
        def: Math.round(char.stats.def * statMultiplier(newLevel)),
      };

      const needed = xpToNextLevel(newLevel);
      const pct    = needed === Infinity ? 100 : Math.min(100, (newExp / needed) * 100);

      const el = document.createElement('div');
      el.className = `lvlup-card${leveled ? ' lvlup-card--leveled' : ''}`;
      el.style.setProperty('--char-color', char.color || '#00d4ff');

      el.innerHTML = `
        <div class="lvlup-portrait">
          <span class="lvlup-symbol">${char.symbol || char.name[0]}</span>
          ${leveled ? '<div class="lvlup-badge">⬆</div>' : ''}
        </div>
        <div class="lvlup-info">
          <div class="lvlup-name">${char.name}</div>
          <div class="lvlup-level">
            ${leveled
              ? `<span class="lvlup-old-lv">Lv.${oldLevel}</span>
                 <span class="lvlup-arrow">→</span>
                 <span class="lvlup-new-lv">Lv.${newLevel}</span>`
              : `<span class="lvlup-new-lv">Lv.${newLevel}</span>`
            }
          </div>
          ${leveled ? `
          <div class="lvlup-stats">
            <div class="lvlup-stat">
              <span class="lvlup-stat-lbl">HP</span>
              <span class="lvlup-stat-old">${oldStats.hp.toLocaleString()}</span>
              <span class="lvlup-stat-arrow">→</span>
              <span class="lvlup-stat-new" data-val="${newStats.hp}">${oldStats.hp.toLocaleString()}</span>
            </div>
            <div class="lvlup-stat">
              <span class="lvlup-stat-lbl">ATK</span>
              <span class="lvlup-stat-old">${oldStats.atk.toLocaleString()}</span>
              <span class="lvlup-stat-arrow">→</span>
              <span class="lvlup-stat-new" data-val="${newStats.atk}">${oldStats.atk.toLocaleString()}</span>
            </div>
            <div class="lvlup-stat">
              <span class="lvlup-stat-lbl">DEF</span>
              <span class="lvlup-stat-old">${oldStats.def.toLocaleString()}</span>
              <span class="lvlup-stat-arrow">→</span>
              <span class="lvlup-stat-new" data-val="${newStats.def}">${oldStats.def.toLocaleString()}</span>
            </div>
          </div>` : ''}
          <div class="lvlup-xp-block">
            <div class="lvlup-xp-label">
              <span>EXP +${expGained}</span>
              ${newLevel < 50 ? `<span>${newExp} / ${needed}</span>` : '<span>MAX</span>'}
            </div>
            <div class="lvlup-xp-track">
              <div class="lvlup-xp-bar" style="width:0%" data-pct="${pct}"></div>
            </div>
          </div>
        </div>
      `;

      grid.appendChild(el);
    });
  }

  /* ════════════════════════════════
     ANIMATIONS DES STATS
  ════════════════════════════════ */

  _animateStats() {
    // Stats qui montent
    document.querySelectorAll('.lvlup-stat-new[data-val]').forEach(el => {
      const target = parseInt(el.dataset.val);
      const start  = parseInt(el.textContent.replace(/,/g, '')) || 0;
      gsap.to({ val: start }, {
        val: target, duration: 0.7, ease: 'power2.out',
        onUpdate: function() { el.textContent = Math.round(this.targets()[0].val).toLocaleString(); },
      });
      gsap.fromTo(el, { color: '#00ff88' }, { color: '#00ff88', duration: 0.05,
        onComplete: () => gsap.to(el, { color: '#00ff88', duration: 0.6 }),
      });
    });

    // Barres EXP
    document.querySelectorAll('.lvlup-xp-bar[data-pct]').forEach((bar, i) => {
      const pct = parseFloat(bar.dataset.pct);
      gsap.to(bar, { width: `${pct}%`, duration: 0.8, delay: i * 0.1, ease: 'power2.out' });
    });
  }

  /* ════════════════════════════════
     FIN
  ════════════════════════════════ */

  _end() {
    gsap.to(this.screen, {
      opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        this.screen.style.display = 'none';
        document.getElementById('levelup-grid').innerHTML = '';
        if (this._onDone) { const cb = this._onDone; this._onDone = null; cb(); }
      },
    });
  }
}
