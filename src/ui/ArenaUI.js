/**
 * ArenaUI.js — Écran d'Arène PvP asynchrone de KuroSekai.
 * Combat contre des équipes adverses IA, rating ELO, 5 tentatives/jour.
 */

import { gsap }     from 'gsap';
import { audio }    from '../audio/AudioManager.js';
import { toast }    from './ToastUI.js';
import { STAGES }   from '../data/enemies.js';
import { CHARACTERS } from '../data/characters.js';

const ARENA_TIERS = [
  { name: 'Bronze',  minRating: 0,    color: '#cd7f32', icon: '🥉', kanji: '銅' },
  { name: 'Argent',  minRating: 1100, color: '#aaaacc', icon: '🥈', kanji: '銀' },
  { name: 'Or',      minRating: 1250, color: '#ffd700', icon: '🥇', kanji: '金' },
  { name: 'Platine', minRating: 1400, color: '#00e5ff', icon: '💎', kanji: '白' },
  { name: 'Diamant', minRating: 1600, color: '#8844ff', icon: '◆',  kanji: '霊' },
];

const FAKE_NAMES = [
  'ShadowKira', 'Neo_Ryuu', 'VoidHunter', 'DarkSeraph', 'CyberNyx',
  'AkaneZero',  'GlitchTaka', 'PhantomSuki', 'IronJin', 'QuantumX',
  'GhostByte',  'NeonBlade',  'CrimsonPact', 'DataWraith', 'OmegaUnit',
];

/** RNG déterministe simple (xorshift32). */
function seededRand(seed) {
  let s = seed | 0;
  return function () {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) / 0xFFFFFFFF);
  };
}

export class ArenaUI {
  constructor(playerData, onBack) {
    this.playerData  = playerData;
    this.onBack      = onBack;
    this.screen      = document.getElementById('arena-screen');
    this._opponents  = [];
    this._pendingOpp = null;
    this._combatResultCb = null;  // injecté par main.js

    this._bindBack();
  }

  /* ════════════════════════════════
     Injection du combat par main.js
  ════════════════════════════════ */

  /** main.js appelle cette méthode après création pour fournir le launcher de combat. */
  setCombatLauncher(fn) {
    this._launchCombat = fn; // fn(stage, onResult)
  }

  /* ════════════════════════════════
     SHOW / HIDE
  ════════════════════════════════ */

  show() {
    this._buildOpponents();
    this._render();

    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 24 });
    gsap.to(this.screen, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
    audio.play?.('ui_navigate');
  }

  hide() {
    gsap.to(this.screen, {
      opacity: 0, y: 16, duration: 0.28, ease: 'power2.in',
      onComplete: () => { if (this.screen) this.screen.style.display = 'none'; },
    });
  }

  /* ════════════════════════════════
     GÉNÉRATION DES ADVERSAIRES
  ════════════════════════════════ */

  _buildOpponents() {
    const rating  = this.playerData.arenaRating ?? 1000;
    const daySeed = Math.floor(Date.now() / 86_400_000);

    // Pré-mélanger les noms pour le jour avec un seul RNG
    const nameRng    = seededRand(daySeed * 997 + 13);
    const shuffled   = [...FAKE_NAMES].sort(() => nameRng() - 0.5);

    this._opponents = Array.from({ length: 5 }, (_, i) => {
      const r     = seededRand(daySeed * 1031 + i * 137 + (rating | 0) * 7);
      const nameI = i % shuffled.length;
      const diff  = Math.round((r() - 0.4) * 350);
      const oppRating = Math.max(400, rating + diff);

      // Stage pour le combat : varie selon l'index
      const stagePool = STAGES.slice(0, Math.min(STAGES.length, 6));
      const stageIdx  = i % stagePool.length;

      return {
        name:      shuffled[nameI],
        rating:    oppRating,
        tier:      this.playerData._getArenaTier(oppRating),
        stageIdx,
        winBonus:  Math.max(15, Math.round((oppRating - rating) / 20) + 20),
        lossLoss:  10,
      };
    });
  }

  /* ════════════════════════════════
     RENDU
  ════════════════════════════════ */

  _render() {
    if (!this.screen) return;
    const state = this.playerData.getArenaState();

    this.screen.innerHTML = `
      <div id="arena-bg"></div>

      <header id="arena-header">
        <button id="arena-back-btn" class="col-back-btn">
          <span class="col-back-arrow">←</span> HUB
        </button>
        <div id="arena-title-block">
          <span class="arena-kanji">闘</span>
          <h2>ARÈNE</h2>
        </div>
        <div id="arena-player-rating" style="--tier-color:${state.tier.color}">
          <span class="apr-icon">${state.tier.icon}</span>
          <span class="apr-tier">${state.tier.name}</span>
          <span class="apr-rating">${state.rating}</span>
        </div>
      </header>

      <div id="arena-body">

        <!-- Panneau joueur -->
        <div id="arena-player-panel">
          <div class="arp-section-label">MON PROFIL</div>
          <div id="arp-tier-badge" style="--tier-color:${state.tier.color}">
            <span class="arp-tier-icon">${state.tier.icon}</span>
            <span class="arp-tier-name">${state.tier.name}</span>
          </div>
          <div id="arp-rating-display">
            <span class="arp-rating-val">${state.rating}</span>
            <span class="arp-rating-label">POINTS</span>
          </div>
          <div id="arp-wl">
            <div class="arp-wl-block arp-wl-w">
              <span class="arp-wl-val">${state.wins}</span>
              <span class="arp-wl-label">VICTOIRES</span>
            </div>
            <div class="arp-wl-sep">·</div>
            <div class="arp-wl-block arp-wl-l">
              <span class="arp-wl-val">${state.losses}</span>
              <span class="arp-wl-label">DÉFAITES</span>
            </div>
          </div>
          <div id="arp-attempts">
            <span class="arp-att-label">TENTATIVES</span>
            <div class="arp-att-pips">
              ${Array.from({ length: 5 }, (_, i) =>
                `<div class="arp-att-pip ${i < state.attemptsLeft ? 'arp-att-pip--active' : ''}"></div>`
              ).join('')}
            </div>
            <span class="arp-att-val">${state.attemptsLeft}/5 restantes</span>
          </div>
          <div id="arp-next-tier">
            ${this._renderNextTierProgress(state.rating)}
          </div>
          <div class="arp-info-box">
            <div class="arp-info-row"><span class="arp-info-key">Victoire</span><span class="arp-info-val arp-info-pos">+20 pts</span></div>
            <div class="arp-info-row"><span class="arp-info-key">Défaite</span><span class="arp-info-val arp-info-neg">-10 pts</span></div>
            <div class="arp-info-row"><span class="arp-info-key">Reset</span><span class="arp-info-val">Minuit</span></div>
          </div>
        </div>

        <!-- Liste des adversaires -->
        <div id="arena-opponents">
          <div class="arp-section-label">ADVERSAIRES DU JOUR</div>
          <div id="arena-opp-list">
            ${this._opponents.map((opp, i) => this._renderOpponent(opp, i, state.attemptsLeft)).join('')}
          </div>
        </div>

      </div><!-- /arena-body -->
    `;

    this._bindBack();
    this._bindFightButtons();

    // Animation stagger
    gsap.fromTo('#arena-header, #arena-player-panel',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.35, ease: 'power2.out', delay: 0.1 }
    );
    gsap.fromTo('.arena-opp-row',
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, stagger: 0.07, duration: 0.32, ease: 'power2.out', delay: 0.2 }
    );
  }

  _renderNextTierProgress(rating) {
    const tiers = ARENA_TIERS;
    for (let i = 0; i < tiers.length - 1; i++) {
      if (rating < tiers[i + 1].minRating) {
        const from = tiers[i].minRating;
        const to   = tiers[i + 1].minRating;
        const pct  = Math.round(((rating - from) / (to - from)) * 100);
        return `
          <div class="arp-next-label">Prochain rang : <b style="color:${tiers[i+1].color}">${tiers[i+1].icon} ${tiers[i+1].name}</b></div>
          <div class="arp-next-track"><div class="arp-next-fill" style="width:${pct}%;background:${tiers[i+1].color}"></div></div>
          <div class="arp-next-pts">${rating} / ${to} pts</div>
        `;
      }
    }
    return `<div class="arp-next-label" style="color:#ffd700">★ Rang maximum atteint !</div>`;
  }

  _renderOpponent(opp, idx, attemptsLeft) {
    const canFight = attemptsLeft > 0;
    const diff     = opp.rating - (this.playerData.arenaRating ?? 1000);
    const diffStr  = diff > 0 ? `+${diff}` : `${diff}`;
    const diffCls  = diff > 50 ? 'aor-diff--hard' : diff < -50 ? 'aor-diff--easy' : 'aor-diff--mid';

    return `
      <div class="arena-opp-row" data-opp-idx="${idx}">
        <div class="aor-avatar" style="--tc:${opp.tier.color}">${opp.tier.icon}</div>
        <div class="aor-info">
          <div class="aor-name">${opp.name}</div>
          <div class="aor-tier-label" style="color:${opp.tier.color}">${opp.tier.name}</div>
        </div>
        <div class="aor-rating">
          <span class="aor-rating-val">${opp.rating}</span>
          <span class="aor-diff ${diffCls}">${diffStr}</span>
        </div>
        <div class="aor-reward">
          <span class="aor-rew-win">+${opp.winBonus} pts</span>
        </div>
        <button class="aor-fight-btn ${canFight ? '' : 'aor-fight-btn--disabled'}"
                data-opp-idx="${idx}"
                ${canFight ? '' : 'disabled'}>
          ${canFight ? '⚔ DÉFIER' : '—'}
        </button>
      </div>
    `;
  }

  /* ════════════════════════════════
     COMBAT
  ════════════════════════════════ */

  _bindFightButtons() {
    document.querySelectorAll('.aor-fight-btn:not(.aor-fight-btn--disabled)')
      .forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.oppIdx, 10);
          this._challengeOpponent(idx);
        });
      });
  }

  _challengeOpponent(idx) {
    const opp = this._opponents[idx];
    if (!opp) return;
    const state = this.playerData.getArenaState();
    if (state.attemptsLeft <= 0) {
      toast.show('Plus de tentatives aujourd\'hui !', 'warning', { sub: 'Reviens demain à minuit', duration: 3500 });
      return;
    }

    this._pendingOpp = opp;
    audio.play?.('ui_navigate');

    if (!this._launchCombat) {
      // Fallback si launcher pas injecté
      this._onCombatResult('player');
      return;
    }

    // Choisir un stage pour le combat (adapté au niveau de l'adversaire)
    const stage = STAGES[opp.stageIdx] ?? STAGES[0];
    this.hide();
    this._launchCombat(stage, (winner) => {
      this._onCombatResult(winner);
    });
  }

  _onCombatResult(winner) {
    const won = (winner === 'player');
    const opp = this._pendingOpp;
    if (!opp) { this.show(); return; }

    const { newRating, ratingChange } = this.playerData.recordArenaFight(won);
    this._pendingOpp = null;

    const ratingStr = ratingChange >= 0 ? `+${ratingChange}` : `${ratingChange}`;
    const type      = won ? 'reward' : 'warning';
    const title     = won ? `Victoire vs ${opp.name} !` : `Défaite vs ${opp.name}`;
    const sub       = `${ratingStr} pts · Rating : ${newRating}`;

    // Récompense de monnaie en cas de victoire
    if (won) {
      const currReward = 150 + Math.round(opp.winBonus * 3);
      this.playerData.currency += currReward;
      this.playerData._saveProgress();
      toast.show(title, type, { sub: `${sub} · +${currReward} ◈`, duration: 4500 });
    } else {
      toast.show(title, type, { sub, duration: 4000 });
    }

    this.show();
  }

  /* ════════════════════════════════
     BINDINGS
  ════════════════════════════════ */

  _bindBack() {
    const btn = document.getElementById('arena-back-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        audio.play?.('ui_navigate');
        this.hide();
        this.onBack?.();
      });
    }
  }
}
