// Backs the "How It Works" and "Spotlights" nav links

let backdrop = null;
let onSubmitAction = null;
let onClaimAction = null;
let activeModalKey = null;

const CONTENT = {
  'how-it-works': {
    badge: 'HOW IT WORKS',
    heading: 'Three steps to the globe',
    desc: 'From an empty form to a discoverable pin, in about a minute.',
    cta: '🚀 Submit Your Project',
    actionType: 'submit',
    steps: [
      {
        title: 'Pin your coordinates',
        desc: 'Type your city and country. We geocode it and drop your marker at the real latitude and longitude.',
        action: 'submit'
      },
      {
        title: 'Add your build',
        desc: 'Project name, one-line pitch, tech stack, a live demo or repo link, and a headline metric.',
        action: 'submit'
      },
      {
        title: 'Get discovered',
        desc: 'Your pin is searchable by project, stack, city and country — and you can edit it from My Projects any time.',
        action: 'submit'
      }
    ]
  },
  spotlights: {
    badge: 'CELESTIAL & SPOTLIGHT TIERS',
    heading: 'Showcase tiers',
    desc: 'Every pin on Earth is 100% free. Paid tiers unlock premier placement, spotlight dock rotation, and celestial planet real estate.',
    cta: '👑 Claim Planet / Spotlight Spot',
    actionType: 'claim',
    steps: [
      { 
        title: 'Free Maker', 
        desc: 'Your pin on the 3D globe, searchable by stack, city, and country.', 
        price: '₹0',
        action: 'submit'
      },
      { 
        title: 'Verified', 
        desc: 'Verified gold badge on your profile card and priority in search results.', 
        price: '₹99',
        action: 'claim'
      },
      { 
        title: 'Featured Marker', 
        desc: 'Larger illuminated pulsing marker with a persistent name label on the globe.', 
        price: '₹499',
        action: 'claim'
      },
      { 
        title: 'Trending Spotlight', 
        desc: 'Guaranteed rotation through the Front of Globe spotlight dock carousel.', 
        price: '₹1,999',
        action: 'claim'
      },
      { 
        title: '👑 Celestial VIP Planet & The Sun', 
        desc: 'Own a 1-of-1 Planet (The Sun, Jupiter, Saturn) in the 3D Solar System with orbital camera tracking, laser tether & dedicated showcase.', 
        price: 'from ₹2,499',
        isVip: true,
        action: 'claim',
        planet: 'sun'
      }
    ]
  }
};

export function openInfoModal(key) {
  activeModalKey = key;
  const content = CONTENT[key];
  if (!backdrop || !content) return;

  const badge = document.getElementById('info-badge');
  const heading = document.getElementById('info-heading');
  const desc = document.getElementById('info-desc');
  const body = document.getElementById('info-body');
  const cta = document.getElementById('btn-info-cta');

  if (badge) badge.textContent = content.badge;
  if (heading) heading.textContent = content.heading;
  if (desc) desc.textContent = content.desc;
  if (cta) cta.textContent = content.cta;

  if (body) {
    body.innerHTML = '';
    content.steps.forEach((step, i) => {
      const row = document.createElement('div');
      row.className = 'info-step clickable' + (step.isVip ? ' celestial-vip' : '');

      const index = document.createElement('span');
      index.className = 'info-step-index';
      index.textContent = String(i + 1);

      const inner = document.createElement('div');
      inner.className = 'info-step-body';

      const title = document.createElement('span');
      title.className = 'info-step-title';
      title.textContent = step.title;

      const text = document.createElement('span');
      text.className = 'info-step-desc';
      text.textContent = step.desc;

      inner.append(title, text);
      row.append(index, inner);

      if (step.price) {
        const price = document.createElement('span');
        price.className = 'info-step-price';
        price.textContent = step.price;
        row.appendChild(price);
      }

      row.addEventListener('click', () => {
        closeInfoModal();
        if (step.action === 'claim') {
          if (onClaimAction) onClaimAction(step.planet || null);
        } else {
          if (onSubmitAction) onSubmitAction();
        }
      });

      body.appendChild(row);
    });
  }

  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeInfoModal() {
  if (!backdrop) return;
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

export function initInfoModal({ onSubmitProject, onClaimSpotlight } = {}) {
  onSubmitAction = onSubmitProject;
  onClaimAction = onClaimSpotlight;
  backdrop = document.getElementById('info-modal-backdrop');

  const closeBtn = document.getElementById('btn-close-info');
  const dismissBtn = document.getElementById('btn-info-dismiss');
  const cta = document.getElementById('btn-info-cta');

  if (closeBtn) closeBtn.addEventListener('click', closeInfoModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeInfoModal);
  if (cta) {
    cta.addEventListener('click', () => {
      closeInfoModal();
      const currentContent = CONTENT[activeModalKey];
      if (currentContent?.actionType === 'claim' && onClaimAction) {
        onClaimAction();
      } else if (onSubmitAction) {
        onSubmitAction();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeInfoModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && backdrop.classList.contains('active')) {
      closeInfoModal();
    }
  });
}
