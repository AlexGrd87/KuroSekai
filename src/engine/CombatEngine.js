/**
 * CombatEngine.js
 * Moteur de combat tour par tour de KuroSekai.
 *
 * Gère : ordre des tours (SPD), calcul des dégâts, statuts,
 *        IA ennemie, conditions de victoire/défaite.
 */

import { ENEMIES } from '../data/enemies.js';

/* ── Statuts temporaires ── */
const STATUS = {
  burn:      { label: 'Brûlure',    icon: '🔥', color: '#ff4400' },
  bleed:     { label: 'Hémorragie', icon: '🩸', color: '#cc0022' },
  paralyze:  { label: 'Paralysie',  icon: '⚡', color: '#cccc00' },
  shield:    { label: 'Bouclier',   icon: '🛡', color: '#00aaff' },
  regen:     { label: 'Régén',      icon: '💚', color: '#00cc66' },
  atk_up:    { label: 'ATK+',       icon: '⬆', color: '#ff8800' },
  def_down:  { label: 'DEF-',       icon: '⬇', color: '#884400' },
};

export class CombatEngine {
  /**
   * @param {Array} playerTeam  - tableau de personnages (depuis CHARACTERS)
   * @param {Array} enemyIds    - tableau d'IDs ennemis (depuis ENEMIES)
   */
  constructor(playerTeam, enemyIds) {
    this.turn    = 0;
    this.round   = 1;
    this.log     = [];
    this.over    = false;
    this.winner  = null; // 'player' | 'enemy'

    /* ── Combattants joueur ── */
    this.playerUnits = playerTeam.map((char, i) => this._buildUnit(char, 'player', i));

    /* ── Combattants ennemis ── */
    this.enemyUnits = enemyIds.map((id, i) => {
      const data = ENEMIES.find(e => e.id === id);
      if (!data) throw new Error(`Enemy not found: ${id}`);
      return this._buildUnit(data, 'enemy', i);
    });

    /* ── Ordre de tour initial par SPD décroissant ── */
    this._buildTurnOrder();
  }

  /* ════════════════════════════════
     CONSTRUCTION DES UNITÉS
  ════════════════════════════════ */

  _buildUnit(data, side, index) {
    return {
      uid:      `${side}_${index}`,
      id:       data.id,
      name:     data.name,
      class:    data.class,
      element:  data.element,
      color:    data.color || '#00d4ff',
      side,
      index,
      // Niveau (affiché dans l'UI)
      level:    data.level ?? 1,
      // Stats (déjà scalées par main.js pour les joueurs)
      maxHp:    data.stats.hp,
      hp:       data.stats.hp,
      atk:      data.stats.atk,
      def:      data.stats.def,
      spd:      data.stats.spd,
      // État
      alive:    true,
      statuses: [],          // [{ type, duration, value }]
      shield:   0,           // PV de bouclier absorbé
      skillCooldowns: (data.skills || []).map(() => 0),
      // Skills
      skills:   data.skills || [],
      // IA
      ai:       data.ai || 'aggressive',
      symbol:   data.symbol || '◆',
    };
  }

  /* ════════════════════════════════
     ORDRE DES TOURS
  ════════════════════════════════ */

  _buildTurnOrder() {
    const all = [...this.playerUnits, ...this.enemyUnits];
    this.turnOrder = all
      .filter(u => u.alive)
      .sort((a, b) => b.spd - a.spd);
    this.turnIndex = 0;
  }

  get currentUnit() {
    return this.turnOrder[this.turnIndex] || null;
  }

  /* ════════════════════════════════
     ACTIONS DU JOUEUR
  ════════════════════════════════ */

  /** Attaque de base */
  basicAttack(attackerUid, targetUid) {
    const att = this._unit(attackerUid);
    const def = this._unit(targetUid);
    if (!att || !def || !att.alive || !def.alive) return null;

    const dmg = this._calcDamage(att, def, 1.0);
    this._applyDamage(def, dmg);
    const entry = this._log(`${att.name} attaque ${def.name} pour ${dmg} dégâts.`, att, def, dmg);
    this._nextTurn();
    return entry;
  }

  /** Utilise un skill (index 0 ou 1) */
  useSkill(attackerUid, skillIndex, targetUid = null) {
    const att   = this._unit(attackerUid);
    const skill = att?.skills[skillIndex];
    if (!att || !skill || !att.alive) return null;
    if (att.skillCooldowns[skillIndex] > 0) return null;

    let results = [];

    if (skill.target === 'self') {
      results = this._applySkillSelf(att, skill);
    } else if (skill.target === 'all') {
      const enemies = att.side === 'player' ? this.enemyUnits : this.playerUnits;
      enemies.filter(u => u.alive).forEach(t => {
        const dmg = this._calcDamage(att, t, skill.multiplier);
        this._applyDamage(t, dmg);
        results.push({ target: t, dmg });
      });
    } else if (skill.target === 'weakest') {
      const enemies = att.side === 'player' ? this.enemyUnits : this.playerUnits;
      const weakest = enemies.filter(u => u.alive).sort((a, b) => a.hp - b.hp)[0];
      if (weakest) {
        const dmg = this._calcDamage(att, weakest, skill.multiplier);
        this._applyDamage(weakest, dmg);
        results.push({ target: weakest, dmg });
      }
    } else if (skill.target === 'random' && skill.hits) {
      const enemies = att.side === 'player' ? this.enemyUnits : this.playerUnits;
      const alive   = enemies.filter(u => u.alive);
      if (alive.length) {
        for (let h = 0; h < skill.hits; h++) {
          const t   = alive[Math.floor(Math.random() * alive.length)];
          const dmg = this._calcDamage(att, t, skill.multiplier);
          this._applyDamage(t, dmg);
          results.push({ target: t, dmg });
        }
      }
    } else {
      // single target
      const def = this._unit(targetUid) || this._defaultTarget(att);
      if (def && def.alive) {
        const hits = skill.hits || 1;
        for (let h = 0; h < hits; h++) {
          const dmg = this._calcDamage(att, def, skill.multiplier);
          this._applyDamage(def, dmg);
          results.push({ target: def, dmg });
        }
        if (skill.debuff) this._applyStatus(def, skill.debuff, 2);
        if (skill.buff)   this._applyStatus(att, skill.buff,   2);
      }
    }

    att.skillCooldowns[skillIndex] = skill.cooldown;

    const totalDmg = results.reduce((s, r) => s + (r.dmg || 0), 0);
    const entry = this._log(`${att.name} utilise ${skill.name} ! (${totalDmg} dégâts totaux)`, att,
      results[0]?.target, totalDmg, skill.name);

    this._nextTurn();
    return { entry, results };
  }

  /* ════════════════════════════════
     IA ENNEMIE
  ════════════════════════════════ */

  doEnemyTurn() {
    const unit = this.currentUnit;
    if (!unit || unit.side !== 'enemy' || !unit.alive) {
      this._nextTurn();
      return null;
    }

    const players = this.playerUnits.filter(u => u.alive);
    if (!players.length) return null;

    // Vérifie si un skill disponible est intéressant
    const availSkill = unit.skills.findIndex((s, i) =>
      unit.skillCooldowns[i] === 0 && s.cooldown > 0
    );

    let result;
    if (availSkill >= 0 && Math.random() > 0.4) {
      // Cible : le plus faible pour assassin, aléatoire sinon
      let target = players[0];
      if (unit.ai === 'assassin') target = [...players].sort((a, b) => a.hp - b.hp)[0];
      else                        target = players[Math.floor(Math.random() * players.length)];
      result = this.useSkill(unit.uid, availSkill, target.uid);
    } else {
      // Attaque de base
      const target = players[Math.floor(Math.random() * players.length)];
      const dmg    = this._calcDamage(unit, target, 1.0);
      this._applyDamage(target, dmg);
      const entry  = this._log(`${unit.name} attaque ${target.name} pour ${dmg} dégâts.`, unit, target, dmg);
      this._nextTurn();
      result = { entry, results: [{ target, dmg }] };
    }

    return result;
  }

  /* ════════════════════════════════
     CALCULS
  ════════════════════════════════ */

  _calcDamage(att, def, multiplier) {
    if (multiplier === 0) return 0;
    const atk    = Number(att.atk)    || 0;
    const defVal = Number(def.def)    || 0;
    const base   = atk * multiplier;
    const reduce = defVal * 0.30;
    const variance = 0.9 + Math.random() * 0.2;
    const dmg = Math.max(1, Math.round((base - reduce) * variance));
    return isNaN(dmg) ? 1 : dmg;
  }

  _applyDamage(unit, dmg) {
    if (!unit.alive) return;
    // Bouclier absorbe en premier
    if (unit.shield > 0) {
      const absorbed = Math.min(unit.shield, dmg);
      unit.shield -= absorbed;
      dmg -= absorbed;
    }
    unit.hp = Math.max(0, unit.hp - dmg);
    if (unit.hp <= 0) {
      unit.hp    = 0;
      unit.alive = false;
      this._log(`${unit.name} est mis hors combat !`, null, unit, 0, 'KO');
      // Retire du tour order
      this.turnOrder = this.turnOrder.filter(u => u.uid !== unit.uid);
      if (this.turnIndex >= this.turnOrder.length) this.turnIndex = 0;
      this._checkEnd();
    }
  }

  _applySkillSelf(unit, skill) {
    if (skill.buff === 'shield') {
      unit.shield = Math.round(unit.maxHp * 0.20);
      this._log(`${unit.name} se protège avec un bouclier !`, unit, unit, 0, skill.name);
    }
    return [];
  }

  _applyStatus(unit, type, duration) {
    const existing = unit.statuses.find(s => s.type === type);
    if (existing) { existing.duration = duration; return; }
    unit.statuses.push({ type, duration, value: unit.maxHp * 0.06 });
  }

  /* ════════════════════════════════
     GESTION DES TOURS
  ════════════════════════════════ */

  _nextTurn() {
    if (this.over) return;

    // Tick des cooldowns et statuts pour l'unité actuelle
    const unit = this.currentUnit;
    if (unit) {
      unit.skillCooldowns = unit.skillCooldowns.map(cd => Math.max(0, cd - 1));
      unit.statuses = unit.statuses
        .map(s => {
          if (s.type === 'burn' || s.type === 'bleed') {
            const dot = Math.round(s.value);
            this._applyDamage(unit, dot);
          }
          if (s.type === 'regen') {
            unit.hp = Math.min(unit.maxHp, unit.hp + Math.round(s.value));
          }
          return { ...s, duration: s.duration - 1 };
        })
        .filter(s => s.duration > 0);
    }

    this.turnIndex = (this.turnIndex + 1) % this.turnOrder.length;
    if (this.turnIndex === 0) {
      this.round++;
      this._log(`— Manche ${this.round} —`, null, null, 0, 'round');
    }
    this.turn++;
  }

  /**
   * Charge une nouvelle vague d'ennemis sans recréer le moteur.
   * Les unités joueur conservent leur HP, cooldowns et statuts.
   */
  loadNextWave(enemyIds) {
    this.enemyUnits = enemyIds.map((id, i) => {
      const data = ENEMIES.find(e => e.id === id);
      if (!data) throw new Error(`Enemy not found: ${id}`);
      return this._buildUnit(data, 'enemy', i);
    });
    this.over   = false;
    this.winner = null;
    this._buildTurnOrder();
    this._log('— Vague suivante —', null, null, 0, 'round');
  }

  _checkEnd() {
    const playersAlive = this.playerUnits.some(u => u.alive);
    const enemiesAlive = this.enemyUnits.some(u => u.alive);

    if (!enemiesAlive) {
      this.over   = true;
      this.winner = 'player';
      this._log('🏆 Victoire !', null, null, 0, 'victory');
    } else if (!playersAlive) {
      this.over   = true;
      this.winner = 'enemy';
      this._log('💀 Défaite...', null, null, 0, 'defeat');
    }
  }

  /* ════════════════════════════════
     UTILITAIRES
  ════════════════════════════════ */

  _unit(uid) {
    return [...this.playerUnits, ...this.enemyUnits].find(u => u.uid === uid);
  }

  _defaultTarget(attacker) {
    const enemies = attacker.side === 'player' ? this.enemyUnits : this.playerUnits;
    return enemies.filter(u => u.alive)[0] || null;
  }

  _log(msg, source, target, dmg, tag) {
    const entry = { msg, source: source?.name, target: target?.name, dmg, tag, turn: this.turn };
    this.log.push(entry);
    return entry;
  }

  /* Getter public */
  get STATUS_META() { return STATUS; }
}
