import { geocodeLocation } from '../api/geocoding.js';
import { saveProject, updateProject, loadCommunityProjects } from '../api/supabase.js';
import { isSignedIn } from '../api/auth.js';
import { registerNewProfile, refreshProfileGeometry } from '../three/markers.js';
import { showToast } from './toast.js';
import { openAuthModal } from './auth-modal.js';

let modalBackdrop = null;
let formEl = null;
let coordPreviewEl = null;
let geocodeDebounceTimer = null;

// null while creating, or the profile object being edited.
let editingProfile = null;
let onProjectsChanged = null;

let _openProfileCard = null;
let _flyCameraToCoordinates = null;

const FIELDS = {
  title: 'sub-title',
  tagline: 'sub-tagline',
  category: 'sub-category',
  tech: 'sub-tech',
  demoUrl: 'sub-demo-url',
  metric: 'sub-metric',
  makerName: 'sub-maker-name',
  makerRole: 'sub-maker-role',
  isRemote: 'sub-is-remote',
  city: 'sub-city',
  country: 'sub-country',
  email: 'sub-email',
  experience: 'sub-experience'
};

const field = (key) => document.getElementById(FIELDS[key]);
const valueOf = (key) => {
  const el = field(key);
  return el ? el.value.trim() : '';
};

const COPY = {
  create: {
    badge: 'LAUNCH YOUR PIN',
    heading: 'Feature Your Project & Profile',
    desc: 'Put your build on the global 3D map. Free, instant, and discoverable worldwide.',
    cta: '🚀 Launch Pin on Globe',
    busy: 'Geocoding & Deploying Pin...'
  },
  edit: {
    badge: 'EDIT YOUR PIN',
    heading: 'Edit Your Project',
    desc: 'Update the details on your globe pin. Changes go live immediately.',
    cta: '💾 Save Changes',
    busy: 'Saving Changes...'
  }
};

function applyCopy(mode) {
  const copy = COPY[mode];
  const badge = document.getElementById('sub-badge');
  const heading = document.getElementById('sub-heading');
  const desc = document.getElementById('sub-desc');
  const submitBtn = document.getElementById('btn-submit-project');
  if (badge) badge.textContent = copy.badge;
  if (heading) heading.textContent = copy.heading;
  if (desc) desc.textContent = copy.desc;
  if (submitBtn) submitBtn.textContent = copy.cta;
}

export function initSubmitModal({ openProfileCard, flyCameraToCoordinates, onChange } = {}) {
  _openProfileCard = openProfileCard;
  _flyCameraToCoordinates = flyCameraToCoordinates;
  onProjectsChanged = onChange;

  modalBackdrop = document.getElementById('submit-modal-backdrop');
  formEl = document.getElementById('submit-project-form');
  coordPreviewEl = document.getElementById('submit-coord-preview');

  // Single owner for both "Submit Project" entry points.
  const navBtn = document.getElementById('btn-advertise-nav');
  const heroBtn = document.getElementById('btn-advertise-hero');
  if (navBtn) navBtn.addEventListener('click', () => openSubmitModal());
  if (heroBtn) heroBtn.addEventListener('click', () => openSubmitModal());

  const closeBtn = document.getElementById('btn-close-submit');
  const cancelBtn = document.getElementById('btn-cancel-submit');
  if (closeBtn) closeBtn.addEventListener('click', () => closeSubmitModal());
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeSubmitModal());

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeSubmitModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('active')) {
      closeSubmitModal();
    }
  });

  // Live geocode preview & remote toggle handler
  const isRemoteInput = field('isRemote');
  const cityInput = field('city');
  const countryInput = field('country');
  const cityLabel = document.getElementById('lbl-sub-city');
  const countryLabel = document.getElementById('lbl-sub-country');

  const handleLocationChange = () => {
    clearTimeout(geocodeDebounceTimer);
    geocodeDebounceTimer = setTimeout(async () => {
      const isRemote = Boolean(isRemoteInput && isRemoteInput.checked);
      const city = cityInput ? cityInput.value.trim() : '';
      const country = countryInput ? countryInput.value.trim() : '';

      if (!isRemote && city.length < 2) {
        if (coordPreviewEl) {
          coordPreviewEl.textContent = '📍 Type your city to auto-detect coordinates on the 3D globe';
          coordPreviewEl.classList.remove('loading');
        }
        return;
      }

      if (coordPreviewEl) {
        coordPreviewEl.textContent = '📍 Calculating coordinates...';
        coordPreviewEl.classList.add('loading');
      }

      const coords = await geocodeLocation(city, country, isRemote);
      if (coordPreviewEl) {
        if (isRemote) {
          if (coords.isGlobal) {
            coordPreviewEl.innerHTML = `🌐 <b>Global Cloud Pin:</b> Floating Orbit (${formatCoords(coords.lat, coords.lon)})`;
          } else {
            coordPreviewEl.innerHTML = `🛡️ <b>Privacy Pin:</b> Region Centered on ${country || 'Country'} (${formatCoords(coords.lat, coords.lon)})`;
          }
        } else {
          coordPreviewEl.textContent = `📍 Geocoded: ${formatCoords(coords.lat, coords.lon)}`;
        }
        coordPreviewEl.classList.remove('loading');
      }
    }, 350);
  };

  const updateRemoteUI = () => {
    const isRemote = Boolean(isRemoteInput && isRemoteInput.checked);
    if (isRemote) {
      if (cityInput) {
        cityInput.required = false;
        cityInput.placeholder = 'Hidden (Remote / Privacy)';
      }
      if (cityLabel) cityLabel.textContent = 'City (Optional / Hidden)';
      if (countryLabel) countryLabel.textContent = 'Country (or Worldwide) *';
      if (countryInput && !countryInput.value.trim()) {
        countryInput.placeholder = 'e.g. India (or Worldwide)';
      }
    } else {
      if (cityInput) {
        cityInput.required = true;
        cityInput.placeholder = 'e.g. Bengaluru';
      }
      if (cityLabel) cityLabel.textContent = 'City *';
      if (countryLabel) countryLabel.textContent = 'Country *';
      if (countryInput) countryInput.placeholder = 'e.g. India';
    }
    handleLocationChange();
  };

  if (isRemoteInput) isRemoteInput.addEventListener('change', updateRemoteUI);
  if (cityInput) cityInput.addEventListener('input', handleLocationChange);
  if (countryInput) countryInput.addEventListener('input', handleLocationChange);

  if (formEl) formEl.addEventListener('submit', handleFormSubmit);

  loadSavedCommunityProjects();
}

function formatCoords(lat, lon) {
  const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

export async function loadSavedCommunityProjects() {
  try {
    const projects = await loadCommunityProjects();
    projects.forEach(p => registerNewProfile(p));
    if (projects.length) {
      console.log(`[Community] Mounted ${projects.length} community projects on the 3D globe.`);
    }
    if (onProjectsChanged) onProjectsChanged();
  } catch (err) {
    console.warn('[Community] Error loading projects on init:', err);
  }
}

/**
 * Opens the form. Pass a profile to edit it instead of creating a new one.
 * Creating requires a signed-in account, so the auth modal is raised first and
 * the submit form re-opens once the person is in.
 */
export function openSubmitModal({ profile = null } = {}) {
  if (!modalBackdrop) return;

  if (!profile && !isSignedIn()) {
    openAuthModal({
      startMode: 'signin',
      reason: 'Sign in to launch your project on the globe.',
      afterAuth: () => openSubmitModal()
    });
    return;
  }

  editingProfile = profile;
  applyCopy(profile ? 'edit' : 'create');

  if (profile) {
    fillForm(profile);
  } else if (formEl) {
    formEl.reset();
    if (coordPreviewEl) {
      coordPreviewEl.textContent = '📍 Type your city to auto-detect coordinates on the 3D globe';
      coordPreviewEl.classList.remove('loading');
    }
  }

  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const first = field('title');
    if (first) first.focus();
  }, 100);
}

function fillForm(p) {
  const project = p.project || {};
  const set = (key, value) => {
    const el = field(key);
    if (el) el.value = value || '';
  };
  set('title', project.title);
  set('tagline', project.tagline);
  set('category', p.projectCategory);
  set('tech', (project.techStack || p.skills || []).join(', '));
  set('demoUrl', project.demoUrl);
  set('metric', project.metric);
  set('makerName', p.name);
  set('makerRole', p.title);
  set('city', p.city === 'Remote' ? '' : p.city);
  set('country', p.country);
  set('email', p.contactEmail);
  set('experience', p.experience);

  const isRemoteInput = field('isRemote');
  const isRemote = Boolean(p.isRemote || p.city === 'Remote' || p.country === 'Global' || p.country === 'Worldwide');
  if (isRemoteInput) {
    isRemoteInput.checked = isRemote;
    const cityInput = field('city');
    const cityLabel = document.getElementById('lbl-sub-city');
    const countryLabel = document.getElementById('lbl-sub-country');
    if (isRemote) {
      if (cityInput) {
        cityInput.required = false;
        cityInput.placeholder = 'Hidden (Remote / Privacy)';
      }
      if (cityLabel) cityLabel.textContent = 'City (Optional / Hidden)';
      if (countryLabel) countryLabel.textContent = 'Country (or Worldwide) *';
    }
  }

  if (coordPreviewEl) {
    if (isRemote) {
      coordPreviewEl.innerHTML = `🌐 <b>Privacy Pin:</b> ${p.country || 'Global'} (${formatCoords(p.lat, p.lon)})`;
    } else {
      coordPreviewEl.textContent = `📍 Current pin: ${formatCoords(p.lat, p.lon)}`;
    }
    coordPreviewEl.classList.remove('loading');
  }
}

export function closeSubmitModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove('active');
  document.body.style.overflow = '';
  editingProfile = null;
}

function readForm() {
  const isRemoteInput = field('isRemote');
  const isRemote = Boolean(isRemoteInput && isRemoteInput.checked);
  const techStackRaw = valueOf('tech');
  const makerName = valueOf('makerName');
  let city = valueOf('city');
  let country = valueOf('country');

  if (isRemote) {
    if (!city) city = 'Remote';
    if (!country) country = 'Worldwide';
  }

  return {
    title: valueOf('title'),
    tagline: valueOf('tagline'),
    category: valueOf('category'),
    demoUrl: valueOf('demoUrl'),
    metric: valueOf('metric') || 'Active Build',
    makerName,
    makerRole: valueOf('makerRole') || 'Software Engineer',
    isRemote,
    city,
    country,
    email: valueOf('email'),
    experience: valueOf('experience') || '3 years',
    techStack: techStackRaw
      ? techStackRaw.split(',').map(s => s.trim()).filter(Boolean)
      : ['TypeScript', 'React'],
    initials: makerName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'MK'
  };
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const isEdit = Boolean(editingProfile);
  const copy = COPY[isEdit ? 'edit' : 'create'];
  const submitBtn = document.getElementById('btn-submit-project');

  const form = readForm();
  if (!form.title || !form.tagline || !form.makerName) {
    showToast('Fill in every field marked * before launching.', 3200);
    return;
  }
  if (!form.isRemote && (!form.city || !form.country)) {
    showToast('Please enter your City & Country (or enable "Work Remotely" for privacy).', 3500);
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="submit-spinner"></span> ${copy.busy}`;
  }

  try {
    const coords = await geocodeLocation(form.city, form.country, form.isRemote);

    if (isEdit) {
      await commitEdit(editingProfile, form, coords);
    } else {
      await commitCreate(form, coords);
    }
  } catch (err) {
    console.error('[Submit] Error:', err);
    showToast('❌ Something went wrong. Your details are still in the form — try again.', 4000);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = copy.cta;
    }
  }
}

async function commitCreate(form, coords) {
  const isGlobalOrbit = Boolean(coords.isGlobal || form.country.toLowerCase() === 'worldwide' || form.country.toLowerCase() === 'global');
  const targetAltitude = isGlobalOrbit ? 265 : 185;

  const profile = {
    id: `comm-${Date.now()}`,
    name: form.makerName,
    initials: form.initials,
    title: form.makerRole,
    category: 'Developer',
    projectCategory: form.category,
    isRemote: form.isRemote,
    city: form.city,
    country: form.country,
    region: form.country,
    lat: coords.lat,
    lon: coords.lon,
    tier: 4,
    tierName: form.isRemote ? 'Global Builder' : 'Community Spotlight',
    skills: form.techStack,
    experience: form.experience,
    availability: 'AVAILABLE FOR OPPORTUNITIES',
    impressions: '1.4k impressions',
    pitch: form.tagline,
    contactEmail: form.email,
    project: {
      title: form.title,
      tagline: form.tagline,
      techStack: form.techStack,
      metric: form.metric,
      badge: form.isRemote ? '🌐 Remote Build' : 'Just Launched',
      demoUrl: form.demoUrl
    }
  };

  const result = await saveProject(profile);
  const saved = result.profile || profile;

  registerNewProfile(saved);
  if (formEl) formEl.reset();
  closeSubmitModal();
  if (onProjectsChanged) onProjectsChanged();

  // Informative toast
  const destination = form.isRemote ? (form.country || 'Global Orbit') : form.city;
  if (result.remote) {
    showToast(`🚀 "${form.title}" is live on the globe. Flying to ${destination}...`, 4500);
  } else {
    showToast(`📍 "${form.title}" is pinned in this browser only — ${result.error || 'cloud save unavailable'}`, 6000);
  }

  if (_flyCameraToCoordinates) _flyCameraToCoordinates(saved.lat, saved.lon, targetAltitude);
  setTimeout(() => {
    if (_openProfileCard) _openProfileCard(saved);
  }, 1500);
}

async function commitEdit(profile, form, coords) {
  const moved = profile.lat !== coords.lat || profile.lon !== coords.lon;
  const isGlobalOrbit = Boolean(coords.isGlobal || form.country.toLowerCase() === 'worldwide' || form.country.toLowerCase() === 'global');
  const targetAltitude = isGlobalOrbit ? 265 : 185;

  Object.assign(profile, {
    name: form.makerName,
    initials: form.initials,
    title: form.makerRole,
    projectCategory: form.category,
    isRemote: form.isRemote,
    city: form.city,
    country: form.country,
    region: form.country,
    lat: coords.lat,
    lon: coords.lon,
    tierName: form.isRemote ? 'Global Builder' : (profile.tierName || 'Community Spotlight'),
    skills: form.techStack,
    experience: form.experience,
    pitch: form.tagline,
    contactEmail: form.email,
    project: {
      ...(profile.project || {}),
      title: form.title,
      tagline: form.tagline,
      techStack: form.techStack,
      metric: form.metric,
      badge: form.isRemote ? '🌐 Remote Build' : (profile.project?.badge || 'Live Build'),
      demoUrl: form.demoUrl
    }
  });

  if (moved) refreshProfileGeometry(profile);

  const result = await updateProject(profile);
  closeSubmitModal();
  if (onProjectsChanged) onProjectsChanged();

  if (!result.ok) {
    showToast(`❌ ${result.error}`, 5000);
    return;
  }
  if (result.remote) {
    showToast(`✅ "${form.title}" updated.`, 3500);
  } else {
    showToast(`✅ "${form.title}" updated in this browser only.`, 4000);
  }

  if (moved && _flyCameraToCoordinates) _flyCameraToCoordinates(profile.lat, profile.lon, targetAltitude);
  setTimeout(() => {
    if (_openProfileCard) _openProfileCard(profile);
  }, moved ? 1200 : 200);
}
