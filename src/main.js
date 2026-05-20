/**
 * main.js — Point d'entrée de KuroSekai
 */

import { gsap }         from 'gsap';
import { MenuScene }    from './scenes/MenuScene.js';
import { MenuUI }       from './ui/MenuUI.js';
import { SummonUI }     from './ui/SummonUI.js';
import { CollectionUI } from './ui/CollectionUI.js';
import { TeamSelectUI } from './ui/TeamSelectUI.js';
import { CombatUI }     from './ui/CombatUI.js';
import { HubUI }        from './ui/HubUI.js';
import { SceneUI }      from './ui/SceneUI.js';
import { PlayerData }   from './data/PlayerData.js';
import { CHARACTERS }   from './data/characters.js';
import { SCENARIO }     from './data/scenario.js';
import { SettingsUI }   from './ui/SettingsUI.js';
import { LevelUpUI }    from './ui/LevelUpUI.js';
import { settings }     from './data/Settings.js';

/* ── Données joueur ── */
const playerData = new PlayerData();
playerData.seedDemo(CHARACTERS);

/* ── Scène 3D + UI menu ── */
const canvas = document.getElementById('bg-canvas');
const scene  = new MenuScene(canvas);
const ui     = new MenuUI();

/* ── Lecteur de scènes narratives ── */
const sceneUI = new SceneUI();

/* ── Écrans ── */
const summon     = new SummonUI();
const collection = new CollectionUI(playerData);

/* ── Retour au menu ── */
function showMenu() {
  const overlay = document.getElementById('ui-overlay');
  gsap.set(overlay, { display: 'grid' });
  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4 });
}

/* ── Après victoire : EXP → level up → débriefing → hub ── */
function handleVictory(stage) {
  playerData.completeStage(stage.id, stage.rewards);

  // Distribue l'EXP à tous les membres de l'équipe
  const expGained = stage.rewards.exp ?? 0;
  const lvlResults = _currentTeam.map(char => {
    const oldLevel = playerData.getLevel(char.id);
    const result   = playerData.addExp(char.id, expGained);
    const prog     = playerData.expProgress(char.id);
    return {
      char,
      oldLevel,
      newLevel:  result.newLevel,
      newExp:    prog.exp,
      expGained,
      leveled:   result.newLevel > oldLevel,
    };
  });

  const goToHub = () => {
    const debrief = SCENARIO.debriefings[stage.id];
    hub.refresh();
    if (debrief) {
      sceneUI.play(debrief, () => hub.show());
    } else {
      hub.show();
    }
  };

  // Si au moins un perso a monté de niveau → écran level up
  if (lvlResults.some(r => r.leveled)) {
    levelUpUI.play(lvlResults, goToHub);
  } else {
    // Pas de level up : juste débriefing + hub
    goToHub();
  }
}

/* ── Combat ── */
const combatUI = new CombatUI((winner, stage) => {
  if (winner === 'player' && stage) {
    handleVictory(stage);
  } else {
    showMenu();
  }
});

/* ── Sélection d'équipe ── */
let _pendingStage = null;
let _currentTeam  = [];

const teamSelect = new TeamSelectUI(playerData, (team) => {
  const stage = _pendingStage;
  const wave  = stage ? stage.waves[0] : [];
  _currentTeam = team;
  // Applique le scaling de stats selon le niveau de chaque perso
  const scaledTeam = team.map(char => ({
    ...char,
    level: playerData.getLevel(char.id),
    stats: playerData.getScaledStats(char),
  }));
  combatUI.start(scaledTeam, wave, stage);
});

/* ── Hub ── */
const hub = new HubUI(
  playerData,
  (stage) => {
    _pendingStage = stage;
    const briefing = SCENARIO.briefings[stage.id];
    if (briefing) {
      sceneUI.play(briefing, () => teamSelect.show());
    } else {
      teamSelect.show();
    }
  },
  () => showMenu(),
);

/* ── Navigation menu principal ── */
document.getElementById('btn-play')?.addEventListener('click', () => {
  const overlay = document.getElementById('ui-overlay');
  gsap.to(overlay, {
    opacity: 0, duration: 0.3, ease: 'power2.in',
    onComplete: () => { overlay.style.display = 'none'; hub.show(); },
  });
});
document.getElementById('btn-summon')?.addEventListener('click', () => summon.show());
document.getElementById('btn-collection')?.addEventListener('click', () => collection.show());

/* ── Sync invocation → collection ── */
document.addEventListener('kuro:character-obtained', (e) => {
  if (e.detail?.id) playerData.addCharacter(e.detail.id);
});

/* ── Level Up ── */
const levelUpUI = new LevelUpUI();

/* ── Paramètres ── */
const settingsUI = new SettingsUI(playerData, () => showMenu());

document.getElementById('btn-settings')?.addEventListener('click', () => {
  const overlay = document.getElementById('ui-overlay');
  gsap.to(overlay, {
    opacity: 0, duration: 0.25, ease: 'power2.in',
    onComplete: () => { overlay.style.display = 'none'; settingsUI.show(); },
  });
});

/* ── Démarrage ── */
settings.applyAll();
scene.animate();
ui.playIntro();

/* ── Intro cinématique (une seule fois) ── */
const INTRO_KEY = 'kuro_intro_v1';
if (!localStorage.getItem(INTRO_KEY)) {
  localStorage.setItem(INTRO_KEY, '1');
  setTimeout(() => {
    const overlay = document.getElementById('ui-overlay');
    gsap.to(overlay, {
      opacity: 0, duration: 0.4, ease: 'power2.in',
      onComplete: () => {
        overlay.style.display = 'none';
        sceneUI.play(SCENARIO.intro, () => {
          gsap.set(overlay, { display: 'grid' });
          gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 });
        });
      },
    });
  }, 2200); // après l'animation d'intro du menu
}
