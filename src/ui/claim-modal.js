import { geocodeLocation } from '../api/geocoding.js';
import { saveProject } from '../api/supabase.js';
import { registerTier5Profile } from '../three/markers.js';
import { showToast } from './toast.js';

let modalBackdrop = null;
let formEl = null;
let _openProfileCard = null;
let _flyCameraToCoordinates = null;
let _onProjectsChanged = null;

// Dynamic SVG QR code generator (Clean deterministic matrix representation)
function renderQrCodeSvg(targetEl) {
  if (!targetEl) return;
  targetEl.innerHTML = `
    <svg viewBox="0 0 110 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px;">
      <rect width="110" height="110" fill="#FFFFFF"/>
      <!-- Position Detection Squares -->
      <!-- Top-Left -->
      <rect x="10" y="10" width="26" height="26" fill="#0A0A0C" rx="3"/>
      <rect x="14" y="14" width="18" height="18" fill="#FFFFFF" rx="2"/>
      <rect x="18" y="18" width="10" height="10" fill="#F59E0B" rx="1"/>
      
      <!-- Top-Right -->
      <rect x="74" y="10" width="26" height="26" fill="#0A0A0C" rx="3"/>
      <rect x="78" y="14" width="18" height="18" fill="#FFFFFF" rx="2"/>
      <rect x="82" y="18" width="10" height="10" fill="#F59E0B" rx="1"/>
      
      <!-- Bottom-Left -->
      <rect x="10" y="74" width="26" height="26" fill="#0A0A0C" rx="3"/>
      <rect x="14" y="78" width="18" height="18" fill="#FFFFFF" rx="2"/>
      <rect x="18" y="82" width="10" height="10" fill="#F59E0B" rx="1"/>
      
      <!-- Data Pattern Matrix -->
      <path fill="#0A0A0C" d="
        M42,12 h4 v4 h-4 z M50,12 h6 v4 h-6 z M62,12 h4 v4 h-4 z
        M42,20 h8 v4 h-8 z M58,20 h4 v8 h-4 z M66,20 h4 v4 h-4 z
        M46,28 h4 v4 h-4 z M54,28 h4 v4 h-4 z
        M12,42 h4 v4 h-4 z M20,42 h8 v4 h-8 z M36,42 h12 v4 h-12 z M56,42 h8 v4 h-8 z M72,42 h4 v4 h-4 z M82,42 h6 v4 h-6 z M94,42 h4 v4 h-4 z
        M12,50 h8 v4 h-8 z M28,50 h4 v4 h-4 z M40,50 h6 v4 h-6 z M52,50 h4 v8 h-4 z M64,50 h8 v4 h-8 z M80,50 h4 v4 h-4 z M90,50 h8 v4 h-8 z
        M16,58 h4 v4 h-4 z M24,58 h6 v8 h-6 z M38,58 h6 v4 h-6 z M60,58 h4 v4 h-4 z M76,58 h6 v4 h-6 z M92,58 h6 v4 h-6 z
        M12,66 h4 v4 h-4 z M36,66 h4 v4 h-4 z M48,66 h8 v4 h-8 z M64,66 h4 v4 h-4 z M72,66 h8 v4 h-8 z M88,66 h4 v4 h-4 z
        M42,74 h4 v4 h-4 z M50,74 h8 v4 h-8 z M66,74 h4 v4 h-4 z M74,74 h6 v4 h-6 z M88,74 h8 v4 h-8 z
        M46,82 h6 v4 h-6 z M58,82 h4 v4 h-4 z M70,82 h8 v4 h-8 z M84,82 h4 v8 h-4 z M94,82 h4 v4 h-4 z
        M42,90 h8 v4 h-8 z M56,90 h4 v8 h-4 z M68,90 h4 v4 h-4 z M76,90 h6 v4 h-6 z M90,90 h4 v4 h-4 z
        M46,98 h4 v4 h-4 z M52,98 h8 v4 h-8 z M66,98 h8 v4 h-8 z M82,98 h4 v4 h-4 z M92,98 h6 v4 h-6 z
      "/>

      <!-- Center Gold Crown Emblem -->
      <circle cx="55" cy="55" r="9" fill="#F59E0B"/>
      <path d="M51,57 L53,52 L55,55 L57,52 L59,57 Z" fill="#0A0A0C"/>
    </svg>
  `;
}

export function openClaimModal() {
  if (!modalBackdrop) modalBackdrop = document.getElementById('claim-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.classList.add('active');
    const qrTarget = document.getElementById('upi-qr-code');
    if (qrTarget && !qrTarget.hasChildNodes()) {
      renderQrCodeSvg(qrTarget);
    }
  }
}

export function closeClaimModal() {
  if (!modalBackdrop) modalBackdrop = document.getElementById('claim-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('active');
  }
}

export function initClaimModal({ openProfileCard, flyCameraToCoordinates, onProjectsChanged } = {}) {
  _openProfileCard = openProfileCard;
  _flyCameraToCoordinates = flyCameraToCoordinates;
  _onProjectsChanged = onProjectsChanged;

  modalBackdrop = document.getElementById('claim-modal-backdrop');
  formEl = document.getElementById('claim-spotlight-form');

  // Trigger buttons
  const btnClaimDock = document.getElementById('btn-claim-spotlight');
  const btnClaimPill = document.getElementById('btn-claim-pill');
  if (btnClaimDock) btnClaimDock.addEventListener('click', openClaimModal);
  if (btnClaimPill) btnClaimPill.addEventListener('click', openClaimModal);

  // Close buttons
  const btnClose = document.getElementById('btn-close-claim');
  const btnCancel = document.getElementById('btn-cancel-claim');
  if (btnClose) btnClose.addEventListener('click', closeClaimModal);
  if (btnCancel) btnCancel.addEventListener('click', closeClaimModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeClaimModal();
    });
  }

  // Payment method switcher tabs
  const tabUpi = document.getElementById('tab-pay-upi');
  const tabCard = document.getElementById('tab-pay-card');
  const paneUpi = document.getElementById('pane-pay-upi');
  const paneCard = document.getElementById('pane-pay-card');

  if (tabUpi && tabCard && paneUpi && paneCard) {
    tabUpi.addEventListener('click', () => {
      tabUpi.classList.add('active');
      tabCard.classList.remove('active');
      paneUpi.classList.add('active');
      paneCard.classList.remove('active');
    });

    tabCard.addEventListener('click', () => {
      tabCard.classList.add('active');
      tabUpi.classList.remove('active');
      paneCard.classList.add('active');
      paneUpi.classList.remove('active');
    });
  }

  // Copy UPI ID button
  const btnCopyUpi = document.getElementById('btn-copy-upi');
  if (btnCopyUpi) {
    btnCopyUpi.addEventListener('click', async () => {
      const upiId = 'talentglobe@upi';
      try {
        await navigator.clipboard.writeText(upiId);
        btnCopyUpi.textContent = 'Copied!';
        btnCopyUpi.style.background = '#F59E0B';
        btnCopyUpi.style.color = '#0A0A0C';
        showToast('✓ UPI ID "talentglobe@upi" copied to clipboard!', 3000);
        setTimeout(() => {
          btnCopyUpi.textContent = 'Copy';
          btnCopyUpi.style.background = '';
          btnCopyUpi.style.color = '';
        }, 2200);
      } catch (err) {
        showToast('UPI ID: talentglobe@upi', 4000);
      }
    });
  }

  // Card input formatting
  const cardInput = document.getElementById('claim-card-num');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.match(/.{1,4}/g)?.join(' ') || val;
      e.target.value = val;

      const badge = document.getElementById('card-brand-badge');
      if (badge) {
        if (val.startsWith('4')) badge.textContent = '💳 Visa';
        else if (val.startsWith('5')) badge.textContent = '💳 Mastercard';
        else if (val.startsWith('3')) badge.textContent = '💳 Amex';
        else badge.textContent = '💳';
      }
    });
  }

  const cardExpInput = document.getElementById('claim-card-exp');
  if (cardExpInput) {
    cardExpInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
      e.target.value = val;
    });
  }

  // Form submission: process claim, save to Supabase, register as Tier 5 #1 spotlight!
  if (formEl) {
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = (document.getElementById('claim-title')?.value || '').trim();
      const category = document.getElementById('claim-category')?.value || 'DevTools';
      const tagline = (document.getElementById('claim-tagline')?.value || '').trim();
      const metric = (document.getElementById('claim-metric')?.value || '').trim() || '★ Spotlight #1';
      const makerName = (document.getElementById('claim-maker-name')?.value || '').trim();
      const email = (document.getElementById('claim-email')?.value || '').trim();
      const city = (document.getElementById('claim-city')?.value || '').trim();
      const country = (document.getElementById('claim-country')?.value || '').trim();
      const demoUrl = (document.getElementById('claim-demo')?.value || '').trim();

      if (!title || !makerName || !city || !country) {
        showToast('Please complete all required fields.', 3000);
        return;
      }

      const submitBtn = document.getElementById('btn-confirm-claim');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying & Pinning to Globe...';
      }

      try {
        // 1. Geocode coordinates
        const coords = await geocodeLocation(city, country);

        // Derive initials
        const parts = makerName.split(/\s+/).filter(Boolean);
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : (parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'TG');

        // 2. Construct Tier 5 VIP Profile
        const profile = {
          name: makerName,
          initials,
          title: `Founder & Creator of ${title}`,
          category,
          projectCategory: category,
          isRemote: false,
          city,
          country,
          region: country,
          lat: coords.lat,
          lon: coords.lon,
          tier: 5,
          tierName: '₹9,999 Front of Globe',
          spotlightRank: 1,
          skills: [category, 'Full-Stack', 'Cloud'],
          experience: 'Founder',
          availability: 'AVAILABLE FOR OPPORTUNITIES',
          impressions: '52.4k impressions',
          pitch: tagline,
          contactEmail: email,
          project: {
            title,
            tagline,
            techStack: [category, 'Production'],
            metric,
            badge: '👑 Gold Spotlight #1',
            demoUrl: demoUrl || '#'
          }
        };

        // 3. Save to Supabase (and local storage fallback)
        const result = await saveProject(profile);
        const saved = result.profile || profile;

        // 4. Register as Tier 5 on Globe & Spotlight carousel
        registerTier5Profile(saved);

        // 5. Clean up modal
        formEl.reset();
        closeClaimModal();
        if (_onProjectsChanged) _onProjectsChanged();

        // 6. Celebration Toast
        showToast(`👑 Congratulations! "${title}" is now live as the #1 Gold Spotlight on Talent Globe!`, 6000);

        // 7. Fly camera to coordinates
        if (_flyCameraToCoordinates) {
          _flyCameraToCoordinates(saved.lat, saved.lon, 190);
        }

        // 8. Open showcase card
        setTimeout(() => {
          if (_openProfileCard) _openProfileCard(saved);
        }, 1500);

      } catch (err) {
        console.error('[Claim Modal] Error claiming spotlight:', err);
        showToast('Error activating spotlight. Please try again.', 4000);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '⚡ Pay & Claim #1 Spot Now';
        }
      }
    });
  }
}
