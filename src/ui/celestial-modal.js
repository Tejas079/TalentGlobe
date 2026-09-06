import { flyCameraToCelestial, flyCameraToCoordinates, startCinematicTour, stopCinematicTour } from '../three/camera-flight.js';
import { openClaimModal } from './claim-modal.js';
import * as THREE from 'three';

let cardEl = null;
let modeEarthBtn = null;
let modeCosmicBtn = null;
let modeTourBtn = null;
let tourBannerEl = null;
let tourBannerText = null;
let btnExitTour = null;

let _celestialSystem = null;

export function initCelestialUI(celestialSystemInstance) {
  _celestialSystem = celestialSystemInstance;

  cardEl = document.getElementById('celestial-showcase-card');
  modeEarthBtn = document.getElementById('btn-mode-earth');
  modeCosmicBtn = document.getElementById('btn-mode-cosmic');
  modeTourBtn = document.getElementById('btn-mode-tour');
  tourBannerEl = document.getElementById('cinematic-tour-banner');
  tourBannerText = document.getElementById('tour-banner-text');
  btnExitTour = document.getElementById('btn-exit-tour');

  // Close card button
  const btnClose = document.getElementById('btn-close-celestial');
  if (btnClose) btnClose.addEventListener('click', closeCelestialCard);

  // Claim planet button inside celestial card
  const btnClaim = document.getElementById('celestial-claim-trigger');
  if (btnClaim) {
    btnClaim.addEventListener('click', () => {
      closeCelestialCard();
      openClaimModal();
    });
  }

  // 1. Earth View button
  if (modeEarthBtn) {
    modeEarthBtn.addEventListener('click', () => {
      setActiveMode('earth');
      stopCinematicTour();
      hideTourBanner();
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

export function openCelestialCard(cfg, profile) {
  if (!cardEl) return;

  const badgeEl = document.getElementById('celestial-badge');
  const iconEl = document.getElementById('celestial-icon');
  const nameEl = document.getElementById('celestial-name');
  const descEl = document.getElementById('celestial-desc');
  const projNameEl = document.getElementById('celestial-proj-name');
  const projFounderEl = document.getElementById('celestial-proj-founder');
  const projTaglineEl = document.getElementById('celestial-proj-tagline');
  const demoLinkEl = document.getElementById('celestial-demo-link');

  if (badgeEl) badgeEl.textContent = cfg.badge;
  if (iconEl) iconEl.textContent = cfg.symbol;
  if (nameEl) nameEl.textContent = cfg.name;
  if (descEl) descEl.textContent = cfg.desc;

  if (profile) {
    const proj = profile.project || {};
    if (projNameEl) projNameEl.textContent = proj.title || cfg.name;
    if (projFounderEl) projFounderEl.textContent = `by ${profile.name || 'Open Source Maintainer'} • ${profile.city || 'Global'}, ${profile.country || 'Space'}`;
    if (projTaglineEl) projTaglineEl.textContent = proj.tagline || profile.pitch || 'Leading innovation in the global tech constellation.';
    if (demoLinkEl) {
      demoLinkEl.href = proj.demoUrl || 'https://www.tripezy.in/';
      demoLinkEl.style.display = 'flex';
    }
  } else {
    if (projNameEl) projNameEl.textContent = 'Available for Sponsorship';
    if (projFounderEl) projFounderEl.textContent = 'Claim this planet spot for your startup or open-source build';
    if (projTaglineEl) projTaglineEl.textContent = 'Exclusive 1-of-1 cosmic real estate orbiting the global tech map.';
    if (demoLinkEl) demoLinkEl.style.display = 'none';
  }

  cardEl.classList.add('active');
}

export function closeCelestialCard() {
  if (cardEl) {
    cardEl.classList.remove('active');
  }
}
