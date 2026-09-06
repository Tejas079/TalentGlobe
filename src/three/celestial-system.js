import * as THREE from 'three';
import { scene, camera, EARTH_RADIUS } from './scene.js';
import { PROFILES_DATA } from '../data/profiles.js';

/* --------------------------------------------------------------------------
   CELESTIAL SYSTEM CONFIGURATION
   Hollywood-Grade Visual Prototype with Sun (#1 TRIPEZY) & 9 VIP Planets
   -------------------------------------------------------------------------- */

export const CELESTIAL_CONFIG = [
  {
    key: 'sun',
    name: 'The Sun',
    symbol: '☀️',
    badge: '👑 SUPREME SPONSOR #1',
    rank: 1,
    size: 26,
    orbitRadius: 460,
    orbitSpeed: 0.000015, // Subtle barycentric cosmic drift
    spinSpeed: 0.00002,   // Real Sun: ~25 Earth days (slow plasma core rotation)
    realDay: '25.4 Earth Days',
    realYear: 'Center Anchor',
    orbitAngle: 0.85,
    inclination: 0.12,
    color: 0xF59E0B,
    emissive: 0xFBBF24,
    profileId: 1, // TRIPEZY (Tejas Kshirsagar)
    desc: 'The Golden Star at the center of the universe. Maximum visibility, high-intensity corona, illuminates all worlds.'
  },
  {
    key: 'jupiter',
    name: 'Jupiter',
    symbol: '🪐',
    badge: 'VIP PLANET #2 • TITAN',
    rank: 2,
    size: 13.5,
    orbitRadius: 360,
    orbitSpeed: 0.00009,  // Real orbit: 11.86 Earth years
    spinSpeed: 0.00072,   // Real day: 9.93 hours (Fastest gas giant spin, ~2.4x Earth)
    realDay: '9.9 Hours (Fast Gas Giant)',
    realYear: '11.86 Earth Years',
    orbitAngle: 2.1,
    inclination: 0.08,
    color: 0xD97706,
    profileId: 2, // Anthropic Skills
    hasRings: false,
    desc: 'The colossal gas giant. Storm-banded atmosphere and massive gravitational brand presence.'
  },
  {
    key: 'saturn',
    name: 'Saturn',
    symbol: '🪐',
    badge: 'VIP PLANET #3 • RINGED MAJESTY',
    rank: 3,
    size: 11.5,
    orbitRadius: 420,
    orbitSpeed: 0.00006,  // Real orbit: 29.45 Earth years
    spinSpeed: 0.00067,   // Real day: 10.7 hours (~2.2x Earth)
    realDay: '10.7 Hours',
    realYear: '29.45 Earth Years',
    orbitAngle: 3.8,
    inclination: 0.16,
    color: 0xFDE68A,
    profileId: 3, // Hermes Agent
    hasRings: true,
    ringInner: 14,
    ringOuter: 25,
    ringColor: 0xF59E0B,
    desc: 'The jewel of the solar system. Iconic golden tilted rings and high aesthetic appeal.'
  },
  {
    key: 'mars',
    name: 'Mars',
    symbol: '🔴',
    badge: 'VIP PLANET #4 • FRONTIER',
    rank: 4,
    size: 7.2,
    orbitRadius: 280,
    orbitSpeed: 0.00018,  // Real orbit: 687 Earth days (1.88 years)
    spinSpeed: 0.00029,   // Real day: 24.6 hours (Almost identical to Earth's 24 hours!)
    realDay: '24.6 Hours',
    realYear: '687 Earth Days',
    orbitAngle: 5.1,
    inclination: 0.05,
    color: 0xEF4444,
    profileId: 4, // Supabase
    desc: 'The red frontier. Iron-rich dusty plains for relentless builders pushing boundaries.'
  },
  {
    key: 'venus',
    name: 'Venus',
    symbol: '💎',
    badge: 'VIP PLANET #5 • MORNING STAR',
    rank: 5,
    size: 8.4,
    orbitRadius: 230,
    orbitSpeed: 0.00030,  // Real orbit: 224.7 Earth days
    spinSpeed: -0.00002,  // Real day: 243 Earth days (Super slow retrograde rotation!)
    realDay: '243 Earth Days (Retrograde)',
    realYear: '225 Earth Days',
    orbitAngle: 1.2,
    inclination: 0.06,
    color: 0xFBBF24,
    profileId: 5, // Browser Use
    desc: 'The brilliant morning star. Dense golden clouds and high-reflectivity presence.'
  },
  {
    key: 'mercury',
    name: 'Mercury',
    symbol: '⚡',
    badge: 'VIP PLANET #6 • SPEED DEMON',
    rank: 6,
    size: 5.5,
    orbitRadius: 185,
    orbitSpeed: 0.00045,  // Real orbit: 88 Earth days (Fastest planetary orbit!)
    spinSpeed: 0.00004,   // Real day: 58.6 Earth days (Slow prograde spin)
    realDay: '58.6 Earth Days',
    realYear: '88 Earth Days (Fastest Orbit)',
    orbitAngle: 4.4,
    inclination: 0.14,
    color: 0x94A3B8,
    profileId: 6, // Astral uv
    desc: 'Fast-moving, high-frequency orbit closest to the central sunbeams.'
  },
  {
    key: 'moon',
    name: 'The Moon',
    symbol: '🌕',
    badge: 'VIP CELESTIAL #7 • LUNAR ORB',
    rank: 7,
    size: 5.0,
    orbitRadius: 138,
    orbitSpeed: 0.00065,  // Real orbit: 27.3 Earth days around Earth
    spinSpeed: 0.00002,   // Tidally locked to Earth
    realDay: 'Tidally Locked (27.3 Days)',
    realYear: '27.3 Days (Lunar Orbit)',
    orbitAngle: 0.3,
    inclination: 0.22,
    color: 0xE2E8F0,
    profileId: 7, // Ollama
    desc: 'Earth’s closest cosmic companion. High-contrast craters watching over the world map.'
  },
  {
    key: 'neptune',
    name: 'Neptune',
    symbol: '🔵',
    badge: 'VIP PLANET #8 • DEEP AZURE',
    rank: 8,
    size: 9.2,
    orbitRadius: 490,
    orbitSpeed: 0.000028, // Real orbit: 164.8 Earth years
    spinSpeed: 0.00045,   // Real day: 16.1 hours (~1.5x Earth)
    realDay: '16.1 Hours',
    realYear: '164.8 Earth Years',
    orbitAngle: 2.9,
    inclination: 0.04,
    color: 0x3B82F6,
    profileId: 8, // FastAPI
    desc: 'Deep-space azure giant. Cryogenic elegance at the far reach of the planetary system.'
  },
  {
    key: 'uranus',
    name: 'Uranus',
    symbol: '🌀',
    badge: 'VIP PLANET #9 • CYAN ICE',
    rank: 9,
    size: 9.0,
    orbitRadius: 455,
    orbitSpeed: 0.000040, // Real orbit: 84.0 Earth years
    spinSpeed: -0.00042,  // Real day: 17.2 hours (Retrograde on 98° tilted axis!)
    realDay: '17.2 Hours (Retrograde)',
    realYear: '84.0 Earth Years',
    orbitAngle: 0.1,
    inclination: 0.11,
    color: 0x06B6D4,
    profileId: 9, // vLLM
    desc: 'Aquamarine ice giant with vertical planetary tilt.'
  },
  {
    key: 'pluto',
    name: 'Pluto Outpost',
    symbol: '❄️',
    badge: 'VIP PLANET #10 • FRONTIER',
    rank: 10,
    size: 4.5,
    orbitRadius: 530,
    orbitSpeed: 0.000018, // Real orbit: 248.0 Earth years
    spinSpeed: -0.00008,  // Real day: 6.4 Earth days (Retrograde)
    realDay: '6.4 Earth Days (Retrograde)',
    realYear: '248.0 Earth Years',
    orbitAngle: 3.5,
    inclination: 0.28,
    color: 0xC084FC,
    profileId: 10, // shadcn/ui
    desc: 'The outer edge of the tech galaxy. Distinct high-inclination orbit for avant-garde creators.'
  }
];

/* --------------------------------------------------------------------------
   Procedural Planet Textures Generator
   -------------------------------------------------------------------------- */

function createNoiseCanvas(width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 1. Sun Texture (Boiling Solar Plasma)
function generateSunTexture() {
  return createNoiseCanvas(1024, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#F59E0B');
    grad.addColorStop(0.3, '#FBBF24');
    grad.addColorStop(0.6, '#EF4444');
    grad.addColorStop(1, '#D97706');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Solar granulation flares
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const rr = 8 + Math.random() * 32;
      const flare = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
      flare.addColorStop(0, 'rgba(255, 255, 230, 0.45)');
      flare.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
      flare.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = flare;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// 2. Jupiter Storm Bands
function generateJupiterTexture() {
  return createNoiseCanvas(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#D97706';
    ctx.fillRect(0, 0, w, h);
    const bands = [
      { y: 0.15, h: 0.08, col: '#78350F' },
      { y: 0.28, h: 0.12, col: '#FDE68A' },
      { y: 0.45, h: 0.14, col: '#B45309' },
      { y: 0.62, h: 0.09, col: '#FDE68A' },
      { y: 0.76, h: 0.11, col: '#78350F' }
    ];
    bands.forEach(b => {
      ctx.fillStyle = b.col;
      ctx.fillRect(0, b.y * h, w, b.h * h);
    });
    // Great Red Spot
    const rSpot = ctx.createRadialGradient(w * 0.62, h * 0.58, 2, w * 0.62, h * 0.58, 28);
    rSpot.addColorStop(0, '#DC2626');
    rSpot.addColorStop(0.7, '#991B1B');
    rSpot.addColorStop(1, 'rgba(180, 83, 9, 0)');
    ctx.fillStyle = rSpot;
    ctx.beginPath();
    ctx.ellipse(w * 0.62, h * 0.58, 28, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 3. Saturn Ring Texture
function generateSaturnRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0.0, 'rgba(0,0,0,0)');
  g.addColorStop(0.12, 'rgba(245, 158, 11, 0.45)');
  g.addColorStop(0.40, 'rgba(253, 230, 138, 0.85)');
  g.addColorStop(0.55, 'rgba(0, 0, 0, 0.05)'); // Cassini division
  g.addColorStop(0.65, 'rgba(245, 158, 11, 0.75)');
  g.addColorStop(0.92, 'rgba(217, 119, 6, 0.35)');
  g.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 32);
  return new THREE.CanvasTexture(canvas);
}

// 4. Mars Rusty Surface
function generateMarsTexture() {
  return createNoiseCanvas(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#C2410C';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 150; i++) {
      const rx = Math.random() * w;
      const ry = 20 + Math.random() * (h - 40);
      const rr = 6 + Math.random() * 25;
      const dark = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
      dark.addColorStop(0, 'rgba(67, 20, 7, 0.35)');
      dark.addColorStop(1, 'rgba(194, 65, 12, 0)');
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Polar ice cap
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(w * 0.5, 4, 24, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 5. Generic Planet Textures
function generateGenericPlanetTexture(baseCol, accentCol) {
  return createNoiseCanvas(256, 128, (ctx, w, h) => {
    ctx.fillStyle = baseCol;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const rr = 8 + Math.random() * 20;
      const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
      g.addColorStop(0, accentCol);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/* --------------------------------------------------------------------------
   CELESTIAL SYSTEM MANAGER
   -------------------------------------------------------------------------- */

export class CelestialSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'CelestialSystem';
    this.planets = [];
    this.sunMesh = null;
    this.sunLight = null;
    this.sunCorona = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.onSelectPlanet = null;
    this.labelsContainer = null;
    this.isCosmicViewActive = false;
  }

  init(container, onSelectPlanet) {
    this.onSelectPlanet = onSelectPlanet;
    this.labelsContainer = document.createElement('div');
    this.labelsContainer.id = 'celestial-labels-container';
    this.labelsContainer.style.position = 'absolute';
    this.labelsContainer.style.top = '0';
    this.labelsContainer.style.left = '0';
    this.labelsContainer.style.width = '100%';
    this.labelsContainer.style.height = '100%';
    this.labelsContainer.style.pointerEvents = 'none';
    this.labelsContainer.style.zIndex = '15';
    container.appendChild(this.labelsContainer);

    // Build the Sun & Planets
    this.buildSun();
    this.buildPlanets();
    this.buildOrbitalRings();
    this.buildCosmicNebula();

    scene.add(this.group);

    // Click handler for 3D celestial objects
    window.addEventListener('pointerdown', (e) => this.onPointerDown(e));
  }

  buildSun() {
    const sunCfg = CELESTIAL_CONFIG[0];
    const sunTexture = generateSunTexture();

    // 1. Sun Core Sphere
    const sunGeo = new THREE.SphereGeometry(sunCfg.size, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture,
      color: 0xFFFBEB
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.userData = { config: sunCfg };

    // 2. Multi-layer Solar Corona Glow (Additive Blending)
    const coronaGeo = new THREE.SphereGeometry(sunCfg.size * 1.35, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    this.sunMesh.add(coronaMesh);

    // 3. Outer Solar Flare Aura
    const auraGeo = new THREE.SphereGeometry(sunCfg.size * 1.9, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xFBBF24,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.sunMesh.add(auraMesh);

    // 4. Radiant PointLight emanating from Sun
    this.sunLight = new THREE.PointLight(0xFFF3D6, 2.5, 2200, 0.75);
    this.sunMesh.add(this.sunLight);

    // Create 2D HUD label element
    const labelEl = this.createLabelElement(sunCfg);
    this.sunMesh.userData.labelEl = labelEl;

    this.group.add(this.sunMesh);
    this.planets.push(this.sunMesh);
  }

  buildPlanets() {
    for (let i = 1; i < CELESTIAL_CONFIG.length; i++) {
      const cfg = CELESTIAL_CONFIG[i];
      let texture;

      if (cfg.key === 'jupiter') texture = generateJupiterTexture();
      else if (cfg.key === 'mars') texture = generateMarsTexture();
      else if (cfg.key === 'venus') texture = generateGenericPlanetTexture('#FBBF24', 'rgba(217, 119, 6, 0.4)');
      else if (cfg.key === 'neptune') texture = generateGenericPlanetTexture('#2563EB', 'rgba(96, 165, 250, 0.5)');
      else if (cfg.key === 'uranus') texture = generateGenericPlanetTexture('#06B6D4', 'rgba(165, 243, 252, 0.4)');
      else if (cfg.key === 'moon') texture = generateGenericPlanetTexture('#94A3B8', 'rgba(51, 65, 85, 0.5)');
      else texture = generateGenericPlanetTexture('#E2E8F0', 'rgba(148, 163, 184, 0.4)');

      // Planet Sphere Geometry
      const geo = new THREE.SphereGeometry(cfg.size, 36, 36);
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0.1
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { config: cfg };

      // Subtle atmospheric glow layer
      const atmoGeo = new THREE.SphereGeometry(cfg.size * 1.06, 24, 24);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      });
      mesh.add(new THREE.Mesh(atmoGeo, atmoMat));

      // Saturn Rings
      if (cfg.hasRings) {
        const ringGeo = new THREE.RingGeometry(cfg.ringInner, cfg.ringOuter, 64);
        const ringTex = generateSaturnRingTexture();
        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.88,
          roughness: 0.6
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI * 0.45;
        ringMesh.rotation.y = Math.PI * 0.1;
        mesh.add(ringMesh);
      }

      // 2D Label element
      const labelEl = this.createLabelElement(cfg);
      mesh.userData.labelEl = labelEl;

      this.group.add(mesh);
      this.planets.push(mesh);
    }
  }

  buildOrbitalRings() {
    CELESTIAL_CONFIG.forEach(cfg => {
      const points = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * cfg.orbitRadius;
        const z = Math.sin(theta) * cfg.orbitRadius;
        const y = Math.sin(theta) * cfg.orbitRadius * cfg.inclination;
        points.push(new THREE.Vector3(x, y, z));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMat = new THREE.LineBasicMaterial({
        color: cfg.rank === 1 ? 0xF5A20B : (cfg.rank <= 3 ? 0x60A5FA : 0x334155),
        transparent: true,
        opacity: cfg.rank === 1 ? 0.35 : (cfg.rank <= 3 ? 0.22 : 0.12),
        blending: THREE.AdditiveBlending
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      this.group.add(orbitLine);
    });
  }

  buildCosmicNebula() {
    const particleCount = 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color(0xF59E0B), // Solar Gold
      new THREE.Color(0x3B82F6), // Cosmic Blue
      new THREE.Color(0xA855F7), // Nebula Purple
      new THREE.Color(0x06B6D4)  // Teal
    ];

    for (let i = 0; i < particleCount; i++) {
      const r = 500 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.45; // flatter galaxy disk
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const nebulaMesh = new THREE.Points(geo, mat);
    this.group.add(nebulaMesh);
  }

  getProfileForCelestial(cfg) {
    if (!cfg) return null;

    // 1. By explicit spotlightRank (Rank 1 = Sun, Rank 2 = Jupiter, etc.)
    const byRank = PROFILES_DATA.find(p => p.spotlightRank === cfg.rank);
    if (byRank) return byRank;

    // 2. By tier 5 profiles array
    const t5 = PROFILES_DATA.filter(p => p.tier === 5);
    if (t5[cfg.rank - 1]) return t5[cfg.rank - 1];

    // 3. Fallback by configured profileId
    if (cfg.profileId) {
      const byId = PROFILES_DATA.find(p => p.id === cfg.profileId);
      if (byId) return byId;
    }

    // 4. Special fallback for The Sun (#1 Spot) -> TRIPEZY
    if (cfg.rank === 1) {
      const tripezy = PROFILES_DATA.find(p => 
        (p.project?.title && p.project.title.toLowerCase().includes('tripezy')) ||
        (p.title && p.title.toLowerCase().includes('tripezy')) ||
        (p.name && p.name.toLowerCase().includes('tejas'))
      );
      if (tripezy) return tripezy;
    }

    return null;
  }

  createLabelElement(cfg) {
    const el = document.createElement('div');
    el.className = 'celestial-billboard-label' + (cfg.rank === 1 ? ' sun-label' : '');

    // Match profile title dynamically
    const profile = this.getProfileForCelestial(cfg) || {};
    const projName = profile.project?.title || cfg.name;

    el.innerHTML = `
      <div class="celestial-badge-pill">${cfg.badge}</div>
      <div class="celestial-name-row">
        <span class="celestial-icon">${cfg.symbol}</span>
        <span class="celestial-name">${projName}</span>
      </div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectCelestialBody(cfg);
    });

    this.labelsContainer.appendChild(el);
    return el;
  }

  update(delta) {
    const time = performance.now();
    // Normalize frame delta (1.0 at standard 60 FPS, clamped to prevent lag teleports)
    const dt = Math.min(Math.max((delta || 16.67) / 16.667, 0.2), 3.0);

    // Advance planetary orbital mechanics
    this.planets.forEach((mesh, index) => {
      const cfg = mesh.userData.config;
      if (!cfg) return;

      // Realistic Axial spin as per real planet sidereal physics
      const spin = cfg.spinSpeed !== undefined ? cfg.spinSpeed : 0.0003;
      mesh.rotation.y += spin * dt;

      // Realistic Orbital progression as per Keplerian mechanics
      cfg.orbitAngle += (cfg.orbitSpeed || 0.0001) * dt;

      const x = Math.cos(cfg.orbitAngle) * cfg.orbitRadius;
      const z = Math.sin(cfg.orbitAngle) * cfg.orbitRadius;
      const y = Math.sin(cfg.orbitAngle) * cfg.orbitRadius * cfg.inclination;

      mesh.position.set(x, y, z);

      // Sun corona breathing animation
      if (cfg.rank === 1) {
        const pulse = 1 + Math.sin(time * 0.002) * 0.06;
        mesh.children[0].scale.set(pulse, pulse, pulse);
        mesh.children[1].scale.set(1 / pulse, 1 / pulse, 1 / pulse);
      }

      // Project 3D position to 2D screen coordinate for HUD Label
      const labelEl = mesh.userData.labelEl;
      if (labelEl) {
        const screenPos = mesh.position.clone();
        screenPos.y += cfg.size + 6; // float above
        screenPos.project(camera);

        // Check if behind camera
        if (screenPos.z > 1) {
          labelEl.style.opacity = '0';
          labelEl.style.pointerEvents = 'none';
        } else {
          const sx = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

          // Distance fading
          const distToCam = camera.position.distanceTo(mesh.position);
          const isOccludedByEarth = this.checkEarthOcclusion(mesh.position);

          if (isOccludedByEarth) {
            labelEl.style.opacity = '0.08';
            labelEl.style.pointerEvents = 'none';
          } else {
            const alpha = THREE.MathUtils.clamp(1 - (distToCam - 200) / 750, 0.25, 1.0);
            labelEl.style.opacity = alpha.toFixed(2);
            labelEl.style.pointerEvents = 'auto';
          }

          labelEl.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`;
        }
      }
    });
  }

  checkEarthOcclusion(planetPos) {
    const vCam = camera.position;
    // Simple ray-sphere intersection with Earth at (0,0,0) radius 100
    const d = planetPos.clone().sub(vCam);
    const dLen = d.length();
    d.normalize();

    const earthPos = new THREE.Vector3(0, 0, 0);
    const vToEarth = earthPos.clone().sub(vCam);
    const tClosest = vToEarth.dot(d);

    if (tClosest < 0 || tClosest > dLen) return false;

    const closestPoint = vCam.clone().add(d.clone().multiplyScalar(tClosest));
    const distToCenter = closestPoint.distanceTo(earthPos);

    return distToCenter < (EARTH_RADIUS * 0.96);
  }

  onPointerDown(event) {
    // Only raycast when clicking on canvas directly (not on modals/hud buttons)
    if (event.target.tagName !== 'CANVAS') return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(this.planets, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const cfg = hit.userData.config;
      if (cfg) {
        this.selectCelestialBody(cfg);
      }
    }
  }

  selectCelestialBody(cfg) {
    const profile = this.getProfileForCelestial(cfg);
    if (this.onSelectPlanet) {
      this.onSelectPlanet(cfg, profile);
    }
  }

  refreshLabels() {
    this.planets.forEach((mesh) => {
      const cfg = mesh.userData?.config;
      const labelEl = mesh.userData?.labelEl;
      if (cfg && labelEl) {
        const profile = this.getProfileForCelestial(cfg) || {};
        const projName = profile.project?.title || cfg.name;
        const nameSpan = labelEl.querySelector('.celestial-name');
        if (nameSpan) nameSpan.textContent = projName;
      }
    });
  }

  getPlanetByRank(rank) {
    const mesh = this.planets.find(p => p.userData?.config?.rank === rank);
    return mesh ? mesh.userData.config : null;
  }

  getMeshByRank(rank) {
    return this.planets.find(p => p.userData?.config?.rank === rank);
  }

  setLabelsVisible(visible) {
    if (this.labelsContainer) {
      this.labelsContainer.style.display = visible ? 'block' : 'none';
    }
  }
}

export const celestialSystem = new CelestialSystem();
