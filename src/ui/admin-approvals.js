import { registerTier5Profile, registerNewProfile } from '../three/markers.js';
import { celestialSystem } from '../three/celestial-system.js';
import { updateDynamicSpotlights } from './spotlight-dock.js';
import { refreshFilters } from './search-filters.js';
import { render as renderMyProjects } from './my-projects.js';
import { showToast } from './toast.js';
import { getUser } from '../api/auth.js';
import { saveProject } from '../api/supabase.js';

const PENDING_STORAGE_KEY = 'talent_globe_pending_claims';
const ADMIN_AUTH_KEY = 'talent_globe_admin_auth';

let modalBackdrop = null;
let listContainer = null;
let countBadgeEl = null;

export function getPendingClaims() {
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function savePendingClaims(claims) {
  try {
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(claims));
  } catch (err) {}
  updateBadgeCounter();
}

export function addPendingClaim(profile) {
  const claims = getPendingClaims();
  // Avoid duplicates
  const existingIdx = claims.findIndex(c => c.id === profile.id || (c.project?.title && c.project.title.toLowerCase() === profile.project?.title?.toLowerCase()));
  if (existingIdx >= 0) {
    claims[existingIdx] = profile;
  } else {
    claims.unshift(profile);
  }
  savePendingClaims(claims);
  updateBadgeCounter();
}

export function updateBadgeCounter() {
  if (!countBadgeEl) countBadgeEl = document.getElementById('approvals-count-badge');
  const count = getPendingClaims().length;
  if (countBadgeEl) {
    countBadgeEl.textContent = String(count);
    countBadgeEl.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

export function isAdminAuthenticated() {
  const user = getUser();
  if (user && user.email && user.email.toLowerCase().includes('tejas')) {
    return true;
  }
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

export function openAdminApprovals() {
  if (!modalBackdrop) modalBackdrop = document.getElementById('admin-approvals-modal');
  if (!modalBackdrop) return;

  if (!isAdminAuthenticated()) {
    promptAdminPasscode();
    return;
  }

  renderAdminApprovalsList();
  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeAdminApprovals() {
  if (!modalBackdrop) modalBackdrop = document.getElementById('admin-approvals-modal');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

export function syncAdminUI() {
  const isAuth = isAdminAuthenticated();
  const navItem = document.getElementById('nav-item-approvals');
  const menuBtn = document.getElementById('menu-approvals');
  if (navItem) navItem.style.display = isAuth ? 'inline-block' : 'none';
  if (menuBtn) menuBtn.style.display = isAuth ? 'flex' : 'none';
}

function promptAdminPasscode() {
  const entered = prompt('🔐 Enter Admin Passcode:');
  if (!entered) return;
  if (entered.trim() === 'admin777' || entered.trim() === 'tejas') {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    showToast('✓ Admin verified!', 2500);
    syncAdminUI();
    openAdminApprovals();
  } else {
    showToast('✕ Access denied.', 3000);
  }
}

export function approveClaim(claimId) {
  const claims = getPendingClaims();
  const idx = claims.findIndex(c => String(c.id) === String(claimId));
  if (idx < 0) return;

  const claim = claims[idx];
  claim.status = 'approved';
  claim.approvedAt = new Date().toISOString();

  // Register live onto 3D Globe & Solar System
  if (claim.tier === 5 || claim.spotlightRank) {
    registerTier5Profile(claim);
  } else {
    registerNewProfile(claim);
  }

  // Live refresh celestial solar system labels
  if (celestialSystem && typeof celestialSystem.refreshLabels === 'function') {
    celestialSystem.refreshLabels();
  }

  // Refresh other UI components
  updateDynamicSpotlights();
  refreshFilters();
  renderMyProjects();

  // Also sync approved state to Supabase in background
  saveProject(claim).catch(() => {});

  // Remove from pending queue
  claims.splice(idx, 1);
  savePendingClaims(claims);

  showToast(`👑 Approved "${claim.project?.title || claim.name}"! Now live on TalentGlobe!`, 4500);
  renderAdminApprovalsList();
}

export function rejectClaim(claimId) {
  const claims = getPendingClaims();
  const idx = claims.findIndex(c => String(c.id) === String(claimId));
  if (idx < 0) return;

  const claim = claims[idx];
  claims.splice(idx, 1);
  savePendingClaims(claims);

  showToast(`Claim for "${claim.project?.title || claim.name}" dismissed.`, 3000);
  renderAdminApprovalsList();
}

export function renderAdminApprovalsList() {
  if (!listContainer) listContainer = document.getElementById('admin-approvals-list');
  if (!listContainer) return;

  const claims = getPendingClaims();
  updateBadgeCounter();

  if (claims.length === 0) {
    listContainer.innerHTML = `
      <div class="admin-empty-state">
        <span class="admin-empty-icon">✨</span>
        <div class="admin-empty-title">No Pending Approvals</div>
        <p class="admin-empty-desc">All submitted projects and planet claims are reviewed! New free claims submitted during beta will appear here instantly.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = '';
  claims.forEach((claim) => {
    const card = document.createElement('div');
    card.className = 'admin-claim-card';

    const proj = claim.project || {};
    const celestialSpot = claim.tierName || (claim.spotlightRank === 1 ? '☀️ The Sun' : `Spot #${claim.spotlightRank}`);

    card.innerHTML = `
      <div class="admin-card-header">
        <div class="admin-spot-badge">👑 TARGET: ${celestialSpot.toUpperCase()}</div>
        <span class="admin-time-tag">${claim.claimedAt ? new Date(claim.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</span>
      </div>
      <div class="admin-card-title-row">
        <h3 class="admin-project-title">${proj.title || claim.name}</h3>
        <span class="admin-cat-pill">${claim.projectCategory || claim.category || 'Build'}</span>
      </div>
      <p class="admin-project-tagline">${proj.tagline || claim.pitch || 'No tagline provided.'}</p>
      <div class="admin-meta-row">
        <span>👤 <strong>${claim.name}</strong></span>
        <span>📍 ${claim.city}, ${claim.country}</span>
        ${claim.contactEmail ? `<span>✉️ ${claim.contactEmail}</span>` : ''}
        ${proj.demoUrl && proj.demoUrl !== '#' ? `<span>🔗 <a href="${proj.demoUrl}" target="_blank" rel="noopener">${proj.demoUrl}</a></span>` : ''}
      </div>
      <div class="admin-actions-row">
        <button type="button" class="btn-admin-approve" data-id="${claim.id}">
          ✓ Approve & Publish Live
        </button>
        <button type="button" class="btn-admin-reject" data-id="${claim.id}">
          ✕ Dismiss
        </button>
      </div>
    `;

    const approveBtn = card.querySelector('.btn-admin-approve');
    const rejectBtn = card.querySelector('.btn-admin-reject');

    approveBtn.addEventListener('click', () => approveClaim(claim.id));
    rejectBtn.addEventListener('click', () => rejectClaim(claim.id));

    listContainer.appendChild(card);
  });
}

export function initAdminApprovals() {
  modalBackdrop = document.getElementById('admin-approvals-modal');
  listContainer = document.getElementById('admin-approvals-list');
  countBadgeEl = document.getElementById('approvals-count-badge');

  const btnClose = document.getElementById('btn-close-admin-approvals');
  if (btnClose) btnClose.addEventListener('click', closeAdminApprovals);

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeAdminApprovals();
    });
  }

  // Top nav button
  const navBtn = document.getElementById('nav-btn-approvals');
  if (navBtn) navBtn.addEventListener('click', openAdminApprovals);

  // Account menu item
  const menuBtn = document.getElementById('menu-approvals');
  if (menuBtn) menuBtn.addEventListener('click', openAdminApprovals);

  // Secret shortcut: Cmd+Shift+A or Ctrl+Shift+A opens Admin Console
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      openAdminApprovals();
    }
  });

  // URL Hash trigger: visiting #admin opens Admin Console
  if (window.location.hash === '#admin') {
    setTimeout(() => openAdminApprovals(), 500);
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') openAdminApprovals();
  });

  syncAdminUI();
  updateBadgeCounter();
}
