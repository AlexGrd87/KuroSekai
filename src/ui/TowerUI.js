/**
 * TowerUI.js — Tour Infinie de KuroSekai.
 * Affiche l'état de la tour, les ennemis du prochain étage, les récompenses,
 * et le classement hebdomadaire.
 */

import { gsap }    from 'gsap';
import { audio }   from '../audio/AudioManager.js';
import { toast }   from './ToastUI.js';
import {
  getTierForFloor, getTowerFloorStage, getTowerRewards,
  formatTowerRewards, TOWER_MILESTONES, getTowerLeaderboard, TOWER_TIERS,
} from '../data/tower.js';
import { weekStart } from '../data/weeklyBoss.js'; // réutilise weekStart
import { rollArtifactDrops, formatArtifactDrops } from '../data/artifacts.js';

export class TowerUI {
  constructor(playerData, onBack) {
    this.playerData = playerData;
    this.onBack     = onBack;
    this.screen     = document.getElementById('tower-screen');
    this._launchCombat = null;  // injecté par main.js
  }

  setCombatLauncher(fn) {
    this._launchCombat = fn; // fn(stage, onResult)
  }

  /* ════════════════════════════════
     WEEKLY RESET
  ════════════════════════════════ */

  _resetTowerIfNeeded() {
    const reset = weekStart();
    if ((this.playerData.towerLastReset ?? 0) < reset) {
      this.playerData.towerWeeklyFloor  = this.playerData.towerCurrentFloor - 1;
      this.playerData.towerCurrentFloor = 1;
      this.playerData.towerLastReset    = reset;
      this.playerData._saveProgress();
    }
  }

  /* ════════════════════════════════
     SHOW / HIDE
  ════════════════════════════════ */

  show() {
    this._resetTowerIfNeeded();
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
     RENDU
  ════════════════════════════════ */

  _render() {
    if (!this.screen) return;
    const floor    = this.playerData.towerCurrentFloor ?? 1;
    const best     = this.playerData.towerBestFloor    ?? 0;
    const tier     = getTierForFloor(floor);
    const stage    = getTowerFloorStage(floor);
    const rewards  = getTowerRewards(floor);
    const isBoss   = floor % 10 === 0;
    const lb       = getTowerLeaderboard(Math.max(floor - 1, best));

    // Enemies preview (flatten waves, deduplicate)
    const allEnemyIds = [...new Set(stage.waves.flat())];

    // Next milestone floor
    const nextMilestone = [10, 20, 30, 40, 50].find(m => m >= floor) ?? 50;

    this.screen.innerHTML = `
      <div id="tower-bg" style="--tier-color:${tier.color}"></div>

      <header id="tower-header">
        <button id="tower-back-btn" class="col-back-btn">
          <span class="col-back-arrow">←</span> HUB
        </button>
        <div id="tower-title-block">
          <span class="tower-kanji-deco">塔</span>
          <h2>TOUR INFINIE</h2>
        </div>
        <div id="tower-best-badge">
          <span class="twb-label">RECORD</span>
          <span class="twb-val">${best > 0 ? best : '—'}</span>
        </div>
      </header>

      <div id="tower-body">

        <!-- Colonne gauche : étage + infos -->
        <div id="tower-left">

          <!-- Étage actuel -->
          <div id="tower-floor-display" style="--tc:${tier.color}; --tg:${tier.glow}">
            <div class="tfd-tier-kanji">${tier.kanji}</div>
            <div class="tfd-floor-num">${floor}</div>
            <div class="tfd-tier-name">${tier.name}</div>
            ${isBoss ? '<div class="tfd-boss-tag">⚔ BOSS ⚔</div>' : ''}
          </div>

          <!-- Progression vers le prochain jalon -->
          <div id="tower-milestone-progress">
            <div class="tmp-label">Prochain jalon — Étage ${nextMilestone}</div>
            <div class="tmp-track">
              <div class="tmp-fill" style="width:${_milestoneProgress(floor, nextMilestone)}%;background:${tier.color}"></div>
            </div>
            <div class="tmp-sub">${nextMilestone - floor} étage${nextMilestone - floor !== 1 ? 's' : ''} restant${nextMilestone - floor !== 1 ? 's' : ''}</div>
          </div>

          <!-- Récompenses -->
          <div id="tower-rewards-preview">
            <div class="trp-label">RÉCOMPENSES CET ÉTAGE</div>
            <div class="trp-list">
              <div class="trp-item"><span class="trp-icon">◈</span> ${rewards.currency.toLocaleString()}</div>
              ${rewards.freeRolls     ? `<div class="trp-item trp-milestone"><span class="trp-icon">🔮</span> ${rewards.freeRolls} tirage${rewards.freeRolls > 1 ? 's' : ''}</div>` : ''}
              ${rewards.shard_basic   ? `<div class="trp-item trp-milestone"><span class="trp-icon">💠</span> ${rewards.shard_basic}× Fragment Basique</div>` : ''}
              ${rewards.shard_elite   ? `<div class="trp-item trp-milestone"><span class="trp-icon">🔷</span> ${rewards.shard_elite}× Fragment Élite</div>` : ''}
              ${rewards.crystal_void  ? `<div class="trp-item trp-milestone"><span class="trp-icon">⬛</span> ${rewards.crystal_void}× Cristal du Vide</div>` : ''}
              ${rewards.stone_ascension ? `<div class="trp-item trp-milestone"><span class="trp-icon">🌑</span> ${rewards.stone_ascension}× Pierre d'Ascension</div>` : ''}
            </div>
          </div>

          <!-- Bouton combattre -->
          <button id="tower-fight-btn" style="--tc:${tier.color}">
            <span class="tfb-kanji">戦</span>
            <span class="tfb-label">COMBATTRE<br><small>Étage ${floor}</small></span>
          </button>

        </div>

        <!-- Colonne droite : ennemis + classement -->
        <div id="tower-right">

          <!-- Aperçu des ennemis -->
          <div id="tower-enemies-preview">
            <div class="tep-label">ENNEMIS — ${stage.waves.length} VAGUE${stage.waves.length > 1 ? 'S' : ''}</div>
            <div class="tep-waves">
              ${stage.waves.map((wave, wi) => `
                <div class="tep-wave">
                  <div class="tep-wave-label">Vague ${wi + 1}</div>
                  <div class="tep-wave-enemies">
                    ${wave.map(id => `<div class="tep-enemy-chip">${_enemySymbol(id)} ${_enemyShortName(id)}</div>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Classement hebdomadaire -->
          <div id="tower-leaderboard">
            <div class="tlb-label">CLASSEMENT HEBDO</div>
            <div class="tlb-list">
              ${lb.map((e, i) => `
                <div class="tlb-entry ${e.isPlayer ? 'tlb-entry--player' : ''}">
                  <span class="tlb-rank">#${i + 1}</span>
                  <span class="tlb-name">${e.name}</span>
                  <span class="tlb-floor" style="color:${getTierForFloor(e.floor).color}">
                    Étage ${e.floor}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      </div>
    `;

    this._bindBack();
    this._bindFight();

    // Animations
    gsap.fromTo('#tower-header, #tower-floor-display',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.3, ease: 'power2.out', delay: 0.05 }
    );
    gsap.fromTo('#tower-milestone-progress, #tower-rewards-preview, #tower-fight-btn',
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, stagger: 0.06, duration: 0.3, ease: 'power2.out', delay: 0.15 }
    );
    gsap.fromTo('#tower-enemies-preview, #tower-leaderboard',
      { opacity: 0, x: 16 },
      { opacity: 1, x: 0, stagger: 0.06, duration: 0.3, ease: 'power2.out', delay: 0.15 }
    );
  }

  /* ════════════════════════════════
     COMBAT
  ════════════════════════════════ */

  _bindFight() {
    const btn = document.getElementById('tower-fight-btn');
    if (!btn) return;
    btn.addEventListener('click', () => this._startFight());
  }

  _startFight() {
    const floor = this.playerData.towerCurrentFloor ?? 1;
    const stage = getTowerFloorStage(floor);
    audio.play?.('ui_navigate');
    this.hide();

    if (!this._launchCombat) {
      this._onCombatResult('player', 1);
      return;
    }
    this._launchCombat(stage, (winner, teamHpPct) => {
      this._onCombatResult(winner, teamHpPct ?? 1);
    });
  }

  _onCombatResult(winner, teamHpPct = 1) {
    const floor = this.playerData.towerCurrentFloor ?? 1;
    const tier  = getTierForFloor(floor);

    if (winner === 'player') {
      const rewards = getTowerRewards(floor);
      // Applique les récompenses
      this.playerData.currency += rewards.currency;
      if (rewards.freeRolls)      this.playerData.freeRolls        = (this.playerData.freeRolls ?? 0) + rewards.freeRolls;
      if (rewards.shard_basic)    this.playerData.ascensionMaterials.shard_basic   += rewards.shard_basic;
      if (rewards.shard_elite)    this.playerData.ascensionMaterials.shard_elite   += rewards.shard_elite;
      if (rewards.crystal_void)   this.playerData.ascensionMaterials.crystal_void  += rewards.crystal_void;
      if (rewards.stone_ascension) this.playerData.ascensionMaterials.stone_ascension += rewards.stone_ascension;

      // Progression de l'étage
      this.playerData.towerCurrentFloor = floor + 1;
      if (floor > (this.playerData.towerBestFloor ?? 0)) {
        this.playerData.towerBestFloor = floor;
      }
      this.playerData._saveProgress();

      // Drop d'artefact
      const artDrops = rollArtifactDrops('tower', { floor });
      artDrops.forEach(art => this.playerData.addArtifactToInventory(art));

      const rewardStr = formatTowerRewards(floor);
      const isMilestone = floor % 10 === 0;
      const type = isMilestone ? 'reward' : 'success';
      const artStr = artDrops.length > 0 ? `  ·  ✦ ${formatArtifactDrops(artDrops)}` : '';
      toast.show(
        `${isMilestone ? '🏆 Jalon !' : '✓'} Étage ${floor} — ${tier.name}`,
        type,
        { sub: rewardStr + artStr, duration: isMilestone ? 5000 : 3500 }
      );
    } else {
      toast.show(
        `Étage ${floor} — Défaite`,
        'warning',
        { sub: `Réessaye — tu atteindras l'étage ${floor} !`, duration: 3500 }
      );
    }

    this.show();
  }

  /* ════════════════════════════════
     BINDINGS
  ════════════════════════════════ */

  _bindBack() {
    const btn = document.getElementById('tower-back-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        audio.play?.('ui_navigate');
        this.hide();
        this.onBack?.();
      });
    }
  }
}

/* ── Helpers affichage ── */
function _milestoneProgress(floor, nextMilestone) {
  const prevMilestone = nextMilestone - 10;
  const range = nextMilestone - prevMilestone;
  const progress = floor - prevMilestone;
  return Math.min(100, Math.round((progress / range) * 100));
}

const ENEMY_SYMBOLS = {
  drone_mk1: '⬡', neuro_guard: '⬢', phantom_hacker: '◆', plasma_sentinel: '▲',
  cyber_witch: '✦', shadow_samurai: '刀', tide_crawler: '〜', cyber_oni: '鬼',
  network_spider: '蜘', regen_drone: '✚', void_specter: '幽', arc_sentinel: '⚡',
  iron_colossus: '⛏', null_fragment: '碎', cyber_seraph: '翼', void_herald: '令',
  chrono_breaker: '時', quantum_reaper: '光', storm_titan: '嵐', origin_guardian: '守',
  void_mother: '母', null_sovereign: '無', mech_overlord: '⚙', void_archon: '虚',
  nexus_destroyer: '皇',
};

const ENEMY_SHORT = {
  drone_mk1: 'Drone', neuro_guard: 'Garde', phantom_hacker: 'Fantôme', plasma_sentinel: 'Sentinelle',
  cyber_witch: 'Sorcière', shadow_samurai: 'Samouraï', tide_crawler: 'Rôdeur', cyber_oni: 'Oni',
  network_spider: 'Araignée', regen_drone: 'Médical', void_specter: 'Spectre', arc_sentinel: 'Arc',
  iron_colossus: 'Colosse', null_fragment: 'Fragment', cyber_seraph: 'Séraphin', void_herald: 'Héraut',
  chrono_breaker: 'Briseur', quantum_reaper: 'Faucheur', storm_titan: 'Titan', origin_guardian: 'Gardien',
  void_mother: 'Mère', null_sovereign: 'Souverain', mech_overlord: 'Seigneur', void_archon: 'Archonte',
  nexus_destroyer: 'NEXUS',
};

function _enemySymbol(id)    { return ENEMY_SYMBOLS[id] ?? '?'; }
function _enemyShortName(id) { return ENEMY_SHORT[id]   ?? id;  }
