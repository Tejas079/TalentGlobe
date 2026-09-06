// Project persistence: Supabase PostgREST when the visitor is signed in,
// with a localStorage mirror so nothing a person submits is ever lost.
//
// Every write returns { ok, remote, error } — callers are expected to tell the
// user what actually happened rather than assuming success.

import { getAccessToken, getUserId } from './auth.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const LOCAL_STORAGE_KEY = 'talent_globe_community_projects';

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project'));
}

/* -------------------------------------------------------------------------- */
/* Local mirror                                                               */
/* -------------------------------------------------------------------------- */

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[Storage] Could not read local projects:', err);
    return [];
  }
}

function writeLocal(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[Storage] Could not write local projects:', err);
  }
}

/**
 * Writes the local mirror. `dirty` marks a record whose latest state has not
 * reached the server yet — loadCommunityProjects prefers those over the stale
 * remote row, so a failed sync is never silently reverted.
 */
function upsertLocal(profile, { dirty = true } = {}) {
  const list = readLocal();
  const record = { ...profile, _dirty: dirty };
  const idx = list.findIndex(p => p.id === profile.id
    || (profile.remoteId && p.remoteId === profile.remoteId));
  if (idx >= 0) list[idx] = record;
  else list.unshift(record);
  writeLocal(list);
  return record;
}

function removeLocal(profile) {
  writeLocal(readLocal().filter(p => p.id !== profile.id
    && !(profile.remoteId && p.remoteId === profile.remoteId)));
}

/* -------------------------------------------------------------------------- */
/* Row <-> profile mapping                                                    */
/* -------------------------------------------------------------------------- */

function splitStack(value, fallback) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  return fallback;
}

function mapDatabaseRowToProfile(row) {
  const stack = splitStack(row.tech_stack, ['Full-Stack']);
  return {
    id: `remote-${row.id}`,
    remoteId: row.id,
    ownerId: row.user_id || null,
    name: row.name,
    initials: row.name
      ? row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'MK',
    title: row.role || 'Maker & Builder',
    category: 'Developer',
    projectCategory: row.project_category || 'DevTools',
    city: row.city,
    country: row.country,
    region: row.country,
    lat: parseFloat(row.lat),
    lon: parseFloat(row.lon),
    tier: 4,
    tierName: 'Community Spotlight',
    skills: stack,
    experience: row.experience || '3 years',
    availability: row.availability || 'AVAILABLE FOR OPPORTUNITIES',
    impressions: '1.2k impressions',
    pitch: row.project_tagline || '',
    contactEmail: row.contact_email || '',
    project: {
      title: row.project_title,
      tagline: row.project_tagline,
      techStack: stack,
      metric: row.project_metric || 'Active Build',
      badge: row.project_badge || 'Community',
      demoUrl: row.project_demo_url || ''
    }
  };
}

function profileToRow(profile, userId) {
  return {
    user_id: userId,
    name: profile.name,
    role: profile.title,
    city: profile.city,
    country: profile.country,
    lat: profile.lat,
    lon: profile.lon,
    project_title: profile.project.title,
    project_tagline: profile.project.tagline,
    project_category: profile.projectCategory,
    project_demo_url: profile.project.demoUrl,
    project_metric: profile.project.metric,
    project_badge: profile.project.badge,
    tech_stack: profile.skills,
    experience: profile.experience,
    availability: profile.availability,
    contact_email: profile.contactEmail || ''
  };
}

/* -------------------------------------------------------------------------- */
/* Requests                                                                   */
/* -------------------------------------------------------------------------- */

async function restHeaders(extra = {}) {
  const token = await getAccessToken();
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

/** Turns a PostgREST failure into something a person can act on. */
async function describeFailure(res) {
  let body = {};
  try {
    body = await res.json();
  } catch (err) {
    return `Server responded ${res.status}.`;
  }
  const message = body.message || body.error || `Server responded ${res.status}.`;

  if (body.code === '42501' || /row-level security/i.test(message)) {
    return 'The database rejected the write (row-level security). Run supabase/001_auth_and_ownership.sql in the Supabase SQL editor.';
  }
  if (body.code === 'PGRST204' || /column .* does not exist|could not find the/i.test(message)) {
    return 'The projects table is missing the user_id column. Run supabase/001_auth_and_ownership.sql in the Supabase SQL editor.';
  }
  if (res.status === 401 || res.status === 403) {
    return 'Not authorised — try signing out and back in.';
  }
  return message;
}

/**
 * Returns every community project: remote rows first, plus any local-only
 * submission that has not been synced. Remote success no longer hides local
 * work the way the previous early-return did.
 */
export async function loadCommunityProjects() {
  const local = readLocal();

  if (!isSupabaseConfigured()) return local;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.desc`,
      { headers: await restHeaders({ Accept: 'application/json' }) }
    );

    if (!res.ok) {
      console.warn('[Supabase] Fetch failed, showing local projects only.');
      return local;
    }

    const remote = (await res.json()).map(mapDatabaseRowToProfile);
    const remoteIds = new Set(remote.map(p => String(p.remoteId)));
    const dirtyByRemoteId = new Map(
      local.filter(p => p.remoteId && p._dirty).map(p => [String(p.remoteId), p])
    );

    // An edit that never reached the server must not be overwritten by the
    // stale row it was meant to replace.
    const reconciled = remote.map(r => dirtyByRemoteId.get(String(r.remoteId)) || r);
    const neverSynced = local.filter(p => !p.remoteId || !remoteIds.has(String(p.remoteId)));
    return [...reconciled, ...neverSynced];
  } catch (err) {
    console.warn('[Supabase] Network error, showing local projects only:', err);
    return local;
  }
}

export async function saveProject(profile) {
  const userId = getUserId();

  // Mirror locally first so the submission survives a failed network call.
  upsertLocal(profile);

  if (!isSupabaseConfigured()) {
    return { ok: true, remote: false, error: null, profile };
  }
  if (!userId) {
    return { ok: true, remote: false, error: 'Not signed in — saved to this browser only.', profile };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
      method: 'POST',
      headers: await restHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(profileToRow(profile, userId))
    });

    if (!res.ok) {
      const error = await describeFailure(res);
      console.warn('[Supabase] Insert failed:', error);
      return { ok: true, remote: false, error, profile };
    }

    const [row] = await res.json();
    // Re-key the local mirror to the remote id so the next load dedupes cleanly.
    removeLocal(profile);
    const saved = { ...profile, id: `remote-${row.id}`, remoteId: row.id, ownerId: userId };
    upsertLocal(saved, { dirty: false });
    return { ok: true, remote: true, error: null, profile: saved };
  } catch (err) {
    console.warn('[Supabase] Network error during insert:', err);
    return { ok: true, remote: false, error: 'Network error — saved to this browser only.', profile };
  }
}

export async function updateProject(profile) {
  const userId = getUserId();

  upsertLocal(profile);

  if (!isSupabaseConfigured() || !profile.remoteId) {
    return { ok: true, remote: false, error: null, profile };
  }
  if (!userId) {
    return { ok: false, remote: false, error: 'Sign in to edit this project.', profile };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(profile.remoteId)}`,
      {
        method: 'PATCH',
        headers: await restHeaders({ Prefer: 'return=representation' }),
        body: JSON.stringify(profileToRow(profile, userId))
      }
    );

    if (!res.ok) {
      const error = await describeFailure(res);
      console.warn('[Supabase] Update failed:', error);
      return { ok: false, remote: false, error, profile };
    }

    const rows = await res.json();
    if (!rows.length) {
      return { ok: false, remote: false, error: 'That project is not yours to edit.', profile };
    }
    upsertLocal(profile, { dirty: false });
    return { ok: true, remote: true, error: null, profile };
  } catch (err) {
    return { ok: false, remote: false, error: 'Network error — changes are saved on this device and will need re-saving when you are back online.', profile };
  }
}

export async function deleteProject(profile) {
  // A pin that only ever lived here has no server state to coordinate with.
  if (!isSupabaseConfigured() || !profile.remoteId) {
    removeLocal(profile);
    return { ok: true, remote: false, error: null };
  }
  if (!getUserId()) {
    return { ok: false, remote: false, error: 'Sign in to delete this project.' };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(profile.remoteId)}`,
      { method: 'DELETE', headers: await restHeaders() }
    );
    if (!res.ok) {
      // The row is still on the server, so the local mirror must stay too —
      // dropping it here used to make the project reappear on the next load.
      // Lead with the outcome so the message is not just a server string.
      return {
        ok: false,
        remote: false,
        error: `The project was not deleted — ${await describeFailure(res)}`
      };
    }
    removeLocal(profile);
    return { ok: true, remote: true, error: null };
  } catch (err) {
    return {
      ok: false,
      remote: false,
      error: 'Network error — the project was not deleted. Try again once you are back online.'
    };
  }
}
