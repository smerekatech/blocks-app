import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL, apiFetch } from './client';
import { useSessionStore } from '~/state/session';

const REDIRECT = 'blocks-mobile://auth/callback';

/**
 * Open the system browser to start Google OAuth, capture the deep-link callback,
 * and persist the returned session cookie. Resolves true on success, false if
 * the user cancelled or no session value was returned.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const startUrl = `${API_BASE_URL.replace(/\/$/, '')}/auth/mobile-start`;

  const result = await WebBrowser.openAuthSessionAsync(startUrl, REDIRECT);
  if (result.type !== 'success' || !result.url) return false;

  const parsed = Linking.parse(result.url);
  const session = parsed.queryParams?.session;
  if (typeof session !== 'string' || session.length === 0) return false;

  await useSessionStore.getState().set(session);
  return true;
}

export async function signOut(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore — clearing local session is what matters.
  }
  await useSessionStore.getState().clear();
}
