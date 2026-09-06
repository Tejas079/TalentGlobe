import { gsap } from 'gsap';
import { showToast } from './toast.js';
import { flyCameraToCoordinates } from '../three/camera-flight.js';
import { canEditProfile } from '../api/ownership.js';
import { openSubmitModal } from './submit-modal.js';
import { setSelectedGlobeProfileId } from '../three/markers.js';
import { setActiveSpotlightProfile } from './spotlight-dock.js';

let highlightCountryCallback = null;

export function setHighlightCountryHandler(fn) {
  highlightCountryCallback = fn;
}

function isUsableUrl(value) {
  if (!value || value === '#') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

/** Turns "you@x.com" into a mailto and "@handle" into an x.com profile. */
function contactTarget(profile) {
  const raw = (profile.contactEmail || '').trim();
  if (!raw) return null;
  if (raw.includes('@') && raw.includes('.') && !raw.startsWith('@')) {
    const subject = encodeURIComponent(
      `About ${(profile.project && profile.project.title) || 'your project'} on Talent Globe`
    );
    return { href: `mailto:${raw}?subject=${subject}`, label: raw, sameTab: true };
  }
  if (raw.startsWith('@')) {
    return { href: `https://x.com/${raw.slice(1)}`, label: raw, sameTab: false };
  }
  if (isUsableUrl(raw)) return { href: raw, label: raw, sameTab: false };
  return null;
}

export function openProfileCard(p) {
  const profileCardModal = document.getElementById('profile-card');
  if (!profileCardModal) return;

  // Sync selected pin beacon on globe & spotlight carousel
  setSelectedGlobeProfileId(p.id);
  setActiveSpotlightProfile(p.id);

  const project = p.project || {};

  const tierTag = document.getElementById('card-tier-tag');
  if (tierTag) {
    tierTag.textContent = p.spotlightRank
      ? `#${p.spotlightRank} GLOBAL SPOTLIGHT`
      : String(p.tierName || 'Community Spotlight').toUpperCase();
  }

  const badgeTag = document.getElementById('card-badge-tag');
  if (badgeTag) badgeTag.textContent = project.badge || 'Production Live';

  const projectTitle = document.getElementById('card-project-title');
  if (projectTitle) projectTitle.textContent = project.title || p.title;

  const projectCat = document.getElementById('card-project-category');
  if (projectCat) projectCat.textContent = p.projectCategory || p.category || 'Engineering';

  const projectMetric = document.getElementById('card-project-metric');
  if (projectMetric) projectMetric.textContent = project.metric || 'Active Production';

  const projectTagline = document.getElementById('card-project-tagline');
  if (projectTagline) projectTagline.textContent = project.tagline || p.pitch;

  const stackContainer = document.getElementById('card-project-stack');
  if (stackContainer) {
    stackContainer.innerHTML = '';
    const stackItems = (project.techStack && project.techStack.length) ? project.techStack : (p.skills || []);
    stackItems.forEach(s => {
      const span = document.createElement('span');
      span.className = 'card-tech-tag';
      span.textContent = s;
      stackContainer.appendChild(span);
    });
  }

  const cardAvatar = document.getElementById('card-avatar');
  if (cardAvatar) cardAvatar.textContent = p.initials;

  const cardName = document.getElementById('card-name');
  if (cardName) cardName.textContent = p.name;

  const cardRole = document.getElementById('card-role');
  if (cardRole) cardRole.textContent = p.title;

  const locEl = document.getElementById('card-location');
  if (locEl) {
    const isGlobal = p.country === 'Global' || p.country === 'Worldwide' || (!p.country && p.isRemote);
    const isRemote = Boolean(p.isRemote || p.city === 'Remote' || isGlobal);

    if (isGlobal) {
      locEl.textContent = '🌐 100% Remote / Distributed Team (Global Orbit)';
      locEl.style.cursor = 'pointer';
      locEl.title = 'Click to view global orbital panorama';
      locEl.onclick = () => {
        flyCameraToCoordinates(p.lat, p.lon, 265);
      };
    } else if (isRemote) {
      locEl.textContent = `🌐 Remote • ${p.country} (Approximate Region)`;
      locEl.style.cursor = 'pointer';
      locEl.title = 'Click to focus & highlight country on globe';
      locEl.onclick = () => {
        flyCameraToCoordinates(p.lat, p.lon, 210);
        if (highlightCountryCallback) highlightCountryCallback(p.country, true);
      };
    } else {
      locEl.textContent = `${p.city}, ${p.country} • ${Math.abs(p.lat).toFixed(2)}° ${p.lat >= 0 ? 'N' : 'S'}, ${Math.abs(p.lon).toFixed(2)}° ${p.lon >= 0 ? 'E' : 'W'}`;
      locEl.style.cursor = 'pointer';
      locEl.title = 'Click to focus & highlight country on globe';
      locEl.onclick = () => {
        flyCameraToCoordinates(p.lat, p.lon, 195);
        if (highlightCountryCallback) highlightCountryCallback(p.country, true);
      };
    }
  }

  // Previously hardcoded in the markup, so every card claimed availability.
  const availabilityEl = document.getElementById('card-availability-text');
  if (availabilityEl) {
    availabilityEl.textContent = p.availability || 'AVAILABILITY NOT STATED';
  }

  const expEl = document.getElementById('card-experience');
  if (expEl) expEl.textContent = `${p.experience} experience`;

  // "Live Demo" now actually opens the demo.
  const btnDemo = document.getElementById('card-btn-demo');
  if (btnDemo) {
    const demoUrl = project.demoUrl;
    if (isUsableUrl(demoUrl)) {
      btnDemo.disabled = false;
      btnDemo.textContent = '⚡ Live Demo';
      btnDemo.title = demoUrl;
      btnDemo.onclick = () => {
        window.open(demoUrl, '_blank', 'noopener,noreferrer');
      };
    } else {
      btnDemo.disabled = true;
      btnDemo.textContent = '⚡ No demo link';
      btnDemo.title = 'This project has not published a demo or repo URL.';
      btnDemo.onclick = null;
    }
  }

  // "Hire / Contact" now actually opens a contact channel.
  const btnContact = document.getElementById('card-btn-contact');
  if (btnContact) {
    const firstName = String(p.name || '').split(' ')[0] || 'Maker';
    const target = contactTarget(p);
    if (target) {
      btnContact.disabled = false;
      btnContact.textContent = `✉ Hire / Contact ${firstName}`;
      btnContact.title = target.label;
      btnContact.onclick = () => {
        if (target.sameTab) window.location.href = target.href;
        else window.open(target.href, '_blank', 'noopener,noreferrer');
      };
    } else {
      btnContact.disabled = false;
      btnContact.textContent = `✉ No contact listed`;
      btnContact.title = `${p.name} has not published a contact address.`;
      btnContact.onclick = () => {
        showToast(`${p.name} has not published a contact address.`, 3000);
      };
    }
  }

  // Owner-only edit shortcut.
  const btnEdit = document.getElementById('card-btn-edit');
  if (btnEdit) {
    if (canEditProfile(p)) {
      btnEdit.hidden = false;
      btnEdit.onclick = () => openSubmitModal({ profile: p });
    } else {
      btnEdit.hidden = true;
      btnEdit.onclick = null;
    }
  }

  if (highlightCountryCallback) highlightCountryCallback(p.country, false);

  profileCardModal.classList.add('open');
  gsap.killTweensOf(profileCardModal);
  gsap.fromTo(profileCardModal,
    { opacity: 0, y: 22, scale: 0.94 },
    { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }
  );

  const elementsToStagger = [
    document.querySelector('.card-tier-wrap'),
    document.getElementById('card-project-box'),
    document.querySelector('.card-maker-row'),
    document.querySelector('.card-meta-row'),
    document.querySelector('.card-actions')
  ].filter(Boolean);

  gsap.killTweensOf(elementsToStagger);
  gsap.fromTo(elementsToStagger,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out', delay: 0.06 }
  );
}

export function closeProfileCard() {
  const profileCardModal = document.getElementById('profile-card');
  if (!profileCardModal) return;
  if (!profileCardModal.classList.contains('open')) return;

  // Clear selected pin beacon on globe & dock highlight
  setSelectedGlobeProfileId(null);
  setActiveSpotlightProfile(null);

  gsap.killTweensOf(profileCardModal);
  gsap.to(profileCardModal, {
    opacity: 0,
    y: 14,
    scale: 0.95,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: () => profileCardModal.classList.remove('open')
  });
}

export function initProfileModal() {
  const cardCloseBtn = document.getElementById('card-close-btn');
  if (cardCloseBtn) cardCloseBtn.addEventListener('click', closeProfileCard);
}
