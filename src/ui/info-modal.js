// Backs the "How It Works" and "Spotlights" nav links, which previously only
// fired a toast that scrolled away before it could be read.

let backdrop = null;
let onPrimaryAction = null;

const CONTENT = {
  'how-it-works': {
    badge: 'HOW IT WORKS',
    heading: 'Three steps to the globe',
    desc: 'From an empty form to a discoverable pin, in about a minute.',
    cta: '🚀 Submit Your Project',
    steps: [
      {
        title: 'Pin your coordinates',
        desc: 'Type your city and country. We geocode it and drop your marker at the real latitude and longitude.'
      },
      {
        title: 'Add your build',
        desc: 'Project name, one-line pitch, tech stack, a live demo or repo link, and a headline metric.'
      },
      {
        title: 'Get discovered',
        desc: 'Your pin is searchable by project, stack, city and country — and you can edit it from My Projects any time.'
      }
    ]
  },
  spotlights: {
    badge: 'SPOTLIGHT TIERS',
    heading: 'Showcase tiers',
    desc: 'Every pin is free. Paid tiers buy placement, not access.',
    cta: '🚀 Submit Your Project',
    steps: [
      { title: 'Free Maker', desc: 'Your pin on the globe, searchable and editable.', price: '₹0' },
      { title: 'Verified', desc: 'Verified badge on your card and priority in search results.', price: '₹99' },
      { title: 'Featured', desc: 'Larger marker with a persistent name label at mid zoom.', price: '₹499' },
      { title: 'Trending', desc: 'Rotation through the Front of Globe spotlight dock.', price: '₹1,999' },
      { title: 'Global Spotlight', desc: 'Ranked beacon stalk visible from full orbit distance.', price: '₹9,999' }
    ]
  }
};

export function openInfoModal(key) {
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
      row.className = 'info-step';

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

export function initInfoModal({ onSubmitProject } = {}) {
  onPrimaryAction = onSubmitProject;
  backdrop = document.getElementById('info-modal-backdrop');

  const closeBtn = document.getElementById('btn-close-info');
  const dismissBtn = document.getElementById('btn-info-dismiss');
  const cta = document.getElementById('btn-info-cta');

  if (closeBtn) closeBtn.addEventListener('click', closeInfoModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeInfoModal);
  if (cta) {
    cta.addEventListener('click', () => {
      closeInfoModal();
      if (onPrimaryAction) onPrimaryAction();
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
