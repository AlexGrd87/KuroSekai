/**
 * DungeonUI.js
 * Mode Donjon Abyssal — 5 salles roguelite avec buffs aléatoires.
 *
 * Flux :
 *   Hub (bouton DONJON) → intro → sélection équipe →
 *   salle 1 → buff → salle 2 → buff → … → salle 5 → résultat final
 *
 * Récompense victoire : 2000 ◈
 * Défaite : retour hub sans récompense.
 */

import { gsap }                                    from 'gsap';
import { DUNGEON_ROOMS, DUNGEON_BUFFS, buildDungeonStage } from '../data/dungeon.js';
import { saveDungeonBest }                         from './LeaderboardUI.js';
import { audio }                                   from '../audio/AudioManager.js';

const VICTORY_CURRENCY = 2000;

export class DungeonUI {
  /**
   * @param {PlayerData}   playerData
   * @param {CombatUI}     combatUI
   * @param {TeamSelectUI} teamSelect
   * @param {Function}     goHub      — retour au hub
   */
  constructor(playerData, combatUI, teamSelect, goHub) {
    this.playerData = playerData;
    this.combatUI   = combatUI;
    this.teamSelect = teamSelect;
    this.goHub      = goHub;

    this._dungeonTeam   = null;  // équipe en cours avec buffs accumulés
    this._roomIndex     = 0;
    this._buffsApplied  = [];
    this._origOnBack    = null;
    this._origTeamReady = null;

    this.introOverlay = document.getElementById('dungeon-intro');
    this.buffOverlay  = document.getElementById('dungeon-buff-overlay');
    this.endOverlay   = document.getElementById('dungeon-end-overlay');

    this._bindIntro();
    this._bindEnd();
  }

  /* ════════════════════════════════
     INTRO
  ════════════════════════════════ */

  show() {
    const ol = this.introOverlay;
    if (!ol) return;
    gsap.set(ol, { display: 'flex', opacity: 0, y: 24 });
    gsap.to(ol, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
    gsap.fromTo('.dng-room-dot',
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1, stagger: 0.1, duration: 0.35, ease: 'back.out(2)', delay: 0.3 }
    );
  }

  _bindIntro() {
    document.getElementById('dungeon-start-btn')
      ?.addEventListener('click', () => this._startDungeon());
    document.getElementById('dungeon-intro-back')
      ?.addEventListener('click', () => this._hideIntro());
  }

  _hideIntro(cb) {
    if (!this.introOverlay) { cb?.(); return; }
    gsap.to(this.introOverlay, {
      opacity: 0, y: -20, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        gsap.set(this.introOverlay, { display: 'none' });
        cb?.();
      },
    });
  }

  /* ════════════════════════════════
     FLOW PRINCIPAL
  ════════════════════════════════ */

  _startDungeon() {
    audio.play('ui_navigate');
    this._roomIndex   = 0;
    this._buffsApplied = [];

    this._hideIntro(() => {
      // Redirige temporairement le callback de TeamSelectUI vers le donjon
      this._origTeamReady = this.teamSelect.onTeamReady;
      this.teamSelect.onTeamReady = (rawTeam) => {
        // Restaure immédiatement le callback original
        this.teamSelect.onTeamReady = this._origTeamReady;
        this._origTeamReady = null;

        // Copie profonde de l'équipe pour ne pas modifier les originaux
        this._dungeonTeam = rawTeam.map(c => ({
          ...c,
          stats: { ...c.stats },
          skills: c.skills.map(s => ({ ...s })),
        }));

        audio.stopBgm(400);
        setTimeout(() => audio.playBgm('combat'), 450);
        this._startRoom();
      };

      this.teamSelect.show();
    });
  }

  _startRoom() {
    const room  = DUNGEON_ROOMS[this._roomIndex];
    const stage = buildDungeonStage(room);

    // Libelle de la salle dans le log de combat
    stage.name = `[DONJON] ${room.roomNum}/5 — ${room.name}`;

    // Override temporaire de combatUI.onBack
    this._origOnBack     = this.combatUI.onBack;
    this.combatUI.onBack = (winner) => {
      this.combatUI.onBack = this._origOnBack;
      this._origOnBack     = null;
      this._onRoomEnd(winner);
    };

    this.combatUI.start(this._dungeonTeam, stage);
  }

  _onRoomEnd(winner) {
    if (winner !== 'player') {
      // Défaite — sauvegarde la meilleure salle atteinte
      saveDungeonBest(this._roomIndex);
      audio.stopBgm();
      setTimeout(() => audio.playBgm('hub'), 700);
      setTimeout(() => this._showEnd(false), 350);
      return;
    }

    // Victoire de salle — sauvegarde progression
    saveDungeonBest(this._roomIndex);

    const isLast = this._roomIndex >= DUNGEON_ROOMS.length - 1;
    if (isLast) {
      // Victoire finale
      audio.play('victory');
      audio.stopBgm();
      setTimeout(() => audio.playBgm('hub'), 800);
      this.playerData.currency = (this.playerData.currency ?? 0) + VICTORY_CURRENCY;
      this.playerData._saveProgress?.();
      setTimeout(() => this._showEnd(true), 350);
    } else {
      // Passer à la salle suivante
      this._roomIndex++;
      setTimeout(() => this._showBuffSelect(), 300);
    }
  }

  /* ════════════════════════════════
     SÉLECTION DE BUFF
  ════════════════════════════════ */

  _showBuffSelect() {
    const room = DUNGEON_ROOMS[this._roomIndex];
    const ol   = this.buffOverlay;
    if (!ol) return;

    // 3 buffs aléatoires uniques
    const alreadyPicked = new Set(this._buffsApplied);
    const pool    = DUNGEON_BUFFS.filter(b => !alreadyPicked.has(b.id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const choices  = shuffled.length >= 3 ? shuffled.slice(0, 3) : shuffled;

    // Indicateur de salle
    const roomLabel = document.getElementById('dungeon-buff-room');
    if (roomLabel) roomLabel.textContent = `Salle ${room.roomNum} — ${room.name}`;

    // Points de progression
    document.querySelectorAll('.dng-prog-dot').forEach((dot, i) => {
      dot.classList.toggle('dng-prog-dot--done',    i < this._roomIndex);
      dot.classList.toggle('dng-prog-dot--current', i === this._roomIndex - 1);
    });

    // Cartes de buff
    const grid = document.getElementById('dungeon-buff-grid');
    if (grid) {
      grid.innerHTML = '';
      choices.forEach(buff => {
        const card = document.createElement('div');
        card.className = 'dng-buff-card';
        card.style.setProperty('--bc', buff.color);
        card.innerHTML = `
          <div class="dng-buff-icon">${buff.icon}</div>
          <div class="dng-buff-name">${buff.name}</div>
          <div class="dng-buff-desc">${buff.desc}</div>
          <div class="dng-buff-select-hint">CHOISIR</div>
        `;
        card.addEventListener('click', () => this._pickBuff(buff), { once: true });
        grid.appendChild(card);
      });
    }

    // Animation d'entrée
    gsap.set(ol, { display: 'flex', opacity: 0 });
    gsap.to(ol, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo('.dng-buff-card',
      { opacity: 0, y: 45, scale: 0.88 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.12, duration: 0.42, ease: 'back.out(1.5)', delay: 0.15 }
    );
  }

  _pickBuff(buff) {
    audio.play('ui_navigate');
    this._buffsApplied.push(buff.id);
    this._dungeonTeam = buff.apply(this._dungeonTeam);

    // Flash de sélection sur la carte choisie
    const cards = document.querySelectorAll('.dng-buff-card');
    cards.forEach(c => {
      if (c.querySelector('.dng-buff-name')?.textContent === buff.name) {
        gsap.to(c, {
          scale: 1.1, borderColor: '#00e896',
          boxShadow: `0 0 30px ${buff.color}88`,
          duration: 0.2, ease: 'power2.out',
        });
      } else {
        gsap.to(c, { opacity: 0.25, scale: 0.9, duration: 0.18 });
      }
    });

    setTimeout(() => {
      gsap.to(this.buffOverlay, {
        opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: () => {
          gsap.set(this.buffOverlay, { display: 'none' });
          this._startRoom();
        },
      });
    }, 380);
  }

  /* ════════════════════════════════
     ÉCRAN DE FIN
  ════════════════════════════════ */

  _showEnd(victory) {
    const ol = this.endOverlay;
    if (!ol) return;

    document.getElementById('dungeon-end-icon').textContent  = victory ? '🏆' : '💀';
    document.getElementById('dungeon-end-title').textContent = victory
      ? 'ABÎME CONQUIS !'
      : 'MISSION ÉCHOUÉE';
    document.getElementById('dungeon-end-sub').textContent = victory
      ? `+${VICTORY_CURRENCY.toLocaleString()} ◈ · ${this._buffsApplied.length} buff${this._buffsApplied.length !== 1 ? 's' : ''} accumulé${this._buffsApplied.length !== 1 ? 's' : ''}`
      : `Éliminé salle ${this._roomIndex + 1} / ${DUNGEON_ROOMS.length}`;

    // Icônes de salles
    document.querySelectorAll('.dng-end-room').forEach((r, i) => {
      const reached = i < (victory ? DUNGEON_ROOMS.length : this._roomIndex);
      const failed  = !victory && i === this._roomIndex;
      r.classList.toggle('dng-end-room--done',   reached);
      r.classList.toggle('dng-end-room--failed', failed);
    });

    // Animation
    gsap.set(ol, { display: 'flex', opacity: 0 });
    gsap.to(ol, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo('#dungeon-end-box',
      { scale: 0.85, y: 32 },
      { scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.5)', delay: 0.1 }
    );
    if (victory) {
      gsap.fromTo('.dng-end-room',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.09, duration: 0.32, ease: 'back.out(2)', delay: 0.4 }
      );
    }
  }

  _bindEnd() {
    document.getElementById('dungeon-end-back')
      ?.addEventListener('click', () => {
        const ol = this.endOverlay;
        if (!ol) { this.goHub(); return; }
        gsap.to(ol, {
          opacity: 0, duration: 0.3, ease: 'power2.in',
          onComplete: () => {
            gsap.set(ol, { display: 'none' });
            this.goHub();
          },
        });
      });
  }
}
