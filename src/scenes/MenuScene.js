/**
 * MenuScene.js
 * Scène Three.js du menu principal KuroSekai.
 *
 * DA améliorée :
 *  - Ciel gradient canvas (navy profond → violet horizon → lueur cité)
 *  - Aurores boréales translucides animées
 *  - Lune avec halo
 *  - Cité de fond (25 silhouettes lointaines) pour remplir tout l'écran
 *  - 15 bâtiments principaux avec bandes néon multiples
 *  - Portail : 5 anneaux + orbitales + cône de lumière
 *  - Flaques réfléchissantes au sol
 *  - Luminosité globale accrue
 */

import * as THREE from 'three';

export class MenuScene {
  constructor(canvas) {
    this.canvas         = canvas;
    this.clock          = new THREE.Clock();
    this.particles      = null;
    this.portal         = null;
    this.portalSphere   = null;
    this.portalOrbitals = null;
    this.portalLight    = null;
    this.violetLight    = null;
    this.groundGlow     = null;
    this._rings         = [];
    this.neonLines      = [];
    this.auroras        = [];
    this._init();
  }

  _init() {
    this._createRenderer();
    this._createScene();
    this._createCamera();
    this._createLights();
    this._createMoon();
    this._createAurora();
    this._createHorizonGlow();
    this._createGround();
    this._createBackgroundCity();
    this._createCity();
    this._createPortal();
    this._createParticles();
    window.addEventListener('resize', () => this._onResize());
  }

  /* ── Renderer transparent — le fond CSS est visible derrière ── */
  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0); // fond transparent
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 3.2;
  }

  /* ── Scène — pas de background, le CSS #sky-bg est visible à travers ── */
  _createScene() {
    this.scene = new THREE.Scene();
    // Pas de scene.background — le canvas est transparent
    this.scene.fog = new THREE.FogExp2(0x0a0818, 0.008);
  }

  /* ── Caméra : vue panoramique large, positionnée au centre de la ville ── */
  _createCamera() {
    this.camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 400);
    this.camera.position.set(0, 5, 13);
    this.camera.lookAt(3, 2, -8);
  }

  /* ── Lumières — beaucoup plus intenses ── */
  _createLights() {
    // Ambiante bleue de nuit
    this.scene.add(new THREE.AmbientLight(0x0d2040, 18));

    // Hémisphérique ciel / sol
    this.scene.add(new THREE.HemisphereLight(0x1a2a6a, 0x050412, 9));

    // Lumière principale portail
    this.portalLight = new THREE.PointLight(0x00d4ff, 55, 120);
    this.portalLight.position.set(12, 9, -6);
    this.scene.add(this.portalLight);

    // Halo violet du portail
    this.violetLight = new THREE.PointLight(0x7b2fff, 38, 100);
    this.violetLight.position.set(8, 13, -8);
    this.scene.add(this.violetLight);

    // Lumière lointaine droite — éclaire fond + bâtiments droite
    const rightFill = new THREE.PointLight(0x6600ff, 22, 180);
    rightFill.position.set(18, 22, -18);
    this.scene.add(rightFill);

    // Lueur de sol rose-violet
    this.groundGlow = new THREE.PointLight(0x8800ff, 14, 40);
    this.groundGlow.position.set(12, 0.5, -5);
    this.scene.add(this.groundGlow);

    // Néons de rue gauche et droite
    [-12, 18].forEach((x, i) => {
      const l = new THREE.PointLight(i === 0 ? 0x003fff : 0x00ccff, 9, 40);
      l.position.set(x, 4, 2);
      this.scene.add(l);
    });

    // Lumière horizon cité lointaine — bleu-violet chaud
    const cityGlow = new THREE.PointLight(0x1a2255, 10, 120);
    cityGlow.position.set(0, 8, -40);
    this.scene.add(cityGlow);

    // Lumière rose pour façade des bâtiments centraux
    const pinkFill = new THREE.PointLight(0xff2288, 12, 60);
    pinkFill.position.set(-5, 12, -10);
    this.scene.add(pinkFill);

    const sky = new THREE.DirectionalLight(0x1a2a60, 4);
    sky.position.set(0, 30, 10);
    this.scene.add(sky);
  }

  /* ── Lune + halo ── */
  _createMoon() {
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xaac8ff, emissive: 0x2244aa, emissiveIntensity: 0.6, fog: false,
    });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), moonMat);
    moon.position.set(-45, 55, -120);
    this.scene.add(moon);

    // Lumière douce de la lune
    const moonLight = new THREE.PointLight(0x334466, 4, 150);
    moonLight.position.set(-45, 55, -120);
    this.scene.add(moonLight);

    // Halo lumineux
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x112244, transparent: true, opacity: 0.18,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false,
    });
    const halo = new THREE.Mesh(new THREE.CircleGeometry(8, 32), haloMat);
    halo.position.set(-45, 55, -119);
    this.scene.add(halo);
  }

  /* ── Aurores boréales — plans translucides animés ── */
  _createAurora() {
    const auroraData = [
      { color: 0x0055ff, opacity: 0.72, x: 10,  y: 42, z: -90,  rx: 0.08, w: 220, h: 60 },
      { color: 0x7700cc, opacity: 0.62, x: -20, y: 50, z: -110, rx: 0.12, w: 200, h: 48 },
      { color: 0x00aa66, opacity: 0.50, x: 30,  y: 38, z: -80,  rx: 0.05, w: 175, h: 38 },
      { color: 0x0033aa, opacity: 0.58, x: -10, y: 60, z: -130, rx: 0.15, w: 260, h: 55 },
      { color: 0x5500aa, opacity: 0.45, x: 50,  y: 35, z: -70,  rx: 0.06, w: 140, h: 30 },
      { color: 0x003388, opacity: 0.40, x: -40, y: 45, z: -95,  rx: 0.09, w: 160, h: 35 },
      { color: 0x880066, opacity: 0.35, x: 20,  y: 55, z: -120, rx: 0.11, w: 190, h: 40 },
    ];

    auroraData.forEach(({ color, opacity, x, y, z, rx, w, h }) => {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,  // les aurores ne doivent pas être masquées par le fog
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.set(x, y, z);
      mesh.rotation.x = rx;
      mesh._baseOpacity = opacity;
      this.scene.add(mesh);
      this.auroras.push(mesh);
    });
  }

  /* ── Plan de lueur horizon — donne de la profondeur lumineuse ── */
  _createHorizonGlow() {
    // Grand plan vertical lumineux simulant une aurore / halo de cité à l'horizon
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x2200aa,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(400, 80), glowMat);
    glow.position.set(0, 18, -60);
    this.scene.add(glow);

    // Bande rose-violet plus basse pour l'horizon de ville
    const pinkMat = new THREE.MeshBasicMaterial({
      color: 0x880033,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const pink = new THREE.Mesh(new THREE.PlaneGeometry(400, 35), pinkMat);
    pink.position.set(0, 5, -35);
    this.scene.add(pink);
  }

  /* ── Sol asphalte + grille + lignes d'accent + flaques ── */
  _createGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x06090f, roughness: 0.2, metalness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(200, 100, 0x001a33, 0x000d1a);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // Lignes d'accent lumineuses
    const accentMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.22 });
    [
      [new THREE.Vector3(-100, 0.04, 0), new THREE.Vector3(100, 0.04, 0)],
      [new THREE.Vector3(0, 0.04, -100), new THREE.Vector3(0, 0.04, 100)],
    ].forEach(pts => {
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), accentMat));
    });

    // Flaques réfléchissantes au sol
    const puddlePositions = [
      { x: -5, z: 4, r: 2.2 }, { x: 5, z: 8, r: 1.4 }, { x: -14, z: -1, r: 1.0 },
      { x: 10, z: 1, r: 2.5 }, { x: 3, z: -3, r: 1.6 }, { x: -8, z: 10, r: 0.9 },
    ];
    puddlePositions.forEach(({ x, z, r }) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x08122a, roughness: 0.04, metalness: 0.95,
        emissive: 0x000814, emissiveIntensity: 0.5,
      });
      const p = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat);
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.04, z);
      this.scene.add(p);
    });
  }

  /* ── Cité lointaine — 30 silhouettes pour remplir l'horizon ── */
  _createBackgroundCity() {
    const silMat = new THREE.MeshStandardMaterial({ color: 0x040710, roughness: 1, metalness: 0 });
    const neonColors = [0x00d4ff, 0x7b2fff, 0xff44aa, 0x003fff];

    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 130;
      const h = 6 + Math.random() * 30;
      const w = 2 + Math.random() * 5;
      const d = 2 + Math.random() * 4;
      const z = -32 - Math.random() * 60;

      const bld = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), silMat);
      bld.position.set(x, h / 2, z);
      this.scene.add(bld);

      // Néon de toit discret
      if (Math.random() > 0.45) {
        const c = neonColors[Math.floor(Math.random() * neonColors.length)];
        const nMat = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.5 });
        nMat._baseEmit = 1.5;
        const n = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.1, d + 0.1), nMat);
        n.position.set(x, h, z);
        this.scene.add(n);
        this.neonLines.push(n);
      }
    }
  }

  /* ── Ville principale — 15 bâtiments avec bandes néon multiples ── */
  _createCity() {
    const baseMat    = new THREE.MeshStandardMaterial({ color: 0x080c18, roughness: 0.95, metalness: 0.2 });
    const neonCyan   = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 5 });
    const neonViolet = new THREE.MeshStandardMaterial({ color: 0x7b2fff, emissive: 0x7b2fff, emissiveIntensity: 5 });
    const neonBlue   = new THREE.MeshStandardMaterial({ color: 0x003fff, emissive: 0x003fff, emissiveIntensity: 4 });
    const neonPink   = new THREE.MeshStandardMaterial({ color: 0xff44aa, emissive: 0xff44aa, emissiveIntensity: 4 });

    const buildings = [
      { x: -10, z: -5,  w: 2.5, h: 15, d: 2.5, neon: neonCyan   },
      { x: -15, z: -8,  w: 3,   h: 24, d: 3,   neon: neonViolet },
      { x: -7,  z: -11, w: 2,   h: 10, d: 2,   neon: neonBlue   },
      { x: -22, z: -6,  w: 4,   h: 20, d: 3.5, neon: neonCyan   },
      { x:  14, z: -5,  w: 2.5, h: 13, d: 2,   neon: neonPink   },
      { x:  20, z: -9,  w: 3,   h: 22, d: 3,   neon: neonBlue   },
      { x:  25, z: -3,  w: 2,   h: 10, d: 2,   neon: neonCyan   },
      { x: -4,  z: -16, w: 5,   h: 9,  d: 3,   neon: neonViolet },
      { x:  9,  z: -14, w: 2,   h: 17, d: 2.5, neon: neonCyan   },
      { x: -28, z: -11, w: 3,   h: 15, d: 2.5, neon: neonBlue   },
      { x:  29, z: -7,  w: 2.5, h: 19, d: 3,   neon: neonViolet },
      { x: -33, z: -4,  w: 2,   h: 11, d: 2,   neon: neonPink   },
      { x:  33, z: -4,  w: 2,   h: 14, d: 2,   neon: neonCyan   },
      { x: -20, z: -18, w: 3.5, h: 9,  d: 2.5, neon: neonViolet },
      { x:  6,  z: -20, w: 2,   h: 7,  d: 2,   neon: neonBlue   },
    ];

    buildings.forEach(b => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), baseMat);
      body.position.set(b.x, b.h / 2, b.z);
      this.scene.add(body);

      // Bandes néon (top + intermédiaires)
      const bandYs = [b.h];
      if (b.h > 10) bandYs.push(b.h * 0.60);
      if (b.h > 17) bandYs.push(b.h * 0.32);

      bandYs.forEach(yPos => {
        const mat = b.neon.clone();
        mat.emissiveIntensity = 4 + Math.random() * 2;
        mat._baseEmit = mat.emissiveIntensity;
        const band = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.12, 0.12, b.d + 0.12), mat);
        band.position.set(b.x, yPos, b.z);
        this.scene.add(band);
        this.neonLines.push(band);
      });

      // Strip vertical
      if (b.h > 16 && Math.random() > 0.35) {
        const sMat = neonViolet.clone();
        sMat.emissiveIntensity = 4;
        sMat._baseEmit = 4;
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.09, b.h * 0.55, 0.09), sMat);
        strip.position.set(b.x + b.w / 2, b.h * 0.72, b.z + b.d / 2);
        this.scene.add(strip);
        this.neonLines.push(strip);
      }

      // Antenne + lumignon
      if (b.h > 15) {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 4, 6), baseMat);
        ant.position.set(b.x, b.h + 2, b.z);
        this.scene.add(ant);

        const tipMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 7 });
        tipMat._baseEmit = 7;
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), tipMat);
        tip.position.set(b.x, b.h + 4.1, b.z);
        this.scene.add(tip);
        this.neonLines.push(tip);
      }
    });
  }

  /* ── Portail démoniaque : 5 anneaux + orbitales + cône de lumière ── */
  _createPortal() {
    this.portal = new THREE.Group();
    this._rings = [];

    const ringDefs = [
      { r: 5.5, tube: 0.25, color: 0x00d4ff, emit: 6,   rx: 0,     ry: 0,     speed:  0.12 },
      { r: 4.6, tube: 0.15, color: 0x7b2fff, emit: 8,   rx: 0.38,  ry: 0,     speed: -0.24 },
      { r: 3.7, tube: 0.11, color: 0x00aaff, emit: 9,   rx: 0,     ry: 0.28,  speed:  0.40 },
      { r: 2.8, tube: 0.09, color: 0xff44ff, emit: 8,   rx: -0.22, ry: 0.14,  speed: -0.60 },
      { r: 1.8, tube: 0.07, color: 0x00ffcc, emit: 12,  rx: 0.12,  ry: -0.22, speed:  0.80 },
    ];

    ringDefs.forEach(({ r, tube, color, emit, rx, ry, speed }) => {
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: emit,
        roughness: 0.1, metalness: 0.9,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 20, 100), mat);
      ring.rotation.set(rx, ry, 0);
      ring._speed = speed;
      this.portal.add(ring);
      this._rings.push(ring);
    });

    // Disque sombre central
    this.portal.add(new THREE.Mesh(
      new THREE.CircleGeometry(1.45, 64),
      new THREE.MeshBasicMaterial({ color: 0x010308, transparent: true, opacity: 0.97, side: THREE.DoubleSide })
    ));

    // Halo intermédiaire
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(6.0, 64),
      new THREE.MeshBasicMaterial({
        color: 0x002266, transparent: true, opacity: 0.55,
        side: THREE.DoubleSide, depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    halo.position.z = -0.2;
    this.portal.add(halo);

    // Grand halo de lueur derrière le portail (illumine le ciel)
    const bigHalo = new THREE.Mesh(
      new THREE.CircleGeometry(14, 64),
      new THREE.MeshBasicMaterial({
        color: 0x110033, transparent: true, opacity: 0.6,
        side: THREE.DoubleSide, depthWrite: false,
        blending: THREE.AdditiveBlending, fog: false,
      })
    );
    bigHalo.position.z = -0.5;
    this.portal.add(bigHalo);

    // Sphère centrale
    this.portalSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 14,
        transparent: true, opacity: 0.9,
      })
    );
    this.portal.add(this.portalSphere);

    // Cône de lumière projeté depuis le portail vers le sol
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x0055aa,
      transparent: true, opacity: 0.055,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(7, 18, 32, 1, true), coneMat);
    cone.position.set(0, -10, 0);
    cone.rotation.x = Math.PI;
    this.portal.add(cone);
    this.lightCone = cone;

    // Particules orbitales
    this._createPortalOrbitals();

    this.portal.position.set(11, 8, -10);
    this.portal.rotation.y = -0.4;
    this.scene.add(this.portal);
  }

  _createPortalOrbitals() {
    const count = 110;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 4.2 + (Math.random() - 0.5) * 0.7;
      pos[i*3]     = Math.cos(a) * r;
      pos[i*3 + 1] = Math.sin(a) * r;
      pos[i*3 + 2] = (Math.random() - 0.5) * 0.6;
      if (Math.random() < 0.5) {
        col[i*3] = 0; col[i*3+1] = 0.83; col[i*3+2] = 1;
      } else {
        col[i*3] = 0.48; col[i*3+1] = 0.18; col[i*3+2] = 1;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    this.portalOrbitals = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.14, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true,
    }));
    this.portal.add(this.portalOrbitals);
  }

  /* ── 3 500 particules data-rain ── */
  _createParticles() {
    const count = 3500;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    const spd   = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3]     = (Math.random() - 0.5) * 90;
      pos[i3 + 1] = Math.random() * 35;
      pos[i3 + 2] = (Math.random() - 0.5) * 65;
      spd[i]      = 0.012 + Math.random() * 0.030;
      const t = Math.random();
      if (t < 0.55) {
        col[i3] = 0;    col[i3+1] = 0.83; col[i3+2] = 1;
      } else if (t < 0.8) {
        col[i3] = 0.48; col[i3+1] = 0.18; col[i3+2] = 1;
      } else {
        col[i3] = 0.88; col[i3+1] = 0.93; col[i3+2] = 1;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    this._particleSpeeds = spd;
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.1, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true,
    }));
    this.scene.add(this.particles);
  }

  /* ── Boucle d'animation ── */
  animate() {
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();

    // Anneaux du portail
    this._rings.forEach(r => { r.rotation.z += r._speed * 0.016; });
    if (this.portalOrbitals) this.portalOrbitals.rotation.z = -t * 0.28;

    // Sphère centrale
    if (this.portalSphere) {
      this.portalSphere.scale.setScalar(1 + Math.sin(t * 3.5) * 0.24);
      this.portalSphere.material.emissiveIntensity = 14 + Math.sin(t * 2.8) * 6;
    }

    // Cône de lumière — opacité pulsante
    if (this.lightCone) {
      this.lightCone.material.opacity = 0.04 + Math.sin(t * 1.8) * 0.02;
    }

    // Pulsation lumières portail
    if (this.portalLight)  this.portalLight.intensity = 16 + Math.sin(t * 2.2) * 5;
    if (this.violetLight)  this.violetLight.intensity = 10 + Math.sin(t * 1.8 + 1) * 4;
    if (this.groundGlow)   this.groundGlow.intensity  = 7  + Math.sin(t * 2.5 + 0.5) * 3;

    // Clignotement néons de bâtiments
    this.neonLines.forEach((line, idx) => {
      if (!line.material) return;
      const base    = line.material._baseEmit || 3;
      const flicker = Math.sin(t * (2.5 + idx * 0.65)) > 0.94 ? 0.2 : 1;
      line.material.emissiveIntensity = base * flicker;
    });

    // Aurores — légère pulsation d'opacité
    this.auroras.forEach((a, i) => {
      a.material.opacity = a._baseOpacity * (0.7 + 0.3 * Math.sin(t * 0.4 + i * 1.3));
    });

    // Chute des particules
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= this._particleSpeeds[i];
        if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 35;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Respiration caméra
    this.camera.position.y = 6 + Math.sin(t * 0.22) * 0.3;
    this.camera.position.x = -2 + Math.sin(t * 0.14) * 0.4;

    this.renderer.render(this.scene, this.camera);
  }

  /* ── Resize ── */
  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
