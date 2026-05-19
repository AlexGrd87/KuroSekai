/**
 * main.js — Point d'entrée de KuroSekai
 *
 * Responsabilités :
 *   1. Instancie la scène 3D du menu (Three.js)
 *   2. Instancie l'interface UI du menu (GSAP)
 *   3. Instancie l'écran d'invocation gacha
 *   4. Lance la boucle de rendu + l'animation d'intro
 */

import { MenuScene } from './scenes/MenuScene.js';
import { MenuUI }    from './ui/MenuUI.js';
import { SummonUI }  from './ui/SummonUI.js';

/* ── Initialisation ── */
const canvas = document.getElementById('bg-canvas');

const scene   = new MenuScene(canvas); // Scène 3D (portail, particules, ville)
const ui      = new MenuUI();          // Menu principal
const summon  = new SummonUI();        // Écran d'invocation

/* ── Navigation : menu → invocation ── */
document.getElementById('btn-summon')?.addEventListener('click', () => {
  summon.show();
});

/* ── Démarrage ── */
scene.animate();
ui.playIntro();
