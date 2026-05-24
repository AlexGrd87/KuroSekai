/**
 * CollectionUI.js
 * Écran de collection KuroSekai.
 *
 * Fonctionnalités :
 *  - Grille de personnages (possédés = couleur, non possédés = silhouette)
 *  - Filtres par rareté et par élément
 *  - Modale centrée au clic : carte full design + stats animées + skills + lore
 *  - Transition GSAP depuis/vers le menu
 */

import { gsap }                                    from 'gsap';
import { CHARACTERS, RARITIES, CONSTELLATION_BONUSES } from '../data/characters.js';
import { buildPortraitSVG }                        from './portrait.js';
import { ARTIFACT_SLOTS, SLOT_META, ARTIFACT_SETS,
         formatStatValue, getActiveSets }          from '../data/artifacts.js';
import { ASCENSION_RANKS, MATERIAL_META,
         getNextAscensionCost }                    from '../data/ascension.js';
import { audio }                                   from '../audio/AudioManager.js';

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

export class CollectionUI {
  constructor(playerData) {
    this.playerData    = playerData;
    this.screen        = document.getElementById('collection-screen');
    this.grid          = document.getElementById('col-grid');
    this.modal         = document.getElementById('col-modal');
    this.modalCardWrap = document.getElementById('col-modal-card-wrap');
    this._activeFilter   = 'all';
    this._activeElement  = 'all';
    this._activeSort     = 'rarity';
    this._tiltCleanup    = null;
    this._amlCleanup     = null;
    this._currentModalChar = null;

    this._bindFilters();
    this._bindBack();
    this._bindModalClose();
  }

  /* ════════════════════════════════
     AFFICHAGE / MASQUAGE DE L'ÉCRAN
  ════════════════════════════════ */

  show() {
    this._updateCount();
    this._buildGrid();

    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 30 });
    gsap.to(this.screen, {
      opacity: 1, y: 0, duration: 0.45, ease: 'power3.out',
      onComplete: () => {
        gsap.from('.col-card', {
          opacity: 0, scale: 0.88, y: 20,
          stagger: 0.04, duration: 0.35, ease: 'back.out(1.4)',
        });
      },
    });
  }

  hide() {
    this._closeModal();
    gsap.to(this.screen, {
      opacity: 0, y: 20, duration: 0.3, ease: 'power2.in',
      onComplete: () => { this.screen.style.display = 'none'; },
    });
  }

  /* ════════════════════════════════
     GRILLE
  ════════════════════════════════ */

  _buildGrid() {
    this.grid.innerHTML = '';

    const filtered = CHARACTERS.filter(c => {
      const rarOk = this._activeFilter  === 'all' || String(c.rarity)  === this._activeFilter;
      const elOk  = this._activeElement === 'all' || c.element === this._activeElement;
      return rarOk && elOk;
    });

    filtered.sort((a, b) => {
      const ownA = this.playerData.has(a.id) ? 1 : 0;
      const ownB = this.playerData.has(b.id) ? 1 : 0;
      if (ownA !== ownB) return ownB - ownA;
      if (this._activeSort === 'level') {
        return this.playerData.getLevel(b.id) - this.playerData.getLevel(a.id);
      }
      if (this._activeSort === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.rarity - a.rarity; // default: rarity
    });

    filtered.forEach(char => {
      const owned  = this.playerData.has(char.id);
      const copies = this.playerData.countOf(char.id);
      const el     = ELEMENT_DATA[char.element] || ELEMENT_DATA.Neutral;
      const rar    = RARITIES[char.rarity];
      const stars  = '★'.repeat(char.rarity) + '☆'.repeat(5 - char.rarity);

      const card = document.createElement('div');
      card.className   = `col-card${owned ? ' col-card--owned' : ' col-card--locked'}`;
      card.dataset.id  = char.id;

      card.innerHTML = `
        <div class="col-card-bg"
             style="--card-el-color:${el.color};--card-el-glow:${el.glow};--card-rarity-color:${rar.color}">
          <div class="col-card-el-badge">${el.kanji}</div>
          ${copies > 1 ? `<div class="col-card-copies">×${copies}</div>` : ''}
          <div class="col-card-portrait">
            ${owned
              ? buildPortraitSVG(char)
              : '<span class="col-card-initial">?</span>'}
          </div>
          <div class="col-card-footer">
            <div class="col-card-stars" style="color:${rar.color}">${stars}</div>
            <div class="col-card-name">${owned ? char.name : '???'}</div>
            <div class="col-card-class">${owned ? char.class : '——'}</div>
          </div>
          ${!owned ? '<div class="col-card-lock">🔒</div>' : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        if (owned) this._openModal(char);
        else       this._shakeCard(card);
      });

      this.grid.appendChild(card);
    });
  }

  /* ════════════════════════════════
     MODALE
  ════════════════════════════════ */

  _openModal(char) {
    const el  = ELEMENT_DATA[char.element] || ELEMENT_DATA.Neutral;
    const rar = RARITIES[char.rarity];
    const copies = this.playerData.countOf(char.id);

    /* -- Variables CSS de couleur -- */
    this.modal.style.setProperty('--det-el-color',  el.color);
    this.modal.style.setProperty('--det-el-glow',   el.glow);
    this.modal.style.setProperty('--det-rar-color',  rar.color);

    /* -- Contenu textuel -- */
    document.getElementById('det-stars').textContent   = '★'.repeat(char.rarity);
    document.getElementById('det-stars').style.color   = rar.color;
    document.getElementById('det-name').textContent    = char.name;
    document.getElementById('det-title-text').textContent = char.title;
    document.getElementById('det-class').textContent   = char.class;
    document.getElementById('det-el').textContent      = `${el.kanji} ${char.element}`;
    document.getElementById('det-el').style.color      = el.color;
    document.getElementById('det-copies').textContent  = copies > 1
      ? `Possédé — ${copies} exemplaires`
      : 'Possédé';
    document.getElementById('det-copies').style.color  = rar.color;
    document.getElementById('det-skill1-name').textContent = char.skills[0].name;
    document.getElementById('det-skill1-desc').textContent = char.skills[0].desc;
    document.getElementById('det-skill2-name').textContent = char.skills[1].name;
    document.getElementById('det-skill2-desc').textContent = char.skills[1].desc;
    document.getElementById('det-desc').textContent    = char.description;
    document.getElementById('det-lore').textContent    = char.lore;

    /* -- Niveau + EXP -- */
    const prog = this.playerData.expProgress(char.id);
    const badge = document.getElementById('det-level-badge');
    const expTxt = document.getElementById('det-exp-text');
    const expBar = document.getElementById('det-exp-bar');
    if (badge)  badge.textContent  = prog.maxed ? 'Lv.MAX' : `Lv.${prog.level}`;
    if (expTxt) expTxt.textContent = prog.maxed
      ? 'Niveau maximum'
      : `${prog.exp.toLocaleString()} / ${prog.needed.toLocaleString()} EXP`;
    if (expBar) {
      expBar.style.background = prog.maxed ? '#ffd700' : el.color;
      expBar.style.boxShadow  = `0 0 8px ${prog.maxed ? '#ffaa00' : el.glow}`;
      gsap.fromTo(expBar, { width: '0%' },
        { width: `${prog.pct}%`, duration: 0.75, ease: 'power2.out', delay: 0.25 });
    }

    /* -- Carte full design -- */
    this._buildModalCard(char);

    /* -- Affichage modale -- */
    gsap.set(this.modal, { display: 'flex' });
    const box = document.getElementById('col-modal-box');
    gsap.fromTo(this.modal,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: 'power2.out' }
    );
    gsap.fromTo(box,
      { scale: 0.88, y: 20 },
      { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' }
    );

    /* -- Stats scalées (niveau + constellation) -- */
    const scaled   = this.playerData.getScaledStats(char);
    const maxStats = { hp: 18000, atk: 2500, def: 2600, spd: 180 };
    [
      ['hp',  scaled.hp,  maxStats.hp],
      ['atk', scaled.atk, maxStats.atk],
      ['def', scaled.def, maxStats.def],
      ['spd', scaled.spd, maxStats.spd],
    ].forEach(([stat, val, max], i) => {
      const bar = document.getElementById(`det-${stat}-bar`);
      const txt = document.getElementById(`det-${stat}-val`);
      if (!bar) return;
      bar.style.background = el.color;
      bar.style.boxShadow  = `0 0 8px ${el.glow}`;
      gsap.fromTo(bar, { width: '0%' }, {
        width: `${Math.min((val / max) * 100, 100)}%`,
        duration: 0.65, ease: 'power2.out', delay: 0.35 + i * 0.08,
      });
      if (txt) txt.textContent = stat === 'spd' ? val : val.toLocaleString();
    });

    /* -- Constellation -- */
    this._buildConstellationUI(char, el);

    /* -- Ascension -- */
    this._buildAscensionUI(char, el);

    /* -- Équipement (artefacts) -- */
    this._buildEquipmentUI(char, el);

    /* -- Talents -- */
    this._buildTalentsUI(char, el);

    /* -- Boutons Améliorer -- */
    this._currentModalChar = char;
    this._bindAmeliorerButtons(char, el);

    /* -- Stagger des blocs de droite -- */
    const infoSections = ['#det-header', '#det-ameliorer', '#det-ascension', '#det-stats', '#det-skills', '#det-constellation', '#det-equipment', '#det-talents', '#det-lore-block'];
    gsap.fromTo(infoSections.map(s => document.querySelector(s)).filter(Boolean),
      { opacity: 0, x: 18 },
      { opacity: 1, x: 0, stagger: 0.07, duration: 0.35, ease: 'power2.out', delay: 0.15 }
    );
  }

  /* ════════════════════════════════
     SECTION AMÉLIORER
  ════════════════════════════════ */

  _bindAmeliorerButtons(char, el) {
    // Cleanup des anciens listeners
    if (this._amlCleanup) { this._amlCleanup(); this._amlCleanup = null; }

    // Met à jour l'affichage de la monnaie dans le header améliorer
    const currDisp = document.getElementById('det-aml-currency-val');
    if (currDisp) currDisp.textContent = this.playerData.currency.toLocaleString();

    const btns    = document.querySelectorAll('.det-aml-btn');
    const entries = [];

    btns.forEach(btn => {
      const expAmt  = parseInt(btn.dataset.exp,  10);
      const costAmt = parseInt(btn.dataset.cost, 10);

      const updateState = () => {
        const prog     = this.playerData.expProgress(char.id);
        const disabled = this.playerData.currency < costAmt || prog.maxed;
        btn.classList.toggle('det-aml-btn--disabled', disabled);
        btn.disabled = disabled;
      };
      updateState();

      const handler = () => {
        const prog = this.playerData.expProgress(char.id);
        if (this.playerData.currency < costAmt || prog.maxed) {
          gsap.fromTo(btn,
            { x: -5 },
            { x: 0, duration: 0.35, ease: 'elastic.out(1,0.3)' });
          this._showAmlToast(prog.maxed ? '✦ Niveau maximum atteint !' : '◈ Fonds insuffisants');
          return;
        }

        const oldLevel = this.playerData.getLevel(char.id);
        this.playerData.spendCurrency(costAmt);
        const result   = this.playerData.addExp(char.id, expAmt);
        const leveled  = result.newLevel > oldLevel;

        // Flash bouton
        gsap.timeline()
          .to(btn, { scale: 1.07, borderColor: '#00e896', duration: 0.12, ease: 'power2.out' })
          .to(btn, { scale: 1, borderColor: '',           duration: 0.22, ease: 'power2.in'  });

        this._refreshModalProgress(char, el);

        const msg = leveled
          ? `⬆ Niveau ${result.newLevel} atteint !`
          : `✦ +${expAmt.toLocaleString()} EXP`;
        this._showAmlToast(msg);
      };

      btn.addEventListener('click', handler);
      entries.push({ btn, handler });
    });

    this._amlCleanup = () => entries.forEach(({ btn, handler }) =>
      btn.removeEventListener('click', handler)
    );
  }

  _refreshModalProgress(char, el) {
    const prog   = this.playerData.expProgress(char.id);
    const badge  = document.getElementById('det-level-badge');
    const expTxt = document.getElementById('det-exp-text');
    const expBar = document.getElementById('det-exp-bar');
    const currDisp = document.getElementById('det-aml-currency-val');

    if (badge)    badge.textContent    = prog.maxed ? 'Lv.MAX' : `Lv.${prog.level}`;
    if (expTxt)   expTxt.textContent   = prog.maxed
      ? 'Niveau maximum'
      : `${prog.exp.toLocaleString()} / ${prog.needed.toLocaleString()} EXP`;
    if (expBar) {
      expBar.style.background = prog.maxed ? '#ffd700' : el.color;
      expBar.style.boxShadow  = `0 0 8px ${prog.maxed ? '#ffaa00' : el.glow}`;
      gsap.to(expBar, { width: `${prog.pct}%`, duration: 0.5, ease: 'power2.out' });
    }
    if (currDisp) currDisp.textContent = this.playerData.currency.toLocaleString();

    // Stats scalées
    const scaled   = this.playerData.getScaledStats(char);
    const maxStats = { hp: 18000, atk: 2500, def: 2600, spd: 180 };
    [['hp', scaled.hp, maxStats.hp], ['atk', scaled.atk, maxStats.atk],
     ['def', scaled.def, maxStats.def], ['spd', scaled.spd, maxStats.spd]
    ].forEach(([stat, val, max]) => {
      const bar = document.getElementById(`det-${stat}-bar`);
      const txt = document.getElementById(`det-${stat}-val`);
      if (bar) gsap.to(bar, { width: `${Math.min((val / max) * 100, 100)}%`, duration: 0.45, ease: 'power2.out' });
      if (txt) txt.textContent = stat === 'spd' ? val : val.toLocaleString();
    });

    // Re-check affordabilité des boutons
    document.querySelectorAll('.det-aml-btn').forEach(btn => {
      const costAmt  = parseInt(btn.dataset.cost, 10);
      const disabled = this.playerData.currency < costAmt || prog.maxed;
      btn.classList.toggle('det-aml-btn--disabled', disabled);
      btn.disabled = disabled;
    });

    // Sync monnaie dans le hub
    const hubCurr = document.getElementById('hub-nav-currency-val');
    if (hubCurr) hubCurr.textContent = this.playerData.currency.toLocaleString();
  }

  _showAmlToast(msg) {
    const toast = document.getElementById('det-aml-toast');
    if (!toast) return;
    gsap.killTweensOf(toast);
    toast.textContent = msg;
    gsap.fromTo(toast,
      { opacity: 0, y: 5 },
      { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out',
        onComplete: () => gsap.to(toast, { opacity: 0, y: -6, duration: 0.3, ease: 'power2.in', delay: 1.5 }) }
    );
  }

  _buildConstellationUI(char, el) {
    const level   = this.playerData.getConstellationLevel(char.id);
    const bonuses = CONSTELLATION_BONUSES[char.rarity] || [];
    const rar     = RARITIES[char.rarity];

    /* level badge */
    const levelEl = document.getElementById('det-const-level');
    if (levelEl) {
      levelEl.textContent  = level === 0 ? 'C0' : `C${level}`;
      levelEl.style.color  = level > 0 ? rar.color : '#666';
    }

    /* 6 nodes */
    const nodesEl = document.getElementById('det-const-nodes');
    if (nodesEl) {
      nodesEl.innerHTML = bonuses.map((b, i) => {
        const active  = i < level;
        const current = i === level - 1;
        return `
          <div class="det-const-node ${active ? 'det-const-node--active' : ''}
                                     ${current ? 'det-const-node--current' : ''}"
               style="${active ? `--nc:${rar.color};--ng:${rar.glow}` : ''}"
               title="${b.label}">
            <span class="det-const-node-num">C${i + 1}</span>
            <span class="det-const-node-label">${b.label}</span>
          </div>
        `;
      }).join('');

      /* animate active nodes */
      if (level > 0) {
        gsap.fromTo(nodesEl.querySelectorAll('.det-const-node--active'),
          { scale: 0.7, opacity: 0 },
          { scale: 1, opacity: 1, stagger: 0.06, duration: 0.3, ease: 'back.out(1.5)', delay: 0.4 }
        );
      }
    }

    /* bonus summary */
    const bonusEl = document.getElementById('det-const-bonus');
    if (bonusEl) {
      if (level === 0) {
        bonusEl.textContent = 'Obtenez des copies pour débloquer des constellations.';
        bonusEl.style.color = '#667';
      } else if (level >= 6) {
        bonusEl.textContent = '✦ Constellation maximale atteinte !';
        bonusEl.style.color = rar.color;
      } else {
        bonusEl.textContent = `Prochain : ${bonuses[level]?.label ?? '—'}`;
        bonusEl.style.color = '#99aacc';
      }
    }
  }

  /* ════════════════════════════════
     ASCENSION
  ════════════════════════════════ */

  _buildAscensionUI(char, el) {
    const wrap = document.getElementById('det-ascension');
    if (!wrap) return;

    const rank     = this.playerData.getAscensionRank(char.id);
    const rankData = ASCENSION_RANKS[rank];
    const nextCost = getNextAscensionCost(rank);
    const mats     = this.playerData.ascensionMaterials ?? {};

    const rankNodes = ASCENSION_RANKS.map((r, i) => `
      <div class="asc-node ${i <= rank ? 'asc-node--active' : ''} ${i === rank ? 'asc-node--current' : ''}"
           style="${i <= rank ? `--nc:${r.color}` : ''}">
        <span class="asc-node-label">${r.label}</span>
      </div>
    `).join('<div class="asc-conn"></div>');

    const materialsHtml = nextCost
      ? Object.entries(nextCost).map(([mat, qty]) => {
          const meta  = MATERIAL_META[mat] ?? { label: mat, icon: '?', color: '#888' };
          const have  = mats[mat] ?? 0;
          const ok    = have >= qty;
          return `
            <div class="asc-mat ${ok ? 'asc-mat--ok' : 'asc-mat--missing'}">
              <span class="asc-mat-icon" style="color:${meta.color}">${meta.icon}</span>
              <span class="asc-mat-label">${meta.label}</span>
              <span class="asc-mat-count">${have}/${qty}</span>
            </div>
          `;
        }).join('')
      : '<span class="asc-max-label">★ Rang maximum !</span>';

    const canResult = this.playerData.canAscend(char.id);
    const btnDisabled = !canResult.ok;

    wrap.innerHTML = `
      <div class="det-asc-header">
        <span class="det-asc-title">⬆ ASCENSION</span>
        <span class="det-asc-rank" style="color:${rankData.color}">${rankData.label}</span>
      </div>
      <div class="asc-track">${rankNodes}</div>
      <div class="asc-stat-mult">
        Stats × <span style="color:${rankData.color}">${rankData.statMult.toFixed(2)}</span>
        · Niveau max <span style="color:${rankData.color}">${rankData.levelCap}</span>
      </div>
      ${rank < 5 ? `<div class="asc-mats-label">Coût ascension :</div>` : ''}
      <div class="asc-mats-row">${materialsHtml}</div>
      ${rank < 5 ? `
        <button id="det-asc-btn" class="det-asc-btn ${btnDisabled ? 'det-asc-btn--disabled' : ''}"
                ${btnDisabled ? 'disabled' : ''}>
          ⬆ Monter en ${ASCENSION_RANKS[rank + 1]?.label ?? '—'}
        </button>
      ` : ''}
      <div id="det-asc-toast" class="det-aml-toast"></div>
    `;

    const btn = document.getElementById('det-asc-btn');
    btn?.addEventListener('click', () => {
      const result = this.playerData.ascendCharacter(char.id);
      if (!result.ok) {
        this._showAscToast('✗ ' + (result.reason ?? 'Impossible'));
        return;
      }
      audio.play?.('level_up');
      const newRank  = ASCENSION_RANKS[result.newRank];
      this._showAscToast(`⬆ Ascension ${newRank.label} atteinte !`);
      // Refresh stats et section ascension
      this._buildAscensionUI(char, el);
      this._refreshModalProgress(char, el);
    });
  }

  _showAscToast(msg) {
    const t = document.getElementById('det-asc-toast');
    if (!t) return;
    gsap.killTweensOf(t);
    t.textContent = msg;
    gsap.fromTo(t,
      { opacity: 0, y: 5 },
      { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out',
        onComplete: () => gsap.to(t, { opacity: 0, y: -6, duration: 0.3, delay: 1.8 }) }
    );
  }

  /* ════════════════════════════════
     ÉQUIPEMENT (ARTEFACTS)
  ════════════════════════════════ */

  _buildEquipmentUI(char, el) {
    const wrap = document.getElementById('det-equipment');
    if (!wrap) return;

    const equipped   = this.playerData.getEquippedArtifacts(char.id);
    const activeSets = getActiveSets(equipped.filter(Boolean));

    const slotsHtml = ARTIFACT_SLOTS.map((slot, i) => {
      const art  = equipped[i];
      const meta = SLOT_META[slot];
      if (!art) {
        return `
          <div class="eq-slot eq-slot--empty" data-slot="${slot}" data-char="${char.id}">
            <div class="eq-slot-icon">${meta.icon}</div>
            <div class="eq-slot-label">${meta.label}</div>
            <div class="eq-slot-kanji">${meta.kanji}</div>
          </div>
        `;
      }
      const setData = ARTIFACT_SETS[art.setId] ?? { name: '?', color: '#888', icon: '?' };
      const mainLbl = formatStatValue(art.mainStat.stat, art.mainStat.value);
      return `
        <div class="eq-slot eq-slot--filled" data-slot="${slot}" data-char="${char.id}"
             style="--eq-set-color:${setData.color}">
          <div class="eq-slot-header">
            <span class="eq-slot-icon-sm">${meta.icon}</span>
            <span class="eq-slot-label-sm">${meta.label}</span>
            <span class="eq-slot-rarity">${'★'.repeat(art.rarity)}</span>
          </div>
          <div class="eq-slot-set" style="color:${setData.color}">${setData.icon} ${setData.name}</div>
          <div class="eq-slot-main">${mainLbl}</div>
          <div class="eq-slot-subs">
            ${art.subStats.slice(0, 2).map(s => `<span>${formatStatValue(s.stat, s.value)}</span>`).join('')}
          </div>
          <button class="eq-unequip-btn" data-slot="${slot}" data-char="${char.id}">✕</button>
        </div>
      `;
    }).join('');

    const setsHtml = activeSets.length > 0
      ? activeSets.map(s => `
          <div class="eq-set-tag" style="--sc:${s.set.color}">
            <span class="eq-set-icon">${s.set.icon}</span>
            <span class="eq-set-name">${s.set.name}</span>
            <span class="eq-set-pieces">${s.pieces}p</span>
            <span class="eq-set-bonus">${s.bonus.label}</span>
          </div>
        `).join('')
      : '<span class="eq-no-set">Aucun bonus de set actif</span>';

    wrap.innerHTML = `
      <div class="det-eq-header">
        <span class="det-eq-title">⚔ ÉQUIPEMENT</span>
        <button id="det-eq-open-inv" class="det-eq-inv-btn">Inventaire</button>
      </div>
      <div class="eq-slots-grid">${slotsHtml}</div>
      <div class="eq-sets-row">${setsHtml}</div>
      <div id="det-eq-inv-panel" class="eq-inv-panel" style="display:none"></div>
    `;

    // Boutons déséquiper
    wrap.querySelectorAll('.eq-unequip-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.playerData.unequipArtifact(char.id, btn.dataset.slot);
        this._buildEquipmentUI(char, el);
        this._refreshModalProgress(char, el);
      });
    });

    // Slots vides → ouvre l'inventaire pour ce slot
    wrap.querySelectorAll('.eq-slot--empty').forEach(slot => {
      slot.addEventListener('click', () => this._openInventory(char, el, slot.dataset.slot));
    });

    // Bouton inventaire global
    document.getElementById('det-eq-open-inv')
      ?.addEventListener('click', () => this._openInventory(char, el, null));
  }

  /* ════════════════════════════════
     SECTION TALENTS
  ════════════════════════════════ */

  _buildTalentsUI(char, _el) {
    const wrap = document.getElementById('det-talents');
    if (!wrap) return;

    const unlocked = this.playerData.getUnlockedTalents(char.id);
    const talentFx = this.playerData.getTalentEffects(char);
    const summary  = Object.keys(talentFx).length > 0
      ? Object.entries(talentFx).map(([k, v]) => {
          const labels = {
            atk_pct: 'ATK', hp_pct: 'PV', def_pct: 'DEF', spd_pct: 'VIT',
            crit_rate: 'Crit', crit_dmg: 'CritDMG', all_pct: 'Tous', cd0: 'Skill1CD', cd1: 'Skill2CD',
          };
          const isPct = k.endsWith('_pct') || k === 'crit_rate' || k === 'crit_dmg';
          return `${labels[k] ?? k} ${v > 0 && isPct ? '+' : ''}${isPct ? Math.round(v * 100) + '%' : v}`;
        }).join(' · ')
      : 'Aucun talent actif';

    wrap.innerHTML = `
      <div class="det-talents-header">
        <span class="det-talents-title">✦ TALENTS</span>
        <span class="det-talents-unlocked">${unlocked.size}/6 débloqués</span>
      </div>
      <div class="det-talents-summary">${summary}</div>
      <button id="det-talents-open-btn" class="det-talents-btn">
        <span>GÉRER LES TALENTS</span>
        <span class="dtb-arrow">→</span>
      </button>
    `;

    document.getElementById('det-talents-open-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('kuro:open-talents', { detail: { charId: char.id } }));
    });
  }

  _openInventory(char, el, filterSlot = null) {
    const panel = document.getElementById('det-eq-inv-panel');
    if (!panel) return;

    if (panel.style.display !== 'none') {
      gsap.to(panel, { opacity: 0, height: 0, duration: 0.25, onComplete: () => { panel.style.display = 'none'; } });
      return;
    }

    const inventory = this.playerData.artifactInventory ?? [];
    // Filtrer par slot si demandé
    const arts = filterSlot ? inventory.filter(a => a.slot === filterSlot) : inventory;

    if (arts.length === 0) {
      panel.innerHTML = `<div class="eq-inv-empty">Inventaire vide.<br>Les artefacts se dropeent en combattant.</div>`;
      panel.style.display = 'block';
      gsap.fromTo(panel, { opacity: 0, height: 0 }, { opacity: 1, height: 'auto', duration: 0.3 });
      return;
    }

    panel.innerHTML = `
      <div class="eq-inv-title">${filterSlot ? SLOT_META[filterSlot]?.label : 'Tous les artefacts'}</div>
      <div class="eq-inv-list">
        ${arts.map(art => {
          const setData = ARTIFACT_SETS[art.setId] ?? { name: '?', color: '#888', icon: '?', glow: '#444' };
          const mainLbl = formatStatValue(art.mainStat.stat, art.mainStat.value);
          // Check if already equipped on this char
          const alreadyOn = (this.playerData.characterEquipment?.[char.id]?.[art.slot] === art.id);
          return `
            <div class="eq-inv-item ${alreadyOn ? 'eq-inv-item--equipped' : ''}"
                 data-art-id="${art.id}" data-slot="${art.slot}"
                 style="--si:${setData.color}">
              <div class="eq-inv-item-top">
                <span class="eq-inv-set-icon">${setData.icon}</span>
                <span class="eq-inv-slot-label">${SLOT_META[art.slot]?.label ?? art.slot}</span>
                <span class="eq-inv-rarity">${'★'.repeat(art.rarity)}</span>
              </div>
              <div class="eq-inv-main">${mainLbl}</div>
              <div class="eq-inv-subs">
                ${art.subStats.map(s => `<span>${formatStatValue(s.stat, s.value)}</span>`).join(' · ')}
              </div>
              ${alreadyOn
                ? '<span class="eq-inv-eq-badge">ÉQUIPÉ</span>'
                : `<button class="eq-inv-equip-btn" data-art-id="${art.id}" data-slot="${art.slot}">Équiper</button>`
              }
            </div>
          `;
        }).join('')}
      </div>
    `;

    panel.style.display = 'block';
    panel.style.height   = '0';
    panel.style.overflow = 'hidden';
    gsap.to(panel, { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out' });

    panel.querySelectorAll('.eq-inv-equip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.playerData.equipArtifact(char.id, btn.dataset.slot, btn.dataset.artId);
        this._buildEquipmentUI(char, el);
        this._refreshModalProgress(char, el);
      });
    });
  }

  _closeModal() {
    if (!this.modal || this.modal.style.display === 'none') return;
    if (this._tiltCleanup) { this._tiltCleanup(); this._tiltCleanup = null; }
    if (this._amlCleanup)  { this._amlCleanup();  this._amlCleanup  = null; }
    this._currentModalChar = null;
    gsap.to(this.modal, {
      opacity: 0, duration: 0.22, ease: 'power2.in',
      onComplete: () => {
        this.modal.style.display = 'none';
        if (this.modalCardWrap) this.modalCardWrap.innerHTML = '';
      },
    });
  }

  /* ════════════════════════════════
     CARTE FULL DESIGN DANS LA MODALE
  ════════════════════════════════ */

  _buildModalCard(char) {
    if (!this.modalCardWrap) return;
    this.modalCardWrap.innerHTML = '';

    const rar    = RARITIES[char.rarity];
    const el     = ELEMENT_DATA[char.element] || ELEMENT_DATA.Neutral;
    const stars  = '★'.repeat(char.rarity);
    const empty  = '★'.repeat(5 - char.rarity);
    const sym    = el.kanji;

    const card = document.createElement('div');
    card.className = `summon-card rarity-${char.rarity}`;
    card.dataset.rarity = char.rarity;
    card.style.setProperty('--card-color',  rar.color);
    card.style.setProperty('--card-glow',   rar.glow);
    card.style.setProperty('--elem-color',  el.color);
    card.style.setProperty('--elem-glow',   el.glow);

    card.innerHTML = `
      <div class="card-holo"></div>
      <div class="card-scanline"></div>
      <div class="card-corner card-corner--tl"></div>
      <div class="card-corner card-corner--tr"></div>
      <div class="card-corner card-corner--bl"></div>
      <div class="card-corner card-corner--br"></div>
      <div class="card-portrait">
        <div class="card-portrait-bg"></div>
        <div class="card-circuit">
          <div class="circuit-h circuit-h1"></div>
          <div class="circuit-h circuit-h2"></div>
          <div class="circuit-v circuit-v1"></div>
        </div>
        <div class="card-element-bg">${sym}</div>
        ${buildPortraitSVG(char, 'card')}
        <div class="card-rarity-badge">
          <span class="stars-lit">${stars}</span><span class="stars-dim">${empty}</span>
        </div>
        <div class="card-portrait-foot">
          <span class="card-elem-tag">${char.element}</span>
          <span class="card-class-tag">${char.class}</span>
        </div>
      </div>
      <div class="card-info">
        <div class="card-accent-line"></div>
        <div class="card-rarity-label">${rar.label}</div>
        <div class="card-name">${char.name}</div>
        <div class="card-title-text">${char.title}</div>
        <div class="card-info-foot">
          <div class="card-id">ID_${char.id.toUpperCase()}</div>
          <div class="card-dot"></div>
        </div>
      </div>
    `;

    this.modalCardWrap.appendChild(card);

    /* Flip d'entrée */
    gsap.fromTo(card,
      { rotateY: -90, opacity: 0 },
      { rotateY: 0, opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.1,
        transformPerspective: 900 }
    );

    /* Glow pulse pour 5★ */
    if (char.rarity >= 5) {
      gsap.to(card, {
        filter: `drop-shadow(0 0 14px ${rar.glow}) brightness(1.08)`,
        duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut',
      });
    }

    /* Tilt 3D */
    const onMove = e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(card, { rotateY: x * 20, rotateX: -y * 20, duration: 0.3, ease: 'power2.out', transformPerspective: 900 });
      const holo = card.querySelector('.card-holo');
      if (holo) holo.style.backgroundPosition = `${(x + 0.5) * 100}% ${(y + 0.5) * 100}%`;
    };
    const onLeave = () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power3.out' });

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    this._tiltCleanup = () => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
    };
  }

  /* ════════════════════════════════
     HELPERS
  ════════════════════════════════ */

  _shakeCard(card) {
    gsap.to(card, { x: -8, duration: 0.05, yoyo: true, repeat: 5, ease: 'none',
      onComplete: () => gsap.set(card, { x: 0 }) });
  }

  _updateCount() {
    const el = document.getElementById('col-count');
    if (el) el.textContent = `${this.playerData.uniqueCount()} / ${CHARACTERS.length}`;
  }

  _bindFilters() {
    document.querySelectorAll('.col-filter-sort').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.col-filter-sort').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._activeSort = btn.dataset.sort;
        this._buildGrid();
        gsap.from('.col-card', { opacity: 0, scale: 0.9, stagger: 0.03, duration: 0.25, ease: 'power2.out' });
      });
    });
    document.querySelectorAll('.col-filter-rar').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.col-filter-rar').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._activeFilter = btn.dataset.filter;
        this._closeModal();
        this._buildGrid();
        gsap.from('.col-card', { opacity: 0, scale: 0.9, stagger: 0.03, duration: 0.25, ease: 'power2.out' });
      });
    });
    document.querySelectorAll('.col-filter-el').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.col-filter-el').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._activeElement = btn.dataset.element;
        this._closeModal();
        this._buildGrid();
        gsap.from('.col-card', { opacity: 0, scale: 0.9, stagger: 0.03, duration: 0.25, ease: 'power2.out' });
      });
    });
  }

  _bindBack() {
    document.getElementById('col-back')?.addEventListener('click', () => this.hide());
  }

  _bindModalClose() {
    document.getElementById('col-modal-close')?.addEventListener('click', () => this._closeModal());
    document.getElementById('col-modal-backdrop')?.addEventListener('click', () => this._closeModal());
  }
}
