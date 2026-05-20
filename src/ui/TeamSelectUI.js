/**
 * TeamSelectUI.js
 * Écran de sélection d'équipe (max 3 personnages possédés).
 */

import { gsap }       from 'gsap';
import { CHARACTERS, RARITIES } from '../data/characters.js';
import { statMultiplier } from '../data/PlayerData.js';

const ELEMENT_DATA = {
  Fire:    { color: '#ff5500', glow: '#ff2200', kanji: '火' },
  Dark:    { color: '#8800ff', glow: '#5500cc', kanji: '闇' },
  Wind:    { color: '#00cc66', glow: '#00ff88', kanji: '風' },
  Water:   { color: '#0099cc', glow: '#00ccff', kanji: '水' },
  Thunder: { color: '#cccc00', glow: '#ffff00', kanji: '雷' },
  Earth:   { color: '#886600', glow: '#bbaa00', kanji: '土' },
  Light:   { color: '#ccccff', glow: '#ffffff', kanji: '光' },
  Void:    { color: '#cc00ff', glow: '#880099', kanji: '虚' },
  Neutral: { color: '#99aacc', glow: '#667799', kanji: '無' },
};

export class TeamSelectUI {
  constructor(playerData, onTeamReady) {
    this.playerData   = playerData;
    this.onTeamReady  = onTeamReady; // callback(team: Character[])
    this.screen       = document.getElementById('team-select-screen');
    this.grid         = document.getElementById('ts-grid');
    this.startBtn     = document.getElementById('ts-start-btn');
    this.selectedIds  = [];

    document.getElementById('ts-back')?.addEventListener('click', () => this.hide());
    this.startBtn?.addEventListener('click', () => this._launch());
  }

  show() {
    this._buildGrid();
    this._updateSlots();

    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 20 });
    gsap.to(this.screen, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out',
      onComplete: () => gsap.from('.ts-char-card', {
        opacity: 0, scale: 0.88, y: 16, stagger: 0.04, duration: 0.3, ease: 'back.out(1.4)',
      }),
    });
  }

  hide() {
    gsap.to(this.screen, { opacity: 0, y: 16, duration: 0.25, ease: 'power2.in',
      onComplete: () => { this.screen.style.display = 'none'; this.selectedIds = []; },
    });
  }

  _buildGrid() {
    this.grid.innerHTML = '';
    const owned = CHARACTERS.filter(c => this.playerData.has(c.id));
    owned.sort((a, b) => b.rarity - a.rarity);

    owned.forEach(char => {
      const el  = ELEMENT_DATA[char.element] || ELEMENT_DATA.Neutral;
      const rar = RARITIES[char.rarity];
      const card = document.createElement('div');
      card.className = 'ts-char-card';
      card.dataset.id = char.id;

      const level = this.playerData.getLevel(char.id);
      const prog  = this.playerData.expProgress(char.id);

      card.innerHTML = `
        <div class="ts-char-bg" style="--el:${el.color};--glow:${el.glow};--rar:${rar.color}">
          <div class="ts-char-el">${el.kanji}</div>
          <div class="ts-char-initial">${char.name[0]}</div>
          <div class="ts-char-stars" style="color:${rar.color}">${'★'.repeat(char.rarity)}</div>
          <div class="ts-char-name">${char.name}</div>
          <div class="ts-char-class">${char.class}</div>
          <div class="ts-char-level">
            <span class="ts-lv-badge">Lv.${level}</span>
            <div class="ts-lv-bar-track">
              <div class="ts-lv-bar" style="width:${prog.pct}%"></div>
            </div>
          </div>
          <div class="ts-char-check">✓</div>
        </div>
      `;

      card.addEventListener('click', () => this._toggleChar(char.id, card));
      this.grid.appendChild(card);
    });
  }

  _toggleChar(id, card) {
    const idx = this.selectedIds.indexOf(id);
    if (idx >= 0) {
      // Désélectionner
      this.selectedIds.splice(idx, 1);
      card.classList.remove('ts-char-selected');
      gsap.to(card, { scale: 1, duration: 0.2 });
    } else {
      if (this.selectedIds.length >= 3) return; // max 3
      this.selectedIds.push(id);
      card.classList.add('ts-char-selected');
      gsap.fromTo(card, { scale: 1.05 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' });
    }
    this._updateSlots();
  }

  _updateSlots() {
    const slots = document.querySelectorAll('.ts-slot');
    slots.forEach((slot, i) => {
      const id   = this.selectedIds[i];
      const char = id ? CHARACTERS.find(c => c.id === id) : null;
      const el   = char ? (ELEMENT_DATA[char.element] || ELEMENT_DATA.Neutral) : null;
      const rar  = char ? RARITIES[char.rarity] : null;

      if (char) {
        slot.innerHTML = `
          <div class="ts-slot-filled" style="--el:${el.color};--rar:${rar.color}">
            <span class="ts-slot-kanji">${el.kanji}</span>
            <span class="ts-slot-initial">${char.name[0]}</span>
            <span class="ts-slot-name">${char.name}</span>
          </div>
        `;
      } else {
        slot.innerHTML = `<span class="ts-slot-empty">+</span>`;
      }
    });

    const count = document.getElementById('ts-slot-count');
    if (count) count.textContent = `${this.selectedIds.length} / 3`;

    this.startBtn.disabled = this.selectedIds.length === 0;
    if (this.selectedIds.length > 0) {
      this.startBtn.classList.add('ts-start-ready');
    } else {
      this.startBtn.classList.remove('ts-start-ready');
    }
  }

  _launch() {
    const team = this.selectedIds.map(id => CHARACTERS.find(c => c.id === id)).filter(Boolean);
    if (!team.length) return;

    // Cache immédiatement — pas de dépendance au onComplete GSAP
    gsap.killTweensOf(this.screen);
    gsap.to(this.screen, { opacity: 0, duration: 0.2, ease: 'power2.in' });

    setTimeout(() => {
      this.screen.style.display = 'none';
      this.screen.style.opacity = '1';
      this.selectedIds = [];
      this.onTeamReady(team);
    }, 220);
  }
}
