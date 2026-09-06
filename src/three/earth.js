import * as THREE from 'three';
import { EARTH_RADIUS, scene, SUN_DIR } from './scene.js';
import { EARTH_LAND_SVG } from '../data/countries.js';

export function generateEarthTextures() {
  const width = 2048;
  const height = 1024;

  // 1. Day-side Surface Canvas
  const dayCanvas = document.createElement('canvas');
  dayCanvas.width = width;
  dayCanvas.height = height;
  const ctx = dayCanvas.getContext('2d');

  // Ocean background gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0C1A2A');
  oceanGrad.addColorStop(0.5, '#102336');
  oceanGrad.addColorStop(1, '#0A1624');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Graticule lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += width / 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += height / 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Vectorized coastline polygons
  const landPath = new Path2D(EARTH_LAND_SVG);

  // Land body
  ctx.fillStyle = '#2A3849';
  ctx.fill(landPath);

  // Terrain relief blobs
  ctx.save();
  ctx.clip(landPath);
  for (let i = 0; i < 900; i++) {
    const rx = Math.random() * width;
    const ry = 60 + Math.random() * (height - 130);
    const rr = 12 + Math.random() * 68;
    const warm = Math.random() > 0.55;
    const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
    g.addColorStop(0, warm ? 'rgba(96, 118, 146, 0.20)' : 'rgba(18, 26, 40, 0.24)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Antarctic cap
  ctx.fillStyle = '#2A3849';
  ctx.fillRect(0, 996, width, height - 996);

  // Coastlines
  ctx.strokeStyle = '#55708F';
  ctx.lineWidth = 1.5;
  ctx.stroke(landPath);

  // 2. Night-side City Lights Canvas
  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = width;
  nightCanvas.height = height;
  const nCtx = nightCanvas.getContext('2d');

  nCtx.fillStyle = '#000000';
  nCtx.fillRect(0, 0, width, height);

  nCtx.save();
  nCtx.clip(landPath);

  const METRO_NODES = [
    // India & South Asia
    [12.97, 77.59, 15, 1.0], [19.07, 72.87, 17, 1.0], [28.61, 77.20, 17, 1.0],
    [17.38, 78.48, 13, 0.9], [13.08, 80.27, 13, 0.9], [18.52, 73.85, 11, 0.85],
    [22.57, 88.36, 13, 0.85], [23.02, 72.57, 11, 0.75],
    // Europe
    [51.50, -0.12, 17, 1.0], [48.85, 2.35, 16, 1.0], [52.52, 13.40, 15, 0.95],
    [52.36, 4.90, 13, 0.95], [41.38, 2.17, 13, 0.85], [40.41, -3.70, 13, 0.85],
    [52.22, 21.01, 11, 0.8], [45.46, 9.19, 13, 0.9], [59.32, 18.06, 10, 0.75],
    // US & North America
    [40.71, -74.00, 19, 1.0], [37.77, -122.41, 17, 1.0], [34.05, -118.24, 17, 0.95],
    [41.87, -87.62, 15, 0.9], [30.26, -97.74, 13, 0.85], [47.60, -122.33, 13, 0.85],
    [42.36, -71.05, 13, 0.85], [29.76, -95.36, 13, 0.8], [33.74, -84.38, 13, 0.8],
    // Southeast Asia & East Asia
    [1.35, 103.81, 16, 1.0], [-6.20, 106.84, 16, 0.95], [13.75, 100.50, 15, 0.9],
    [14.59, 120.98, 15, 0.85], [3.13, 101.68, 13, 0.85], [10.82, 106.62, 13, 0.85],
    [35.67, 139.65, 19, 1.0], [37.56, 126.97, 17, 1.0], [31.23, 121.47, 17, 1.0],
    // Latin America
    [-23.55, -46.63, 17, 1.0], [-22.90, -43.17, 15, 0.9], [-34.60, -58.38, 15, 0.9],
    [4.71, -74.07, 13, 0.85], [19.43, -99.13, 17, 0.95],
    // Africa
    [6.52, 3.37, 16, 0.95], [-1.29, 36.82, 13, 0.85], [-33.92, 18.42, 13, 0.85],
    [30.04, 31.23, 16, 0.95], [5.60, -0.18, 11, 0.75], [-26.20, 28.04, 13, 0.8]
  ];

  let __seed = 20260905;
  const rnd = () => (__seed = (__seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  // Inhabited background glow
  for (let i = 0; i < 5200; i++) {
    const sx = rnd() * width;
    const sy = 70 + rnd() * (height - 180);
    const a = 0.05 + rnd() * 0.13;
    nCtx.fillStyle = `rgba(255, ${(170 + rnd() * 50) | 0}, ${(90 + rnd() * 60) | 0}, ${a})`;
    nCtx.fillRect(sx, sy, 1, 1);
  }

  // Major cities
  METRO_NODES.forEach(([lat, lon, size, intensity]) => {
    const px = ((lon + 180) / 360) * width;
    const py = ((90 - lat) / 180) * height;
    const core = size * 0.15;
    const halo = size * 0.55;

    const radGrad = nCtx.createRadialGradient(px, py, 0, px, py, halo);
    radGrad.addColorStop(0, `rgba(255, 214, 138, ${intensity * 0.34})`);
    radGrad.addColorStop(0.35, `rgba(245, 158, 11, ${intensity * 0.11})`);
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    nCtx.fillStyle = radGrad;
    nCtx.beginPath();
    nCtx.arc(px, py, halo, 0, Math.PI * 2);
    nCtx.fill();

    const dots = Math.round(size * 40);
    for (let i = 0; i < dots; i++) {
      const ang = rnd() * Math.PI * 2;
      const r = Math.pow(rnd(), 0.85) * halo;
      const sx = px + Math.cos(ang) * r;
      const sy = py + Math.sin(ang) * r * 0.85;
      const falloff = 1 - (r / halo);
      const a = intensity * falloff * (0.22 + rnd() * 0.48);
      nCtx.fillStyle = `rgba(255, ${(196 + rnd() * 45) | 0}, ${(120 + rnd() * 70) | 0}, ${a})`;
      nCtx.fillRect(sx, sy, 1, 1);
    }

    const coreGrad = nCtx.createRadialGradient(px, py, 0, px, py, core);
    coreGrad.addColorStop(0, `rgba(255, 240, 205, ${intensity})`);
    coreGrad.addColorStop(1, 'rgba(255, 176, 60, 0)');
    nCtx.fillStyle = coreGrad;
    nCtx.beginPath();
    nCtx.arc(px, py, core, 0, Math.PI * 2);
    nCtx.fill();
  });
  nCtx.restore();

  const dayTexture = new THREE.CanvasTexture(dayCanvas);
  const nightTexture = new THREE.CanvasTexture(nightCanvas);
  dayTexture.wrapS = THREE.RepeatWrapping;
  nightTexture.wrapS = THREE.RepeatWrapping;

  return { dayTexture, nightTexture };
}

export const { dayTexture, nightTexture } = generateEarthTextures();

export const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);

export const earthMaterial = new THREE.MeshStandardMaterial({
  map: dayTexture,
  emissiveMap: nightTexture,
  emissive: new THREE.Color(0xF59E0B),
  emissiveIntensity: 0.72,
  roughness: 0.94,
  metalness: 0.0
});

earthMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uSunDir = { value: SUN_DIR };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWorldNrm;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorldNrm = normalize(mat3(modelMatrix) * objectNormal);');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform vec3 uSunDir;\nvarying vec3 vWorldNrm;')
    .replace('#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       float sunDot = dot(normalize(vWorldNrm), normalize(uSunDir));
       float nightMask = smoothstep(0.14, -0.20, sunDot);
       totalEmissiveRadiance *= nightMask;`);
};

export const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earthMesh);
