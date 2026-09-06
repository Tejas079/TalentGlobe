import { camera, renderer } from '../three/scene.js';
import { controls, flyCameraToCoordinates } from '../three/camera-flight.js';
import { closeProfileCard } from './profile-modal.js';
import { openSubmitModal } from './submit-modal.js';
import { openAuthModal } from './auth-modal.js';
import { openInfoModal } from './info-modal.js';
import { openMyProjects } from './my-projects.js';
import { isSignedIn } from '../api/auth.js';

const HOME_VIEW = { lat: 16, lon: 22, distance: 315 };

function collapseHero() {
  const heroBanner = document.getElementById('hero-banner');
  if (heroBanner) heroBanner.classList.add('collapsed');
}

export function initHud() {
  // The "Submit Project" buttons are owned by submit-modal.js. They used to be
  // bound here as well, so a single click both opened the form and flew to an
  // unrelated spotlight profile, opening that stranger's card over the form.

  const btnExploreHero = document.getElementById('btn-explore-hero');
  if (btnExploreHero) {
    btnExploreHero.addEventListener('click', () => {
      collapseHero();
      closeProfileCard();
      flyCameraToCoordinates(20.0, 78.0, 210);
    });
  }

  const brandLogo = document.getElementById('brand-logo-btn');
  if (brandLogo) {
    brandLogo.addEventListener('click', () => {
      flyCameraToCoordinates(HOME_VIEW.lat, HOME_VIEW.lon, HOME_VIEW.distance);
      closeProfileCard();
      const heroBanner = document.getElementById('hero-banner');
      if (heroBanner) heroBanner.classList.remove('collapsed');
    });
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.nav;

      // Sign In opens a modal rather than navigating, so it should not take
      // over the active-section underline.
      if (target !== 'sign-in') {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }

      if (target === 'explore') {
        closeProfileCard();
        flyCameraToCoordinates(0, 30, 310);
      } else if (target === 'categories') {
        // "Projects" reveals the browsing surface instead of only focusing an input.
        collapseHero();
        const drawer = document.getElementById('secondary-filters-drawer');
        const icon = document.getElementById('filters-toggle-icon');
        if (drawer && !drawer.classList.contains('open')) {
          drawer.classList.add('open');
          if (icon) icon.textContent = '▲';
        }
        const allPill = document.querySelector('.category-pill[data-cat="All"]');
        if (allPill && !allPill.classList.contains('active')) allPill.click();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      } else if (target === 'how-it-works') {
        openInfoModal('how-it-works');
      } else if (target === 'pricing') {
        openInfoModal('spotlights');
      } else if (target === 'sign-in') {
        openAuthModal({ startMode: 'signin' });
      }
    });
  });

  // Account menu entries
  const menuMyProjects = document.getElementById('menu-my-projects');
  if (menuMyProjects) {
    menuMyProjects.addEventListener('click', () => {
      const menu = document.getElementById('account-menu');
      if (menu) menu.hidden = true;
      openMyProjects();
    });
  }

  const menuSubmit = document.getElementById('menu-submit');
  if (menuSubmit) {
    menuSubmit.addEventListener('click', () => {
      const menu = document.getElementById('account-menu');
      if (menu) menu.hidden = true;
      openSubmitModal();
    });
  }

  // HUD Controls
  const btnToggleRotate = document.getElementById('btn-toggle-rotate');
  if (btnToggleRotate) {
    btnToggleRotate.addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
      btnToggleRotate.classList.toggle('active', controls.autoRotate);
      btnToggleRotate.title = controls.autoRotate ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation';
    });
  }

  const btnResetCamera = document.getElementById('btn-reset-camera');
  if (btnResetCamera) {
    btnResetCamera.addEventListener('click', () => {
      flyCameraToCoordinates(HOME_VIEW.lat, HOME_VIEW.lon, HOME_VIEW.distance);
      closeProfileCard();
    });
  }

  const btnZoomIn = document.getElementById('btn-zoom-in');
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      const dir = camera.position.clone().normalize();
      const newDist = Math.max(controls.minDistance + 10, camera.position.length() - 40);
      camera.position.copy(dir.multiplyScalar(newDist));
    });
  }

  const btnZoomOut = document.getElementById('btn-zoom-out');
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      const dir = camera.position.clone().normalize();
      const newDist = Math.min(controls.maxDistance - 10, camera.position.length() + 40);
      camera.position.copy(dir.multiplyScalar(newDist));
    });
  }

  renderer.domElement.addEventListener('pointerdown', collapseHero);
  renderer.domElement.addEventListener('wheel', collapseHero, { passive: true });
  renderer.domElement.addEventListener('touchstart', collapseHero, { passive: true });
  if (btnZoomIn) btnZoomIn.addEventListener('click', collapseHero);
  if (btnZoomOut) btnZoomOut.addEventListener('click', collapseHero);

  window.addEventListener('keydown', (e) => {
    // The modals close themselves on Escape; only dismiss the card when no
    // modal is holding the screen.
    if (e.key !== 'Escape') return;
    const modalOpen = document.querySelector('.submit-modal-backdrop.active');
    if (!modalOpen) closeProfileCard();
  });

  // Keep the hero CTA honest about what happens next.
  const heroBtn = document.getElementById('btn-advertise-hero');
  if (heroBtn && !isSignedIn()) {
    heroBtn.title = 'Sign in, then pin your project on the globe';
  }
}
