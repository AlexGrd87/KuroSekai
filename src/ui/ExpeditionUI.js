/**
 * ExpeditionUI.js — Mode expéditions passives de KuroSekai.
 * 3 slots indépendants. Durées : 30 min / 2 h / 8 h.
 * Récompenses : or, matériaux d'ascension, parfois artefact (opération longue).
 */

import { gsap }       from 'gsap';
import { audio }      from '../audio/AudioManager.js';
import { toast }      from './ToastUI.js';
import { CHARACTERS } from '../data/characters.js';
import {
  EXPEDITION_TYPES, EXPEDITION_SLOTS,
  getExpeditionType, formatRemaining,
} from '../data/expeditions.js';
import { rollArtifactDrops, formatArtifactDrops } from '../data/artifacts.js';

export class ExpeditionUI {
  constructor(playerData, onBack) {
    this.playerData = playerData;
    this.onBack     = onBack;
    this.screen     = document.getElementById('expedition-screen');
    this._timerInt  = null;
    // Picker state
    this._pickerSlot = null;
    this._pickerType = null;
  }

  /* ════════════════════════════════
     SHOW / HIDE
  ════════════════════════════════ */

  show() {
    this._render();
    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 24 });
    gsap.to(this.screen, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
    audio.play?.('ui_navigate');
    this._startTimer();
  }

  hide() {
    this._stopTimer();
    gsap.to(this.screen, {
      opacity: 0, y: 16, duration: 0.28, ease: 'power2.in',
      onComplete: () => { if (this.screen) this.screen.style.display = 'none'; },
    });
  }

  _startTimer() {
    this._stopTimer();
    this._timerInt = setInterval(() => this._tickTimers(), 1000);
  }

  _stopTimer() {
    clearInterval(this._timerInt);
    this._timerInt = null;
  }

  /* ════════════════════════════════
     RENDU PRINCIPAL
  ════════════════════════════════ */

  _render() {
    if (!this.screen) return;
    const slots = this.playerData.expeditionSlots ?? [null, null, null];
    const now   = Date.now();
    const ready = slots.filter(s => s !== null && now >= s.endTime).length;
    const active = slots.filter(Boolean).length;

    this.screen.innerHTML = `
      <div id="exp-bg"></div>

      <header id="exp-header">
        <button id="exp-back-btn" class="col-back-btn">
          <span class="col-back-arrow">←</span> HUB
        </button>
        <div id="exp-title-block">
          <span class="exp-kanji-deco">遠</span>
          <h2>EXPÉDITIONS</h2>
        </div>
        <div id="exp-status-display">
          <div class="esd-item">
            <span class="esd-val" id="exp-active-count">${active}</span>
            <span class="esd-label">EN COURS</span>
          </div>
          <div class="esd-sep">|</div>
          <div class="esd-item">
            <span class="esd-val ${ready > 0 ? 'esd-val--ready' : ''}" id="exp-ready-count">${ready}</span>
            <span class="esd-label">PRÊTE${ready > 1 ? 'S' : ''}</span>
          </div>
        </div>
      </header>

      <!-- Bandeau informatif -->
      <div id="exp-info-strip">
        Envoyez vos combattants en mission automatique.
        Ils rapportent or, matériaux et parfois des artefacts.
      </div>

      <!-- 3 slots -->
      <div id="exp-slots-row">
        ${slots.map((slot, i) => this._slotHTML(slot, i, now)).join('')}
      </div>

      <!-- ── Modales (cachées par défaut) ── -->

      <!-- Choix du type de mission -->
      <div id="exp-type-picker" class="exp-modal-overlay" style="display:none" aria-modal="true">
        <div id="exp-type-picker-box" class="exp-modal-box">
          <div class="exp-modal-title">CHOISIR LA MISSION</div>
          <div class="exp-modal-sub" id="exp-type-slot-label"></div>
          <div id="exp-type-list">
            ${EXPEDITION_TYPES.map(t => `
              <button class="exp-type-btn" data-type="${t.id}" style="--tc:${t.color};--tg:${t.glow}">
                <div class="etb-kanji">${t.kanji}</div>
                <div class="etb-info">
                  <div class="etb-label">${t.label}</div>
                  <div class="etb-dur">${t.durationLabel}</div>
                  <div class="etb-rewards">${t.rewardDesc}${t.artifactChance ? ` · ${Math.round(t.artifactChance * 100)}% artefact` : ''}</div>
                </div>
              </button>
            `).join('')}
          </div>
          <button class="exp-modal-cancel" id="exp-type-cancel">Annuler</button>
        </div>
      </div>

      <!-- Choix du personnage -->
      <div id="exp-char-picker" class="exp-modal-overlay" style="display:none" aria-modal="true">
        <div id="exp-char-picker-box" class="exp-modal-box">
          <div class="exp-modal-title">CHOISIR UN COMBATTANT</div>
          <div class="exp-modal-sub">Mission : <span id="exp-char-type-label">—</span></div>
          <div id="exp-char-grid">
            ${this._charGridHTML()}
          </div>
          <button class="exp-modal-cancel" id="exp-char-cancel">Annuler</button>
        </div>
      </div>
    `;

    this._bindBack();
    this._bindSlots();
    this._bindTypePicker();
    this._bindCharPicker();
    this._animateEntrance();
  }

  _animateEntrance() {
    gsap.fromTo('#exp-header',
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
    gsap.fromTo('.exp-slot-card',
      { opacity: 0, y: 24, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.35, ease: 'back.out(1.4)', delay: 0.08 }
    );
  }

  /* ════════════════════════════════
     HTML DES SLOTS
  ════════════════════════════════ */

  _slotHTML(slot, idx, now) {
    const label = `MISSION ${idx + 1}`;

    /* Slot vide */
    if (!slot) {
      return `
        <div class="exp-slot-card exp-slot-card--empty" data-slot="${idx}">
          <div class="esc-label">${label}</div>
          <div class="esc-empty-deco">遠</div>
          <div class="esc-empty-text">Aucune mission</div>
          <button class="esc-launch-btn" data-slot="${idx}">
            <span>+</span> ENVOYER
          </button>
        </div>
      `;
    }

    const type      = getExpeditionType(slot.typeId);
    const done      = now >= slot.endTime;
    const remaining = Math.max(0, slot.endTime - now);
    const char      = CHARACTERS.find(c => c.id === slot.charId);
    const charColor = char?.color ?? '#00d4ff';
    const totalMs   = slot.endTime - slot.startTime;
    const pct       = done ? 100 : Math.min(100, Math.round(((totalMs - remaining) / totalMs) * 100));

    if (done) {
      return `
        <div class="exp-slot-card exp-slot-card--ready" data-slot="${idx}"
             style="--tc:${type.color};--tg:${type.glow}">
          <div class="esc-label">${label}</div>
          <div class="esc-type-row" style="color:${type.color}">
            <span class="esc-type-kanji">${type.kanji}</span>
            <span class="esc-type-name">${type.label}</span>
          </div>
          ${char ? `
            <div class="esc-char-block">
              <div class="esc-char-sym" style="color:${charColor}">${char.name[0]}</div>
              <div class="esc-char-name">${char.name}</div>
            </div>
          ` : ''}
          <div class="esc-ready-badge">✓ PRÊTE !</div>
          <div class="esc-progress-track" style="--tc:${type.color}">
            <div class="esc-progress-fill" style="width:100%;background:${type.color}"></div>
          </div>
          <div class="esc-reward-preview">${type.rewardDesc}</div>
          <button class="esc-claim-btn" data-slot="${idx}" style="--tc:${type.color}">
            🎁 RÉCLAMER
          </button>
        </div>
      `;
    }

    /* Slot en cours */
    return `
      <div class="exp-slot-card exp-slot-card--active" data-slot="${idx}"
           style="--tc:${type.color};--tg:${type.glow}">
        <div class="esc-label">${label}</div>
        <div class="esc-type-row" style="color:${type.color}">
          <span class="esc-type-kanji">${type.kanji}</span>
          <span class="esc-type-name">${type.label}</span>
        </div>
        ${char ? `
          <div class="esc-char-block">
            <div class="esc-char-sym" style="color:${charColor}">${char.name[0]}</div>
            <div class="esc-char-name">${char.name}</div>
          </div>
        ` : ''}
        <div class="esc-timer-section">
          <div class="esc-timer-label">RETOUR DANS</div>
          <div class="esc-timer" id="exp-timer-${idx}">${formatRemaining(remaining)}</div>
          <div class="esc-progress-track">
            <div class="esc-progress-fill" id="exp-fill-${idx}"
                 style="width:${pct}%;background:${type.color}"></div>
          </div>
          <div class="esc-duration">${type.durationLabel}</div>
        </div>
        <div class="esc-reward-preview">${type.rewardDesc}</div>
        <button class="esc-cancel-btn" data-slot="${idx}">Annuler</button>
      </div>
    `;
  }

  _charGridHTML() {
    const owned = CHARACTERS.filter(c => this.playerData.has(c.id));
    if (owned.length === 0) {
      return '<div class="exp-char-empty">Aucun combattant dans la collection.</div>';
    }
    return owned.map(c => `
      <button class="exp-char-btn" data-char-id="${c.id}"
              style="--cc:${c.color ?? '#00d4ff'}">
        <div class="ecb-sym">${c.name[0]}</div>
        <div class="ecb-name">${c.name}</div>
        <div class="ecb-rar">${'★'.repeat(c.rarity)}</div>
      </button>
    `).join('');
  }

  /* ════════════════════════════════
     TIMERS (tick chaque seconde)
  ════════════════════════════════ */

  _tickTimers() {
    if (!this.screen || this.screen.style.display === 'none') return;
    const slots = this.playerData.expeditionSlots ?? [null, null, null];
    const now   = Date.now();
    let readyCount = 0;

    slots.forEach((slot, idx) => {
      if (!slot) return;
      const remaining = Math.max(0, slot.endTime - now);
      const done      = remaining === 0;

      const card = this.screen.querySelector(`.exp-slot-card[data-slot="${idx}"]`);
      if (!card) return;

      if (done) {
        readyCount++;
        if (!card.classList.contains('exp-slot-card--ready')) {
          // Passer en état "prête"
          this._reRenderSlot(idx);
          audio.play?.('level_up');
          const type = getExpeditionType(slot.typeId);
          toast.show('✓ Expédition prête !', 'success', {
            sub: `${type.label} terminée — Réclame ta récompense.`,
            duration: 4000,
          });
          this._updateBadge();
        }
      } else {
        // Mettre à jour le timer
        const timerEl = card.querySelector(`#exp-timer-${idx}`);
        if (timerEl) timerEl.textContent = formatRemaining(remaining);

        // Mettre à jour la barre de progression
        const totalMs = slot.endTime - slot.startTime;
        const pct     = Math.min(100, Math.round(((totalMs - remaining) / totalMs) * 100));
        const fillEl  = card.querySelector(`#exp-fill-${idx}`);
        if (fillEl) fillEl.style.width = `${pct}%`;
      }
    });

    // Mettre à jour le compteur "prêtes" dans le header
    const readyEl = document.getElementById('exp-ready-count');
    if (readyEl) {
      readyEl.textContent = String(readyCount);
      readyEl.classList.toggle('esd-val--ready', readyCount > 0);
    }
  }

  /* ════════════════════════════════
     RENDU PARTIEL D'UN SLOT
  ════════════════════════════════ */

  _reRenderSlot(idx) {
    const container = this.screen;
    if (!container) return;
    const slot    = this.playerData.expeditionSlots?.[idx] ?? null;
    const now     = Date.now();
    const oldCard = container.querySelector(`.exp-slot-card[data-slot="${idx}"]`);
    if (!oldCard) return;

    const tmp = document.createElement('div');
    tmp.innerHTML = this._slotHTML(slot, idx, now);
    const newCard = tmp.firstElementChild;
    oldCard.replaceWith(newCard);
    this._bindSlotCard(idx);

    gsap.fromTo(newCard,
      { opacity: 0, scale: 0.93 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.4)' }
    );
  }

  _updateActiveCount() {
    const slots = this.playerData.expeditionSlots ?? [null, null, null];
    const el = document.getElementById('exp-active-count');
    if (el) el.textContent = String(slots.filter(Boolean).length);
  }

  _updateBadge() {
    // Badge dans le nav du hub
    const badge = document.getElementById('hub-expedition-badge');
    if (badge) {
      const ready = this.playerData.hasReadyExpeditions();
      badge.style.display = ready ? 'block' : 'none';
    }
  }

  /* ════════════════════════════════
     PICKERS — TYPE
  ════════════════════════════════ */

  _openTypePicker(slotIdx) {
    this._pickerSlot = slotIdx;
    const overlay = document.getElementById('exp-type-picker');
    const label   = document.getElementById('exp-type-slot-label');
    if (label) label.textContent = `Slot ${slotIdx + 1}`;
    if (overlay) {
      overlay.style.display = 'flex';
      gsap.fromTo('#exp-type-picker-box',
        { opacity: 0, scale: 0.90, y: 16 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.6)' }
      );
    }
  }

  _closeTypePicker(then) {
    gsap.to('#exp-type-picker-box', {
      opacity: 0, scale: 0.93, y: 8, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        const overlay = document.getElementById('exp-type-picker');
        if (overlay) overlay.style.display = 'none';
        then?.();
      },
    });
  }

  /* ════════════════════════════════
     PICKERS — PERSONNAGE
  ════════════════════════════════ */

  _openCharPicker() {
    const overlay = document.getElementById('exp-char-picker');
    const label   = document.getElementById('exp-char-type-label');
    if (label) {
      const type = getExpeditionType(this._pickerType);
      label.textContent = `${type.label} · ${type.durationLabel}`;
    }
    if (overlay) {
      overlay.style.display = 'flex';
      gsap.fromTo('#exp-char-picker-box',
        { opacity: 0, scale: 0.90, y: 16 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.6)' }
      );
    }
  }

  _closeCharPicker(then) {
    gsap.to('#exp-char-picker-box', {
      opacity: 0, scale: 0.93, y: 8, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        const overlay = document.getElementById('exp-char-picker');
        if (overlay) overlay.style.display = 'none';
        then?.();
      },
    });
  }

  /* ════════════════════════════════
     LANCEMENT / RÉCLAMATION / ANNUL.
  ════════════════════════════════ */

  _launch(slotIdx, charId, typeId) {
    if (slotIdx === null || !charId || !typeId) return;
    const ok = this.playerData.startExpedition(slotIdx, charId, typeId);
    if (!ok) return;
    const type = getExpeditionType(typeId);
    const char = CHARACTERS.find(c => c.id === charId);
    toast.show('🚀 Expédition lancée !', 'success', {
      sub: `${char?.name ?? charId} — ${type.label} (${type.durationLabel})`,
      duration: 3500,
    });
    this._reRenderSlot(slotIdx);
    this._updateActiveCount();
    audio.play?.('ui_navigate');
    this._updateBadge();
  }

  _claim(slotIdx) {
    const slot = this.playerData.expeditionSlots?.[slotIdx];
    if (!slot) return;
    const type = getExpeditionType(slot.typeId);

    // Roll artefact si la mission longue le permet
    let artDrops = [];
    if (type.artifactChance > 0 && Math.random() < type.artifactChance) {
      artDrops = rollArtifactDrops('expedition');
      artDrops.forEach(art => this.playerData.addArtifactToInventory(art));
    }

    const result = this.playerData.claimExpedition(slotIdx);
    if (!result) return;

    audio.play?.('level_up');
    const artStr = artDrops.length > 0 ? `  ·  ✦ ${formatArtifactDrops(artDrops)}` : '';
    toast.show(`🎁 ${type.label} — Récompenses réclamées !`, 'reward', {
      sub: type.rewardDesc + artStr,
      duration: 5000,
    });

    this._reRenderSlot(slotIdx);
    this._updateActiveCount();
    this._updateBadge();

    gsap.fromTo(
      this.screen.querySelector(`.exp-slot-card[data-slot="${slotIdx}"]`),
      { scale: 1.06 },
      { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.6)' }
    );
  }

  /* ════════════════════════════════
     BINDINGS
  ════════════════════════════════ */

  _bindBack() {
    document.getElementById('exp-back-btn')?.addEventListener('click', () => {
      audio.play?.('ui_navigate');
      this.hide();
      this.onBack?.();
    });
  }

  _bindSlots() {
    for (let i = 0; i < EXPEDITION_SLOTS; i++) {
      this._bindSlotCard(i);
    }
  }

  _bindSlotCard(idx) {
    const c = this.screen;
    if (!c) return;

    c.querySelector(`.esc-launch-btn[data-slot="${idx}"]`)
      ?.addEventListener('click', () => {
        audio.play?.('ui_navigate');
        this._openTypePicker(idx);
      });

    c.querySelector(`.esc-claim-btn[data-slot="${idx}"]`)
      ?.addEventListener('click', () => this._claim(idx));

    c.querySelector(`.esc-cancel-btn[data-slot="${idx}"]`)
      ?.addEventListener('click', () => {
        this.playerData.cancelExpedition(idx);
        this._reRenderSlot(idx);
        this._updateActiveCount();
        this._updateBadge();
        toast.show('Expédition annulée', 'warning', { duration: 2000 });
      });
  }

  _bindTypePicker() {
    document.getElementById('exp-type-cancel')
      ?.addEventListener('click', () => this._closeTypePicker());

    this.screen.querySelectorAll('.exp-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._pickerType = btn.dataset.type;
        this._closeTypePicker(() => this._openCharPicker());
      });
    });
  }

  _bindCharPicker() {
    document.getElementById('exp-char-cancel')
      ?.addEventListener('click', () => this._closeCharPicker());

    this.screen.querySelectorAll('.exp-char-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const charId = btn.dataset.charId;
        this._closeCharPicker(() => this._launch(this._pickerSlot, charId, this._pickerType));
      });
    });
  }
}
