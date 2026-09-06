import {
  initAuth, onAuthChange, getUser, signIn, signUp, signOut, resendConfirmation,
  signInWithOAuth, completeOAuthRedirect, revalidateSession
} from '../api/auth.js';
import { showToast } from './toast.js';

let backdrop = null;
let form = null;
let emailInput = null;
let passwordInput = null;
let messageEl = null;
let submitBtn = null;
let headingEl = null;
let descEl = null;
let tabSignIn = null;
let tabSignUp = null;

let mode = 'signin';
let pendingAfterAuth = null;
let onSessionChange = null;

const COPY = {
  signin: {
    heading: 'Sign in to Talent Globe',
    desc: 'Sign in to launch a project pin and edit it any time.',
    cta: 'Sign In',
    autocomplete: 'current-password'
  },
  signup: {
    heading: 'Create your maker account',
    desc: 'One account lets you pin projects on the globe and edit them later.',
    cta: 'Create Account',
    autocomplete: 'new-password'
  }
};

function setMessage(text, kind = 'error', extraHtml = '') {
  if (!messageEl) return;
  if (!text) {
    messageEl.hidden = true;
    messageEl.textContent = '';
    return;
  }
  messageEl.hidden = false;
  messageEl.className = `auth-message ${kind}`;
  messageEl.textContent = text;
  if (extraHtml) messageEl.insertAdjacentHTML('beforeend', extraHtml);
}

function setMode(next) {
  mode = next;
  const copy = COPY[mode];
  if (headingEl) headingEl.textContent = copy.heading;
  if (descEl) descEl.textContent = copy.desc;
  if (submitBtn) submitBtn.textContent = copy.cta;
  if (passwordInput) passwordInput.setAttribute('autocomplete', copy.autocomplete);
  if (tabSignIn) {
    tabSignIn.classList.toggle('active', mode === 'signin');
    tabSignIn.setAttribute('aria-selected', String(mode === 'signin'));
  }
  if (tabSignUp) {
    tabSignUp.classList.toggle('active', mode === 'signup');
    tabSignUp.setAttribute('aria-selected', String(mode === 'signup'));
  }
  setMessage('');
}

export function openAuthModal({ startMode = 'signin', reason = '', afterAuth = null } = {}) {
  if (!backdrop) return;
  pendingAfterAuth = afterAuth;
  setMode(startMode);
  if (reason) setMessage(reason, 'info');
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => emailInput && emailInput.focus(), 100);
}

export function closeAuthModal() {
  if (!backdrop) return;
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
  pendingAfterAuth = null;
}

export function isAuthModalOpen() {
  return Boolean(backdrop && backdrop.classList.contains('active'));
}

function initials(email) {
  const handle = String(email || '').split('@')[0] || 'MK';
  const parts = handle.split(/[._-]+/).filter(Boolean);
  const letters = parts.length > 1
    ? parts[0][0] + parts[1][0]
    : handle.slice(0, 2);
  return letters.toUpperCase();
}

function renderAccountState(user) {
  const chip = document.getElementById('account-chip');
  const signInLink = document.querySelector('.nav-link[data-nav="sign-in"]');
  const avatar = document.getElementById('account-avatar');
  const emailLabel = document.getElementById('account-email');
  const menu = document.getElementById('account-menu');

  if (user) {
    if (chip) chip.hidden = false;
    if (signInLink) signInLink.closest('li').hidden = true;
    if (avatar) avatar.textContent = initials(user.email);
    if (emailLabel) emailLabel.textContent = user.email || 'Signed in';
  } else {
    if (chip) chip.hidden = true;
    if (signInLink) signInLink.closest('li').hidden = false;
    if (menu) menu.hidden = true;
  }
  if (onSessionChange) onSessionChange(user);
}

async function handleSubmit(e) {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    setMessage('Enter your email and password.');
    return;
  }

  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="submit-spinner"></span> Working...';
  setMessage('');

  const result = mode === 'signin'
    ? await signIn(email, password)
    : await signUp(email, password);

  submitBtn.disabled = false;
  submitBtn.textContent = originalText;

  if (!result.ok) {
    setMessage(result.error);
    return;
  }

  if (result.needsConfirmation) {
    // Tell the truth: the account exists but there is no session yet.
    setMode('signin');
    emailInput.value = email;
    setMessage(
      `Account created. Confirm ${email} from the link we emailed, then sign in.`,
      'success',
      ' <button type="button" class="auth-inline-btn" id="auth-resend">Resend email</button>'
    );
    const resend = document.getElementById('auth-resend');
    if (resend) {
      resend.addEventListener('click', async () => {
        resend.disabled = true;
        const out = await resendConfirmation(email);
        setMessage(
          out.ok ? `Confirmation email resent to ${email}.` : out.error,
          out.ok ? 'success' : 'error'
        );
      });
    }
    return;
  }

  form.reset();
  closeAuthModal();
  showToast(`Signed in as ${result.user ? result.user.email : email}`, 3000);

  const next = pendingAfterAuth;
  pendingAfterAuth = null;
  if (next) next();
}

export function initAuthModal({ onChange } = {}) {
  onSessionChange = onChange;

  backdrop = document.getElementById('auth-modal-backdrop');
  form = document.getElementById('auth-form');
  emailInput = document.getElementById('auth-email');
  passwordInput = document.getElementById('auth-password');
  messageEl = document.getElementById('auth-message');
  submitBtn = document.getElementById('btn-auth-submit');
  headingEl = document.getElementById('auth-heading');
  descEl = document.getElementById('auth-desc');
  tabSignIn = document.getElementById('auth-tab-signin');
  tabSignUp = document.getElementById('auth-tab-signup');

  if (tabSignIn) tabSignIn.addEventListener('click', () => setMode('signin'));
  if (tabSignUp) tabSignUp.addEventListener('click', () => setMode('signup'));
  if (form) form.addEventListener('submit', handleSubmit);

  // OAuth providers. These navigate away, so the button only needs to show it
  // is working until the browser leaves the page.
  const providerButtons = [
    ['btn-oauth-google', 'google', 'Google']
  ];
  providerButtons.forEach(([id, providerKey, label]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      setMessage('');
      const span = btn.querySelector('span');
      btn.disabled = true;
      if (span) span.textContent = `Redirecting to ${label}...`;

      const result = signInWithOAuth(providerKey);
      if (!result.ok) {
        btn.disabled = false;
        if (span) span.textContent = `Continue with ${label}`;
        setMessage(result.error);
      }
    });
  });

  const closeBtn = document.getElementById('btn-close-auth');
  const cancelBtn = document.getElementById('btn-cancel-auth');
  if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeAuthModal);

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeAuthModal();
    });
  }

  // Account chip menu
  const chipBtn = document.getElementById('account-chip-btn');
  const menu = document.getElementById('account-menu');
  if (chipBtn && menu) {
    chipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      chipBtn.setAttribute('aria-expanded', String(!menu.hidden));
    });
    document.addEventListener('click', () => {
      if (!menu.hidden) {
        menu.hidden = true;
        chipBtn.setAttribute('aria-expanded', 'false');
      }
    });
    menu.addEventListener('click', (e) => e.stopPropagation());
  }

  const signOutBtn = document.getElementById('menu-sign-out');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await signOut();
      if (menu) menu.hidden = true;
      showToast('Signed out.', 2500);
    });
  }

  onAuthChange(renderAccountState);
  renderAccountState(initAuth() || getUser());

  // A provider redirect lands here with the session (or an error) in the hash.
  completeOAuthRedirect()
    .then(result => {
      if (!result.handled) {
        // No redirect to consume — make sure a restored session is still valid
        // before the rest of the UI trusts it.
        return revalidateSession().then(() => undefined);
      }
      if (result.error) {
        openAuthModal({ startMode: 'signin' });
        setMessage(result.error);
        return undefined;
      }
      if (result.user) {
        closeAuthModal();
        showToast(`Signed in as ${result.user.email}`, 3000);
      }
      return undefined;
    })
    .catch(err => {
      // An unhandled rejection here used to leave the visitor on a signed-out
      // page with no explanation and the hash already stripped.
      console.error('[Auth] Could not complete sign-in:', err);
      openAuthModal({ startMode: 'signin' });
      setMessage('Could not complete sign-in. Please try again.');
    });
}
