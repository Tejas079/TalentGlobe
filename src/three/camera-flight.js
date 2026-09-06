import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { camera, renderer, latLonToVector3 } from './scene.js';

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.6;
controls.minDistance = 125;
controls.maxDistance = 1200;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.12;

let idleTimer = null;

// Distinguishes "paused for a moment because the user is interacting" from
// "the user pressed the toggle off". Without this the idle timer resumed
// rotation four seconds after any drag, overriding an explicit opt-out and
// leaving the HUD button showing a state nobody asked for.
let autoRotateEnabledByUser = true;
let isProfileSelected = false;
let isCinematicTourActive = false;
let cinematicTourTween = null;

export function isAutoRotateEnabledByUser() {
  return autoRotateEnabledByUser;
}

export function isProfileSelectedState() {
  return isProfileSelected;
}

export function isTourActive() {
  return isCinematicTourActive;
}

/**
 * Locks or unlocks rotation when a gold spotlight/profile is selected.
 * When a profile is selected, rotation stays completely stopped until closed/deselected.
 */
export function setProfileSelected(selected) {
  isProfileSelected = Boolean(selected);
  clearTimeout(idleTimer);
  if (isProfileSelected) {
    controls.autoRotate = false;
  } else if (autoRotateEnabledByUser && !isCinematicTourActive) {
    controls.autoRotate = true;
  }
}

/** Called by the HUD toggle. Returns the new user-intended state. */
export function setAutoRotateEnabled(enabled) {
  autoRotateEnabledByUser = Boolean(enabled);
  clearTimeout(idleTimer);
  if (!isProfileSelected && !isCinematicTourActive) {
    controls.autoRotate = autoRotateEnabledByUser;
  }
  return autoRotateEnabledByUser;
}

/**
 * Stops the globe while the user is interacting, resuming 4s later (only if no profile is selected).
 */
export function pauseAutoRotateTemporarily() {
  clearTimeout(idleTimer);
  if (isCinematicTourActive) {
    stopCinematicTour();
  }
  controls.autoRotate = false;

  // Never resume if a spotlight project is currently selected!
  if (isProfileSelected || !autoRotateEnabledByUser) return;

  idleTimer = setTimeout(() => {
    if (isProfileSelected || !autoRotateEnabledByUser || isCinematicTourActive) return;
    controls.autoRotate = true;
  }, 4000);
}

renderer.domElement.addEventListener('pointerdown', pauseAutoRotateTemporarily);
renderer.domElement.addEventListener('wheel', pauseAutoRotateTemporarily, { passive: true });
renderer.domElement.addEventListener('touchstart', pauseAutoRotateTemporarily, { passive: true });

/* ==========================================================================
   Camera Flight Animation (Spherical Slerp)
   ========================================================================== */
let cameraFlightTween = null;
const flightProgress = { t: 0 };
let flyStartDist = 315;
let flyTargetDist = 205;
const flyStartQuat = new THREE.Quaternion();
const flyTargetQuat = new THREE.Quaternion();

export function flyCameraToCoordinates(lat, lon, targetDistance = 205, onCompleteCallback = null) {
  pauseAutoRotateTemporarily();
  const heroEl = document.getElementById('hero-banner');
  if (heroEl) heroEl.classList.add('collapsed');
  const targetVec = latLonToVector3(lat, lon, targetDistance);

  flyStartDist = camera.position.length();
  flyTargetDist = targetDistance;

  const vStartDir = camera.position.clone().normalize();
  const vTargetDir = targetVec.clone().normalize();

  flyStartQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vStartDir);
  flyTargetQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vTargetDir);

  if (cameraFlightTween) cameraFlightTween.kill();
  flightProgress.t = 0;

  cameraFlightTween = gsap.to(flightProgress, {
    t: 1,
    duration: 1.4,
    ease: "power3.inOut",
    onUpdate: () => {
      const t = flightProgress.t;
      const currentQuat = new THREE.Quaternion().copy(flyStartQuat).slerp(flyTargetQuat, t);
      const currentDir = new THREE.Vector3(0, 0, 1).applyQuaternion(currentQuat);

      const baseDist = THREE.MathUtils.lerp(flyStartDist, flyTargetDist, t);
      const flightArc = Math.sin(t * Math.PI) * 35;
      const currentDist = baseDist + flightArc;

      camera.position.copy(currentDir.multiplyScalar(currentDist));
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    },
    onComplete: () => {
      if (onCompleteCallback) onCompleteCallback();
    }
  });
}

/**
 * Smooth 3D flight to any celestial body (Sun, Planet) in space
 */
export function flyCameraToCelestial(targetPos, lookAtPos = new THREE.Vector3(0, 0, 0), distance = 95, duration = 1.6, onComplete = null) {
  if (isCinematicTourActive) stopCinematicTour();
  pauseAutoRotateTemporarily();

  const heroEl = document.getElementById('hero-banner');
  if (heroEl) heroEl.classList.add('collapsed');

  if (cameraFlightTween) cameraFlightTween.kill();

  const startCamPos = camera.position.clone();
  const startTarget = controls.target.clone();

  // Offset camera slightly backwards and upwards from target for a dramatic cinematic frame
  const offsetDir = targetPos.clone().sub(lookAtPos).normalize();
  if (offsetDir.lengthSq() < 0.001) offsetDir.set(0, 0.4, 1).normalize();
  const endCamPos = targetPos.clone().add(offsetDir.multiplyScalar(distance));
  endCamPos.y += distance * 0.22;

  const anim = { t: 0 };
  cameraFlightTween = gsap.to(anim, {
    t: 1,
    duration,
    ease: "power3.inOut",
    onUpdate: () => {
      const t = anim.t;
      camera.position.lerpVectors(startCamPos, endCamPos, t);
      controls.target.lerpVectors(startTarget, targetPos, t);
      camera.lookAt(controls.target);
    },
    onComplete: () => {
      if (onComplete) onComplete();
    }
  });
}

/* ==========================================================================
   Hollywood Cinematic Tour Engine
   Sweeping camera choreography past Sun, Saturn rings, Jupiter, and Earth
   ========================================================================== */

export function startCinematicTour(onWaypoint = null, onTourEnd = null) {
  isCinematicTourActive = true;
  controls.autoRotate = false;

  const waypoints = [
    // 1. Wide Cosmic Overview
    {
      pos: new THREE.Vector3(0, 320, 780),
      lookAt: new THREE.Vector3(0, 0, 0),
      duration: 3.5,
      label: '🌌 Cosmic System Overview'
    },
    // 2. The Sun (#1 TRIPEZY) Majestic Golden Flare Pass
    {
      pos: new THREE.Vector3(340, 140, 320),
      lookAt: new THREE.Vector3(390, 60, 240),
      duration: 4.5,
      label: '☀️ The Sun • #1 TRIPEZY'
    },
    // 3. Saturn Ring Dive (#3 Hermes Agent)
    {
      pos: new THREE.Vector3(-280, 80, -320),
      lookAt: new THREE.Vector3(-310, 40, -280),
      duration: 4.2,
      label: '🪐 Saturn Rings • Hermes Agent'
    },
    // 4. Jupiter Gas Giant (#2 Anthropic Skills)
    {
      pos: new THREE.Vector3(-240, -110, 260),
      lookAt: new THREE.Vector3(-200, -80, 210),
      duration: 4.0,
      label: '🪐 Jupiter Titan • Anthropic Skills'
    },
    // 5. Orbital Re-Entry back to Earth
    {
      pos: new THREE.Vector3(0, 45, 270),
      lookAt: new THREE.Vector3(0, 0, 0),
      duration: 3.8,
      label: '🌍 Earth Orbit • Global Builders'
    }
  ];

  let currentIdx = 0;

  function nextWaypoint() {
    if (!isCinematicTourActive) return;

    if (currentIdx >= waypoints.length) {
      currentIdx = 0; // Loop seamlessly
    }

    const wp = waypoints[currentIdx];
    if (onWaypoint) onWaypoint(wp);

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const anim = { t: 0 };

    cinematicTourTween = gsap.to(anim, {
      t: 1,
      duration: wp.duration,
      ease: "sine.inOut",
      onUpdate: () => {
        const t = anim.t;
        camera.position.lerpVectors(startPos, wp.pos, t);
        controls.target.lerpVectors(startTarget, wp.lookAt, t);
        camera.lookAt(controls.target);
      },
      onComplete: () => {
        if (isCinematicTourActive) {
          currentIdx++;
          setTimeout(nextWaypoint, 1000);
        }
      }
    });
  }

  nextWaypoint();
}

export function stopCinematicTour() {
  if (!isCinematicTourActive) return;
  isCinematicTourActive = false;
  if (cinematicTourTween) cinematicTourTween.kill();
  if (autoRotateEnabledByUser && !isProfileSelected) {
    controls.autoRotate = true;
  }
}

