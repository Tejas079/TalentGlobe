import { gsap } from 'gsap';
import { PROFILES_DATA } from '../data/profiles.js';
import { showToast } from './toast.js';
import { flyCameraToCoordinates } from '../three/camera-flight.js';

let currentFilterCategory = 'All';
let currentSearchQuery = '';
let selectedCountry = '';
let selectedCity = '';
let selectedAvailability = '';
let selectedExperience = '';
let selectedSkill = '';

let onCountryFilterChanged = null;
let initialised = false;

const countTween = { val: 0 };

const el = (id) => document.getElementById(id);

export function setCountryFilterChangeHandler(fn) {
  onCountryFilterChanged = fn;
}

/**
 * Rebuilds a <select> from a value list while keeping the current selection if
 * it still exists. Called again whenever community projects arrive, so their
 * countries, cities and stacks become filterable too.
 */
function syncOptions(select, values, placeholderLabel) {
  if (!select) return;
  const previous = select.value;
  select.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = placeholderLabel;
  select.appendChild(placeholder);

  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });

  select.value = values.includes(previous) ? previous : '';
}

function collectSkills() {
  const all = new Set();
  PROFILES_DATA.forEach(p => {
    (p.skills || []).forEach(s => all.add(s));
    if (p.project && p.project.techStack) p.project.techStack.forEach(t => all.add(t));
  });
  return [...all].sort();
}

function populateSelects() {
  syncOptions(
    el('filter-country'),
    [...new Set(PROFILES_DATA.map(p => p.country).filter(Boolean))].sort(),
    'All Countries'
  );
  syncOptions(
    el('filter-city'),
    [...new Set(PROFILES_DATA.map(p => p.city).filter(Boolean))].sort(),
    'All Cities'
  );
  syncOptions(el('filter-skills'), collectSkills(), 'All Technologies');

  // A previously chosen value may have vanished with the project it came from.
  const countryEl = el('filter-country');
  const cityEl = el('filter-city');
  const skillsEl = el('filter-skills');
  if (countryEl) selectedCountry = countryEl.value;
  if (cityEl) selectedCity = cityEl.value;
  if (skillsEl) selectedSkill = skillsEl.value;
}

function matchesQuery(p, q) {
  const project = p.project || {};
  const haystacks = [
    p.name, p.title, p.city, p.country,
    project.title, project.tagline,
    ...(p.skills || []),
    ...(project.techStack || [])
  ];
  return haystacks.some(v => typeof v === 'string' && v.toLowerCase().includes(q));
}

function applyFilters({ fly = true } = {}) {
  let matchCount = 0;
  let firstMatch = null;

  PROFILES_DATA.forEach(p => {
    let isMatch = true;

    if (currentFilterCategory !== 'All') {
      const matchesCat = p.projectCategory === currentFilterCategory
        || p.category === currentFilterCategory;
      if (!matchesCat) isMatch = false;
    }
    if (selectedCountry && p.country !== selectedCountry) isMatch = false;
    if (selectedCity && p.city !== selectedCity) isMatch = false;
    if (selectedAvailability && p.availability !== selectedAvailability) isMatch = false;
    if (selectedSkill) {
      const hasSkill = (p.skills || []).includes(selectedSkill)
        || (p.project && p.project.techStack && p.project.techStack.includes(selectedSkill));
      if (!hasSkill) isMatch = false;
    }
    if (selectedExperience) {
      const yrs = parseInt(p.experience, 10);
      if (selectedExperience === 'junior' && yrs >= 5) isMatch = false;
      if (selectedExperience === 'senior' && (yrs < 5 || yrs > 8)) isMatch = false;
      if (selectedExperience === 'principal' && yrs < 8) isMatch = false;
    }
    if (currentSearchQuery && !matchesQuery(p, currentSearchQuery.toLowerCase())) {
      isMatch = false;
    }

    p._isMatch = isMatch;
    if (isMatch) {
      matchCount++;
      if (!firstMatch) firstMatch = p;
    }
  });

  const countLabel = el('filter-count-label');
  gsap.to(countTween, {
    val: matchCount,
    duration: 0.4,
    ease: 'power2.out',
    onUpdate: () => {
      if (countLabel) {
        countLabel.textContent =
          `Showing ${Math.round(countTween.val)} of ${PROFILES_DATA.length} projects & makers`;
      }
    }
  });

  if (fly && (currentSearchQuery.length >= 3 || selectedCity) && firstMatch) {
    flyCameraToCoordinates(firstMatch.lat, firstMatch.lon, 195);
  }
}

/** Re-reads PROFILES_DATA after projects are added, edited or removed. */
export function refreshFilters() {
  if (!initialised) return;
  populateSelects();
  applyFilters({ fly: false });
}

export function initSearchFilters() {
  const searchInput = el('search-input');
  const searchClearBtn = el('search-clear-btn');
  const categoryPills = document.querySelectorAll('.category-pill');
  const filtersToggleBtn = el('filters-toggle-btn');
  const filtersDrawer = el('secondary-filters-drawer');
  const filtersToggleIcon = el('filters-toggle-icon');

  countTween.val = PROFILES_DATA.length;
  populateSelects();

  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilterCategory = pill.dataset.cat;
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim();
      if (searchClearBtn) {
        searchClearBtn.classList.toggle('visible', currentSearchQuery.length > 0);
      }
      applyFilters();
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentSearchQuery = '';
      searchClearBtn.classList.remove('visible');
      applyFilters();
    });
  }

  const countryEl = el('filter-country');
  if (countryEl) {
    countryEl.addEventListener('change', (e) => {
      selectedCountry = e.target.value;
      applyFilters();
      if (onCountryFilterChanged) onCountryFilterChanged(selectedCountry);
    });
  }

  const cityEl = el('filter-city');
  if (cityEl) cityEl.addEventListener('change', (e) => { selectedCity = e.target.value; applyFilters(); });

  const availabilityEl = el('filter-availability');
  if (availabilityEl) availabilityEl.addEventListener('change', (e) => { selectedAvailability = e.target.value; applyFilters(); });

  const experienceEl = el('filter-experience');
  if (experienceEl) experienceEl.addEventListener('change', (e) => { selectedExperience = e.target.value; applyFilters(); });

  const skillsEl = el('filter-skills');
  if (skillsEl) skillsEl.addEventListener('change', (e) => { selectedSkill = e.target.value; applyFilters(); });

  const resetFiltersBtn = el('reset-filters-btn');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentSearchQuery = '';
      if (searchClearBtn) searchClearBtn.classList.remove('visible');
      currentFilterCategory = 'All';
      categoryPills.forEach(p => p.classList.toggle('active', p.dataset.cat === 'All'));

      [countryEl, cityEl, availabilityEl, experienceEl, skillsEl].forEach(sel => {
        if (sel) sel.value = '';
      });
      selectedCountry = '';
      selectedCity = '';
      selectedAvailability = '';
      selectedExperience = '';
      selectedSkill = '';

      if (onCountryFilterChanged) onCountryFilterChanged('');
      applyFilters({ fly: false });
      showToast('Filters reset.', 2200);
    });
  }

  if (filtersToggleBtn && filtersDrawer) {
    filtersToggleBtn.addEventListener('click', () => {
      const isOpen = filtersDrawer.classList.toggle('open');
      if (filtersToggleIcon) filtersToggleIcon.textContent = isOpen ? '▲' : '▼';
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key !== '/') return;
    const active = document.activeElement;
    const typing = active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA');
    if (typing) return;
    // Do not steal the key while a modal form has the screen.
    if (document.querySelector('.submit-modal-backdrop.active')) return;
    e.preventDefault();
    if (searchInput) searchInput.focus();
  });

  initialised = true;
  applyFilters({ fly: false });
}
