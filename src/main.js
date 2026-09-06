import './styles/index.css';

import * as THREE from 'three';
import { scene, camera, renderer, initScene, SUN_DIR, sunLight, latLonToVector3 } from './three/scene.js';
import './three/earth.js';
import { updateAtmosphere } from './three/atmosphere.js';
import { highlightCountry, clearCountryHighlight, getActiveHighlightedCountry } from './three/country-overlay.js';
import { controls, flyCameraToCoordinates, pauseAutoRotateTemporarily } from './three/camera-flight.js';
import { initMarkerPool, clusterNodes, renderPipeline, updateBeaconVisibility } from './three/markers.js';
import { PROFILES_DATA } from './data/profiles.js';

import { showToast } from './ui/toast.js';
import { initHud } from './ui/hud.js';
import { initProfileModal, openProfileCard, setHighlightCountryHandler } from './ui/profile-modal.js';
import { updateDynamicSpotlights, setActiveSpotlightProfile } from './ui/spotlight-dock.js';
import { initSearchFilters, setCountryFilterChangeHandler, refreshFilters } from './ui/search-filters.js';
import { initSubmitModal, openSubmitModal, loadSavedCommunityProjects } from './ui/submit-modal.js';
import { initAuthModal } from './ui/auth-modal.js';
import { initInfoModal } from './ui/info-modal.js';
import { initMyProjects, render as renderMyProjects } from './ui/my-projects.js';
import { initClaimModal } from './ui/claim-modal.js';
import { celestialSystem } from './three/celestial-system.js';
import { flyCameraToCelestial, trackCelestialMesh, clearCelestialTracking, updateCelestialCameraTracking } from './three/camera-flight.js';
import { initCelestialUI, openCelestialCard, closeCelestialCard, updateCelestialModalPosition } from './ui/celestial-modal.js';


// 1. Mount WebGL Canvas
const canvasContainer = document.getElementById('canvas-container');
initScene(canvasContainer);

// 2. Initialize Marker Pool & Clusters
const markersContainer = document.getElementById('markers-container');
initMarkerPool(
  markersContainer,
  (profile) => {
    closeCelestialCard();
    setActiveSpotlightProfile(profile.id);
    openProfileCard(profile);
  },
  (cluster) => {
    closeCelestialCard();
    pauseAutoRotateTemporarily();
    if (getActiveHighlightedCountry() === cluster.name) {
      clearCountryHighlight(clusterNodes);
    } else {
      highlightCountry({
        nameOrCluster: cluster.name,
        flyTo: true,
        clusterNodes,
        profilesData: PROFILES_DATA,
        flyCameraToCoordinates,
        showToast
      });
    }
  }
);

// 3. Set Opening Camera View (Africa/Europe meridian)
camera.position.copy(latLonToVector3(16, 22, 315));
controls.update();

// Orient sun 44 degrees off camera axis to showcase day/night terminator
SUN_DIR.copy(camera.position).normalize()
       .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(44));
SUN_DIR.y += 0.16;
SUN_DIR.normalize();
sunLight.position.copy(SUN_DIR).multiplyScalar(400);

// 4. Connect UI Handlers
setHighlightCountryHandler((countryName, flyTo) => {
  highlightCountry({
    nameOrCluster: countryName,
    flyTo,
    clusterNodes,
    profilesData: PROFILES_DATA,
    flyCameraToCoordinates,
    showToast
  });
});

setCountryFilterChangeHandler((country) => {
  if (country) {
    highlightCountry({
      nameOrCluster: country,
      flyTo: false,
      announce: true,
      clusterNodes,
      profilesData: PROFILES_DATA,
      flyCameraToCoordinates,
      showToast
    });
    const match = PROFILES_DATA.find(p => p.country === country);
    if (match) flyCameraToCoordinates(match.lat, match.lon, 200);
  } else {
    clearCountryHighlight(clusterNodes);
  }
});

// Auth first: everything else reads the restored session to decide what it
// may show (edit affordances, My Projects, the account chip). The restore fires
// onChange synchronously, before the other modules exist, so hold the reactions
// until boot finishes.
let bootComplete = false;

initAuthModal({
  onChange: () => {
    if (!bootComplete) return;
    renderMyProjects();
    refreshFilters();
    // A different account sees a different set of cloud projects.
    loadSavedCommunityProjects();
  }
});

initProfileModal();
initSearchFilters();
initMyProjects();
initInfoModal({ onSubmitProject: () => openSubmitModal() });
initSubmitModal({
  openProfileCard,
  flyCameraToCoordinates,
  onChange: () => {
    renderMyProjects();
    refreshFilters();
    updateDynamicSpotlights((profile) => openProfileCard(profile));
  }
});
initClaimModal({
  openProfileCard,
  flyCameraToCoordinates,
  onProjectsChanged: () => {
    renderMyProjects();
    refreshFilters();
    updateDynamicSpotlights((profile) => openProfileCard(profile));
  }
});
initHud();

// 5. Initialize Hollywood-grade Celestial Solar System
celestialSystem.init(canvasContainer, (cfg, profile) => {
  const mesh = celestialSystem.getMeshByRank(cfg.rank);
  if (mesh) {
    trackCelestialMesh(mesh);
    flyCameraToCelestial(mesh.position, new THREE.Vector3(0, 0, 0), cfg.size * 3.8 + 25, 1.6);
  }
  openCelestialCard(cfg, profile, mesh);
});

initCelestialUI(celestialSystem);

bootComplete = true;


// Render loop
let lastTime = performance.now();
let spotlightUpdateTimer = 0;

function animate(currentTime) {
  requestAnimationFrame(animate);

  const delta = currentTime - lastTime;
  lastTime = currentTime;

  // Atmospheric cloud drift
  updateAtmosphere();

  // Advance celestial solar system and planetary orbits
  celestialSystem.update(delta);

  // Keep camera locked onto moving celestial body
  updateCelestialCameraTracking();

  // Orbit controls
  controls.update();

  // Dynamically update modal position, 3D tilt, and holographic tether
  updateCelestialModalPosition(camera);

  // Project markers and handle occlusion
  renderPipeline();

  // Per-instance beacon facing fade
  updateBeaconVisibility();

  // Throttle dynamic spotlight re-ranking to every 12 frames
  spotlightUpdateTimer++;
  if (spotlightUpdateTimer >= 12) {
    spotlightUpdateTimer = 0;
    updateDynamicSpotlights((profile) => openProfileCard(profile));
  }

  renderer.render(scene, camera);
}

updateBeaconVisibility();
requestAnimationFrame(animate);
setTimeout(() => updateDynamicSpotlights((profile) => openProfileCard(profile)), 80);
