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

const combatUI = new CombatUI(() => {
  // Retour au menu après combat
  const overlay = document.getElementById('ui-overlay');
  gsap.set(overlay, { display: 'grid' });
  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4 });
});

const teamSelect = new TeamSelectUI(playerData, (team) => {
  combatUI.start(team);
});

/* ── Navigation ── */
document.getElementById('btn-summon')?.addEventListener('click', () => summon.show());
document.getElementById('btn-collection')?.addEventListener('click', () => collection.show());
document.getElementById('btn-play')?.addEventListener('click', () => teamSelect.show());

/* ── Sync invocation → collection ── */
document.addEventListener('kuro:character-obtained', (e) => {
  if (e.detail?.id) playerData.addCharacter(e.detail.id);
});

/* ── Démarrage ── */
scene.animate();
ui.playIntro();
