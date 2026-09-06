import * as THREE from 'three';
import { EARTH_RADIUS, scene } from './scene.js';

/* --------------------------------------------------------------------------
   Atmosphere Fresnel Rim Shader
   -------------------------------------------------------------------------- */
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewVec;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewVec = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;
const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewVec;
  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewVec)));
    float fresnel = pow(clamp(rim, 0.0, 1.0), 7.0);
    gl_FragColor = vec4(0.32, 0.52, 0.86, 1.0) * fresnel * 0.85;
  }
`;

export const atmosphereMaterial = new THREE.ShaderMaterial({
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  transparent: true,
  depthWrite: false
});

export const atmosphereMesh = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_RADIUS * 1.022, 48, 48),
  atmosphereMaterial
);
scene.add(atmosphereMesh);

/* --------------------------------------------------------------------------
   Procedural Clouds
   -------------------------------------------------------------------------- */
export let cloudsMesh = null;
const isMobile = window.innerWidth <= 768;

if (!isMobile) {
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 1024;
  cloudCanvas.height = 512;
  const cCtx = cloudCanvas.getContext('2d');
  cCtx.fillStyle = '#000000';
  cCtx.fillRect(0, 0, 1024, 512);

  for (let i = 0; i < 75; i++) {
    const cx = Math.random() * 1024;
    const cy = 90 + Math.random() * 332;
    const rad = 25 + Math.random() * 70;
    const cGrad = cCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    cGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    cGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.06)');
    cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cCtx.fillStyle = cGrad;
    cCtx.beginPath();
    cCtx.arc(cx, cy, rad, 0, Math.PI * 2);
    cCtx.fill();
  }

  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
  cloudTexture.wrapS = THREE.RepeatWrapping;

  const cloudGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.014, 48, 48);
  const cloudMat = new THREE.MeshBasicMaterial({
    map: cloudTexture,
    color: 0x8FA6C8,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
  scene.add(cloudsMesh);
}

/* --------------------------------------------------------------------------
   Starfield
   -------------------------------------------------------------------------- */
const starCount = 1800;
const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const rad = 650 + Math.random() * 700;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  starPositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
  starPositions[i * 3 + 2] = rad * Math.cos(phi);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xE2E8F0,
  size: 1.4,
  transparent: true,
  opacity: 0.8
});
export const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

export function updateAtmosphere() {
  if (cloudsMesh) {
    cloudsMesh.rotation.y += 0.00008;
  }
}
