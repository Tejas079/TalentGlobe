// Supabase Auth (GoTrue) client — email + password, no SDK.
// Session is persisted to localStorage and refreshed on demand.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SESSION_KEY = 'talent_globe_session';

let session = null;
const listeners = new Set();

export function isAuthConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project'));
}

function authHeaders(extra = {}) {
  return { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...extra };
}

function persist(next) {
  session = next;
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('[Auth] Could not persist session:', err);
  }
  listeners.forEach(fn => fn(getUser()));
}

/** Normalises the several error shapes GoTrue can return into one message. */
async function readError(res, fallback) {
  let body = null;
  try {
    body = await res.json();
  } catch (err) {
    return fallback;
  }
  const raw = body.msg || body.error_description || body.message || body.error || fallback;
  const code = body.error_code || body.code;

  if (code === 'invalid_credentials' || /invalid login credentials/i.test(raw)) {
    return 'Wrong email or password.';
  }
  if (code === 'user_already_exists' || /already registered/i.test(raw)) {
    return 'That email already has an account. Sign in instead.';
  }
  if (code === 'weak_password' || /password should be/i.test(raw)) {
    return 'Password must be at least 6 characters.';
  }
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(raw)) {
    return 'Confirm your email first — check your inbox for the link.';
  }
  if (code === 'over_email_send_rate_limit' || /rate limit/i.test(raw)) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  return raw;
}

function sessionFromTokenResponse(data) {
  if (!data || !data.access_token) return null;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    // expires_in is seconds; keep an absolute ms deadline so reloads stay correct.
    expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    user: data.user || null
  };
}

/** Restores any stored session. Call once at boot. */
export function initAuth() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) session = JSON.parse(stored);
  } catch (err) {
    session = null;
  }
  listeners.forEach(fn => fn(getUser()));
  return getUser();
}

export function onAuthChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getUser() {
  return session && session.user ? session.user : null;
}

export function getUserId() {
  const user = getUser();
  return user ? user.id : null;
}

export function isSignedIn() {
  return Boolean(getUser());
}

async function refreshSession() {
  if (!session || !session.refresh_token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    if (!res.ok) {
      persist(null);
      return null;
    }
    const next = sessionFromTokenResponse(await res.json());
    persist(next);
    return next;
  } catch (err) {
    console.warn('[Auth] Refresh failed:', err);
    return null;
  }
}

/** Returns a valid access token, refreshing it first if it is about to expire. */
export async function getAccessToken() {
  if (!session) return null;
  if (session.expires_at && Date.now() > session.expires_at - 60_000) {
    const next = await refreshSession();
    return next ? next.access_token : null;
  }
  return session.access_token;
}

/**
 * Creates an account. When the project requires email confirmation, GoTrue
 * returns a user with no tokens — surfaced as needsConfirmation so the UI can
 * tell the truth instead of pretending the person is signed in.
 */
export async function signUp(email, password) {
  if (!isAuthConfigured()) return { ok: false, error: 'Auth is not configured.' };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) return { ok: false, error: await readError(res, 'Could not create your account.') };

    const data = await res.json();
    const next = sessionFromTokenResponse(data);
    if (next) {
      persist(next);
      return { ok: true, needsConfirmation: false, user: next.user };
    }
    return { ok: true, needsConfirmation: true, email };
  } catch (err) {
    return { ok: false, error: 'Network error — could not reach the auth server.' };
  }
}

export async function signIn(email, password) {
  if (!isAuthConfigured()) return { ok: false, error: 'Auth is not configured.' };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) return { ok: false, error: await readError(res, 'Could not sign you in.') };

    const next = sessionFromTokenResponse(await res.json());
    if (!next) return { ok: false, error: 'Auth server returned no session.' };
    persist(next);
    return { ok: true, user: next.user };
  } catch (err) {
    return { ok: false, error: 'Network error — could not reach the auth server.' };
  }
}

/* -------------------------------------------------------------------------- */
/* OAuth (Google, LinkedIn)                                                   */
/* -------------------------------------------------------------------------- */

export const OAUTH_PROVIDERS = {
  google: { id: 'google', label: 'Google' },
  // Supabase's legacy `linkedin` provider is retired; `linkedin_oidc` is current.
  linkedin: { id: 'linkedin_oidc', label: 'LinkedIn' }
};

/** Where the provider should land the visitor again — this page, no hash. */
function redirectTarget() {
  return window.location.origin + window.location.pathname;
}

/**
 * Leaves the app for the provider's consent screen. Supabase bounces back to
 * redirectTarget() with the session in the URL hash, which
 * completeOAuthRedirect() picks up on the next boot.
 */
export function signInWithOAuth(providerKey) {
  const provider = OAUTH_PROVIDERS[providerKey];
  if (!provider) return { ok: false, error: `Unknown provider "${providerKey}".` };
  if (!isAuthConfigured()) return { ok: false, error: 'Auth is not configured.' };

  const url = `${SUPABASE_URL}/auth/v1/authorize`
    + `?provider=${encodeURIComponent(provider.id)}`
    + `&redirect_to=${encodeURIComponent(redirectTarget())}`;

  window.location.href = url;
  return { ok: true, redirecting: true };
}

function readHashParams() {
  const hash = window.location.hash || '';
  if (hash.length < 2) return null;
  const params = new URLSearchParams(hash.slice(1));
  if (!params.has('access_token') && !params.has('error') && !params.has('error_description')) {
    return null;
  }
  return params;
}

function stripHash() {
  const clean = window.location.pathname + window.location.search;
  window.history.replaceState(null, '', clean);
}

/**
 * Consumes an OAuth return. Call once at boot, before rendering account state.
 * Returns { handled, error, user } so the UI can report a provider failure
 * instead of silently dropping the visitor back on a signed-out page.
 */
export async function completeOAuthRedirect() {
  const params = readHashParams();
  if (!params) return { handled: false };

  const error = params.get('error_description') || params.get('error');
  if (error) {
    stripHash();
    return { handled: true, error: decodeURIComponent(error.replace(/\+/g, ' ')) };
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresIn = Number(params.get('expires_in')) || 3600;
  stripHash();

  if (!accessToken) return { handled: true, error: 'The provider returned no access token.' };

  // The hash carries tokens but not the profile, so fetch the user.
  let user = null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: authHeaders({ Authorization: `Bearer ${accessToken}` })
    });
    if (res.ok) user = await res.json();
    else return { handled: true, error: await readError(res, 'Could not read your profile.') };
  } catch (err) {
    return { handled: true, error: 'Network error while completing sign-in.' };
  }

  persist({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Date.now() + expiresIn * 1000,
    user
  });

  return { handled: true, user };
}

export async function signOut() {
  const token = session ? session.access_token : null;
  persist(null);
  if (!token || !isAuthConfigured()) return { ok: true };
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: authHeaders({ Authorization: `Bearer ${token}` })
    });
  } catch (err) {
    // Local session is already cleared, so the user is signed out regardless.
  }
  return { ok: true };
}

export async function resendConfirmation(email) {
  if (!isAuthConfigured()) return { ok: false, error: 'Auth is not configured.' };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ type: 'signup', email })
    });
    if (!res.ok) return { ok: false, error: await readError(res, 'Could not resend the email.') };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'Network error — could not reach the auth server.' };
  }
}
