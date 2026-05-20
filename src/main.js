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
import { PlayerData }   from './data/PlayerData.js';
import { CHARACTERS }   from './data/characters.js';

/* ── Données joueur ── */
const playerData = new PlayerData();
playerData.seedDemo(CHARACTERS);

/* ── Scène 3D + UI menu ── */
const canvas = document.getElementById('bg-canvas');
const scene  = new MenuScene(canvas);
const ui     = new MenuUI();

/* ── Écrans ── */
const summon     = new SummonUI();
const collection = new CollectionUI(playerData);

/* ── Retour au menu (réutilisé par plusieurs écrans) ── */
function showMenu() {
  const overlay = document.getElementById('ui-overlay');
  gsap.set(overlay, { display: 'grid' });
  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4 });
}

/* ── Combat ── */
const combatUI = new CombatUI((winner, stage) => {
  // winner : 'player' | 'enemy' | null
  if (winner === 'player' && stage) {
    playerData.completeStage(stage.id, stage.rewards);
    hub.refresh();
    hub.show();
  } else {
    // Défaite ou pas de stage → retour menu
    showMenu();
  }
});

/* ── Sélection d'équipe ── */
let _pendingStage = null;

const teamSelect = new TeamSelectUI(playerData, (team) => {
  const stage  = _pendingStage;
  const wave   = stage ? stage.waves[0] : [];
  combatUI.start(team, wave, stage);
});

/* ── Hub ── */
const hub = new HubUI(
  playerData,
  /* onDeploy */ (stage, waveIndex) => {
    _pendingStage = stage;
    teamSelect.show();
  },
  /* onBack */ () => showMenu(),
);

/* ── Navigation menu principal ── */
document.getElementById('btn-play')?.addEventListener('click', () => {
  const overlay = document.getElementById('ui-overlay');
  gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.in',
    onComplete: () => { overlay.style.display = 'none'; hub.show(); }
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
