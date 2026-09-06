import * as THREE from 'three';
import { camera } from '../three/scene.js';
import { tier5Profiles } from '../three/markers.js';
import { flyCameraToCoordinates } from '../three/camera-flight.js';
import { openClaimModal } from './claim-modal.js';

const spotlightCarousel = document.getElementById('spotlight-carousel');
const spotlightDock = document.getElementById('spotlight-dock');

let lastSpotlightTopIds = '';
let isDockHovered = false;
let activeProfileId = null;
const SPOTLIGHT_SLOTS = 6;
const vCam = new THREE.Vector3();
const vDir = new THREE.Vector3();

// Pause DOM destruction while user is actively hovering over cards to click
if (spotlightDock) {
  spotlightDock.addEventListener('mouseenter', () => { isDockHovered = true; });
  spotlightDock.addEventListener('mouseleave', () => { isDockHovered = false; });
}

export function setActiveSpotlightProfile(id) {
  activeProfileId = id;
  if (!spotlightCarousel) return;
  const cards = spotlightCarousel.querySelectorAll('.spotlight-card-item');
  cards.forEach(c => {
    c.classList.toggle('active', c.dataset.profileId == id);
  });
}

export function updateDynamicSpotlights(onSelectProfile) {
  if (!spotlightCarousel) return;

  // Protect against destroying cards under the user cursor while they are hovering
  if (isDockHovered) return;

  vCam.copy(camera.position);

  const inView = [];
  const offView = [];
  tier5Profiles.forEach(p => {
    vDir.subVectors(vCam, p.pos3D).normalize();
    (p.normal.dot(vDir) > 0.08 ? inView : offView).push(p);
  });

  const byRank = (a, b) => a.spotlightRank - b.spotlightRank;
  inView.sort(byRank);
  offView.sort(byRank);

  // Compute the 6 cards that will actually be visible
  const display = inView.slice(0, SPOTLIGHT_SLOTS);
  for (let i = 0; display.length < SPOTLIGHT_SLOTS && i < offView.length; i++) {
    display.push(offView[i]);
  }

  // Key is based on the 6 displayed cards, not all 20 global items
  const key = display.map(p => p.id).join(',');
  if (key === lastSpotlightTopIds) {
    // Just sync is-offview and active classes without wiping DOM
    const liveSet = new Set(inView.map(p => String(p.id)));
    const cards = spotlightCarousel.querySelectorAll('.spotlight-card-item');
    cards.forEach(c => {
      const pid = c.dataset.profileId;
      if (pid) {
        c.classList.toggle('is-offview', !liveSet.has(pid));
        c.classList.toggle('active', pid === String(activeProfileId));
      }
    });
    return;
  }
  lastSpotlightTopIds = key;

  spotlightCarousel.innerHTML = '';
  const live = new Set(inView.map(p => p.id));
  display.forEach(p => appendSpotlightCard(p, live.has(p.id), onSelectProfile));
  appendClaimCard();
}

function appendClaimCard() {
  const card = document.createElement('div');
  card.className = 'spotlight-card-item claim-spotlight-card';
  card.innerHTML = `
    <div class="spotlight-avatar claim-avatar">👑</div>
    <div class="spotlight-meta">
      <span class="spotlight-rank-tag vip-tag">★ SPOT #1 OPEN</span>
      <span class="spotlight-name">Claim The Gold Spot</span>
      <span class="spotlight-city">Instant UPI & Card • 50k+ Views</span>
    </div>
  `;
  card.title = 'Click to Claim #1 Gold Spotlight with Instant UPI or Card';
  card.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openClaimModal();
  });
  spotlightCarousel.appendChild(card);
}

function appendSpotlightCard(p, isLive, onSelectProfile) {
  const card = document.createElement('div');
  const isActive = (p.id === activeProfileId);
  card.className = 'spotlight-card-item' + (isLive ? '' : ' is-offview') + (isActive ? ' active' : '');
  card.dataset.profileId = p.id;

  const projTitle = (p.project && p.project.title) ? p.project.title : p.name;
  const metric = (p.project && p.project.metric) ? p.project.metric : 'Featured';

  card.innerHTML = `
    <div class="spotlight-avatar">${p.initials}</div>
    <div class="spotlight-meta">
      <span class="spotlight-rank-tag">#${p.spotlightRank} • ${metric}</span>
      <span class="spotlight-name">${projTitle}</span>
      <span class="spotlight-city">by ${p.name} • ${p.city}</span>
    </div>
  `;
  card.title = isLive ? `In view now: ${projTitle}` : `Rotate globe to view ${projTitle}`;

  card.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Immediately activate highlight in the dock
    activeProfileId = p.id;
    const allCards = spotlightCarousel.querySelectorAll('.spotlight-card-item');
    allCards.forEach(c => c.classList.toggle('active', c === card));

    // 2. Open profile card IMMEDIATELY (no lag/timeout delay)
    if (onSelectProfile) {
      onSelectProfile(p);
    }

    // 3. Smoothly fly camera to coordinates
    flyCameraToCoordinates(p.lat, p.lon, 190);
  });

  spotlightCarousel.appendChild(card);
}
