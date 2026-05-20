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

/* ══════════════════════════════════════════
   DONNÉES JOUEUR
══════════════════════════════════════════ */

const playerData = new PlayerData();
playerData.seedDemo(CHARACTERS);

/* ══════════════════════════════════════════
   SCÈNE 3D (fond permanent)
══════════════════════════════════════════ */

const canvas = document.getElementById('bg-canvas');
const scene  = new MenuScene(canvas);

/* ══════════════════════════════════════════
   ÉCRANS
══════════════════════════════════════════ */

const sceneUI    = new SceneUI();
const summon     = new SummonUI(playerData);
const collection = new CollectionUI(playerData);
const levelUpUI  = new LevelUpUI();

/* ── Paramètres — retour vers le hub ── */
const settingsUI = new SettingsUI(playerData, () => hub.refresh());

/* ══════════════════════════════════════════
   COMBAT + SÉLECTION D'ÉQUIPE
══════════════════════════════════════════ */

let _pendingStage = null;
let _currentTeam  = [];

/* Après victoire : EXP → level up → débriefing → hub */
function handleVictory(stage) {
  playerData.completeStage(stage.id, stage.rewards);

  const expGained  = stage.rewards.exp ?? 0;
  const lvlResults = _currentTeam.map(char => {
    const oldLevel = playerData.getLevel(char.id);
    const result   = playerData.addExp(char.id, expGained);
    const prog     = playerData.expProgress(char.id);
    return { char, oldLevel, newLevel: result.newLevel,
             newExp: prog.exp, expGained, leveled: result.newLevel > oldLevel };
  });

  const goToHub = () => {
    const debrief = SCENARIO.debriefings[stage.id];
    if (debrief) {
      sceneUI.play(debrief, () => hub.refresh());
    } else {
      hub.refresh();
    }
  };

  if (lvlResults.some(r => r.leveled)) {
    levelUpUI.play(lvlResults, goToHub);
  } else {
    goToHub();
  }
}

const combatUI = new CombatUI((winner, stage) => {
  if (winner === 'player' && stage) handleVictory(stage);
  else hub.refresh();
});

const teamSelect = new TeamSelectUI(playerData, (team) => {
  _currentTeam = team;
  const scaledTeam = team.map(char => ({
    ...char,
    level: playerData.getLevel(char.id),
    stats: playerData.getScaledStats(char),
  }));
  combatUI.start(scaledTeam, _pendingStage);
});

/* Retour depuis team-select → hub */
document.getElementById('ts-back')?.addEventListener('click', () => hub.refresh());

/* ══════════════════════════════════════════
   HUB — ÉCRAN PRINCIPAL
══════════════════════════════════════════ */

const hub = new HubUI(
  playerData,

  /* onDeploy */
  (stage) => {
    _pendingStage = stage;
    const briefing = SCENARIO.briefings[stage.id];
    if (briefing) sceneUI.play(briefing, () => teamSelect.show());
    else          teamSelect.show();
  },

  /* onSummon — le hub reste en fond, summon le recouvre */
  () => summon.show(),

  /* onCollection */
  () => collection.show(),

  /* onSettings */
  () => settingsUI.show(),
);

/* Rafraîchit les ressources du hub au retour des sous-écrans */
summon.overlay?.querySelector('#summon-back')
  ?.addEventListener('click', () => hub._updateStats());
document.getElementById('col-back')
  ?.addEventListener('click', () => hub._updateStats());

/* ══════════════════════════════════════════
   SYNC INVOCATION → COLLECTION
══════════════════════════════════════════ */

document.addEventListener('kuro:character-obtained', (e) => {
  if (e.detail?.id) playerData.addCharacter(e.detail.id);
});

/* ══════════════════════════════════════════
   DÉMARRAGE
══════════════════════════════════════════ */

settings.applyAll();
scene.animate();

/* Splash : animation logo + glitch titre, puis transition vers hub */
const splashUI = new MenuUI();
splashUI.playIntro();

const SPLASH_DURATION = 1800; // ms — après l'anim glitch du titre
const INTRO_KEY       = 'kuro_intro_v1';

setTimeout(() => {
  const overlay = document.getElementById('ui-overlay');
  gsap.to(overlay, {
    opacity: 0, duration: 0.45, ease: 'power2.in',
    onComplete: () => {
      overlay.style.display = 'none';
      // Première session → intro cinématique avant le hub
      if (!localStorage.getItem(INTRO_KEY)) {
        localStorage.setItem(INTRO_KEY, '1');
        sceneUI.play(SCENARIO.intro, () => hub.show());
      } else {
        hub.show();
      }
    },
  });
}, SPLASH_DURATION);
