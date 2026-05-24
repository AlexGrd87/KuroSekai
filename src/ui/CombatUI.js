/**
 * CombatUI.js
 * Interface du combat tour par tour de KuroSekai.
 *
 * Gère : affichage des unités, HP bars, actions joueur,
 *        tour ennemi automatique, dégâts flottants, résultat.
 */

import { gsap }             from 'gsap';
import { CombatEngine }     from '../engine/CombatEngine.js';
import { STAGES }           from '../data/enemies.js';
import { RARITIES }         from '../data/characters.js';
import { settings }         from '../data/Settings.js';
import { buildPortraitSVG } from './portrait.js';
import { audio }            from '../audio/AudioManager.js';

const ELEMENT_DATA = {
  Fire:    { color: '#ff5500', glow: '#ff2200' },
  Dark:    { color: '#8800ff', glow: '#5500cc' },
  Wind:    { color: '#00cc66', glow: '#00ff88' },
  Water:   { color: '#0099cc', glow: '#00ccff' },
  Thunder: { color: '#cccc00', glow: '#ffff00' },
  Earth:   { color: '#886600', glow: '#bbaa00' },
  Light:   { color: '#ccccff', glow: '#ffffff' },
  Void:    { color: '#cc00ff', glow: '#880099' },
  Neutral: { color: '#99aacc', glow: '#667799' },
};

export class CombatUI {
  constructor(onBack) {
    this.onBack         = onBack;
    this.screen         = document.getElementById('combat-screen');
    this.engine         = null;
    this._currentStage  = null;
    this._pickingTarget = false;
    this._pendingAction = null;   // { type: 'attack'|'skill', skillIndex }
    this._autoMode      = false;
    this._speedMult     = 1;      // 1 | 2 | 3

    document.getElementById('combat-result-back')?.addEventListener('click', () => this._endCombat());
  }

  /* ════════════════════════════════
     DÉMARRAGE
  ════════════════════════════════ */

  start(team, stage = null) {
    this._currentStage  = stage;
    this._waveIndex     = 0;
    this._team          = team;
    this._autoMode      = false;
    this._speedMult     = 1;
    const enemyIds = stage?.waves[0] ?? [];
    this.engine = new CombatEngine(team, enemyIds);

    // Réinitialise les listeners avant de re-binder (évite le double-bind)
    this._unbindActions();
    this._renderAll();
    this._bindActions();

    // Reset du log
    const log = document.getElementById('combat-log');
    if (log) log.innerHTML = '';
    document.getElementById('combat-result').style.display = 'none';

    // Affichage
    this.screen.style.display  = 'flex';
    this.screen.style.opacity  = '0';
    gsap.killTweensOf(this.screen);
    gsap.to(this.screen, { opacity: 1, duration: 0.5, ease: 'power2.out' });

    // Reset auto + vitesse dans l'UI
    this._updateAutoUI();
    document.querySelectorAll('.combat-speed-btn').forEach(btn =>
      btn.classList.toggle('combat-speed-btn--active', btn.dataset.speed === '1')
    );

    const stageName = stage?.name ?? 'Combat';
    this._addLog(`⚔ Début du combat — ${stageName}`, 'round');
    this._updateWaveIndicator();
    this._updateTurnUI();

    // Si l'ennemi commence (SPD plus élevé)
    if (this.engine.currentUnit?.side === 'enemy') {
      setTimeout(() => this._doEnemyTurn(), settings.enemyDelay);
    }
  }

  /* ════════════════════════════════
     RENDU DES UNITÉS
  ════════════════════════════════ */

  _renderAll() {
    this._renderSide('enemy');
    this._renderSide('player');
  }

  _renderSide(side) {
    const row   = document.getElementById(`combat-${side === 'player' ? 'player' : 'enemies'}-row`);
    const units = side === 'player' ? this.engine.playerUnits : this.engine.enemyUnits;
    row.innerHTML = '';

    units.forEach(unit => {
      const el  = ELEMENT_DATA[unit.element] || ELEMENT_DATA.Neutral;
      const div = document.createElement('div');
      div.className   = `combat-unit combat-unit--${side}`;
      div.dataset.uid = unit.uid;

      const portraitContent = unit.side === 'player'
        ? buildPortraitSVG(unit, 'combat')
        : `<span class="cu-symbol">${unit.symbol || unit.name[0]}</span>`;

      div.innerHTML = `
        <div class="cu-portrait" style="--el:${el.color};--glow:${el.glow}">
          ${portraitContent}
          ${unit.shield > 0 ? `<span class="cu-shield-icon">🛡</span>` : ''}
        </div>
        <div class="cu-info">
          <div class="cu-name">
            ${unit.name}
            ${unit.side === 'player' ? `<span class="unit-level-badge">Lv.${unit.level ?? 1}</span>` : ''}
          </div>
          <div class="cu-hp-bar-wrap">
            <div class="cu-hp-bar" style="width:100%;background:${el.color}"></div>
          </div>
          <div class="cu-hp-text">${unit.hp.toLocaleString()} / ${unit.maxHp.toLocaleString()}</div>
          <div class="cu-statuses"></div>
        </div>
      `;

      if (side === 'enemy') {
        div.addEventListener('click', () => this._onTargetClick(unit));
      }

      row.appendChild(div);

      // Animation d'entrée
      gsap.fromTo(div,
        { opacity: 0, y: side === 'enemy' ? -20 : 20 },
        { opacity: 1, y: 0, duration: 0.4, delay: units.indexOf(unit) * 0.1, ease: 'power2.out' }
      );
    });
  }

  /* ════════════════════════════════
     MISE À JOUR HP + STATUTS
  ════════════════════════════════ */

  _updateUnit(unit) {
    const div = document.querySelector(`[data-uid="${unit.uid}"]`);
    if (!div) return;

    const pct = Math.max(0, (unit.hp / unit.maxHp) * 100);
    const bar = div.querySelector('.cu-hp-bar');
    if (bar) {
      gsap.to(bar, { width: `${pct}%`, duration: 0.4, ease: 'power2.out' });
      // Couleur selon seuil
      if (pct < 25)      bar.style.background = '#ff2200';
      else if (pct < 50) bar.style.background = '#ffaa00';
    }

    const txt = div.querySelector('.cu-hp-text');
    if (txt) txt.textContent = `${unit.hp.toLocaleString()} / ${unit.maxHp.toLocaleString()}`;

    // Statuts actifs
    const statusDiv = div.querySelector('.cu-statuses');
    if (statusDiv) {
      const META = this.engine.STATUS_META;
      let html = unit.statuses.map(s => {
        const m = META[s.type] || { icon: '?', color: '#fff' };
        return `<span class="cu-status-badge" style="--sc:${m.color}" title="${m.label}">${m.icon}<sup>${s.duration}</sup></span>`;
      }).join('');
      if (unit.shield > 0) {
        const pct = Math.round(unit.shield / unit.maxHp * 100);
        html += `<span class="cu-status-badge" style="--sc:#00aaff" title="Bouclier ${pct}%">🛡<sup>${pct}%</sup></span>`;
      }
      statusDiv.innerHTML = html;
    }

    if (!unit.alive) {
      div.classList.add('combat-unit--dead');
    }
  }

  /* ════════════════════════════════
     NOMBRE DE DÉGÂTS FLOTTANT
  ════════════════════════════════ */

  _floatDamage(targetUid, dmg, type = 'damage') {
    const div = document.querySelector(`[data-uid="${targetUid}"]`);
    if (!div) return;

    const num = document.createElement('div');
    num.className   = `float-dmg float-dmg--${type}`;
    num.textContent = type === 'heal' ? `+${dmg.toLocaleString()}` : `-${dmg.toLocaleString()}`;
    document.getElementById('combat-screen').appendChild(num);

    const rect       = div.getBoundingClientRect();
    const screenRect = document.getElementById('combat-screen').getBoundingClientRect();
    const jitter     = (Math.random() - 0.5) * 20;
    num.style.left   = `${rect.left - screenRect.left + rect.width / 2 + jitter}px`;
    num.style.top    = `${rect.top  - screenRect.top  + rect.height * 0.25}px`;

    const isCrit  = type === 'crit';
    const riseY   = isCrit ? -70 : -50;
    const dur     = (isCrit ? 1.4 : 1.1) / this._speedMult;

    gsap.fromTo(num,
      { opacity: 1, y: 0, scale: isCrit ? 1.5 : 1.2 },
      { opacity: 0, y: riseY, scale: 0.85, duration: dur, ease: 'power2.out',
        onComplete: () => num.remove() }
    );
  }

  /* ════════════════════════════════
     ACTIONS JOUEUR
  ════════════════════════════════ */

  _bindActions() {
    this._onAtk  = () => { audio.play('ui_click'); this._pendingAction = { type: 'attack' };               this._enterTargetMode(); };
    this._onSk1  = () => { audio.play('skill_activate'); this._pendingAction = { type: 'skill', skillIndex: 0 }; this._enterTargetMode(); };
    this._onSk2  = () => { audio.play('skill_activate'); this._pendingAction = { type: 'skill', skillIndex: 1 }; this._enterTargetMode(); };
    document.getElementById('cbtn-attack')?.addEventListener('click', this._onAtk);
    document.getElementById('cbtn-skill1')?.addEventListener('click', this._onSk1);
    document.getElementById('cbtn-skill2')?.addEventListener('click', this._onSk2);

    // AUTO toggle
    this._onAuto = () => {
      this._autoMode = !this._autoMode;
      this._updateAutoUI();
      if (this._autoMode && this.engine.currentUnit?.side === 'player') {
        this._lockActions(true);
        setTimeout(() => this._autoPlayerTurn(), this._autoDelay());
      }
    };
    document.getElementById('cbtn-auto')?.addEventListener('click', this._onAuto);

    // Vitesse ×1 / ×2 / ×3
    this._onSpeed = (e) => {
      const btn = e.currentTarget;
      this._speedMult = parseInt(btn.dataset.speed) || 1;
      document.querySelectorAll('.combat-speed-btn').forEach(b =>
        b.classList.toggle('combat-speed-btn--active', b === btn)
      );
    };
    document.querySelectorAll('.combat-speed-btn').forEach(btn => {
      btn.addEventListener('click', this._onSpeed);
    });
  }

  _unbindActions() {
    if (this._onAtk) document.getElementById('cbtn-attack')?.removeEventListener('click', this._onAtk);
    if (this._onSk1) document.getElementById('cbtn-skill1')?.removeEventListener('click', this._onSk1);
    if (this._onSk2) document.getElementById('cbtn-skill2')?.removeEventListener('click', this._onSk2);
    if (this._onAuto) document.getElementById('cbtn-auto')?.removeEventListener('click', this._onAuto);
    if (this._onSpeed) document.querySelectorAll('.combat-speed-btn').forEach(btn =>
      btn.removeEventListener('click', this._onSpeed)
    );
    this._onAtk = this._onSk1 = this._onSk2 = this._onAuto = this._onSpeed = null;
  }

  _enterTargetMode() {
    this._pickingTarget = true;
    document.getElementById('combat-target-prompt').style.display = 'block';
    document.querySelectorAll('.combat-unit--enemy:not(.combat-unit--dead)').forEach(el => {
      el.classList.add('combat-unit--targetable');
    });
  }

  _exitTargetMode() {
    this._pickingTarget = false;
    document.getElementById('combat-target-prompt').style.display = 'none';
    document.querySelectorAll('.combat-unit--targetable').forEach(el => {
      el.classList.remove('combat-unit--targetable');
    });
  }

  _onTargetClick(targetUnit) {
    if (!this._pickingTarget || !this._pendingAction) return;
    if (!targetUnit.alive) return;

    this._exitTargetMode();
    const actor  = this.engine.currentUnit;
    if (!actor || actor.side !== 'player') return;

    let result;
    if (this._pendingAction.type === 'attack') {
      const dmg = this.engine.basicAttack(actor.uid, targetUnit.uid);
      if (dmg) this._applyResult(actor, targetUnit, dmg.dmg ?? dmg, null);
    } else {
      const r = this.engine.useSkill(actor.uid, this._pendingAction.skillIndex, targetUnit.uid);
      if (r?.results) {
        const isAoe = r.results.length > 1;
        if (isAoe) this._skillVFX(actor.element);
        r.results.forEach(({ target, dmg }, i) =>
          this._applyResult(actor, target, dmg, null,
            isAoe ? { aoe: true, aoeDelay: i * 30 } : null)
        );
      }
    }

    this._pendingAction = null;
    this._addLog(this.engine.log[this.engine.log.length - 1]?.msg || '');
    this._flushPassives();
    this._updateSkillButtons(this.engine.currentUnit);

    if (this.engine.over) { this._showResult(); return; }

    if (this.engine.currentUnit?.side === 'enemy') {
      this._lockActions(true);
      setTimeout(() => this._doEnemyTurn(), this._autoDelay());
    } else if (this._autoMode) {
      setTimeout(() => this._autoPlayerTurn(), this._autoDelay());
    } else {
      this._updateTurnUI();
    }
  }

  /* ════════════════════════════════
     TOUR ENNEMI
  ════════════════════════════════ */

  _doEnemyTurn() {
    if (this.engine.over) return;
    const unit = this.engine.currentUnit;
    if (!unit || unit.side !== 'enemy') {
      this._lockActions(false);
      this._updateTurnUI();
      return;
    }

    this._highlightUnit(unit.uid);
    const result = this.engine.doEnemyTurn();

    if (result?.results) {
      const isAoe = result.results.length > 1;
      if (isAoe) this._skillVFX(unit.element);
      result.results.forEach(({ target, dmg }, i) => {
        if (target && dmg !== undefined) {
          this._applyResult(unit, target, dmg, null,
            isAoe ? { aoe: true, aoeDelay: i * 30 } : null);
        }
      });
    }

    const lastLog = this.engine.log[this.engine.log.length - 1];
    if (lastLog) this._addLog(lastLog.msg, lastLog.tag);
    this._flushPassives();

    if (this.engine.over) { this._showResult(); return; }

    if (this.engine.currentUnit?.side === 'enemy') {
      setTimeout(() => this._doEnemyTurn(), this._autoDelay(settings.enemyChainDelay));
    } else if (this._autoMode) {
      setTimeout(() => this._autoPlayerTurn(), this._autoDelay());
    } else {
      this._lockActions(false);
      this._updateTurnUI();
    }
  }

  /* ════════════════════════════════
     AUTO-COMBAT
  ════════════════════════════════ */

  _autoPlayerTurn() {
    if (!this._autoMode || this.engine.over) return;
    const actor = this.engine.currentUnit;
    if (!actor || actor.side !== 'player' || !actor.alive) return;

    this._highlightUnit(actor.uid);

    const enemies = this.engine.enemyUnits.filter(u => u.alive);
    if (!enemies.length) return;

    // Cible prioritaire : le plus faible
    const target = [...enemies].sort((a, b) => a.hp - b.hp)[0];

    // Choisit le meilleur skill disponible (multiplier max, hors self si HP > 40%)
    let bestIdx  = -1;
    let bestMult = -1;
    actor.skills.forEach((s, i) => {
      if (actor.skillCooldowns[i] > 0) return;
      // Skill de soin/bouclier : utiliser si PV < 40%
      if (s.target === 'self') {
        if (actor.hp < actor.maxHp * 0.4 && bestIdx === -1) bestIdx = i;
        return;
      }
      if ((s.multiplier || 0) > bestMult) {
        bestMult = s.multiplier;
        bestIdx  = i;
      }
    });

    if (bestIdx >= 0) {
      const r = this.engine.useSkill(actor.uid, bestIdx, target.uid);
      if (r?.results) {
        const isAoe = r.results.length > 1;
        if (isAoe) this._skillVFX(actor.element);
        r.results.forEach(({ target: t, dmg }, i) => {
          if (t && dmg !== undefined) this._applyResult(actor, t, dmg, null,
            isAoe ? { aoe: true, aoeDelay: i * 30 } : null);
        });
      }
    } else {
      const entry = this.engine.basicAttack(actor.uid, target.uid);
      if (entry) this._applyResult(actor, target, entry.dmg ?? 0, null);
    }

    const lastLog = this.engine.log[this.engine.log.length - 1];
    if (lastLog) this._addLog(lastLog.msg, lastLog.tag);
    this._flushPassives();
    this._updateSkillButtons(this.engine.currentUnit);

    if (this.engine.over) { this._showResult(); return; }

    if (this.engine.currentUnit?.side === 'enemy') {
      setTimeout(() => this._doEnemyTurn(), this._autoDelay());
    } else if (this._autoMode) {
      setTimeout(() => this._autoPlayerTurn(), this._autoDelay());
    } else {
      this._lockActions(false);
      this._updateTurnUI();
    }
  }

  _autoDelay(base = null) {
    const b = base ?? settings.enemyDelay;
    return Math.max(80, Math.round(b / this._speedMult));
  }

  /* ════════════════════════════════
     HELPERS VISUELS
  ════════════════════════════════ */

  /**
   * Applique un résultat de combat avec animations :
   *  - Lunge de l'attaquant (single target)
   *  - Hit flash + damage number au moment de l'impact
   *  - Effets spéciaux selon crit / AoE
   * @param {object}  source
   * @param {object}  target
   * @param {number}  dmg
   * @param {string}  tag
   * @param {object}  extra  { aoe: bool, aoeDelay: ms }
   */
  _applyResult(source, target, dmg, tag, extra = null) {
    const isCrit = this.engine.log.slice(-3).some(e => e.tag === 'crit');
    const isAoe  = extra?.aoe ?? false;
    const delay  = extra?.aoeDelay ?? 0;

    const doHit = () => {
      // Flash portrait
      this._hitFlash(target.uid, isCrit);
      // Mise à jour HP bar
      this._updateUnit(target);
      // Nombre flottant + SFX
      if (dmg > 0) {
        this._floatDamage(target.uid, dmg, isCrit ? 'crit' : 'damage');
        audio.play(isCrit ? 'hit_crit' : 'hit_normal');
        if (isCrit) this._screenShake();
      }
      // Shake (sauf unité morte — remplacé par deathEffect)
      if (target.alive) {
        this._shakeUnit(target.uid, source.side === 'enemy');
      } else {
        setTimeout(() => {
          audio.play('unit_ko');
          this._deathEffect(target.uid, target.element);
        }, 80 / this._speedMult);
      }
    };

    if (isAoe) {
      // AoE : pas de lunge, impact décalé par index
      setTimeout(doHit, delay / this._speedMult);
    } else {
      // Single target : lunge vers la cible
      this._attackLunge(source.uid, target.uid, doHit);
    }
  }

  /** Animation de lunge : l'attaquant s'élance vers la cible puis revient. */
  _attackLunge(sourceUid, targetUid, onImpact) {
    const srcEl = document.querySelector(`[data-uid="${sourceUid}"]`);
    if (!srcEl) { onImpact?.(); return; }

    const tgtEl = document.querySelector(`[data-uid="${targetUid}"]`);
    let lungeX = 0, lungeY = 0;

    if (tgtEl) {
      const sr = srcEl.getBoundingClientRect();
      const tr = tgtEl.getBoundingClientRect();
      const dx = (tr.left + tr.width  / 2) - (sr.left + sr.width  / 2);
      const dy = (tr.top  + tr.height / 2) - (sr.top  + sr.height / 2);
      const dist   = Math.sqrt(dx * dx + dy * dy) || 1;
      const factor = Math.min(0.38, 90 / dist);
      lungeX = dx * factor;
      lungeY = dy * factor;
    } else {
      // Pas de cible précise (AoE self) : petit hop vertical
      lungeY = srcEl.closest('#combat-player-row') ? -18 : 18;
    }

    const spd = this._speedMult;
    gsap.timeline()
      .to(srcEl, { x: lungeX, y: lungeY, duration: 0.11 / spd, ease: 'power2.in' })
      .call(() => onImpact?.())
      .to(srcEl, { x: 0, y: 0, duration: 0.22 / spd, ease: 'power3.out' });
  }

  /** Flash lumineux sur le portrait au moment de l'impact. */
  _hitFlash(targetUid, isCrit = false) {
    const portrait = document.querySelector(`[data-uid="${targetUid}"] .cu-portrait`);
    if (!portrait) return;
    const cls = isCrit ? 'is-hit-crit' : 'is-hit';
    portrait.classList.remove('is-hit', 'is-hit-crit');
    // Force reflow pour que l'animation rejoue
    void portrait.offsetWidth;
    portrait.classList.add(cls);
    setTimeout(() => portrait.classList.remove(cls),
      (isCrit ? 220 : 180) / this._speedMult);
  }

  /** Effet de mort : grayscale + particules élémentaires. */
  _deathEffect(uid, element) {
    const el     = document.querySelector(`[data-uid="${uid}"]`);
    const elData = ELEMENT_DATA[element] || ELEMENT_DATA.Neutral;
    if (el) {
      gsap.to(el, {
        opacity: 0.2,
        scale: 0.88,
        filter: 'grayscale(1) brightness(0.35)',
        duration: 0.45 / this._speedMult,
        ease: 'power2.out',
      });
    }
    // Burst de 7 particules
    const screen     = document.getElementById('combat-screen');
    const screenRect = screen.getBoundingClientRect();
    const ref        = el ?? screen;
    const refRect    = ref.getBoundingClientRect();
    const cx = refRect.left - screenRect.left + refRect.width  / 2;
    const cy = refRect.top  - screenRect.top  + refRect.height / 2;

    for (let i = 0; i < 7; i++) {
      const p = document.createElement('div');
      p.className = 'death-particle';
      p.style.setProperty('--dc', elData.color);
      p.style.left = `${cx + (Math.random() - 0.5) * 16}px`;
      p.style.top  = `${cy + (Math.random() - 0.5) * 16}px`;
      screen.appendChild(p);
      gsap.to(p, {
        x: (Math.random() - 0.5) * 70,
        y: (Math.random() - 0.5) * 60 - 20,
        opacity: 0,
        scale: Math.random() * 1.5 + 0.3,
        duration: (0.45 + Math.random() * 0.35) / this._speedMult,
        delay: i * 0.025,
        ease: 'power2.out',
        onComplete: () => p.remove(),
      });
    }
  }

  /** Flash radial coloré en overlay (skill élémentaire). */
  _skillVFX(element) {
    const elData  = ELEMENT_DATA[element] || ELEMENT_DATA.Neutral;
    const overlay = document.createElement('div');
    overlay.className = 'skill-vfx-overlay';
    overlay.style.setProperty('--el', elData.color);
    this.screen.appendChild(overlay);
    const dur = 0.15 / this._speedMult;
    gsap.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: dur, yoyo: true, repeat: 1, ease: 'power2.inOut',
        onComplete: () => overlay.remove() }
    );
  }

  /** Micro-tremblement de l'écran pour les coups critiques. */
  _screenShake() {
    const spd = this._speedMult;
    gsap.timeline()
      .to(this.screen, { x: -7, duration: 0.03 / spd })
      .to(this.screen, { x:  6, duration: 0.03 / spd })
      .to(this.screen, { x: -4, duration: 0.03 / spd })
      .to(this.screen, { x:  0, duration: 0.03 / spd });
  }

  /** Traite les événements passifs enregistrés par CombatEngine (heal, crit…) */
  _flushPassives() {
    if (!this.engine?.pendingPassives?.length) return;
    for (const ev of this.engine.pendingPassives) {
      if (ev.type === 'heal') {
        this._floatDamage(ev.uid, ev.amount, 'heal');
        audio.play('heal');
        const u = this.engine.playerUnits.find(u => u.uid === ev.uid);
        if (u) this._updateUnit(u);
        const logEntry = this.engine.log.find(e => e.tag === 'heal' &&
          e.target === u?.name && !e._displayed);
        if (logEntry) { logEntry._displayed = true; this._addLog(logEntry.msg, 'heal'); }
      }
    }
    this.engine.pendingPassives = [];
  }

  _highlightUnit(uid) {
    document.querySelectorAll('.combat-unit--active').forEach(el => el.classList.remove('combat-unit--active'));
    document.querySelector(`[data-uid="${uid}"]`)?.classList.add('combat-unit--active');
  }

  _shakeUnit(uid, strong = false) {
    const div = document.querySelector(`[data-uid="${uid}"]`);
    if (!div) return;
    gsap.to(div, { x: strong ? -12 : -6, duration: 0.04, yoyo: true, repeat: strong ? 7 : 4,
      onComplete: () => gsap.set(div, { x: 0 }) });
  }

  _updateTurnUI() {
    const unit = this.engine.currentUnit;
    if (!unit) return;
    document.getElementById('combat-turn-name').textContent = unit.name;
    this._highlightUnit(unit.uid);
    this._updateSkillButtons(unit);
    this._updateTurnQueue();
    const isPlayerTurn = unit.side === 'player';
    this._lockActions(!isPlayerTurn || this._autoMode);
  }

  _updateTurnQueue() {
    const wrap = document.getElementById('combat-turn-queue');
    if (!wrap || !this.engine) return;
    const upcoming = this.engine.getUpcoming(4);
    const ELCOL = {
      Fire:'#ff5500', Dark:'#8800ff', Wind:'#00cc66', Water:'#0099cc',
      Thunder:'#cccc00', Earth:'#886600', Light:'#ccccff',
      Void:'#cc00ff', Neutral:'#99aacc',
    };
    wrap.innerHTML = upcoming.map(u => {
      const c = ELCOL[u.element] || '#99aacc';
      const icon = u.side === 'player' ? '◈' : '◆';
      return `<span class="tq-chip tq-chip--${u.side}" style="--tc:${c}"
                    title="${u.name}">${icon} ${u.name.length > 6 ? u.name.slice(0,6)+'…' : u.name}</span>`;
    }).join('');
  }

  _updateAutoUI() {
    const btn = document.getElementById('cbtn-auto');
    if (!btn) return;
    btn.classList.toggle('combat-auto-btn--on', this._autoMode);
    btn.textContent = this._autoMode ? '⏹ AUTO ON' : '▶ AUTO';
    // Verrouille/déverrouille les boutons d'action
    if (!this._autoMode && this.engine.currentUnit?.side === 'player') {
      this._lockActions(false);
      this._updateTurnUI();
    }
  }

  _lockActions(locked) {
    document.querySelectorAll('.combat-btn').forEach(btn => {
      btn.disabled = locked;
    });
  }

  _updateSkillButtons(unit) {
    if (!unit || unit.side !== 'player') return;
    const skill1 = unit.skills[0];
    const skill2 = unit.skills[1];

    const btn1 = document.getElementById('cbtn-skill1');
    const btn2 = document.getElementById('cbtn-skill2');
    if (btn1 && skill1) {
      const cd = unit.skillCooldowns[0];
      btn1.innerHTML = cd > 0
        ? `⏳ ${skill1.name} (${cd})`
        : `✦ ${skill1.name}`;
      btn1.disabled  = cd > 0;
    }
    if (btn2 && skill2) {
      const cd = unit.skillCooldowns[1];
      btn2.innerHTML = cd > 0
        ? `⏳ ${skill2.name} (${cd})`
        : `✦ ${skill2.name}`;
      btn2.disabled  = cd > 0;
    }
  }

  _addLog(msg, tag = '') {
    const log  = document.getElementById('combat-log');
    if (!log) return;
    const line = document.createElement('div');
    line.className   = `log-line ${tag ? `log-${tag}` : ''}`;
    line.textContent = msg;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    gsap.fromTo(line, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.25 });
  }

  /* ════════════════════════════════
     RÉSULTAT
  ════════════════════════════════ */

  _showResult() {
    // Victoire sur une vague → vérifier s'il en reste
    if (this.engine.winner === 'player' && this._currentStage) {
      const totalWaves = this._currentStage.waves.length;
      if (this._waveIndex < totalWaves - 1) {
        this._showWaveTransition();
        return;
      }
    }
    // Victoire finale ou défaite
    this._showFinalResult();
  }

  _showWaveTransition() {
    const nextWave  = this._waveIndex + 1;
    const total     = this._currentStage.waves.length;
    const overlay   = document.getElementById('combat-wave-overlay');
    const numEl     = document.getElementById('combat-wave-next-num');
    const totalEl   = document.getElementById('combat-wave-next-total');
    if (numEl)   numEl.textContent   = nextWave + 1;
    if (totalEl) totalEl.textContent = total;

    this._lockActions(true);
    gsap.set(overlay, { display: 'flex', opacity: 0 });
    gsap.to(overlay, { opacity: 1, duration: 0.35 });

    const delay = Math.max(1200, this._autoDelay(1800));
    setTimeout(() => {
      // Regen partielle 20% PV max pour chaque allié vivant
      this.engine.playerUnits.forEach(unit => {
        if (!unit.alive) return;
        const heal = Math.round(unit.maxHp * 0.20);
        unit.hp = Math.min(unit.maxHp, unit.hp + heal);
        this._floatDamage(unit.uid, heal, 'heal');
      });

      // Charger la vague suivante
      this._waveIndex++;
      this.engine.loadNextWave(this._currentStage.waves[this._waveIndex]);

      // Re-render les ennemis, mettre à jour les joueurs
      this._renderSide('enemy');
      this.engine.playerUnits.forEach(u => this._updateUnit(u));

      gsap.to(overlay, {
        opacity: 0, duration: 0.35,
        onComplete: () => { overlay.style.display = 'none'; },
      });

      this._addLog(`⚔ Vague ${this._waveIndex + 1} / ${total}`, 'round');
      this._updateWaveIndicator();

      if (this.engine.currentUnit?.side === 'enemy') {
        setTimeout(() => this._doEnemyTurn(), this._autoDelay());
      } else if (this._autoMode) {
        setTimeout(() => this._autoPlayerTurn(), this._autoDelay());
      } else {
        this._lockActions(false);
        this._updateTurnUI();
      }
    }, delay);
  }

  _showFinalResult() {
    const win = this.engine.winner === 'player';
    const total = this._currentStage?.waves.length ?? 1;
    document.getElementById('combat-result-icon').textContent  = win ? '🏆' : '💀';
    document.getElementById('combat-result-title').textContent = win ? 'VICTOIRE' : 'DÉFAITE';
    document.getElementById('combat-result-sub').textContent   = win
      ? `${total > 1 ? `${total} vagues éliminées.` : 'Tous les ennemis ont été éliminés.'}`
      : 'Votre équipe a été mise hors combat.';

    const box = document.getElementById('combat-result');
    gsap.set(box, { display: 'flex' });
    gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.4 });
    gsap.fromTo(document.getElementById('combat-result-box'),
      { scale: 0.8, y: 30 },
      { scale: 1, y: 0, duration: 0.55, delay: 0.5, ease: 'back.out(1.6)' }
    );
  }

  _updateWaveIndicator() {
    const stage = this._currentStage;
    if (!stage) return;
    const numEl   = document.getElementById('combat-wave-num');
    const totalEl = document.getElementById('combat-wave-total');
    const wrap    = document.getElementById('combat-wave-indicator');
    if (numEl)   numEl.textContent   = this._waveIndex + 1;
    if (totalEl) totalEl.textContent = stage.waves.length;
    if (wrap)    wrap.style.display  = stage.waves.length > 1 ? 'flex' : 'none';
  }

  _endCombat() {
    const winner = this.engine?.winner;
    const stage  = this._currentStage;

    // Calcul HP% restant de l'équipe joueur (pour les étoiles)
    let teamHpPct = 0;
    if (winner === 'player' && this.engine?.playerUnits) {
      const units = this.engine.playerUnits;
      const totHp    = units.reduce((s, u) => s + u.maxHp, 0);
      const remHp    = units.reduce((s, u) => s + u.hp,    0);
      teamHpPct = totHp > 0 ? remHp / totHp : 0;
    }

    gsap.to(this.screen, { opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        this.screen.style.display = 'none';
        document.getElementById('combat-result').style.display = 'none';
        this.engine        = null;
        this._currentStage = null;
        if (this.onBack) this.onBack(winner, stage, teamHpPct);
      },
    });
  }
}
