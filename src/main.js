/**
 * main.js — Point d'entrée de KuroSekai
 *
 * Responsabilités :
 *   1. Instancie la scène 3D du menu (Three.js)
 *   2. Instancie l'interface UI du menu (GSAP)
 *   3. Lance la boucle de rendu + l'animation d'intro
 */

import { MenuScene } from './scenes/MenuScene.js';
import { MenuUI }    from './ui/MenuUI.js';

/* ── Initialisation ── */
const canvas = document.getElementById('bg-canvas');

const scene = new MenuScene(canvas); // Scène 3D (portail, particules, ruines)
const ui    = new MenuUI();          // Interface menu (boutons, animations)

/* ── Démarrage ── */
scene.animate();   // Boucle Three.js
ui.playIntro();    // Animation GSAP d'entrée
