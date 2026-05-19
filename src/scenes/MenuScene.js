/**
 * MenuScene.js
 * Scène Three.js du menu principal KuroSekai.
 *
 * Ambiance cyberpunk japonais : ville nocturne détruite, néons bleu/violet,
 * portail démoniaque en fond (droite), pluie de particules cyan.
 */

import * as THREE from 'three';

export class MenuScene {
  constructor(canvas) {
    this.canvas    = canvas;
    this.clock     = new THREE.Clock();
    this.particles = null;
    this.portal    = null;
    this.neonLines = []; // lignes néon animées sur les bâtiments
    this._init();
  }

  _init() {
    this._createRenderer();
    this._createScene();
    this._createCamera();
    this._createLights();
    this._createGround();
    this._createCity();
    this._createPortal();
    this._createParticles();
    window.addEventListener('resize', () => this._onResize());
  }

  /* ── Renderer ── */
  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
  }

  /* ── Scène + brouillard bleuté ── */
  _createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05080f);
    // Brouillard cyan très léger — donne de la profondeur sans tout noyer
    this.scene.fog = new THREE.FogExp2(0x060a14, 0.022);
  }

  /* ── Caméra décalée vers la gauche pour laisser le portail à droite ── */
  _createCamera() {
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(-3, 5, 18);
    this.camera.lookAt(4, 3, 0);
  }

  /* ── Lumières néon ── */
  _createLights() {
    // Ambiante bleutée — éclaire toute la scène faiblement
    this.scene.add(new THREE.AmbientLight(0x0a1830, 3));

    // Lumière cyan principale (portail)
    this.portalLight = new THREE.PointLight(0x00d4ff, 8, 35);
    this.portalLight.position.set(6, 6, -2);
    this.scene.add(this.portalLight);

    // Lumière violette (halo portail secondaire)
    this.violetLight = new THREE.PointLight(0x7b2fff, 5, 30);
    this.violetLight.position.set(6, 8, -4);
    this.scene.add(this.violetLight);

    // Lumières néon de rue (bleu froid sur les bâtiments)
    const street1 = new THREE.PointLight(0x003fff, 3, 20);
    street1.position.set(-10, 3, 2);
    this.scene.add(street1);

    const street2 = new THREE.PointLight(0x00aaff, 2, 18);
    street2.position.set(15, 2, 5);
    this.scene.add(street2);

    // Lumière directionnelle lointaine (ciel de nuit)
    const sky = new THREE.DirectionalLight(0x0a1540, 1.5);
    sky.position.set(0, 20, 10);
    this.scene.add(sky);
  }

  /* ── Sol réfléchissant façon asphalte mouillé ── */
  _createGround() {
    const geo = new THREE.PlaneGeometry(120, 120);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x080c14,
      roughness: 0.3,
      metalness: 0.6,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Grille néon cyan sur l'asphalte
    const grid = new THREE.GridHelper(120, 60, 0x003366, 0x001122);
    grid.position.y = 0.02;
    this.scene.add(grid);
  }

  /* ── Ville cyberpunk : immeubles avec fenêtres néon ── */
  _createCity() {
    // Matériau de base des bâtiments (béton sombre)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e18,
      roughness: 0.9,
      metalness: 0.3,
    });

    // Matériaux néon pour les détails lumineux
    const neonCyan   = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 3 });
    const neonViolet = new THREE.MeshStandardMaterial({ color: 0x7b2fff, emissive: 0x7b2fff, emissiveIntensity: 3 });
    const neonBlue   = new THREE.MeshStandardMaterial({ color: 0x003fff, emissive: 0x003fff, emissiveIntensity: 2 });

    // Définition des immeubles : position, taille, couleur néon
    const buildings = [
      { x: -9,  z: -4,  w: 2.5, h: 14, d: 2.5, neon: neonCyan   },
      { x: -14, z: -7,  w: 3,   h: 20, d: 3,   neon: neonViolet },
      { x: -6,  z: -10, w: 2,   h: 9,  d: 2,   neon: neonBlue   },
      { x: -20, z: -5,  w: 4,   h: 16, d: 3.5, neon: neonCyan   },
      { x: 12,  z: -5,  w: 2.5, h: 11, d: 2,   neon: neonViolet },
      { x: 17,  z: -8,  w: 3,   h: 18, d: 3,   neon: neonBlue   },
      { x: 22,  z: -3,  w: 2,   h: 8,  d: 2,   neon: neonCyan   },
      { x: -3,  z: -15, w: 5,   h: 7,  d: 3,   neon: neonBlue   },
      { x: 8,   z: -12, w: 2,   h: 13, d: 2.5, neon: neonViolet },
      { x: -25, z: -10, w: 3,   h: 12, d: 2.5, neon: neonCyan   },
      { x: 26,  z: -6,  w: 2.5, h: 15, d: 3,   neon: neonBlue   },
    ];

    buildings.forEach(b => {
      // Corps principal du bâtiment
      const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const body    = new THREE.Mesh(bodyGeo, baseMat);
      body.position.set(b.x, b.h / 2, b.z);
      this.scene.add(body);

      // Bande néon horizontale en haut du bâtiment
      const bandGeo = new THREE.BoxGeometry(b.w + 0.1, 0.15, b.d + 0.1);
      const band    = new THREE.Mesh(bandGeo, b.neon);
      band.position.set(b.x, b.h + 0.07, b.z);
      this.scene.add(band);
      this.neonLines.push(band); // référence pour animation de clignotement

      // Petite antenne sur les grands bâtiments
      if (b.h > 12) {
        const antGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 6);
        const ant    = new THREE.Mesh(antGeo, baseMat);
        ant.position.set(b.x, b.h + 1.5, b.z);
        this.scene.add(ant);

        // Lumignon rouge au sommet de l'antenne
        const tipGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 4 });
        const tip    = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(b.x, b.h + 3.1, b.z);
        this.scene.add(tip);
      }
    });
  }

  /* ── Portail démoniaque en fond (côté droit de la scène) ── */
  _createPortal() {
    this.portal = new THREE.Group();

    // Anneau extérieur cyan
    const outerGeo = new THREE.TorusGeometry(3.2, 0.15, 20, 100);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 2.5,
      roughness: 0.1, metalness: 0.9,
    });
    this.portal.add(new THREE.Mesh(outerGeo, outerMat));

    // Anneau intermédiaire violet
    const midGeo = new THREE.TorusGeometry(2.6, 0.08, 16, 80);
    const midMat = new THREE.MeshStandardMaterial({
      color: 0x7b2fff, emissive: 0x7b2fff, emissiveIntensity: 3,
    });
    this.portal.add(new THREE.Mesh(midGeo, midMat));

    // Anneau intérieur (contre-rotation)
    const innerGeo = new THREE.TorusGeometry(2.0, 0.06, 12, 60);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 4,
    });
    this.innerRing = new THREE.Mesh(innerGeo, innerMat);
    this.portal.add(this.innerRing);

    // Disque intérieur sombre (ouverture)
    const discGeo = new THREE.CircleGeometry(1.98, 80);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x010510, side: THREE.DoubleSide, transparent: true, opacity: 0.95,
    });
    this.portal.add(new THREE.Mesh(discGeo, discMat));

    // Sphère d'énergie centrale (cyan brillant)
    const sphGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const sphMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 6,
      transparent: true, opacity: 0.95,
    });
    this.portalSphere = new THREE.Mesh(sphGeo, sphMat);
    this.portal.add(this.portalSphere);

    // Portail positionné en fond côté droit, légèrement incliné
    this.portal.position.set(7, 6, -6);
    this.portal.rotation.y = -0.3;
    this.scene.add(this.portal);
  }

  /* ── Particules : pluie de données / reiatsu cyan ── */
  _createParticles() {
    const count  = 2000;
    const geo    = new THREE.BufferGeometry();
    const pos    = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count); // vitesse individuelle de chute

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3]     = (Math.random() - 0.5) * 60;
      pos[i3 + 1] = Math.random() * 25;
      pos[i3 + 2] = (Math.random() - 0.5) * 40;
      speeds[i]   = 0.02 + Math.random() * 0.04;

      // Couleurs : cyan majoritaire, quelques violet et blanc
      const t = Math.random();
      if (t < 0.55) {
        colors[i3] = 0;    colors[i3+1] = 0.83; colors[i3+2] = 1;    // cyan
      } else if (t < 0.8) {
        colors[i3] = 0.48; colors[i3+1] = 0.18; colors[i3+2] = 1;    // violet
      } else {
        colors[i3] = 0.88; colors[i3+1] = 0.93; colors[i3+2] = 1;    // blanc froid
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    this._particleSpeeds = speeds;

    const mat = new THREE.PointsMaterial({
      size: 0.07, vertexColors: true, transparent: true, opacity: 0.75, sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  /* ── Boucle d'animation ── */
  animate() {
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();

    // Rotation du portail (anneau ext tourne, anneau int contre-tourne)
    if (this.portal) {
      this.portal.rotation.z = t * 0.2;
    }
    if (this.innerRing) {
      this.innerRing.rotation.z = -t * 0.5;
    }

    // Pulsation sphère centrale
    if (this.portalSphere) {
      this.portalSphere.scale.setScalar(1 + Math.sin(t * 3) * 0.18);
    }

    // Pulsation lumières du portail
    if (this.portalLight) {
      this.portalLight.intensity  = 7 + Math.sin(t * 2.2) * 2;
      this.violetLight.intensity  = 4 + Math.sin(t * 1.8 + 1) * 1.5;
    }

    // Clignotement aléatoire des néons de bâtiments
    this.neonLines.forEach((line, idx) => {
      const flicker = Math.sin(t * (3 + idx * 0.7)) > 0.95 ? 0.3 : 1;
      line.material.emissiveIntensity = 3 * flicker;
    });

    // Chute des particules (pluie de données)
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= this._particleSpeeds[i];
        if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 25; // reboucle en haut
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Légère oscillation de la caméra (respiration)
    this.camera.position.y = 5 + Math.sin(t * 0.25) * 0.2;

    this.renderer.render(this.scene, this.camera);
  }

  /* ── Resize ── */
  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
