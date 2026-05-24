/**
 * ArtifactInventoryUI.js
 * Inventaire d'artefacts complet.
 * Filtres (rareté / slot), tri, badge "équipé sur X",
 * panneau de détail et comparaison rapide avant équipement.
 */

import { gsap } from 'gsap';
import { audio } from '../audio/AudioManager.js';
import { toast } from './ToastUI.js';
import {
  ARTIFACT_SETS, ARTIFACT_SLOTS, SLOT_META, STAT_LABELS,
  formatStatValue, getEnhancedSubValue,
} from '../data/artifacts.js';
import { CHARACTERS } from '../data/characters.js';

const SORT_OPTIONS = [
  { value: 'rarity_desc', label: 'Rareté ↓' },
  { value: 'rarity_asc',  label: 'Rareté ↑' },
  { value: 'set',         label: 'Set' },
  { value: 'slot',        label: 'Slot' },
];

export class ArtifactInventoryUI {
  constructor(playerData, onBack) {
    this.playerData = playerData;
    this.onBack     = onBack;
    this.screen     = document.getElementById('artifact-inventory-screen');

    this._filter = { rarity: null, slot: null };
    this._sort   = 'rarity_desc';
    this._selectedArtId  = null;
    this._compareCharId  = null;
  }

  /* ════════════════════════════════
     SHOW / HIDE
  ════════════════════════════════ */

  show() {
    this._selectedArtId = null;
    this._compareCharId = null;
    this._render();
    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 20 });
    gsap.to(this.screen,  { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' });
    audio.play?.('ui_navigate');
  }

  hide() {
    gsap.to(this.screen, {
      opacity: 0, y: 12, duration: 0.25, ease: 'power2.in',
      onComplete: () => { if (this.screen) this.screen.style.display = 'none'; },
    });
  }

  /* ════════════════════════════════
     DONNÉES
  ════════════════════════════════ */

  /** Map artId → charId pour les badges "équipé". */
  _equipMap() {
    const map = {};
    for (const [charId, slots] of Object.entries(this.playerData.characterEquipment ?? {})) {
      for (const artId of Object.values(slots)) {
        if (artId) map[artId] = charId;
      }
    }
    return map;
  }

  /** Inventaire filtré et trié. */
  _filteredSorted() {
    const { rarity, slot } = this._filter;
    let arts = [...(this.playerData.artifactInventory ?? [])];

    if (rarity !== null) arts = arts.filter(a => (a.rarity ?? 1) === rarity);
    if (slot   !== null) arts = arts.filter(a => a.slot === slot);

    switch (this._sort) {
      case 'rarity_desc': arts.sort((a, b) => (b.rarity ?? 1) - (a.rarity ?? 1)); break;
      case 'rarity_asc':  arts.sort((a, b) => (a.rarity ?? 1) - (b.rarity ?? 1)); break;
      case 'set':         arts.sort((a, b) => (a.setId ?? '').localeCompare(b.setId ?? '')); break;
      case 'slot':        arts.sort((a, b) => ARTIFACT_SLOTS.indexOf(a.slot) - ARTIFACT_SLOTS.indexOf(b.slot)); break;
    }
    return arts;
  }

  /* ════════════════════════════════
     RENDU PRINCIPAL
  ════════════════════════════════ */

  _render() {
    if (!this.screen) return;

    const inv      = this._filteredSorted();
    const total    = (this.playerData.artifactInventory ?? []).length;
    const equipMap = this._equipMap();

    this.screen.innerHTML = `
      <div id="ainv-bg"></div>

      <header id="ainv-header">
        <button id="ainv-back-btn" class="col-back-btn">
          <span class="col-back-arrow">←</span> HUB
        </button>
        <div id="ainv-title-block">
          <span class="ainv-kanji-deco">蔵</span>
          <h2>ARTEFACTS</h2>
          <span class="ainv-total-badge">${total}</span>
        </div>
        <div id="ainv-summary">
          <span>${inv.length} affiché${inv.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <!-- Barre de filtres -->
      <div id="ainv-filters">

        <div class="ainv-fgroup">
          <span class="ainv-fgroup-label">Rareté</span>
          <button class="ainv-fbtn ${this._filter.rarity === null ? 'ainv-fbtn--on' : ''}"
                  data-frarity="all">Tous</button>
          ${[1,2,3,4,5].map(r => `
            <button class="ainv-fbtn ainv-fbtn--rarity ${this._filter.rarity === r ? 'ainv-fbtn--on' : ''}"
                    data-frarity="${r}" style="--rc:${_rarityColor(r)}">
              ${'★'.repeat(r)}
            </button>
          `).join('')}
        </div>

        <div class="ainv-fgroup">
          <span class="ainv-fgroup-label">Slot</span>
          <button class="ainv-fbtn ${this._filter.slot === null ? 'ainv-fbtn--on' : ''}"
                  data-fslot="all">Tous</button>
          ${ARTIFACT_SLOTS.map(s => `
            <button class="ainv-fbtn ${this._filter.slot === s ? 'ainv-fbtn--on' : ''}"
                    data-fslot="${s}" title="${SLOT_META[s]?.label ?? s}">
              ${SLOT_META[s]?.icon ?? s}
            </button>
          `).join('')}
        </div>

        <div class="ainv-fgroup ainv-fgroup--right">
          <span class="ainv-fgroup-label">Tri</span>
          ${SORT_OPTIONS.map(o => `
            <button class="ainv-fbtn ${this._sort === o.value ? 'ainv-fbtn--on' : ''}"
                    data-sort="${o.value}">${o.label}</button>
          `).join('')}
        </div>

      </div>

      <!-- Corps : grille + détail -->
      <div id="ainv-body">

        <div id="ainv-grid-wrap">
          <div id="ainv-grid">
            ${inv.length === 0
              ? '<div class="ainv-empty">Aucun artefact ne correspond aux filtres.</div>'
              : inv.map(art => this._artCard(art, equipMap)).join('')
            }
          </div>
        </div>

        <div id="ainv-detail">
          ${this._selectedArtId
            ? this._renderDetail(this._selectedArtId, equipMap)
            : `<div class="ainv-detail-hint">
                 <span class="adh-kanji">選</span>
                 <p>Clique sur un artefact pour voir ses détails, le comparer et l'équiper.</p>
               </div>`
          }
        </div>

      </div>
    `;

    this._bindAll();
    this._animateIn();
  }

  /* ════════════════════════════════
     CARTE ARTEFACT (grille)
  ════════════════════════════════ */

  _artCard(art, equipMap) {
    const set      = ARTIFACT_SETS[art.setId];
    const slotMeta = SLOT_META[art.slot];
    const color    = _rarityColor(art.rarity);
    const ownerCharId = equipMap[art.id];
    const ownerName   = ownerCharId
      ? (CHARACTERS.find(c => c.id === ownerCharId)?.name ?? ownerCharId)
      : null;
    const totalEnh = (art.enhancements ?? []).reduce((s, v) => s + v, 0);
    const isSelected = art.id === this._selectedArtId;

    return `
      <div class="ainv-card ${isSelected ? 'ainv-card--sel' : ''} ${ownerName ? 'ainv-card--eq' : ''}"
           data-art-id="${art.id}" style="--sc:${set?.color ?? '#888'}">
        <div class="ainvc-top">
          <span class="ainvc-icon">${set?.icon ?? '?'}</span>
          <span class="ainvc-slot">${slotMeta?.icon ?? '?'}</span>
          <span class="ainvc-stars" style="color:${color}">${'★'.repeat(art.rarity ?? 1)}</span>
        </div>
        <div class="ainvc-main-stat">
          ${STAT_LABELS[art.mainStat?.stat] ?? ''}
          <strong>${formatStatValue(art.mainStat?.stat, art.mainStat?.value)}</strong>
        </div>
        <div class="ainvc-set-name">${set?.name ?? art.setId}</div>
        ${totalEnh > 0 ? `<div class="ainvc-enh">+${totalEnh}</div>` : ''}
        ${ownerName ? `<div class="ainvc-eq-badge">⚔ ${ownerName}</div>` : ''}
      </div>
    `;
  }

  /* ════════════════════════════════
     PANNEAU DÉTAIL (droite)
  ════════════════════════════════ */

  _renderDetail(artId, equipMap) {
    const art = (this.playerData.artifactInventory ?? []).find(a => a.id === artId);
    if (!art) return '';

    const set    = ARTIFACT_SETS[art.setId];
    const slotMt = SLOT_META[art.slot];
    const color  = _rarityColor(art.rarity);
    const ownerCharId = equipMap[artId];
    const ownerName   = ownerCharId
      ? (CHARACTERS.find(c => c.id === ownerCharId)?.name ?? ownerCharId)
      : null;

    const ownedChars = CHARACTERS.filter(c => this.playerData.hasCharacter(c.id));

    // Artefact actuellement en place sur ce slot pour le perso comparé
    let compareArt = null;
    if (this._compareCharId) {
      const slotIdx  = ARTIFACT_SLOTS.indexOf(art.slot);
      const equipped = this.playerData.getEquippedArtifacts(this._compareCharId);
      compareArt     = equipped[slotIdx] ?? null;
    }

    const isEquippedOnCompare = this._compareCharId && ownerCharId === this._compareCharId;

    return `
      <div id="ainv-det-inner">

        <!-- En-tête artefact -->
        <div class="ainv-det-hd" style="--sc:${set?.color ?? '#888'}">
          <span class="adh-set-icon">${set?.icon ?? '?'}</span>
          <div class="adh-info">
            <div class="adh-set-name">${set?.name ?? art.setId}</div>
            <div class="adh-slot">${slotMt?.label ?? art.slot}</div>
            <div class="adh-stars" style="color:${color}">${'★'.repeat(art.rarity ?? 1)}</div>
          </div>
          ${ownerName ? `<div class="adh-owner">⚔ ${ownerName}</div>` : ''}
        </div>

        <!-- Stat principale -->
        <div class="ainv-det-block">
          <div class="adb-label">STAT PRINCIPALE</div>
          <div class="adb-main-row">
            <span>${STAT_LABELS[art.mainStat?.stat] ?? art.mainStat?.stat}</span>
            <span class="adb-main-val">${formatStatValue(art.mainStat?.stat, art.mainStat?.value)}</span>
          </div>
        </div>

        <!-- Sous-stats -->
        <div class="ainv-det-block">
          <div class="adb-label">SOUS-STATS</div>
          ${(art.subStats ?? []).map((sub, i) => {
            const lvl    = art.enhancements?.[i] ?? 0;
            const effVal = getEnhancedSubValue(sub, lvl);
            return `
              <div class="adb-sub-row">
                <span>${STAT_LABELS[sub.stat] ?? sub.stat}</span>
                <span class="adb-sub-val">${formatStatValue(sub.stat, effVal)}</span>
                ${lvl > 0 ? `<span class="adb-sub-enh">+${lvl}</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Sélecteur de personnage -->
        <div class="ainv-det-block">
          <div class="adb-label">ÉQUIPER / COMPARER SUR</div>
          <div class="adb-char-row">
            ${ownedChars.map(c => {
              const isOwner   = ownerCharId === c.id;
              const isCompare = this._compareCharId === c.id;
              return `
                <button class="adb-char-btn ${isCompare ? 'adb-char-btn--sel' : ''} ${isOwner ? 'adb-char-btn--owner' : ''}"
                        data-compare-char="${c.id}" title="${c.name}">
                  <span class="adb-char-icon">${c.icon ?? c.name[0]}</span>
                  <span class="adb-char-name">${c.name.split(' ')[0]}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Comparaison -->
        ${this._compareCharId ? this._renderComparison(art, compareArt) : ''}

        <!-- Bouton action -->
        ${this._compareCharId ? `
          <div class="ainv-det-action">
            ${isEquippedOnCompare
              ? `<button class="ainv-action-btn ainv-action-btn--unequip" data-action="unequip">
                   ✕ Déséquiper de ${CHARACTERS.find(c => c.id === this._compareCharId)?.name ?? ''}
                 </button>`
              : `<button class="ainv-action-btn" data-action="equip">
                   ⚔ Équiper sur ${CHARACTERS.find(c => c.id === this._compareCharId)?.name ?? ''}
                 </button>`
            }
          </div>
        ` : ''}

      </div>
    `;
  }

  /* ════════════════════════════════
     BLOC COMPARAISON
  ════════════════════════════════ */

  _renderComparison(art, compareArt) {
    if (!compareArt || compareArt.id === art.id) {
      return `
        <div class="ainv-det-block ainv-comp-block">
          <div class="adb-label">COMPARAISON</div>
          <div class="ainv-comp-empty">
            ${!compareArt ? 'Slot vide — cet artefact peut être équipé directement.' : 'Cet artefact est déjà équipé ici.'}
          </div>
        </div>
      `;
    }

    const cSet   = ARTIFACT_SETS[compareArt.setId];
    const sameMainStat = art.mainStat?.stat === compareArt.mainStat?.stat;
    const diff         = sameMainStat ? (art.mainStat?.value ?? 0) - (compareArt.mainStat?.value ?? 0) : null;

    return `
      <div class="ainv-det-block ainv-comp-block">
        <div class="adb-label">VS ACTUELLEMENT ÉQUIPÉ</div>
        <div class="ainv-comp-card" style="--sc:${cSet?.color ?? '#888'}">
          <span class="acc-icon">${cSet?.icon ?? '?'}</span>
          <div class="acc-info">
            <span>${cSet?.name ?? compareArt.setId}</span>
            <span style="color:${_rarityColor(compareArt.rarity)}">${'★'.repeat(compareArt.rarity ?? 1)}</span>
          </div>
          <div class="acc-main">
            <span class="acc-main-stat">${STAT_LABELS[compareArt.mainStat?.stat] ?? ''}</span>
            <span class="acc-main-val">${formatStatValue(compareArt.mainStat?.stat, compareArt.mainStat?.value)}</span>
          </div>
        </div>
        ${diff !== null ? `
          <div class="ainv-comp-delta ${diff > 0 ? 'acd--pos' : diff < 0 ? 'acd--neg' : 'acd--neu'}">
            <span class="acd-label">Écart stat principale</span>
            <span class="acd-val">${diff >= 0 ? '+' : ''}${formatStatValue(art.mainStat?.stat, diff)}</span>
          </div>
        ` : `
          <div class="ainv-comp-delta acd--neu">
            <span class="acd-label">Stats principales différentes</span>
          </div>
        `}
      </div>
    `;
  }

  /* ════════════════════════════════
     BINDINGS
  ════════════════════════════════ */

  _bindAll() {
    // Retour
    document.getElementById('ainv-back-btn')?.addEventListener('click', () => {
      audio.play?.('ui_navigate');
      this.hide();
      this.onBack?.();
    });

    // Filtres rareté
    this.screen.querySelectorAll('[data-frarity]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.frarity;
        this._filter.rarity = v === 'all' ? null : parseInt(v, 10);
        this._selectedArtId = null;
        this._compareCharId = null;
        this._render();
      });
    });

    // Filtres slot
    this.screen.querySelectorAll('[data-fslot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.fslot;
        this._filter.slot = v === 'all' ? null : v;
        this._selectedArtId = null;
        this._compareCharId = null;
        this._render();
      });
    });

    // Tri
    this.screen.querySelectorAll('[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._sort = btn.dataset.sort;
        this._render();
      });
    });

    // Sélection artefact
    this.screen.querySelectorAll('.ainv-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.artId;
        this._selectedArtId = id === this._selectedArtId ? null : id;
        this._compareCharId = null;
        this._refreshDetail();
      });
    });

    this._bindDetailButtons();
  }

  _bindDetailButtons() {
    // Sélecteur de perso pour comparaison
    this.screen.querySelectorAll('[data-compare-char]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.dataset.compareChar;
        this._compareCharId = cid === this._compareCharId ? null : cid;
        this._refreshDetail();
      });
    });

    // Équiper
    this.screen.querySelector('[data-action="equip"]')?.addEventListener('click', () => {
      if (!this._selectedArtId || !this._compareCharId) return;
      const art = (this.playerData.artifactInventory ?? []).find(a => a.id === this._selectedArtId);
      if (!art) return;
      this.playerData.equipArtifact(this._compareCharId, art.slot, this._selectedArtId);
      audio.play?.('level_up');
      const name = CHARACTERS.find(c => c.id === this._compareCharId)?.name ?? this._compareCharId;
      toast.show(`⚔ Équipé sur ${name}`, 'success', { duration: 2500 });
      this._render();
    });

    // Déséquiper
    this.screen.querySelector('[data-action="unequip"]')?.addEventListener('click', () => {
      if (!this._selectedArtId || !this._compareCharId) return;
      const art = (this.playerData.artifactInventory ?? []).find(a => a.id === this._selectedArtId);
      if (!art) return;
      this.playerData.unequipArtifact(this._compareCharId, art.slot);
      audio.play?.('ui_navigate');
      toast.show('Artefact déséquipé', 'success', { duration: 2000 });
      this._render();
    });
  }

  /** Rafraîchit seulement le panneau détail (sans re-render la grille). */
  _refreshDetail() {
    const panel = document.getElementById('ainv-detail');
    if (!panel) return;

    const equipMap = this._equipMap();

    if (this._selectedArtId) {
      panel.innerHTML = this._renderDetail(this._selectedArtId, equipMap);
      gsap.fromTo('#ainv-det-inner',
        { opacity: 0, x: 12 },
        { opacity: 1, x: 0, duration: 0.22, ease: 'power2.out' }
      );
    } else {
      panel.innerHTML = `<div class="ainv-detail-hint">
        <span class="adh-kanji">選</span>
        <p>Clique sur un artefact pour voir ses détails, le comparer et l'équiper.</p>
      </div>`;
    }

    // Rebind les boutons du panneau
    this._bindDetailButtons();

    // Mettre à jour l'état sélectionné dans la grille sans re-render
    this.screen.querySelectorAll('.ainv-card').forEach(card => {
      card.classList.toggle('ainv-card--sel', card.dataset.artId === this._selectedArtId);
    });
  }

  /* ════════════════════════════════
     ANIMATION
  ════════════════════════════════ */

  _animateIn() {
    gsap.fromTo('#ainv-header, #ainv-filters',
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, stagger: 0.05, duration: 0.28, ease: 'power2.out', delay: 0.05 }
    );
    gsap.fromTo('.ainv-card',
      { opacity: 0, scale: 0.88 },
      { opacity: 1, scale: 1, stagger: 0.018, duration: 0.2, ease: 'power2.out', delay: 0.12 }
    );
  }
}

function _rarityColor(rarity) {
  return { 1: '#aaaaaa', 2: '#44ff88', 3: '#44aaff', 4: '#cc44ff', 5: '#ffcc00' }[rarity] ?? '#aaaaaa';
}
