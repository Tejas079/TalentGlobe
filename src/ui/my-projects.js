import { PROFILES_DATA } from '../data/profiles.js';
import { canEditProfile } from '../api/ownership.js';
import { deleteProject } from '../api/supabase.js';
import { unregisterProfile } from '../three/markers.js';
import { flyCameraToCoordinates } from '../three/camera-flight.js';
import { openSubmitModal } from './submit-modal.js';
import { openProfileCard, closeProfileCard } from './profile-modal.js';
import { refreshFilters } from './search-filters.js';
import { showToast } from './toast.js';

let backdrop = null;
let listEl = null;

export function getEditableProjects() {
  return PROFILES_DATA.filter(canEditProfile);
}

export function openMyProjects() {
  if (!backdrop) return;
  render();
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeMyProjects() {
  if (!backdrop) return;
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

function buildRow(profile) {
  const row = document.createElement('div');
  row.className = 'my-project-row';

  const project = profile.project || {};
  const synced = Boolean(profile.remoteId);

  const info = document.createElement('div');
  info.className = 'my-project-info';

  const title = document.createElement('div');
  title.className = 'my-project-title';
  title.textContent = project.title || profile.name;

  const meta = document.createElement('div');
  meta.className = 'my-project-meta';
  meta.textContent = `${profile.projectCategory || 'Project'} • ${profile.city}, ${profile.country}`;

  info.append(title, meta);

  const sync = document.createElement('span');
  sync.className = `my-project-sync ${synced ? 'synced' : 'local'}`;
  sync.textContent = synced ? 'Synced' : 'This browser';
  sync.title = synced
    ? 'Saved to your Supabase project and visible to everyone.'
    : 'Saved in this browser only — it will not appear for other visitors.';

  const actions = document.createElement('div');
  actions.className = 'my-project-actions';

  const viewBtn = document.createElement('button');
  viewBtn.className = 'my-project-btn';
  viewBtn.textContent = 'View';
  viewBtn.addEventListener('click', () => {
    closeMyProjects();
    flyCameraToCoordinates(profile.lat, profile.lon, 190);
    setTimeout(() => openProfileCard(profile), 650);
  });

  const editBtn = document.createElement('button');
  editBtn.className = 'my-project-btn';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => {
    closeMyProjects();
    openSubmitModal({ profile });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'my-project-btn danger';
  deleteBtn.textContent = 'Delete';

  // Two-step confirm, so a stray click cannot destroy a pin and no blocking
  // browser dialog is involved.
  let armed = false;
  let disarmTimer = null;
  deleteBtn.addEventListener('click', async () => {
    if (!armed) {
      armed = true;
      deleteBtn.textContent = 'Confirm?';
      deleteBtn.classList.add('confirming');
      disarmTimer = setTimeout(() => {
        armed = false;
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.remove('confirming');
      }, 4000);
      return;
    }

    clearTimeout(disarmTimer);
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';

    const result = await deleteProject(profile);
    if (!result.ok) {
      deleteBtn.disabled = false;
      armed = false;
      deleteBtn.textContent = 'Delete';
      deleteBtn.classList.remove('confirming');
      showToast(`❌ ${result.error}`, 4500);
      return;
    }

    unregisterProfile(profile);
    closeProfileCard();
    refreshFilters();
    render();
    showToast(`Removed "${project.title || profile.name}" from the globe.`, 3200);
  });

  actions.append(viewBtn, editBtn, deleteBtn);
  row.append(info, sync, actions);
  return row;
}

export function render() {
  if (!listEl) return;
  listEl.innerHTML = '';

  const projects = getEditableProjects();
  if (!projects.length) {
    const empty = document.createElement('div');
    empty.className = 'my-projects-empty';
    empty.textContent = 'You have not launched a project yet. Submit one and it will show up here for editing.';
    listEl.appendChild(empty);
    return;
  }

  projects.forEach(p => listEl.appendChild(buildRow(p)));
}

export function initMyProjects() {
  backdrop = document.getElementById('my-projects-backdrop');
  listEl = document.getElementById('my-projects-list');

  const closeBtn = document.getElementById('btn-close-my-projects');
  if (closeBtn) closeBtn.addEventListener('click', closeMyProjects);

  const newBtn = document.getElementById('btn-new-project-from-list');
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      closeMyProjects();
      openSubmitModal();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeMyProjects();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && backdrop.classList.contains('active')) {
      closeMyProjects();
    }
  });
}
