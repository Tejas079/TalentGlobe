import * as THREE from 'three';

export const EARTH_RADIUS = 100;

export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  3000
);
camera.position.set(0, 35, 315);

export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// Natural lighting vectors
export const SUN_POSITION = new THREE.Vector3(-254, 83, 136);
export const SUN_DIR = SUN_POSITION.clone().normalize();

export const sunLight = new THREE.DirectionalLight(0xFFF1DC, 1.6);
sunLight.position.copy(SUN_POSITION);
scene.add(sunLight);

export const ambientLight = new THREE.AmbientLight(0x1A2740, 0.55);
scene.add(ambientLight);

export function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
}

export function initScene(container) {
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
