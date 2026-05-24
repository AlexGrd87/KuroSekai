/**
 * ForgeUI.js — Forge & Économie d'Artefacts de KuroSekai.
 * Trois onglets : Démantèlement · Fusion · Renforcement
 */

import { gsap } from 'gsap';
import { audio } from '../audio/AudioManager.js';
import { toast } from './ToastUI.js';
import {
  ARTIFACT_SETS, ARTIFACT_SLOTS, SLOT_META, STAT_LABELS,
  DISMANTLE_REWARDS, FUSION_COSTS, ENHANCE_COSTS,
  FORGE_MATERIALS, formatStatValue, formatDismantleRewards,
  generateArtifact, getEnhancedSubValue, ENHANCE_BOOST_PER_LEVEL,
} from '../data/artifacts.js';

const TABS = ['dismantle', 'fusion', 'enhance'];
const TAB_LABELS = { dismantle: 'DÉMANTÈLEMENT', fusion: 'FUSION', enhance: 'RENFORCEMENT' };
const TAB_KANJI  = { dismantle: '解', fusion: '鍛', enhance: '強' };

export class ForgeUI {
  constructor(playerData, onBack) {
    this.playerData = playerData;
    this.onBack     = onBack;
    this.screen     = document.getElementById('forge-screen');

    this._activeTab      = 'dismantle';
    this._selectedIds    = new Set();       // pour le démantèlement
    this._fuseSetId      = null;            // set sélectionné pour fusion
    this._enhArtId       = null;            // artefact sélectionné pour renforcement
    this._confirmPending = false;
  }

  /* ════════════════════════════════
     SHOW / HIDE
  ════════════════════════════════ */

  show() {
    this._selectedIds.clear();
    this._fuseSetId  = null;
    this._enhArtId   = null;
    this._render();
    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 20 });
    gsap.to(this.screen, { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' });
    audio.play?.('ui_navigate');
  }

  hide() {
    gsap.to(this.screen, {
      opacity: 0, y: 12, duration: 0.25, ease: 'power2.in',
      onComplete: () => { if (this.screen) this.screen.style.display = 'none'; },
    });
  }

  /* ════════════════════════════════
     RENDU GLOBAL
  ════════════════════════════════ */

  _render() {
    if (!this.screen) return;
    const mats = this.playerData.getForgeMaterials();

    this.screen.innerHTML = `
      <div id="forge-bg"></div>

      <!-- Header -->
      <header id="forge-header">
        <button id="forge-back-btn" class="col-back-btn">
          <span class="col-back-arrow">←</span> HUB
        </button>
        <div id="forge-title-block">
          <span class="forge-kanji-deco">鍛</span>
          <h2>FORGE</h2>
        </div>
        <!-- Balance matériaux -->
        <div id="forge-mats-balance">
          ${Object.entries(FORGE_MATERIALS).map(([k, m]) => `
            <div class="fmb-mat" title="${m.label}">
              <span class="fmb-icon">${m.icon}</span>
              <span class="fmb-val" id="fmb-${k}">${mats[k] ?? 0}</span>
            </div>
          `).join('')}
        </div>
      </header>

      <!-- Onglets -->
      <div id="forge-tabs">
        ${TABS.map(t => `
          <button class="forge-tab ${t === this._activeTab ? 'forge-tab--active' : ''}" data-tab="${t}">
            <span class="ft-kanji">${TAB_KANJI[t]}</span>
            <span class="ft-label">${TAB_LABELS[t]}</span>
          </button>
        `).join('')}
      </div>

      <!-- Contenu des onglets -->
      <div id="forge-content">
        <div id="forge-panel-dismantle"  class="forge-panel ${this._activeTab === 'dismantle' ? 'forge-panel--active' : ''}"></div>
        <div id="forge-panel-fusion"     class="forge-panel ${this._activeTab === 'fusion'    ? 'forge-panel--active' : ''}"></div>
        <div id="forge-panel-enhance"    class="forge-panel ${this._activeTab === 'enhance'   ? 'forge-panel--active' : ''}"></div>
      </div>
    `;

    this._bindBack();
    this._bindTabs();
    this._renderActivePanel();

    gsap.fromTo('#forge-header, #forge-tabs',
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.3, ease: 'power2.out', delay: 0.05 }
    );
  }

  _bindTabs() {
    this.screen.querySelectorAll('.forge-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab === this._activeTab) return;
        this._activeTab = tab;
        this.screen.querySelectorAll('.forge-tab').forEach(b =>
          b.classList.toggle('forge-tab--active', b.dataset.tab === tab)
        );
        this.screen.querySelectorAll('.forge-panel').forEach(p =>
          p.classList.toggle('forge-panel--active', p.id === `forge-panel-${tab}`)
        );
        audio.play?.('ui_navigate');
        this._renderActivePanel();
      });
    });
  }

  _renderActivePanel() {
    if (this._activeTab === 'dismantle') this._renderDismantle();
    if (this._activeTab === 'fusion')    this._renderFusion();
    if (this._activeTab === 'enhance')   this._renderEnhance();
  }

  _updateMatsDisplay() {
    const mats = this.playerData.getForgeMaterials();
    Object.keys(FORGE_MATERIALS).forEach(k => {
      const el = document.getElementById(`fmb-${k}`);
      if (el) el.textContent = mats[k] ?? 0;
    });
  }

  _bindBack() {
    const btn = document.getElementById('forge-back-btn');
    if (btn) btn.addEventListener('click', () => {
      audio.play?.('ui_navigate');
      this.hide();
      this.onBack?.();
    });
  }

  /* ════════════════════════════════════════
     ONGLET 1 : DÉMANTÈLEMENT
  ════════════════════════════════════════ */

  _renderDismantle() {
    const panel = document.getElementById('forge-panel-dismantle');
    if (!panel) return;

    const inv     = (this.playerData.artifactInventory ?? [])
      .filter(a => !this.playerData.isArtifactEquipped(a.id));
    const selected = [...this._selectedIds];

    // Total des matériaux pour la sélection
    const totals = { forge_fragment: 0, crystal_essence: 0, primal_shard: 0 };
    selected.forEach(id => {
      const art = inv.find(a => a.id === id);
      if (!art) return;
      const r = DISMANTLE_REWARDS[art.rarity ?? 1] ?? {};
      Object.entries(r).forEach(([k, v]) => { totals[k] = (totals[k] ?? 0) + v; });
    });
    const hasSelection = selected.length > 0;

    panel.innerHTML = `
      <div class="forge-split">
        <!-- Gauche : liste d'artefacts -->
        <div class="forge-split-left">
          <div class="fsl-header">
            <span class="fsl-title">INVENTAIRE (${inv.length} artefact${inv.length !== 1 ? 's' : ''})</span>
            <div class="fsl-filters">
              <button class="fsl-filter-btn" data-filter="all">Tous</button>
              ${[1,2,3,4].map(r => `<button class="fsl-filter-btn" data-filter="${r}">★${r}</button>`).join('')}
              <button class="fsl-filter-btn fsl-filter-select-all">Sélect. ★1</button>
            </div>
          </div>
          <div class="fsl-art-grid" id="dismantle-grid">
            ${inv.length === 0
              ? '<div class="forge-empty">Aucun artefact disponible à démanteler.</div>'
              : inv.map(art => this._artChip(art, this._selectedIds.has(art.id))).join('')}
          </div>
        </div>
        <!-- Droite : aperçu + confirm -->
        <div class="forge-split-right">
          <div class="fsr-title">APERÇU</div>
          ${hasSelection ? `
            <div class="fsr-selected-count">${selected.length} artefact${selected.length > 1 ? 's' : ''} sélectionné${selected.length > 1 ? 's' : ''}</div>
            <div class="fsr-materials-preview">
              ${Object.entries(totals)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => `
                  <div class="fsr-mat-row">
                    <span class="fsr-mat-icon">${FORGE_MATERIALS[k].icon}</span>
                    <span class="fsr-mat-label">${FORGE_MATERIALS[k].label}</span>
                    <span class="fsr-mat-val">+${v}</span>
                  </div>
                `).join('')}
            </div>
            <button id="dismantle-confirm-btn" class="forge-action-btn forge-action-btn--danger">
              ⚡ DÉMANTELER (${selected.length})
            </button>
          ` : `
            <div class="fsr-empty-hint">
              Clique sur des artefacts pour les sélectionner.<br>
              Les artefacts équipés ne peuvent pas être démantelés.
            </div>
          `}
          <!-- Tableau des récompenses par rareté -->
          <div class="fsr-table-title">RÉCOMPENSES PAR RARETÉ</div>
          ${[1,2,3,4].map(r => `
            <div class="fsr-table-row">
              <span class="fsr-table-star">${'★'.repeat(r)}</span>
              <span class="fsr-table-rewards">${formatDismantleRewards(r)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Bind events
    panel.querySelectorAll('.forge-art-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.artId;
        if (this._selectedIds.has(id)) this._selectedIds.delete(id);
        else this._selectedIds.add(id);
        this._renderDismantle();
      });
    });

    panel.querySelector('.fsl-filter-select-all')?.addEventListener('click', () => {
      const r1Arts = inv.filter(a => (a.rarity ?? 1) === 1);
      r1Arts.forEach(a => this._selectedIds.add(a.id));
      this._renderDismantle();
    });

    panel.querySelectorAll('.fsl-filter-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter;
        if (f === 'all') {
          document.getElementById('dismantle-grid')?.querySelectorAll('.forge-art-chip').forEach(c => {
            c.style.display = '';
          });
        } else {
          document.getElementById('dismantle-grid')?.querySelectorAll('.forge-art-chip').forEach(c => {
            c.style.display = c.dataset.rarity === f ? '' : 'none';
          });
        }
      });
    });

    document.getElementById('dismantle-confirm-btn')?.addEventListener('click', () => {
      this._doDismantleSelected([...this._selectedIds]);
    });

    gsap.fromTo('.forge-art-chip',
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, stagger: 0.02, duration: 0.2, ease: 'power2.out' }
    );
  }

  _artChip(art, selected = false) {
    const set   = ARTIFACT_SETS[art.setId];
    const slot  = SLOT_META[art.slot];
    const stars = '★'.repeat(art.rarity ?? 1);
    const mainLbl = STAT_LABELS[art.mainStat?.stat] ?? art.mainStat?.stat ?? '';
    const mainVal = formatStatValue(art.mainStat?.stat, art.mainStat?.value);
    const totalEnh = (art.enhancements ?? []).reduce((s, v) => s + v, 0);
    return `
      <div class="forge-art-chip ${selected ? 'forge-art-chip--selected' : ''}"
           data-art-id="${art.id}" data-rarity="${art.rarity ?? 1}"
           style="--sc:${set?.color ?? '#888'}">
        <div class="fac-top">
          <span class="fac-set-icon">${set?.icon ?? '?'}</span>
          <span class="fac-slot-icon">${slot?.icon ?? '?'}</span>
          <span class="fac-stars" style="color:${_rarityColor(art.rarity)}">${stars}</span>
        </div>
        <div class="fac-main">${mainLbl} ${mainVal}</div>
        <div class="fac-sub">${art.setId ? (set?.name ?? art.setId) : '?'}</div>
        ${totalEnh > 0 ? `<div class="fac-enh">+${totalEnh}</div>` : ''}
        ${selected ? '<div class="fac-check">✓</div>' : ''}
      </div>
    `;
  }

  _doDismantleSelected(ids) {
    if (ids.length === 0) return;
    const totals = { forge_fragment: 0, crystal_essence: 0, primal_shard: 0 };
    let count = 0;
    ids.forEach(id => {
      const art = (this.playerData.artifactInventory ?? []).find(a => a.id === id);
      if (!art || this.playerData.isArtifactEquipped(id)) return;
      const r = DISMANTLE_REWARDS[art.rarity ?? 1] ?? {};
      Object.entries(r).forEach(([k, v]) => { totals[k] = (totals[k] ?? 0) + v; });
      this.playerData.removeArtifact(id);
      count++;
    });
    this.playerData.addForgeMaterials(totals);
    this._selectedIds.clear();

    const parts = Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `+${v} ${FORGE_MATERIALS[k].icon}`)
      .join(' · ');
    toast.show(`${count} artefact${count > 1 ? 's' : ''} démantelé${count > 1 ? 's' : ''}`, 'success', { sub: parts, duration: 3500 });
    audio.play?.('level_up');

    this._updateMatsDisplay();
    this._renderDismantle();
  }

  /* ════════════════════════════════════════
     ONGLET 2 : FUSION
  ════════════════════════════════════════ */

  _renderFusion() {
    const panel = document.getElementById('forge-panel-fusion');
    if (!panel) return;

    // Compte les artefacts non-équipés par set
    const inv      = (this.playerData.artifactInventory ?? []).filter(a => !this.playerData.isArtifactEquipped(a.id));
    const setCounts = {};
    const setArts   = {};
    for (const art of inv) {
      setCounts[art.setId] = (setCounts[art.setId] ?? 0) + 1;
      if (!setArts[art.setId]) setArts[art.setId] = [];
      setArts[art.setId].push(art);
    }

    const fuseSet    = this._fuseSetId ? ARTIFACT_SETS[this._fuseSetId] : null;
    const fuseArts   = fuseSet ? setArts[this._fuseSetId] ?? [] : [];
    const canFuse    = fuseArts.length >= 3;
    const sorted3    = fuseArts.slice().sort((a, b) => (a.rarity ?? 1) - (b.rarity ?? 1)).slice(0, 3);
    const targetRar  = canFuse ? Math.min(5, Math.max(...sorted3.map(a => a.rarity ?? 1)) + 1) : 2;
    const fuseCost   = FUSION_COSTS[targetRar] ?? {};
    const canAfford  = this.playerData.canAffordForge(fuseCost);
    const mats       = this.playerData.getForgeMaterials();

    panel.innerHTML = `
      <div class="forge-split">
        <!-- Gauche : sets disponibles -->
        <div class="forge-split-left">
          <div class="fsl-title">ENSEMBLES DISPONIBLES</div>
          <div id="fusion-set-list">
            ${Object.entries(ARTIFACT_SETS).map(([sid, set]) => {
              const cnt   = setCounts[sid] ?? 0;
              const ok    = cnt >= 3;
              const active = sid === this._fuseSetId;
              return `
                <div class="fusion-set-card ${active ? 'fusion-set-card--active' : ''} ${!ok ? 'fusion-set-card--dim' : ''}"
                     data-set-id="${sid}" style="--fsc:${set.color}">
                  <span class="fsc-icon">${set.icon}</span>
                  <div class="fsc-info">
                    <div class="fsc-name">${set.name}</div>
                    <div class="fsc-count">${cnt} artefact${cnt !== 1 ? 's' : ''}</div>
                  </div>
                  ${ok ? '<span class="fsc-ready">✓</span>' : `<span class="fsc-need">${3 - cnt} manquant${3 - cnt > 1 ? 's' : ''}</span>`}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <!-- Droite : aperçu fusion -->
        <div class="forge-split-right">
          <div class="fsr-title">RECETTE DE FUSION</div>
          ${fuseSet ? `
            <div id="fusion-preview">
              <!-- Artefacts consommés -->
              <div class="fp-input-label">ARTEFACTS CONSOMMÉS (3× ${fuseSet.name})</div>
              <div class="fp-inputs">
                ${sorted3.map(art => `
                  <div class="fp-input-art" style="--sc:${fuseSet.color}">
                    <span class="fp-art-icon">${fuseSet.icon}</span>
                    <span class="fp-art-slot">${SLOT_META[art.slot]?.icon ?? '?'}</span>
                    <span class="fp-art-stars" style="color:${_rarityColor(art.rarity)}">${'★'.repeat(art.rarity ?? 1)}</span>
                  </div>
                `).join('')}
                ${canFuse ? '' : '<div class="fp-missing">Pas assez d\'artefacts</div>'}
              </div>
              <!-- Flèche et résultat -->
              <div class="fp-arrow">▼</div>
              <div class="fp-result-label">RÉSULTAT</div>
              <div class="fp-result" style="--sc:${fuseSet.color}">
                <span class="fp-result-icon">${fuseSet.icon}</span>
                <div class="fp-result-info">
                  <div class="fp-result-set">${fuseSet.name}</div>
                  <div class="fp-result-rarity" style="color:${_rarityColor(targetRar)}">${'★'.repeat(targetRar)} (rareté ${targetRar})</div>
                  <div class="fp-result-slot">Emplacement aléatoire</div>
                </div>
              </div>
              <!-- Coût matériaux -->
              <div class="fp-cost-label">COÛT SUPPLÉMENTAIRE</div>
              <div class="fp-costs">
                ${Object.entries(fuseCost).length === 0
                  ? '<span class="fp-no-cost">Aucun coût</span>'
                  : Object.entries(fuseCost).map(([k, v]) => `
                    <div class="fp-cost-row ${(mats[k] ?? 0) < v ? 'fp-cost-row--miss' : ''}">
                      <span>${FORGE_MATERIALS[k].icon}</span>
                      <span>${FORGE_MATERIALS[k].label}</span>
                      <span>${mats[k] ?? 0} / ${v}</span>
                    </div>
                  `).join('')}
              </div>
              <button id="fusion-confirm-btn"
                class="forge-action-btn ${canFuse && canAfford ? '' : 'forge-action-btn--disabled'}"
                ${canFuse && canAfford ? '' : 'disabled'}>
                ✦ FUSIONNER
              </button>
            </div>
          ` : `
            <div class="fsr-empty-hint">
              Sélectionne un ensemble à gauche pour voir la recette de fusion.<br>
              Il te faut au moins 3 artefacts du même ensemble.
            </div>
          `}
        </div>
      </div>
    `;

    panel.querySelectorAll('.fusion-set-card').forEach(card => {
      card.addEventListener('click', () => {
        this._fuseSetId = card.dataset.setId === this._fuseSetId ? null : card.dataset.setId;
        this._renderFusion();
      });
    });

    document.getElementById('fusion-confirm-btn')?.addEventListener('click', () => {
      this._doFusion();
    });
  }

  _doFusion() {
    if (!this._fuseSetId) return;
    const inv   = (this.playerData.artifactInventory ?? []).filter(a => !this.playerData.isArtifactEquipped(a.id));
    const pool  = inv.filter(a => a.setId === this._fuseSetId).sort((a, b) => (a.rarity ?? 1) - (b.rarity ?? 1));
    if (pool.length < 3) return;
    const toConsume = pool.slice(0, 3);
    const targetRar = Math.min(5, Math.max(...toConsume.map(a => a.rarity ?? 1)) + 1);
    const cost      = FUSION_COSTS[targetRar] ?? {};
    if (!this.playerData.canAffordForge(cost)) return;

    // Consomme les 3 artefacts
    toConsume.forEach(a => this.playerData.removeArtifact(a.id));
    // Dépense les matériaux
    this.playerData.spendForgeMaterials(cost);
    // Génère le nouvel artefact
    const slot    = ARTIFACT_SLOTS[Math.floor(Math.random() * ARTIFACT_SLOTS.length)];
    const newArt  = generateArtifact(slot, this._fuseSetId, targetRar);
    this.playerData.addArtifactToInventory(newArt);

    const set = ARTIFACT_SETS[this._fuseSetId];
    toast.show(`Fusion réussie ! ${set.icon} ${set.name}`, 'reward', {
      sub: `Nouvel artefact ${'★'.repeat(targetRar)} obtenu — ${SLOT_META[slot]?.label}`,
      duration: 4500,
    });
    audio.play?.('level_up');
    this._fuseSetId = null;
    this._updateMatsDisplay();
    this._renderFusion();
  }

  /* ════════════════════════════════════════
     ONGLET 3 : RENFORCEMENT
  ════════════════════════════════════════ */

  _renderEnhance() {
    const panel = document.getElementById('forge-panel-enhance');
    if (!panel) return;

    const inv  = this.playerData.artifactInventory ?? [];
    const art  = this._enhArtId ? inv.find(a => a.id === this._enhArtId) : null;
    const mats = this.playerData.getForgeMaterials();

    panel.innerHTML = `
      <div class="forge-split">
        <!-- Gauche : liste artefacts -->
        <div class="forge-split-left">
          <div class="fsl-title">CHOISIR UN ARTEFACT</div>
          <div class="fsl-art-grid" id="enhance-grid">
            ${inv.length === 0
              ? '<div class="forge-empty">Aucun artefact dans l\'inventaire.</div>'
              : inv.map(a => this._artChip(a, a.id === this._enhArtId)).join('')}
          </div>
        </div>
        <!-- Droite : stats + renforcement -->
        <div class="forge-split-right">
          ${art ? this._renderEnhanceDetail(art, mats) : `
            <div class="fsr-title">RENFORCEMENT</div>
            <div class="fsr-empty-hint">
              Sélectionne un artefact à gauche pour renforcer ses sous-stats.<br>
              Chaque sous-stat peut être améliorée jusqu'à 3 fois (+${Math.round(ENHANCE_BOOST_PER_LEVEL * 100)}% par niveau).
            </div>
          `}
        </div>
      </div>
    `;

    panel.querySelectorAll('.forge-art-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this._enhArtId = chip.dataset.artId === this._enhArtId ? null : chip.dataset.artId;
        this._renderEnhance();
      });
    });

    panel.querySelectorAll('.enh-sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const subIdx = parseInt(btn.dataset.subIdx, 10);
        this._doEnhance(this._enhArtId, subIdx);
      });
    });

    gsap.fromTo('.forge-art-chip',
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, stagger: 0.02, duration: 0.2, ease: 'power2.out' }
    );
  }

  _renderEnhanceDetail(art, mats) {
    const set  = ARTIFACT_SETS[art.setId];
    const slot = SLOT_META[art.slot];

    return `
      <div class="fsr-title">RENFORCER — ${set?.name ?? art.setId} ${slot?.icon ?? ''}</div>
      <div class="enh-art-header" style="--sc:${set?.color ?? '#888'}">
        <span class="eah-icon">${set?.icon ?? '?'}</span>
        <div class="eah-info">
          <div class="eah-set">${set?.name ?? art.setId}</div>
          <div class="eah-slot">${slot?.label ?? art.slot} · ${'★'.repeat(art.rarity ?? 1)}</div>
        </div>
        <div class="eah-main">
          <div class="eah-main-label">${STAT_LABELS[art.mainStat?.stat] ?? ''}</div>
          <div class="eah-main-val">${formatStatValue(art.mainStat?.stat, art.mainStat?.value)}</div>
        </div>
      </div>

      <!-- Sub-stats avec boutons d'amélioration -->
      <div class="enh-subs">
        ${(art.subStats ?? []).map((sub, si) => {
          const enhLevel   = art.enhancements?.[si] ?? 0;
          const maxed      = enhLevel >= 3;
          const costEntry  = ENHANCE_COSTS[enhLevel];
          const canAfford  = costEntry && this.playerData.canAffordForge(costEntry);
          const effVal     = getEnhancedSubValue(sub, enhLevel);
          const baseVal    = formatStatValue(sub.stat, sub.value);
          const effDisplay = formatStatValue(sub.stat, effVal);
          const boost      = enhLevel > 0 ? ` (+${Math.round(enhLevel * ENHANCE_BOOST_PER_LEVEL * 100)}%)` : '';

          return `
            <div class="enh-sub-row ${maxed ? 'enh-sub-row--maxed' : ''}">
              <div class="esr-left">
                <div class="esr-stat-name">${STAT_LABELS[sub.stat] ?? sub.stat}</div>
                <div class="esr-values">
                  <span class="esr-base">${baseVal}</span>
                  ${enhLevel > 0 ? `→ <span class="esr-eff" style="color:#44ff88">${effDisplay}</span>` : ''}
                  ${boost ? `<span class="esr-boost">${boost}</span>` : ''}
                </div>
              </div>
              <div class="esr-right">
                <div class="esr-stars">
                  ${[0,1,2].map(l => `<span class="esr-star ${l < enhLevel ? 'esr-star--lit' : ''}">★</span>`).join('')}
                </div>
                ${maxed ? `
                  <div class="esr-maxed-tag">MAX</div>
                ` : `
                  <button class="enh-sub-btn ${canAfford ? '' : 'enh-sub-btn--miss'}"
                          data-sub-idx="${si}"
                          ${canAfford ? '' : 'disabled'}
                          title="${costEntry ? _formatCost(costEntry) : ''}">
                    +
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Coûts -->
      <div class="enh-cost-preview">
        <div class="ecp-title">COÛT PAR AMÉLIORATION</div>
        ${ENHANCE_COSTS.map((c, i) => `
          <div class="ecp-row">
            <span class="ecp-level">Niv. ${i + 1}</span>
            <span class="ecp-cost">${_formatCost(c)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  _doEnhance(artId, subIdx) {
    if (!artId) return;
    const art = (this.playerData.artifactInventory ?? []).find(a => a.id === artId);
    if (!art) return;
    const enhLevel = art.enhancements?.[subIdx] ?? 0;
    if (enhLevel >= 3) return;
    const cost = ENHANCE_COSTS[enhLevel];
    if (!cost || !this.playerData.canAffordForge(cost)) return;

    this.playerData.spendForgeMaterials(cost);
    this.playerData.enhanceArtifactSub(artId, subIdx);

    const sub      = art.subStats[subIdx];
    const newLevel = (art.enhancements?.[subIdx] ?? 0);
    const effVal   = getEnhancedSubValue(sub, newLevel);

    toast.show(`★ Renforcement — ${STAT_LABELS[sub.stat]}`, 'success', {
      sub: `Niveau ${newLevel}/3 · Valeur : ${formatStatValue(sub.stat, effVal)}`,
      duration: 3000,
    });
    audio.play?.('level_up');
    this._updateMatsDisplay();
    this._renderEnhance();
  }
}

/* ── Helpers locaux ── */

function _rarityColor(rarity) {
  const colors = { 1: '#aaaaaa', 2: '#44ff88', 3: '#44aaff', 4: '#cc44ff', 5: '#ffcc00' };
  return colors[rarity] ?? '#aaaaaa';
}

function _formatCost(cost) {
  return Object.entries(cost)
    .map(([k, v]) => `${v}${FORGE_MATERIALS[k]?.icon ?? k}`)
    .join(' ');
}
