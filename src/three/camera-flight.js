import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { camera, renderer, latLonToVector3 } from './scene.js';

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.6;
controls.minDistance = 145;
controls.maxDistance = 460;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.12;

let idleTimer = null;

export function pauseAutoRotateTemporarily() {
  controls.autoRotate = false;
  const toggleBtn = document.getElementById('btn-toggle-rotate');
  if (toggleBtn) toggleBtn.classList.remove('active');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    controls.autoRotate = true;
    if (toggleBtn) toggleBtn.classList.add('active');
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
      // Interpolate orientation
      const currentQuat = new THREE.Quaternion().copy(flyStartQuat).slerp(flyTargetQuat, t);
      const currentDir = new THREE.Vector3(0, 0, 1).applyQuaternion(currentQuat);

      // Arc altitude slightly during flight
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
