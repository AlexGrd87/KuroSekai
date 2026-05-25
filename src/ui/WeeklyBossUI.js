/**
 * WeeklyBossUI.js — Boss Hebdomadaire de KuroSekai.
 * Combat de raid contre NEXUS, suivi des dégâts, réclamation des récompenses.
 */

import { gsap }  from 'gsap';
import { audio } from '../audio/AudioManager.js';
import { toast } from './ToastUI.js';
import {
  WEEKLY_BOSS, WEEKLY_BOSS_STAGE, BOSS_MAX_HP, BOSS_REWARD_TIERS,
  calcBossDamage, getBossRewardTier, getBossState, weekStart,
} from '../data/weeklyBoss.js';
import { rollArtifactDrops, formatArtifactDrops } from '../data/artifacts.js';

const _BOSS_TIER_SOURCE = {
  participant:  'boss_tier2',
  challenger:   'boss_tier2',
  conqueror:    'boss_tier3',
  destroyer:    'boss_tier4',
  exterminator: 'boss_tier5',
};

export class WeeklyBossUI {
  constructor(playerData, onBack) {
    this.playerData = playerData;
    this.onBack     = onBack;
    this.screen     = document.getElementById('boss-screen');
    this._launchCombat = null;
    this._pulseInterval = null;
  }

  setCombatLauncher(fn) {
    this._launchCombat = fn;
  }

  /* ════════════════════════════════
     RESET HEBDOMADAIRE
  ════════════════════════════════ */

  _resetBossIfNeeded() {
    const reset = weekStart();
    if ((this.playerData.weeklyBossLastReset ?? 0) < reset) {
      this.playerData.weeklyBossLastReset     = reset;
      this.playerData.weeklyBossDamage        = 0;
      this.playerData.weeklyBossAttempts      = 3;
      this.playerData.weeklyBossRewardClaimed = false;
      this.playerData._saveProgress();
    }
  }

  /* ════════════════════════════════
     SHOW / HIDE
  ════════════════════════════════ */

  show() {
    this._resetBossIfNeeded();
    this._render();
    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 24 });
    gsap.to(this.screen, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
    audio.play?.('ui_navigate');
  }

  hide() {
    clearInterval(this._pulseInterval);
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
    const state   = getBossState(this.playerData);
    const tier    = state.tier;
    const canFight = state.attemptsLeft > 0;
    const canClaim = tier !== null && !state.rewardClaimed;

    // Prochain palier
    const nextTier = BOSS_REWARD_TIERS.find(t => state.totalDamage < t.minDmg) ?? null;

    // Secondes jusqu'au reset du lundi
    const nextReset = weekStart() + 7 * 86_400_000;
    const msLeft    = nextReset - Date.now();
    const daysLeft  = Math.floor(msLeft / 86_400_000);
    const hoursLeft = Math.floor((msLeft % 86_400_000) / 3_600_000);

    this.screen.innerHTML = `
      <div id="boss-bg" style="--boss-color:${WEEKLY_BOSS.color}"></div>

      <header id="boss-header">
        <button id="boss-back-btn" class="col-back-btn">
          <span class="col-back-arrow">←</span> HUB
        </button>
        <div id="boss-title-block">
          <span class="boss-title-kanji">魔</span>
          <h2>BOSS HEBDO</h2>
        </div>
        <div id="boss-reset-timer">
          <span class="brt-label">RESET DANS</span>
          <span class="brt-val">${daysLeft}j ${hoursLeft}h</span>
        </div>
      </header>

      <div id="boss-body">

        <!-- Panneau gauche — Boss art + HP -->
        <div id="boss-left-panel">

          <div id="boss-art">
            <div class="boss-art-kanji" style="color:${WEEKLY_BOSS.color}">${WEEKLY_BOSS.kanji}</div>
            <div class="boss-art-glow" style="background:radial-gradient(ellipse, ${WEEKLY_BOSS.color}33 0%, transparent 70%)"></div>
            <div class="boss-art-particles"></div>
          </div>

          <div id="boss-name-block">
            <div class="boss-name" style="color:${WEEKLY_BOSS.color}">${WEEKLY_BOSS.name}</div>
            <div class="boss-title-text">${WEEKLY_BOSS.title}</div>
          </div>

          <!-- Barre de vie collective -->
          <div id="boss-hp-bar-block">
            <div class="bhb-header">
              <span class="bhb-label">DÉGÂTS TOTAUX</span>
              <span class="bhb-pct" style="color:${WEEKLY_BOSS.color}">${state.hpBarPct}%</span>
            </div>
            <div class="bhb-track">
              <div class="bhb-fill" id="boss-hp-fill"
                   style="width:${state.hpBarPct}%; background: linear-gradient(90deg, ${WEEKLY_BOSS.glow}, ${WEEKLY_BOSS.color})"></div>
              ${BOSS_REWARD_TIERS.map(t => {
                const pct = Math.round((t.minDmg / BOSS_MAX_HP) * 100);
                return `<div class="bhb-marker" style="left:${pct}%; border-color:${t.color}" title="${t.label}"></div>`;
              }).join('')}
            </div>
            <div class="bhb-numbers">
              <span>${state.totalDamage.toLocaleString()}</span>
              <span>${BOSS_MAX_HP.toLocaleString()}</span>
            </div>
          </div>

          <!-- Tentatives -->
          <div id="boss-attempts">
            <span class="ba-label">TENTATIVES</span>
            <div class="ba-pips">
              ${Array.from({ length: 3 }, (_, i) =>
                `<div class="ba-pip ${i < state.attemptsLeft ? 'ba-pip--active' : ''}"></div>`
              ).join('')}
            </div>
            <span class="ba-val">${state.attemptsLeft}/3</span>
          </div>

          <!-- Boutons action -->
          <div id="boss-actions">
            <button id="boss-fight-btn" class="${canFight ? '' : 'boss-btn--disabled'}" ${canFight ? '' : 'disabled'}>
              <span class="bfb-icon">⚔</span>
              <span class="bfb-label">${canFight ? 'ATTAQUER' : 'ÉPUISÉ'}</span>
            </button>
            <button id="boss-claim-btn" class="${canClaim ? 'boss-claim--active' : 'boss-btn--disabled'}" ${canClaim ? '' : 'disabled'}>
              <span class="bcb-icon">🎁</span>
              <span class="bcb-label">${state.rewardClaimed ? 'RÉCLAMÉ' : 'RÉCOMPENSE'}</span>
            </button>
          </div>

        </div>

        <!-- Panneau droit — Paliers de récompenses -->
        <div id="boss-right-panel">

          <div class="brp-section-label">PALIERS DE RÉCOMPENSES</div>

          ${BOSS_REWARD_TIERS.map(t => {
            const reached   = state.totalDamage >= t.minDmg;
            const isCurrent = tier?.id === t.id;
            const pct       = Math.round((t.minDmg / BOSS_MAX_HP) * 100);
            return `
              <div class="boss-tier-row ${reached ? 'boss-tier-row--reached' : ''} ${isCurrent ? 'boss-tier-row--current' : ''}"
                   style="--btc:${t.color}">
                <div class="btr-left">
                  <span class="btr-kanji" style="color:${t.color}">${t.kanji}</span>
                  <div class="btr-info">
                    <div class="btr-name">${t.label}</div>
                    <div class="btr-threshold">${t.minDmg.toLocaleString()} dégâts (${pct}%)</div>
                  </div>
                </div>
                <div class="btr-reward">${t.desc}</div>
                ${reached ? '<div class="btr-check">✓</div>' : ''}
              </div>
            `;
          }).join('')}

          <!-- Prochain palier -->
          ${nextTier ? `
            <div id="boss-next-tier">
              <span class="bnt-label">Prochain palier</span>
              <span class="bnt-name" style="color:${nextTier.color}">${nextTier.label}</span>
              <span class="bnt-delta">+${(nextTier.minDmg - state.totalDamage).toLocaleString()} dégâts</span>
            </div>
          ` : `
            <div id="boss-maxed">
              <span style="color:${WEEKLY_BOSS.color}">★ Dégâts maximum atteints ! ★</span>
            </div>
          `}

          <!-- Lore -->
          <div id="boss-lore">
            <div class="bl-title">RAPPORT D'INTELLIGENCE</div>
            <div class="bl-text">${WEEKLY_BOSS.lore}</div>
          </div>

        </div>

      </div>
    `;

    this._bindBack();
    this._bindFight();
    this._bindClaim();
    this._animateEntrance();
  }

  _animateEntrance() {
    gsap.fromTo('#boss-header',
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
    gsap.fromTo('.boss-art-kanji',
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.8)', delay: 0.1 }
    );
    gsap.fromTo('#boss-name-block, #boss-hp-bar-block, #boss-attempts, #boss-actions',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.3, ease: 'power2.out', delay: 0.2 }
    );
    gsap.fromTo('.boss-tier-row',
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, stagger: 0.05, duration: 0.25, ease: 'power2.out', delay: 0.2 }
    );
    // Pulse du kanji boss
    gsap.to('.boss-art-kanji', {
      textShadow: `0 0 40px ${WEEKLY_BOSS.color}, 0 0 80px ${WEEKLY_BOSS.color}`,
      duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut',
    });
    // Animated HP bar fill
    const fill = document.getElementById('boss-hp-fill');
    if (fill) {
      const target = fill.style.width;
      fill.style.width = '0%';
      gsap.to(fill, { width: target, duration: 0.8, ease: 'power2.out', delay: 0.3 });
    }
  }

  /* ════════════════════════════════
     COMBAT
  ════════════════════════════════ */

  _bindFight() {
    const btn = document.getElementById('boss-fight-btn');
    if (!btn || btn.disabled) return;
    btn.addEventListener('click', () => {
      audio.play?.('ui_navigate');
      this.hide();
      if (!this._launchCombat) {
        this._onCombatResult('player', 0.8);
        return;
      }
      this._launchCombat(WEEKLY_BOSS_STAGE, (winner, teamHpPct) => {
        this._onCombatResult(winner, teamHpPct ?? 0);
      });
    });
  }

  _onCombatResult(winner, teamHpPct = 0) {
    const dmg = calcBossDamage(winner, teamHpPct);
    this.playerData.weeklyBossDamage  = Math.min(
      BOSS_MAX_HP,
      (this.playerData.weeklyBossDamage ?? 0) + dmg
    );
    this.playerData.weeklyBossAttempts = Math.max(
      0,
      (this.playerData.weeklyBossAttempts ?? 3) - 1
    );
    this.playerData._saveProgress();

    // Quest tracking + XP de compte
    this.playerData.incrementQuest?.('COMBAT_WIN', 1);
    if (winner === 'player') this.playerData.incrementQuest?.('STAGE_COMPLETE', 1);
    this.playerData.addAccountXP?.('BOSS_FIGHT');

    const tier = getBossRewardTier(this.playerData.weeklyBossDamage);
    const type = winner === 'player' ? 'reward' : 'warning';
    const msg  = winner === 'player'
      ? `Vague repoussée ! +${dmg.toLocaleString()} dégâts`
      : `Défaite − ${dmg.toLocaleString()} dégâts quand même`;
    toast.show(msg, type, {
      sub: tier ? `Palier atteint : ${tier.label}` : `Total : ${this.playerData.weeklyBossDamage.toLocaleString()}`,
      duration: 4000,
    });

    this.refreshBadge();
    this.show();
  }

  /** Met à jour le badge sur le bouton hub. */
  refreshBadge() {
    const badge = document.getElementById('hub-boss-badge');
    if (!badge) return;
    const state    = getBossState(this.playerData);
    const canClaim = state.tier !== null && !state.rewardClaimed;
    const hasAttempts = state.attemptsLeft > 0;
    badge.style.display = (canClaim || hasAttempts) ? 'block' : 'none';
    badge.textContent   = canClaim ? '!' : state.attemptsLeft;
  }

  /* ════════════════════════════════
     RÉCLAMER RÉCOMPENSE
  ════════════════════════════════ */

  _bindClaim() {
    const btn = document.getElementById('boss-claim-btn');
    if (!btn || btn.disabled) return;
    btn.addEventListener('click', () => {
      const tier = getBossRewardTier(this.playerData.weeklyBossDamage ?? 0);
      if (!tier) return;

      const r = tier.rewards;
      if (r.currency)  this.playerData.currency = (this.playerData.currency ?? 0) + r.currency;
      if (r.freeRolls) this.playerData.addFreeRolls(r.freeRolls);
      const matR = {};
      if (r.shard_basic)  matR.shard_basic  = r.shard_basic;
      if (r.shard_elite)  matR.shard_elite  = r.shard_elite;
      if (r.crystal_void) matR.crystal_void = r.crystal_void;
      if (Object.keys(matR).length > 0) this.playerData.addAscensionMaterials(matR);

      this.playerData.weeklyBossRewardClaimed = true;
      this.playerData._saveProgress();

      // Drop d'artefact selon le palier
      const dropSrc  = _BOSS_TIER_SOURCE[tier.id] ?? 'boss_tier2';
      const artDrops = rollArtifactDrops(dropSrc);
      artDrops.forEach(art => this.playerData.addArtifactToInventory(art));

      audio.play?.('level_up');
      const artStr = artDrops.length > 0 ? `  ·  ✦ ${formatArtifactDrops(artDrops)}` : '';
      toast.show(
        `🎁 ${tier.label} — Récompense réclamée !`,
        'reward',
        { sub: tier.desc + artStr, duration: 5000 }
      );
      this._render();
    });
  }

  /* ════════════════════════════════
     BINDING RETOUR
  ════════════════════════════════ */

  _bindBack() {
    const btn = document.getElementById('boss-back-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        audio.play?.('ui_navigate');
        this.hide();
        this.onBack?.();
      });
    }
  }
}
