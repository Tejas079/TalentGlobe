import * as THREE from 'three';
import { gsap } from 'gsap';
import { EARTH_RADIUS, scene } from './scene.js';
import { COUNTRY_PATHS } from '../data/countries.js';
import { getCountryListForLabel } from '../data/clusters.js';

const countryOverlayCanvas = document.createElement('canvas');
countryOverlayCanvas.width = 2048;
countryOverlayCanvas.height = 1024;
const countryOverlayCtx = countryOverlayCanvas.getContext('2d');

export const countryOverlayTexture = new THREE.CanvasTexture(countryOverlayCanvas);
countryOverlayTexture.wrapS = THREE.RepeatWrapping;

export const countryOverlayMaterial = new THREE.MeshBasicMaterial({
  map: countryOverlayTexture,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  depthTest: true
});

export const countryOverlayMesh = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_RADIUS * 1.002, 64, 64),
  countryOverlayMaterial
);
countryOverlayMesh.renderOrder = 3;
scene.add(countryOverlayMesh);

let activeHighlightedCountryName = null;

export function getActiveHighlightedCountry() {
  return activeHighlightedCountryName;
}

export function drawCountryHighlight(countryList) {
  const ctx = countryOverlayCtx;
  ctx.clearRect(0, 0, 2048, 1024);

  countryList.forEach(cName => {
    const svgD = COUNTRY_PATHS[cName];
    if (!svgD) return;

    const path = new Path2D(svgD);

    // Pass 1: Surface fill
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
    ctx.fill(path);
    ctx.restore();

    // Pass 2: Outer glow stroke
    ctx.save();
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.lineWidth = 5.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
    ctx.restore();

    // Pass 3: Mid stroke
    ctx.save();
    ctx.shadowColor = '#FFC107';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
    ctx.restore();

    // Pass 4: Core stroke
    ctx.save();
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
    ctx.restore();
  });

  countryOverlayTexture.needsUpdate = true;
}

export function highlightCountry({
  nameOrCluster,
  flyTo = true,
  clusterNodes = [],
  profilesData = [],
  flyCameraToCoordinates = null,
  showToast = null,
  // Passive highlights (opening a profile card) must stay silent, otherwise
  // they overwrite whatever the toast was already saying.
  announce = flyTo
}) {
  const countries = getCountryListForLabel(nameOrCluster, COUNTRY_PATHS);
  if (!countries || countries.length === 0) {
    clearCountryHighlight(clusterNodes);
    return;
  }

  activeHighlightedCountryName = nameOrCluster;
  drawCountryHighlight(countries);

  // Fade in overlay
  gsap.killTweensOf(countryOverlayMaterial);
  countryOverlayMaterial.opacity = 0;
  gsap.to(countryOverlayMaterial, {
    opacity: 1,
    duration: 0.45,
    ease: 'power2.out'
  });

  // Fly camera to country or cluster if requested
  if (flyTo && flyCameraToCoordinates) {
    const clusterMatch = clusterNodes.find(
      c => c.cluster.name === nameOrCluster || c.cluster.region === nameOrCluster
    );
    if (clusterMatch) {
      flyCameraToCoordinates(clusterMatch.cluster.lat, clusterMatch.cluster.lon, 205);
    } else {
      const profMatch = profilesData.find(p => p.country === nameOrCluster);
      if (profMatch) {
        flyCameraToCoordinates(profMatch.lat, profMatch.lon, 200);
      }
    }
  }

  // Update cluster active UI states
  if (clusterNodes && clusterNodes.length) {
    clusterNodes.forEach(({ element, cluster }) => {
      const isMatch = cluster.name === nameOrCluster ||
                      (cluster.region === nameOrCluster) ||
                      (countries.length === 1 && (cluster.name.includes(countries[0]) || cluster.region === countries[0]));
      element.classList.toggle('active', !!isMatch);
    });
  }

  if (showToast && announce) {
    const displayTitle = countries.length === 1 ? countries[0] : nameOrCluster;
    showToast('Highlighted: ' + displayTitle + ' (' + countries.length + (countries.length === 1 ? ' country' : ' countries') + ')');
  }
}

export function clearCountryHighlight(clusterNodes = []) {
  activeHighlightedCountryName = null;
  if (clusterNodes && clusterNodes.length) {
    clusterNodes.forEach(({ element }) => element.classList.remove('active'));
  }

  gsap.killTweensOf(countryOverlayMaterial);
  gsap.to(countryOverlayMaterial, {
    opacity: 0,
    duration: 0.35,
    ease: 'power2.in',
    onComplete: () => {
      countryOverlayCtx.clearRect(0, 0, 2048, 1024);
      countryOverlayTexture.needsUpdate = true;
    }
  });
}
