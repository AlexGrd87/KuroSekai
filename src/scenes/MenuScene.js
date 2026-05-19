/**
 * MenuScene.js
 * Scène Three.js du menu principal KuroSekai.
 *
 * Améliorations DA :
 *  - Portail démoniaque : 5 anneaux inclinés + orbitales de particules
 *  - Ville : bâtiments avec 3 bandes néon + strips verticaux + antennes
 *  - Sol asphalte réfléchissant + grille cyan + lignes d'accent
 *  - 3 000 particules data-rain avec chute continue
 *  - Lumière de sol rose-violet sous le portail
 */

import * as THREE from 'three';

export class MenuScene {
  constructor(canvas) {
    this.canvas          = canvas;
    this.clock           = new THREE.Clock();
    this.particles       = null;
    this.portal          = null;
    this.portalSphere    = null;
    this.portalOrbitals  = null;
    this.portalLight     = null;
    this.violetLight     = null;
    this.groundGlow      = null;
    this._rings          = [];
    this.neonLines       = [];
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

  /* ── Renderer ACES ── */
  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
  }

  /* ── Scène + brouillard ── */
  _createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05080f);
    this.scene.fog = new THREE.FogExp2(0x060a14, 0.017);
  }

  /* ── Caméra légèrement décalée pour dégager le portail ── */
  _createCamera() {
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(-4, 5, 16);
    this.camera.lookAt(5, 4, -2);
  }

  /* ── Lumières néon de la ville ── */
  _createLights() {
    this.scene.add(new THREE.AmbientLight(0x0a1830, 4));

    // Lumière principale du portail (cyan)
    this.portalLight = new THREE.PointLight(0x00d4ff, 14, 50);
    this.portalLight.position.set(9, 8, -5);
    this.scene.add(this.portalLight);

    // Halo violet secondaire
    this.violetLight = new THREE.PointLight(0x7b2fff, 9, 40);
    this.violetLight.position.set(6, 11, -7);
    this.scene.add(this.violetLight);

    // Lumière de sol rose sous le portail
    this.groundGlow = new THREE.PointLight(0x5500ff, 6, 22);
    this.groundGlow.position.set(9, 0.6, -6);
    this.scene.add(this.groundGlow);

    // Néons de rue
    const s1 = new THREE.PointLight(0x003fff, 4, 22);
    s1.position.set(-10, 3, 2);
    this.scene.add(s1);

    const s2 = new THREE.PointLight(0x00aaff, 3, 20);
    s2.position.set(16, 2, 5);
    this.scene.add(s2);

    const sky = new THREE.DirectionalLight(0x0a1540, 1.5);
    sky.position.set(0, 20, 10);
    this.scene.add(sky);
  }

  /* ── Sol asphalte réfléchissant + grille + lignes d'accent ── */
  _createGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({ color: 0x070b14, roughness: 0.22, metalness: 0.75 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Grille néon fine
    const grid = new THREE.GridHelper(160, 80, 0x002244, 0x001133);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // Lignes d'accent lumineuses (croix centrale)
    const accentMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.28 });
    [
      [new THREE.Vector3(-80, 0.04, 0), new THREE.Vector3(80, 0.04, 0)],
      [new THREE.Vector3(0, 0.04, -80), new THREE.Vector3(0, 0.04, 80)],
    ].forEach(pts => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.scene.add(new THREE.Line(geo, accentMat));
    });
  }

  /* ── Ville cyberpunk : 15 bâtiments avec néons multiples ── */
  _createCity() {
    const baseMat    = new THREE.MeshStandardMaterial({ color: 0x080c18, roughness: 0.95, metalness: 0.2 });
    const neonCyan   = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 4 });
    const neonViolet = new THREE.MeshStandardMaterial({ color: 0x7b2fff, emissive: 0x7b2fff, emissiveIntensity: 4 });
    const neonBlue   = new THREE.MeshStandardMaterial({ color: 0x003fff, emissive: 0x003fff, emissiveIntensity: 3 });
    const neonPink   = new THREE.MeshStandardMaterial({ color: 0xff44aa, emissive: 0xff44aa, emissiveIntensity: 3 });

    const buildings = [
      { x: -9,  z: -4,  w: 2.5, h: 14, d: 2.5, neon: neonCyan   },
      { x: -14, z: -7,  w: 3,   h: 23, d: 3,   neon: neonViolet },
      { x: -6,  z: -10, w: 2,   h: 9,  d: 2,   neon: neonBlue   },
      { x: -20, z: -5,  w: 4,   h: 19, d: 3.5, neon: neonCyan   },
      { x: 13,  z: -5,  w: 2.5, h: 12, d: 2,   neon: neonPink   },
      { x: 18,  z: -8,  w: 3,   h: 21, d: 3,   neon: neonBlue   },
      { x: 23,  z: -3,  w: 2,   h: 9,  d: 2,   neon: neonCyan   },
      { x: -3,  z: -15, w: 5,   h: 8,  d: 3,   neon: neonViolet },
      { x: 8,   z: -13, w: 2,   h: 16, d: 2.5, neon: neonCyan   },
      { x: -26, z: -10, w: 3,   h: 14, d: 2.5, neon: neonBlue   },
      { x: 27,  z: -6,  w: 2.5, h: 18, d: 3,   neon: neonViolet },
      { x: -31, z: -3,  w: 2,   h: 10, d: 2,   neon: neonPink   },
      { x: 31,  z: -4,  w: 2,   h: 13, d: 2,   neon: neonCyan   },
      { x: -18, z: -16, w: 3.5, h: 8,  d: 2.5, neon: neonViolet },
      { x: 5,   z: -19, w: 2,   h: 6,  d: 2,   neon: neonBlue   },
    ];

    buildings.forEach(b => {
      // Corps
      const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), baseMat);
      body.position.set(b.x, b.h / 2, b.z);
      this.scene.add(body);

      // Bandes néon horizontales (top obligatoire + 1-2 intermédiaires selon hauteur)
      const bandYs = [b.h];
      if (b.h > 10) bandYs.push(b.h * 0.60 + Math.random() * b.h * 0.1);
      if (b.h > 16) bandYs.push(b.h * 0.30 + Math.random() * b.h * 0.05);

      bandYs.forEach(yPos => {
        const mat = b.neon.clone();
        mat.emissiveIntensity = 3 + Math.random() * 1.5;
        mat._baseEmit = mat.emissiveIntensity;
        const band = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.12, 0.12, b.d + 0.12), mat);
        band.position.set(b.x, yPos, b.z);
        this.scene.add(band);
        this.neonLines.push(band);
      });

      // Strip néon vertical sur le coin des grands bâtiments
      if (b.h > 15 && Math.random() > 0.35) {
        const stripMat = neonViolet.clone();
        stripMat.emissiveIntensity = 3.5;
        stripMat._baseEmit = 3.5;
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, b.h * 0.55, 0.09),
          stripMat
        );
        strip.position.set(b.x + b.w / 2, b.h * 0.72, b.z + b.d / 2);
        this.scene.add(strip);
        this.neonLines.push(strip);
      }

      // Antenne sur grands bâtiments
      if (b.h > 14) {
        const ant = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.06, 3.8, 6),
          baseMat
        );
        ant.position.set(b.x, b.h + 1.9, b.z);
        this.scene.add(ant);

        const tipMat = new THREE.MeshStandardMaterial({
          color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 6,
        });
        tipMat._baseEmit = 6;
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), tipMat);
        tip.position.set(b.x, b.h + 3.9, b.z);
        this.scene.add(tip);
        this.neonLines.push(tip);
      }
    });
  }

  /* ── Portail démoniaque : 5 anneaux inclinés + orbitales ── */
  _createPortal() {
    this.portal = new THREE.Group();
    this._rings = [];

    const ringDefs = [
      { r: 4.0, tube: 0.18, color: 0x00d4ff, emit: 3,   rx: 0,     ry: 0,     speed:  0.12 },
      { r: 3.3, tube: 0.10, color: 0x7b2fff, emit: 4,   rx: 0.38,  ry: 0,     speed: -0.24 },
      { r: 2.7, tube: 0.08, color: 0x00aaff, emit: 5,   rx: 0,     ry: 0.28,  speed:  0.40 },
      { r: 2.1, tube: 0.07, color: 0xff44ff, emit: 4.5, rx: -0.22, ry: 0.14,  speed: -0.60 },
      { r: 1.5, tube: 0.05, color: 0x00ffcc, emit: 7,   rx: 0.12,  ry: -0.22, speed:  0.80 },
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

    // Disque central sombre (ouverture du portail)
    this.portal.add(new THREE.Mesh(
      new THREE.CircleGeometry(1.45, 64),
      new THREE.MeshBasicMaterial({ color: 0x010408, transparent: true, opacity: 0.97, side: THREE.DoubleSide })
    ));

    // Halo de lueur derrière
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 64),
      new THREE.MeshBasicMaterial({ color: 0x001840, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
    );
    halo.position.z = -0.2;
    this.portal.add(halo);

    // Sphère d'énergie centrale
    this.portalSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 12,
        transparent: true, opacity: 0.9,
      })
    );
    this.portal.add(this.portalSphere);

    // Anneau de particules orbitales
    this._createPortalOrbitals();

    this.portal.position.set(9, 7, -9);
    this.portal.rotation.y = -0.45;
    this.scene.add(this.portal);
  }

  /* ── 100 particules qui orbitent le portail ── */
  _createPortalOrbitals() {
    const count = 100;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 4.0 + (Math.random() - 0.5) * 0.6;
      pos[i*3]     = Math.cos(a) * r;
      pos[i*3 + 1] = Math.sin(a) * r;
      pos[i*3 + 2] = (Math.random() - 0.5) * 0.5;

      if (Math.random() < 0.5) {
        col[i*3] = 0; col[i*3+1] = 0.83; col[i*3+2] = 1;      // cyan
      } else {
        col[i*3] = 0.48; col[i*3+1] = 0.18; col[i*3+2] = 1;   // violet
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    this.portalOrbitals = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.13, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true,
    }));
    this.portal.add(this.portalOrbitals);
  }

  /* ── 3 000 particules data-rain ── */
  _createParticles() {
    const count = 3000;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    const spd   = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3]     = (Math.random() - 0.5) * 75;
      pos[i3 + 1] = Math.random() * 32;
      pos[i3 + 2] = (Math.random() - 0.5) * 55;
      spd[i]      = 0.014 + Math.random() * 0.032;

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
      size: 0.09, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true,
    }));
    this.scene.add(this.particles);
  }

  /* ── Boucle d'animation principale ── */
  animate() {
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();

    // Rotation indépendante de chaque anneau du portail
    this._rings.forEach(ring => { ring.rotation.z += ring._speed * 0.016; });

    // Les orbitales tournent en sens inverse
    if (this.portalOrbitals) this.portalOrbitals.rotation.z = -t * 0.28;

    // Pulsation de la sphère centrale
    if (this.portalSphere) {
      this.portalSphere.scale.setScalar(1 + Math.sin(t * 3.5) * 0.22);
      this.portalSphere.material.emissiveIntensity = 12 + Math.sin(t * 2.8) * 5;
    }

    // Pulsation lumières
    if (this.portalLight)  this.portalLight.intensity = 12 + Math.sin(t * 2.2) * 5;
    if (this.violetLight)  this.violetLight.intensity = 7  + Math.sin(t * 1.8 + 1) * 3;
    if (this.groundGlow)   this.groundGlow.intensity  = 5  + Math.sin(t * 2.5 + 0.5) * 2.5;

    // Clignotement des néons de bâtiments
    this.neonLines.forEach((line, idx) => {
      if (!line.material) return;
      const base    = line.material._baseEmit || 3;
      const flicker = Math.sin(t * (2.5 + idx * 0.65)) > 0.94 ? 0.2 : 1;
      line.material.emissiveIntensity = base * flicker;
    });

    // Chute des particules
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= this._particleSpeeds[i];
        if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 32;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Respiration caméra
    this.camera.position.y = 5 + Math.sin(t * 0.22) * 0.28;
    this.camera.position.x = -4 + Math.sin(t * 0.14) * 0.35;

    this.renderer.render(this.scene, this.camera);
  }

  /* ── Resize ── */
  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
