// Who is allowed to edit what.
//
// A community project is editable when it belongs to the signed-in account, or
// when it only ever existed in this browser (nothing else can claim it).

import { getUserId } from './auth.js';

export function isCommunityProject(profile) {
  return Boolean(profile && (profile.remoteId || String(profile.id || '').startsWith('comm-')));
}

export function canEditProfile(profile) {
  if (!isCommunityProject(profile)) return false;
  if (!profile.remoteId) return true;          // local-only pin, owned by this browser
  const userId = getUserId();
  return Boolean(userId && profile.ownerId === userId);
}
