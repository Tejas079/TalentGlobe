import { flyCameraToCelestial, flyCameraToCoordinates, startCinematicTour, stopCinematicTour, clearCelestialTracking } from '../three/camera-flight.js';
import { openClaimModal } from './claim-modal.js';
import * as THREE from 'three';

let cardEl = null;
let modeEarthBtn = null;
let modeCosmicBtn = null;
let modeTourBtn = null;
let tourBannerEl = null;
let tourBannerText = null;
let btnExitTour = null;

let connectorSvg = null;
let connectorLine = null;
let connectorDot = null;

let _celestialSystem = null;
let activeMesh = null;
let activeCfg = null;

export function initCelestialUI(celestialSystemInstance) {
  _celestialSystem = celestialSystemInstance;

  cardEl = document.getElementById('celestial-showcase-card');
  modeEarthBtn = document.getElementById('btn-mode-earth');
  modeCosmicBtn = document.getElementById('btn-mode-cosmic');
  modeTourBtn = document.getElementById('btn-mode-tour');
  tourBannerEl = document.getElementById('cinematic-tour-banner');
  tourBannerText = document.getElementById('tour-banner-text');
  btnExitTour = document.getElementById('btn-exit-tour');

  connectorSvg = document.getElementById('celestial-connector-svg');
  connectorLine = document.getElementById('celestial-connector-line');
  connectorDot = document.getElementById('celestial-connector-dot');

  // Close card button
  const btnClose = document.getElementById('btn-close-celestial');
  if (btnClose) btnClose.addEventListener('click', closeCelestialCard);

  // Claim planet button inside celestial card
  const btnClaim = document.getElementById('celestial-claim-trigger');
  if (btnClaim) {
    btnClaim.addEventListener('click', () => {
      const targetBody = activeCfg?.key || 'sun';
      closeCelestialCard();
      openClaimModal(targetBody);
    });
  }

  // 1. Earth View button
  if (modeEarthBtn) {
    modeEarthBtn.addEventListener('click', () => {
      setActiveMode('earth');
      stopCinematicTour();
      hideTourBanner();
      closeCelestialCard();
      // Fly to Earth default meridian
      flyCameraToCoordinates(16, 22, 315);
    });
  }

  // 2. Cosmic Solar System View button
  if (modeCosmicBtn) {
    modeCosmicBtn.addEventListener('click', () => {
      setActiveMode('cosmic');
      stopCinematicTour();
      hideTourBanner();
      closeCelestialCard();
      // Fly out to grand cosmic angle
      const targetPos = new THREE.Vector3(0, 260, 680);
      flyCameraToCelestial(targetPos, new THREE.Vector3(0, 0, 0), 10, 1.8);
    });
  }

  // 3. Cinematic Tour button
  if (modeTourBtn) {
    modeTourBtn.addEventListener('click', () => {
      startTour();
    });
  }

  if (btnExitTour) {
    btnExitTour.addEventListener('click', () => {
      stopTour();
    });
  }
}

function setActiveMode(mode) {
  if (modeEarthBtn) modeEarthBtn.classList.toggle('active', mode === 'earth');
  if (modeCosmicBtn) modeCosmicBtn.classList.toggle('active', mode === 'cosmic');
  if (modeTourBtn) modeTourBtn.classList.toggle('active', mode === 'tour');
}

export function startTour() {
  setActiveMode('tour');
  closeCelestialCard();
  showTourBanner('🎬 CINEMATIC TOUR ACTIVE');

  startCinematicTour((waypoint) => {
    if (tourBannerText) {
      tourBannerText.textContent = `🎬 ${waypoint.label}`;
    }
  });
}

export function stopTour() {
  stopCinematicTour();
  hideTourBanner();
  setActiveMode('earth');
}

function showTourBanner(text) {
  if (tourBannerEl) {
    tourBannerEl.style.display = 'flex';
    if (tourBannerText && text) tourBannerText.textContent = text;
  }
}

function hideTourBanner() {
  if (tourBannerEl) {
    tourBannerEl.style.display = 'none';
  }
}

export function openCelestialCard(cfg, profile, mesh = null) {
  if (!cardEl) return;

  activeCfg = cfg;
  activeMesh = mesh || (_celestialSystem ? _celestialSystem.getMeshByRank(cfg.rank) : null);

  // Dynamic fallback: resolve profile through celestialSystem if not already provided
  if (!profile && _celestialSystem && typeof _celestialSystem.getProfileForCelestial === 'function') {
    profile = _celestialSystem.getProfileForCelestial(cfg);
  }

  const badgeEl = document.getElementById('celestial-badge');
  const iconEl = document.getElementById('celestial-icon');
  const nameEl = document.getElementById('celestial-name');
  const descEl = document.getElementById('celestial-desc');
  const statDayEl = document.getElementById('celestial-stat-day');
  const statYearEl = document.getElementById('celestial-stat-year');
  const projNameEl = document.getElementById('celestial-proj-name');
  const projFounderEl = document.getElementById('celestial-proj-founder');
  const projTaglineEl = document.getElementById('celestial-proj-tagline');
  const demoLinkEl = document.getElementById('celestial-demo-link');
  const claimBtnEl = document.getElementById('celestial-claim-trigger');

  if (badgeEl) badgeEl.textContent = cfg.badge;
  if (iconEl) iconEl.textContent = cfg.symbol;
  if (nameEl) nameEl.textContent = cfg.name;
  if (descEl) descEl.textContent = cfg.desc;
  if (statDayEl) statDayEl.textContent = `⏳ Day: ${cfg.realDay || '24 Hours'}`;
  if (statYearEl) statYearEl.textContent = `🪐 Orbit: ${cfg.realYear || '1 Earth Year'}`;

  if (profile) {
    const proj = profile.project || {};
    if (projNameEl) projNameEl.textContent = proj.title || cfg.name;
    if (projFounderEl) projFounderEl.textContent = `by ${profile.name || 'Open Source Maintainer'} • ${profile.city || 'Global'}, ${profile.country || 'Space'}`;
    if (projTaglineEl) projTaglineEl.textContent = proj.tagline || profile.pitch || 'Leading innovation in the global tech constellation.';
    if (demoLinkEl) {
      demoLinkEl.href = proj.demoUrl || 'https://www.tripezy.in/';
      demoLinkEl.style.display = 'inline-flex';
    }
    if (claimBtnEl) {
      claimBtnEl.innerHTML = `<span>👑</span> Claim / Sponsor Spot`;
    }
  } else {
    if (projNameEl) projNameEl.textContent = 'Available for Sponsorship';
    if (projFounderEl) projFounderEl.textContent = 'Claim this planet spot for your startup or open-source build';
    if (projTaglineEl) projTaglineEl.textContent = 'Exclusive 1-of-1 cosmic real estate orbiting the global tech map.';
    if (demoLinkEl) demoLinkEl.style.display = 'none';
    if (claimBtnEl) {
      claimBtnEl.innerHTML = `<span>👑</span> Claim Planet Spot`;
    }
  }

  cardEl.classList.add('active');
}

export function closeCelestialCard() {
  activeMesh = null;
  activeCfg = null;
  clearCelestialTracking();
  if (cardEl) {
    cardEl.classList.remove('active');
    cardEl.style.transform = 'translate3d(-9999px, -9999px, 0)';
  }
  if (connectorSvg) {
    connectorSvg.style.display = 'none';
  }
}

/**
 * Dynamically repositions the modal and holographic SVG connector every frame
 * so the card stays anchored to the moving/rotating planet in 3D space with 3D perspective tilt!
 */
export function updateCelestialModalPosition(camera) {
  if (!cardEl || !cardEl.classList.contains('active') || !activeMesh || !activeCfg) {
    if (connectorSvg) connectorSvg.style.display = 'none';
    return;
  }

  // 1. Get 3D world position of planet
  const worldPos = activeMesh.position.clone();

  // 2. Project to screen NDC (-1 to +1)
  const screenPos = worldPos.clone().project(camera);

  // If behind the camera, hide card and connector
  if (screenPos.z > 1) {
    cardEl.style.opacity = '0';
    cardEl.style.pointerEvents = 'none';
    if (connectorSvg) connectorSvg.style.display = 'none';
    return;
  }

  // Occlusion check if Earth passes between camera and planet
  if (_celestialSystem && _celestialSystem.checkEarthOcclusion(worldPos)) {
    cardEl.style.opacity = '0.2';
    cardEl.style.pointerEvents = 'none';
    if (connectorSvg) connectorSvg.style.display = 'none';
    return;
  }

  // 3. Convert NDC to 2D pixel coordinates
  const px = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const py = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

  // Approximate visual radius of planet on screen in pixels
  const dist = camera.position.distanceTo(worldPos);
  const fovRad = (camera.fov * Math.PI) / 180;
  const planetRadiusPx = Math.max(18, (activeCfg.size / (dist * Math.tan(fovRad * 0.5))) * (window.innerHeight * 0.5));

  const cardWidth = Math.min(420, window.innerWidth * 0.88);
  const cardHeight = cardEl.offsetHeight || 300;
  const margin = 34;

  // Position to the right if space permits; else flip to the left
  let cardX = px + planetRadiusPx + margin;
  let lineTargetX = cardX;

  if (cardX + cardWidth > window.innerWidth - 18) {
    cardX = px - planetRadiusPx - cardWidth - margin;
    lineTargetX = cardX + cardWidth;
  }

  // Clamp within viewport
  cardX = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, cardX));

  // Center vertically relative to planet
  let cardY = py - cardHeight * 0.44;
  cardY = Math.max(70, Math.min(window.innerHeight - cardHeight - 20, cardY));
  let lineTargetY = Math.max(cardY + 25, Math.min(cardY + cardHeight - 25, py));

  // 3D perspective tilt facing the planet
  const tiltY = cardX > px ? -5.5 : 5.5;
  const tiltX = ((py - (cardY + cardHeight * 0.5)) / (window.innerHeight * 0.5)) * 3.5;

  // Dynamic planet-matching glowing accent color
  const hexColor = '#' + (activeCfg.color ? activeCfg.color.toString(16).padStart(6, '0') : 'F59E0B');

  // Apply smooth transform position with subtle 3D rotational perspective
  cardEl.style.transform = `translate3d(${cardX.toFixed(1)}px, ${cardY.toFixed(1)}px, 0) perspective(900px) rotateY(${tiltY.toFixed(1)}deg) rotateX(${tiltX.toFixed(1)}deg)`;
  cardEl.style.borderColor = `${hexColor}70`;
  cardEl.style.boxShadow = `0 20px 60px rgba(0, 0, 0, 0.85), 0 0 32px ${hexColor}35`;
  cardEl.style.opacity = '1';
  cardEl.style.pointerEvents = 'auto';

  // 4. Update Holographic SVG tether line and dot
  if (connectorSvg && connectorLine && connectorDot) {
    connectorSvg.style.display = 'block';

    // Calculate contact point on the surface edge of the planet facing the card
    const angleToCard = Math.atan2(lineTargetY - py, lineTargetX - px);
    const dotX = px + Math.cos(angleToCard) * (planetRadiusPx * 0.96);
    const dotY = py + Math.sin(angleToCard) * (planetRadiusPx * 0.96);

    connectorLine.setAttribute('x1', dotX.toFixed(1));
    connectorLine.setAttribute('y1', dotY.toFixed(1));
    connectorLine.setAttribute('x2', lineTargetX.toFixed(1));
    connectorLine.setAttribute('y2', lineTargetY.toFixed(1));
    connectorLine.setAttribute('stroke', hexColor);

    connectorDot.setAttribute('cx', dotX.toFixed(1));
    connectorDot.setAttribute('cy', dotY.toFixed(1));
    connectorDot.setAttribute('fill', hexColor);
  }
}
