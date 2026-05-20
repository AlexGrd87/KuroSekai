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

/* ── Combat ── */
const combatUI = new CombatUI((winner, stage) => {
  if (winner === 'player' && stage) {
    playerData.completeStage(stage.id, stage.rewards);
    const debrief = SCENARIO.debriefings[stage.id];
    if (debrief) {
      sceneUI.play(debrief, () => {
        hub.refresh();
        hub.show();
      });
    } else {
      hub.refresh();
      hub.show();
    }
  } else {
    showMenu();
  }
});

/* ── Sélection d'équipe ── */
let _pendingStage = null;

const teamSelect = new TeamSelectUI(playerData, (team) => {
  const stage = _pendingStage;
  const wave  = stage ? stage.waves[0] : [];
  combatUI.start(team, wave, stage);
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

/* ── Démarrage ── */
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
