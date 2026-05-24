/**
 * TalentUI.js — Overlay plein-écran de l'arbre de talents d'un personnage.
 * Deux branches indépendantes : colonne gauche (0→2→4) et colonne droite (1→3→5).
 */

import { gsap }           from 'gsap';
import { audio }          from '../audio/AudioManager.js';
import { toast }          from './ToastUI.js';
import { CHARACTERS, RARITIES } from '../data/characters.js';
import { getTalentTree, formatTalentEffect, TALENT_COST_BY_ROW } from '../data/talents.js';

export class TalentUI {
  constructor(playerData) {
    this.playerData = playerData;
    this.screen     = document.getElementById('talent-screen');
    this._charId    = null;
    this._onClose   = null;
  }

  /* ════════════════════════════════
     SHOW / HIDE
  ════════════════════════════════ */

  /**
   * Ouvre l'arbre de talents d'un personnage.
   * @param {string} charId
   * @param {Function} [onClose] - callback au retour
   */
  show(charId, onClose = null) {
    this._charId  = charId;
    this._onClose = onClose;
    this._render();
    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 18 });
    gsap.to(this.screen, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' });
    audio.play?.('ui_navigate');
  }

  hide() {
    gsap.to(this.screen, {
      opacity: 0, y: 12, duration: 0.22, ease: 'power2.in',
      onComplete: () => { if (this.screen) this.screen.style.display = 'none'; },
    });
  }

  /* ════════════════════════════════
     RENDU
  ════════════════════════════════ */

  _render() {
    if (!this.screen || !this._charId) return;
    const char     = CHARACTERS.find(c => c.id === this._charId);
    if (!char) return;
    const rar      = RARITIES[char.rarity];
    const tree     = getTalentTree(char);
    const unlocked = this.playerData.getUnlockedTalents(char.id);
    const currency = this.playerData.currency ?? 0;

    this.screen.innerHTML = `
      <div id="talent-bg" style="--tc:${rar.color};--tg:${rar.glow}"></div>

      <header id="talent-header">
        <button id="talent-back-btn" class="col-back-btn">
          <span class="col-back-arrow">←</span> RETOUR
        </button>
        <div id="talent-title-block">
          <span class="talent-kanji-deco" style="color:${rar.color}">${char.name[0]}</span>
          <div>
            <div id="talent-char-name" style="color:${rar.color}">${char.name}</div>
            <div id="talent-char-title">${char.title}</div>
          </div>
        </div>
        <div id="talent-currency-display">
          <span class="talent-cur-icon">◈</span>
          <span id="talent-cur-val">${currency.toLocaleString()}</span>
        </div>
      </header>

      <!-- Résumé des effets actifs -->
      <div id="talent-effects-bar">
        <span class="teb-label">BONUS ACTIFS :</span>
        <span id="talent-effects-summary">${this._buildEffectsSummary(char, unlocked, tree)}</span>
      </div>

      <!-- Arbre de talents -->
      <div id="talent-tree-wrap">
        <div id="talent-tree">
          ${this._buildTree(tree, unlocked, currency, rar.color)}
        </div>
      </div>

      <!-- Légende -->
      <div id="talent-legend">
        <div class="tl-item"><span class="tl-dot tl-dot--locked"></span> Verrouillé</div>
        <div class="tl-item"><span class="tl-dot tl-dot--available"></span> Disponible</div>
        <div class="tl-item"><span class="tl-dot tl-dot--unlocked"></span> Débloqué</div>
      </div>
    `;

    this._bindBack();
    this._bindNodes(char, tree, rar.color);

    // Animations entrée
    gsap.fromTo('#talent-header, #talent-effects-bar',
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.3, ease: 'power2.out', delay: 0.05 }
    );
    gsap.fromTo('.talent-node',
      { opacity: 0, scale: 0.7 },
      { opacity: 1, scale: 1, stagger: 0.06, duration: 0.3, ease: 'back.out(1.4)', delay: 0.15 }
    );
  }

  _buildTree(tree, unlocked, currency, accentColor) {
    // Layout : 3 rangées × 2 colonnes, + connecteurs SVG entre rangées
    const byRow = [[], [], []];
    for (const node of tree.nodes) {
      byRow[node.row]?.push(node);
    }

    let html = '';
    for (let row = 0; row < 3; row++) {
      html += `<div class="talent-row" data-row="${row}">`;
      const nodes = byRow[row].sort((a, b) => a.col - b.col);
      for (const node of nodes) {
        const state = this._nodeState(node, unlocked, currency);
        html += this._nodeHTML(node, state, accentColor);
      }
      html += `</div>`;

      // Connecteurs entre rangées
      if (row < 2) {
        html += `<div class="talent-connectors">
          <div class="talent-conn talent-conn--left  ${this._connClass(byRow[row][0], byRow[row+1][0], unlocked)}"></div>
          <div class="talent-conn talent-conn--right ${this._connClass(byRow[row][1], byRow[row+1][1], unlocked)}"></div>
        </div>`;
      }
    }
    return html;
  }

  _nodeState(node, unlocked, currency) {
    if (unlocked.has(node.id)) return 'unlocked';
    const reqsMet = node.requires.every(r => unlocked.has(r));
    if (!reqsMet) return 'locked';
    const cost = TALENT_COST_BY_ROW[node.row];
    return currency >= cost ? 'available' : 'poor';
  }

  _nodeHTML(node, state, accentColor) {
    const cost = TALENT_COST_BY_ROW[node.row];
    const effectStr = formatTalentEffect(node.effect);
    return `
      <div class="talent-node talent-node--${state}"
           data-node-id="${node.id}"
           style="--nc:${accentColor}"
           title="${node.label} — ${effectStr}">
        <div class="tn-glow"></div>
        <div class="tn-icon">${node.icon}</div>
        <div class="tn-label">${node.label}</div>
        <div class="tn-effect">${effectStr}</div>
        ${state !== 'unlocked'
          ? `<div class="tn-cost ${state === 'poor' ? 'tn-cost--poor' : ''}">◈ ${cost.toLocaleString()}</div>`
          : `<div class="tn-unlocked-tag">✓</div>`
        }
      </div>
    `;
  }

  _connClass(parentNode, childNode, unlocked) {
    if (!parentNode || !childNode) return '';
    if (unlocked.has(parentNode.id) && unlocked.has(childNode.id)) return 'talent-conn--both';
    if (unlocked.has(parentNode.id)) return 'talent-conn--parent';
    return '';
  }

  _buildEffectsSummary(char, unlocked, tree) {
    const merged = {};
    for (const node of tree.nodes) {
      if (!unlocked.has(node.id)) continue;
      for (const [k, v] of Object.entries(node.effect)) {
        merged[k] = (merged[k] ?? 0) + v;
      }
    }
    if (Object.keys(merged).length === 0) return '<span style="color:rgba(255,255,255,0.3)">Aucun talent débloqué</span>';
    return formatTalentEffect(merged);
  }

  /* ════════════════════════════════
     EVENTS
  ════════════════════════════════ */

  _bindBack() {
    document.getElementById('talent-back-btn')?.addEventListener('click', () => {
      audio.play?.('ui_navigate');
      this.hide();
      this._onClose?.();
    });
  }

  _bindNodes(char, tree, accentColor) {
    this.screen.querySelectorAll('.talent-node').forEach(el => {
      el.addEventListener('click', () => {
        const nodeId = parseInt(el.dataset.nodeId, 10);
        const node   = tree.nodes.find(n => n.id === nodeId);
        if (!node) return;

        const unlocked = this.playerData.getUnlockedTalents(char.id);
        const state    = this._nodeState(node, unlocked, this.playerData.currency ?? 0);

        if (state === 'unlocked') {
          toast.show(`${node.icon} ${node.label}`, 'info', {
            sub: formatTalentEffect(node.effect), duration: 2500,
          });
          return;
        }
        if (state === 'locked') {
          toast.show('Talent verrouillé', 'error', { sub: 'Débloque les nœuds précédents d\'abord.', duration: 2000 });
          return;
        }
        if (state === 'poor') {
          const cost = TALENT_COST_BY_ROW[node.row];
          toast.show('◈ Fonds insuffisants', 'error', { sub: `Requis : ${cost.toLocaleString()} ◈`, duration: 2200 });
          return;
        }

        // Déblocage
        const cost = TALENT_COST_BY_ROW[node.row];
        if (!this.playerData.unlockTalentNode(char.id, nodeId, cost)) return;

        audio.play?.('level_up');
        toast.show(`✦ Talent débloqué — ${node.label}`, 'reward', {
          sub: formatTalentEffect(node.effect), duration: 3500,
        });

        // Pulse GSAP sur le nœud
        gsap.fromTo(el,
          { scale: 1 },
          { scale: 1.18, duration: 0.14, ease: 'power2.out', yoyo: true, repeat: 1 }
        );

        // Ré-render pour mettre à jour états
        this._render();
        this._bindNodes(char, tree, accentColor);
      });
    });
  }
}
