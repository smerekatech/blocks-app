import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const KEY = 'nuxt-session';

export type SessionStatus = 'loading' | 'signedIn' | 'signedOut';

interface SessionState {
  status: SessionStatus;
  cookie: string | null;
  hydrate: () => Promise<void>;
  set: (cookie: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  cookie: null,
  async hydrate() {
    const value = await SecureStore.getItemAsync(KEY);
    set({ cookie: value, status: value ? 'signedIn' : 'signedOut' });
  },
  async set(cookie) {
    await SecureStore.setItemAsync(KEY, cookie);
    set({ cookie, status: 'signedIn' });
  },
  async clear() {
    await SecureStore.deleteItemAsync(KEY);
    set({ cookie: null, status: 'signedOut' });
  },
}));

export function getSessionCookie(): string | null {
  return useSessionStore.getState().cookie;
}
