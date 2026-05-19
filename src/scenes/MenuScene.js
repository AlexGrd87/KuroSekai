/**
 * MenuScene.js
 * Scène Three.js du menu principal KuroSekai.
 *
 * Ambiance : ville japonaise détruite + portail démoniaque dimensionnel.
 * Éléments visuels :
 *   - Sol en grille néon (ruines urbaines stylisées)
 *   - Portail central animé (anneau + sphère pulsante)
 *   - Particules flottantes (cendres / reiatsu)
 *   - Brouillard atmosphérique
 */

import * as THREE from 'three';

export class MenuScene {
  constructor(canvas) {
    this.canvas   = canvas;
    this.clock    = new THREE.Clock();
    this.particles = null; // groupe de particules
    this.portal    = null; // groupe portail
    this._init();
  }

  /* ── Initialisation complète de la scène ── */
  _init() {
    this._createRenderer();
    this._createScene();
    this._createCamera();
    this._createLights();
    this._createGround();
    this._createPortal();
    this._createParticles();
    this._createRuins();
    window.addEventListener('resize', () => this._onResize());
  }

  /* ── Renderer WebGL ── */
  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
  }

  /* ── Scène + brouillard ── */
  _createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05040a); // noir quasi-absolu
    // Brouillard épais pour l'ambiance dystopique
    this.scene.fog = new THREE.FogExp2(0x0d0510, 0.04);
  }

  /* ── Caméra légèrement inclinée vers le portail ── */
  _createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 4, 14);
    this.camera.lookAt(0, 2, 0);
  }

  /* ── Éclairages ── */
  _createLights() {
    // Lumière ambiante très sombre
    const ambient = new THREE.AmbientLight(0x110a1a, 1.2);
    this.scene.add(ambient);

    // Lumière rouge sang émanant du portail
    this.portalLight = new THREE.PointLight(0xc0152a, 4, 20);
    this.portalLight.position.set(0, 2.5, 0);
    this.scene.add(this.portalLight);

    // Lumière violette secondaire (halo démoniaque)
    const demonicLight = new THREE.PointLight(0x4a0a6a, 2.5, 25);
    demonicLight.position.set(0, 5, -2);
    this.scene.add(demonicLight);

    // Lumière bleutée lointaine (ville morte)
    const cityLight = new THREE.DirectionalLight(0x1a1a4a, 0.5);
    cityLight.position.set(-10, 10, 5);
    this.scene.add(cityLight);
  }

  /* ── Sol : grille néon style ruines urbaines ── */
  _createGround() {
    // Plan de sol sombre
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a080f,
      roughness: 0.9,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grille néon par-dessus le sol
    const gridHelper = new THREE.GridHelper(80, 40, 0x2d0a3a, 0x1a0820);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  /* ── Portail démoniaque central ── */
  _createPortal() {
    this.portal = new THREE.Group();

    // Anneau extérieur du portail
    const ringGeo = new THREE.TorusGeometry(2.2, 0.12, 16, 80);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xc0152a,
      emissive: 0xc0152a,
      emissiveIntensity: 2,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.portal.add(ring);

    // Anneau intérieur (violet)
    const innerRingGeo = new THREE.TorusGeometry(1.8, 0.06, 12, 60);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x6a0aaa,
      emissive: 0x6a0aaa,
      emissiveIntensity: 3,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.portal.add(innerRing);

    // Disque central (ouverture du portail)
    const discGeo = new THREE.CircleGeometry(1.78, 64);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x1a0025,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    this.portal.add(disc);

    // Sphère d'énergie pulsante au centre
    const sphereGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xff1a35,
      emissive: 0xff1a35,
      emissiveIntensity: 5,
      transparent: true,
      opacity: 0.9,
    });
    this.portalSphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.portal.add(this.portalSphere);

    // Position du portail dans la scène
    this.portal.position.set(0, 2.5, 0);
    this.scene.add(this.portal);
  }

  /* ── Particules flottantes (cendres / reiatsu) ── */
  _createParticles() {
    const count  = 1200;
    const geo    = new THREE.BufferGeometry();
    const pos    = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Distribution aléatoire dans la scène
      pos[i3]     = (Math.random() - 0.5) * 50;
      pos[i3 + 1] = Math.random() * 12;
      pos[i3 + 2] = (Math.random() - 0.5) * 30;

      // Couleurs : mélange rouge/violet/blanc
      const t = Math.random();
      if (t < 0.5) {
        colors[i3] = 0.75; colors[i3+1] = 0.08; colors[i3+2] = 0.16; // rouge
      } else if (t < 0.8) {
        colors[i3] = 0.42; colors[i3+1] = 0.04; colors[i3+2] = 0.66; // violet
      } else {
        colors[i3] = 0.9; colors[i3+1] = 0.9; colors[i3+2] = 0.95;   // blanc
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  /* ── Ruines stylisées (boîtes géométriques) ── */
  _createRuins() {
    const ruinMat = new THREE.MeshStandardMaterial({
      color: 0x15101e,
      roughness: 0.95,
      metalness: 0.1,
    });

    // Positions et tailles prédéfinies pour les immeubles détruits
    const buildings = [
      { x: -8,  z: -5,  w: 2,   h: 8,  d: 2  },
      { x: -12, z: -8,  w: 3,   h: 12, d: 2.5 },
      { x: 9,   z: -6,  w: 2.5, h: 6,  d: 2  },
      { x: 13,  z: -4,  w: 2,   h: 10, d: 3  },
      { x: -5,  z: -12, w: 4,   h: 5,  d: 2  },
      { x: 6,   z: -10, w: 2,   h: 7,  d: 2.5 },
      { x: -18, z: -6,  w: 3,   h: 9,  d: 3  },
      { x: 18,  z: -8,  w: 2.5, h: 11, d: 2  },
    ];

    buildings.forEach(b => {
      const geo  = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mesh = new THREE.Mesh(geo, ruinMat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true;
      this.scene.add(mesh);
    });
  }

  /* ── Boucle d'animation ── */
  animate() {
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();

    // Rotation lente du portail sur son axe Z (comme une roue cosmique)
    if (this.portal) {
      this.portal.rotation.z = t * 0.3;
    }

    // Pulsation de la sphère centrale
    if (this.portalSphere) {
      const pulse = 1 + Math.sin(t * 2.5) * 0.2;
      this.portalSphere.scale.setScalar(pulse);
    }

    // Pulsation de la lumière rouge du portail
    if (this.portalLight) {
      this.portalLight.intensity = 3.5 + Math.sin(t * 2) * 1.5;
    }

    // Dérive lente des particules vers le haut (cendres qui montent)
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.002; // montée lente
        if (positions[i] > 12) positions[i] = 0; // réapparition en bas
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
      // Légère rotation d'ensemble pour effet tourbillon
      this.particles.rotation.y = t * 0.02;
    }

    // Légère oscillation de la caméra (respiration)
    this.camera.position.y = 4 + Math.sin(t * 0.3) * 0.15;

    this.renderer.render(this.scene, this.camera);
  }

  /* ── Redimensionnement fenêtre ── */
  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
