import * as THREE from 'three';
import { EARTH_RADIUS, scene, camera, latLonToVector3 } from './scene.js';
import { PROFILES_DATA } from '../data/profiles.js';
import { buildClusterNodes } from '../data/clusters.js';

export const isMobile = window.innerWidth <= 768;
export const POOL_SIZE = isMobile ? 20 : 40;

const vCam = new THREE.Vector3();
const vDir = new THREE.Vector3();
const vProj = new THREE.Vector3();

// Interleave Tier 5 ranks round-robin across regions
(() => {
  const byRegion = {};
  PROFILES_DATA.filter(p => p.spotlightRank)
    .sort((a, b) => a.spotlightRank - b.spotlightRank)
    .forEach(p => (byRegion[p.region] || (byRegion[p.region] = [])).push(p));
  const queues = Object.values(byRegion);
  const order = [];
  for (let i = 0; order.length < 20; i++) {
    let drained = true;
    for (const q of queues) {
      if (i < q.length) { order.push(q[i]); drained = false; }
      if (order.length >= 20) break;
    }
    if (drained) break;
  }
  order.forEach((p, i) => { p.spotlightRank = i + 1; });
})();

// City cohort spatial dispersion
const cityCohorts = {};
PROFILES_DATA.forEach(p => {
  const key = p.city + '|' + p.country;
  (cityCohorts[key] || (cityCohorts[key] = [])).push(p);
});

Object.values(cityCohorts).forEach(group => {
  if (group.length === 1) {
    group[0].mLat = group[0].lat;
    group[0].mLon = group[0].lon;
    return;
  }
  const ringDeg = 0.22 + 0.055 * Math.min(group.length, 9);
  const lonScale = 1 / Math.max(0.30, Math.cos(group[0].lat * Math.PI / 180));
  group.forEach((p, i) => {
    const ang = (i / group.length) * Math.PI * 2 + group.length * 0.7;
    const r = ringDeg * (0.45 + 0.55 * Math.sqrt(i / Math.max(1, group.length - 1)));
    p.mLat = p.lat + Math.sin(ang) * r;
    p.mLon = p.lon + Math.cos(ang) * r * lonScale;
  });
});

// Attach 3D coordinates & normal
PROFILES_DATA.forEach(p => {
  p.pos3D = latLonToVector3(p.mLat, p.mLon, EARTH_RADIUS);
  p.normal = p.pos3D.clone().normalize();
  p._isMatch = true;
  p._rev = 0;
});

/**
 * Dynamically registers a newly submitted or fetched community profile onto the 3D globe
 */
export function registerNewProfile(p) {
  const existing = PROFILES_DATA.find(e => e.id === p.id);

  if (existing) {
    // Merge onto the object already in PROFILES_DATA so marker slots, spotlight
    // entries and any open card keep pointing at the same instance. Previously
    // this branch dropped the incoming data entirely, so a project edited on
    // another device never refreshed here.
    Object.assign(existing, p);
    refreshProfileGeometry(existing);
    existing._isMatch = true;
    invalidateProfileRender(existing);
    return existing;
  }

  refreshProfileGeometry(p);
  p._isMatch = true;
  p._rev = 0;
  PROFILES_DATA.push(p);
  return p;
}

/**
 * Bumps a profile's render revision so renderPipeline rewrites the marker text
 * on the next frame. Needed because edits mutate the profile in place, leaving
 * slot.boundId unchanged.
 */
export function invalidateProfileRender(p) {
  p._rev = (p._rev || 0) + 1;
  return p;
}

/** Recomputes the globe position for a profile whose lat/lon may have changed. */
export function refreshProfileGeometry(p) {
  p.mLat = p.lat;
  p.mLon = p.lon;
  p.pos3D = latLonToVector3(p.mLat, p.mLon, EARTH_RADIUS);
  p.normal = p.pos3D.clone().normalize();
  return p;
}

/** Removes a profile from the globe and releases any marker slot bound to it. */
export function unregisterProfile(p) {
  const idx = PROFILES_DATA.findIndex(existing => existing.id === p.id);
  if (idx >= 0) PROFILES_DATA.splice(idx, 1);

  for (const slot of markerPool) {
    if (slot.boundId === p.id) {
      slot.boundId = null;
      slot.boundRev = null;
      slot.element._boundProfile = null;
      slot.element.style.transform = 'translate3d(-9999px, -9999px, 0)';
      slot.element.style.opacity = '0';
    }
  }
  boundIds.delete(p.id);
}


// Tier 5 Spotlight Beacon Stalks
export const tier5Profiles = PROFILES_DATA.filter(p => p.tier === 5);
const stalkGeo = new THREE.CylinderGeometry(0.3, 0.08, 14, 8);
stalkGeo.translate(0, 7, 0);
const stalkMat = new THREE.MeshBasicMaterial({
  color: 0xF5A20B,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
export const stalkInstancedMesh = new THREE.InstancedMesh(stalkGeo, stalkMat, tier5Profiles.length);

const dummyObj = new THREE.Object3D();
tier5Profiles.forEach((p, idx) => {
  p._stalkQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.normal);
  dummyObj.position.copy(p.pos3D);
  dummyObj.quaternion.copy(p._stalkQuat);
  dummyObj.updateMatrix();
  stalkInstancedMesh.setMatrixAt(idx, dummyObj.matrix);
});
stalkInstancedMesh.instanceMatrix.needsUpdate = true;
scene.add(stalkInstancedMesh);

// Continental Clusters
export const CLUSTER_NODES_DATA = buildClusterNodes(PROFILES_DATA);
CLUSTER_NODES_DATA.forEach(c => {
  c.pos3D = latLonToVector3(c.lat, c.lon, EARTH_RADIUS * 1.02);
  c.normal = c.pos3D.clone().normalize();
});

// HUD Dead Zone avoidance
const HUD_SELECTORS = ['.top-nav', '#hero-banner', '#search-discovery-panel',
                       '#spotlight-dock', '.controls-hud', '#profile-card'];
let hudRects = [];

export function refreshHudRects() {
  hudRects = [];
  for (const sel of HUD_SELECTORS) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.02) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    hudRects.push({ l: r.left, t: r.top, r: r.right, b: r.bottom });
  }
}
window.addEventListener('resize', refreshHudRects);
setInterval(refreshHudRects, 220);

const HUD_FEATHER = 26;

function hudClearance(cx, cy, halfW, halfH) {
  let f = 1;
  for (let i = 0; i < hudRects.length; i++) {
    const r = hudRects[i];
    const dx = Math.max(r.l - (cx + halfW), (cx - halfW) - r.r);
    const dy = Math.max(r.t - (cy + halfH), (cy - halfH) - r.b);
    const d = Math.max(dx, dy);
    if (d <= 0) return 0;
    if (d < HUD_FEATHER) f = Math.min(f, d / HUD_FEATHER);
  }
  return f;
}

let selectedProfileId = null;

export function setSelectedGlobeProfileId(id) {
  selectedProfileId = id;
  const container = document.getElementById('markers-container');
  if (container) {
    if (id !== null && id !== undefined) {
      container.classList.add('has-selection');
    } else {
      container.classList.remove('has-selection');
    }
  }
}

export function getSelectedGlobeProfileId() {
  return selectedProfileId;
}

// Marker Pool & Cluster Nodes
export const markerPool = [];
export let clusterNodes = [];

export function initMarkerPool(container, onSelectProfile, onToggleCluster) {
  for (let i = 0; i < POOL_SIZE; i++) {
    const el = document.createElement('div');
    el.className = 'pool-marker marker-tier-1';
    el.id = `pool-marker-${i}`;
    el.innerHTML = `
      <div class="marker-avatar-wrap">
        <span class="marker-avatar-text">--</span>
      </div>
      <div class="marker-label-pill">
        <span class="marker-company-badge">★ SELECTED COMPANY</span>
        <span class="marker-label-name">Name</span>
        <span class="marker-label-role">Role</span>
      </div>
    `;
    el.addEventListener('click', () => {
      if (el._boundProfile && onSelectProfile) {
        onSelectProfile(el._boundProfile);
      }
    });
    container.appendChild(el);
    markerPool.push({
      element: el,
      avatarWrap: el.querySelector('.marker-avatar-wrap'),
      avatarText: el.querySelector('.marker-avatar-text'),
      labelPill: el.querySelector('.marker-label-pill'),
      companyBadge: el.querySelector('.marker-company-badge'),
      labelName: el.querySelector('.marker-label-name'),
      labelRole: el.querySelector('.marker-label-role'),
      labelMuted: false,
      boundId: null,
      boundRev: null,
      _lastSelected: false
    });
  }

  clusterNodes = CLUSTER_NODES_DATA.map((cluster) => {
    const el = document.createElement('div');
    el.className = 'cluster-node';
    const safeId = 'cluster-' + cluster.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    el.id = safeId;
    el.dataset.cluster = cluster.name;
    el.innerHTML = `
      <span class="cluster-dot"></span>
      <span class="cluster-text">${cluster.name}</span>
      <span class="cluster-count">${cluster.count}</span>
    `;
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onToggleCluster) onToggleCluster(cluster);
    });
    container.appendChild(el);
    return {
      element: el,
      cluster: cluster
    };
  });
}

const visibleCandidates = [];
const accepted = [];
const placedLabels = [];
const boundIds = new Set();

export function renderPipeline() {
  const cameraDistance = camera.position.distanceTo(scene.position);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const halfW = width / 2;
  const halfH = height / 2;

  vCam.copy(camera.position);

  // Cluster transition range (260..290)
  let clusterOpacity = 0;
  let markerModeOpacity = 1;

  if (cameraDistance >= 290) {
    clusterOpacity = 1;
    markerModeOpacity = 0;
  } else if (cameraDistance <= 260) {
    clusterOpacity = 0;
    markerModeOpacity = 1;
  } else {
    const t = (cameraDistance - 260) / 30;
    clusterOpacity = t;
    markerModeOpacity = 1 - t;
  }

  // Render cluster nodes
  clusterNodes.forEach(({ element, cluster }) => {
    if (clusterOpacity <= 0.01) {
      element.style.transform = 'translate3d(-9999px, -9999px, 0)';
      element.style.opacity = '0';
      return;
    }

    vDir.subVectors(vCam, cluster.pos3D).normalize();
    const dot = cluster.normal.dot(vDir);

    if (dot <= 0.05) {
      element.style.transform = 'translate3d(-9999px, -9999px, 0)';
      element.style.opacity = '0';
      return;
    }

    vProj.copy(cluster.pos3D).project(camera);
    const sx = (vProj.x * halfW) + halfW;
    const sy = -(vProj.y * halfH) + halfH;

    let edgeFade = 1;
    if (dot < 0.25) {
      edgeFade = (dot - 0.05) / 0.2;
    }
    const finalOp = clusterOpacity * edgeFade * hudClearance(sx, sy - 18, 75, 20);

    if (finalOp <= 0.01) {
      element.style.transform = 'translate3d(-9999px, -9999px, 0)';
      element.style.opacity = '0';
      return;
    }

    element.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%) translateY(-6px)`;
    element.style.opacity = finalOp.toFixed(3);
  });

  // Individual Markers Projection
  if (markerModeOpacity <= 0.01) {
    for (let i = 0; i < POOL_SIZE; i++) {
      markerPool[i].element.style.transform = 'translate3d(-9999px, -9999px, 0)';
      markerPool[i].element.style.opacity = '0';
    }
    return;
  }

  visibleCandidates.length = 0;

  for (let i = 0; i < PROFILES_DATA.length; i++) {
    const p = PROFILES_DATA[i];

    vDir.subVectors(vCam, p.pos3D).normalize();
    const dot = p.normal.dot(vDir);

    if (dot <= 0.05) {
      p._isVisible = false;
      continue;
    }

    vProj.copy(p.pos3D).project(camera);
    const sx = (vProj.x * halfW) + halfW;
    const sy = -(vProj.y * halfH) + halfH;

    if (sx < -60 || sx > width + 200 || sy < -60 || sy > height + 60) {
      p._isVisible = false;
      continue;
    }

    const labelled = p.tier >= 3;
    const clearance = labelled
      ? hudClearance(sx + 70, sy, 92, 20)
      : hudClearance(sx, sy, 20, 20);
    if (clearance <= 0.01) {
      p._isVisible = false;
      continue;
    }

    let edgeFade = 1;
    if (dot < 0.25) {
      edgeFade = (dot - 0.05) / 0.2;
    }

    p._isVisible = true;
    p._screenX = sx;
    p._screenY = sy;
    p._dot = dot;
    p._edgeFade = edgeFade * clearance;

    const isTarget = (p.id === selectedProfileId);
    p._priority = (isTarget ? 1000000 : 0)
                + (p._isMatch ? 4000 : 0)
                + (dot * 1000)
                + (p.tier * 140)
                + (boundIds.has(p.id) ? 140 : 0);
    visibleCandidates.push(p);
  }

  visibleCandidates.sort((a, b) => b._priority - a._priority);

  accepted.length = 0;
  placedLabels.length = 0;
  for (let i = 0; i < visibleCandidates.length && accepted.length < POOL_SIZE; i++) {
    const p = visibleCandidates[i];
    if (p.id === selectedProfileId) {
      accepted.push(p);
      continue;
    }
    const minGap = p.tier >= 4 ? 52 : 42;
    let blocked = false;
    for (let j = 0; j < accepted.length; j++) {
      const q = accepted[j];
      const dx = p._screenX - q._screenX, dy = p._screenY - q._screenY;
      if (dx * dx + dy * dy < minGap * minGap) { blocked = true; break; }
    }
    if (blocked) continue;
    accepted.push(p);
  }

  // Label collision resolution
  for (let i = 0; i < accepted.length; i++) {
    const p = accepted[i];
    if (p.id === selectedProfileId) {
      p._labelMuted = false;
      const l = p._screenX + 18, r = p._screenX + 260;
      const t = p._screenY - 20, b = p._screenY + 20;
      placedLabels.push({ l, t, r, b });
      continue;
    }
    if (p.tier < 3) { p._labelMuted = true; continue; }
    const l = p._screenX + 18, r = p._screenX + 216;
    const t = p._screenY - 16, b = p._screenY + 16;
    let clash = false;
    for (let j = 0; j < placedLabels.length && !clash; j++) {
      const o = placedLabels[j];
      if (l < o.r && r > o.l && t < o.b && b > o.t) clash = true;
    }
    for (let j = 0; j < accepted.length && !clash; j++) {
      if (j === i) continue;
      const q = accepted[j];
      if (l < q._screenX + 19 && r > q._screenX - 19 &&
          t < q._screenY + 19 && b > q._screenY - 19) clash = true;
    }
    p._labelMuted = clash;
    if (!clash) placedLabels.push({ l, t, r, b });
  }

  boundIds.clear();

  for (let i = 0; i < POOL_SIZE; i++) {
    const slot = markerPool[i];
    if (i < accepted.length) {
      const p = accepted[i];
      boundIds.add(p.id);
      const isSelected = (p.id === selectedProfileId);

      const companyTitle = (p.project && p.project.title) ? p.project.title : p.name;
      const subInfo = (p.project && p.project.title)
        ? (isSelected ? `by ${p.name} • ${p.city}, ${p.country}` : `by ${p.name} • ${p.city}`)
        : `${p.title} • ${p.city}`;

      if (slot.boundId !== p.id || slot._lastSelected !== isSelected || slot.boundRev !== p._rev) {
        slot.boundId = p.id;
        slot.boundRev = p._rev;
        slot._lastSelected = isSelected;
        slot.element._boundProfile = p;
        slot.element.className = `pool-marker marker-tier-${p.tier}${isSelected ? ' is-selected-pin' : ''}`;
        slot.avatarText.textContent = p.initials;
        slot.labelName.textContent = companyTitle;
        slot.labelRole.textContent = subInfo;
        slot.labelMuted = false;
      }

      const shouldMute = isSelected ? false : p._labelMuted;
      if (slot.labelMuted !== shouldMute) {
        slot.labelMuted = shouldMute;
        slot.element.classList.toggle('label-muted', shouldMute);
      }

      slot.element.classList.toggle('is-selected-pin', isSelected);

      const matchFactor = p._isMatch ? 1 : 0.12;
      const finalOp = isSelected ? 1 : (markerModeOpacity * p._edgeFade * matchFactor);

      slot.element.style.transform = `translate3d(${(p._screenX - 17).toFixed(1)}px, ${(p._screenY - 17).toFixed(1)}px, 0)`;
      slot.element.style.opacity = isSelected ? '1' : finalOp.toFixed(3);
    } else {
      if (slot.boundId !== null) {
        slot.element.style.transform = 'translate3d(-9999px, -9999px, 0)';
        slot.element.style.opacity = '0';
        slot.boundId = null;
        slot.boundRev = null;
        slot._lastSelected = false;
      }
    }
  }
}

const stalkDummy = new THREE.Object3D();

export function updateBeaconVisibility() {
  vCam.copy(camera.position);
  for (let i = 0; i < tier5Profiles.length; i++) {
    const p = tier5Profiles[i];
    vDir.subVectors(vCam, p.pos3D).normalize();
    const d = p.normal.dot(vDir);
    let k = d <= 0.04 ? 0 : Math.min(1, (d - 0.04) / 0.34);
    if (!p._isMatch) k *= 0.2;
    if (selectedProfileId !== null) {
      if (p.id === selectedProfileId) {
        k *= 1.6;
      } else {
        k *= 0.18;
      }
    }
    stalkDummy.position.copy(p.pos3D);
    stalkDummy.quaternion.copy(p._stalkQuat);
    stalkDummy.scale.set(1, k, 1);
    stalkDummy.updateMatrix();
    stalkInstancedMesh.setMatrixAt(i, stalkDummy.matrix);
  }
  stalkInstancedMesh.instanceMatrix.needsUpdate = true;
}
