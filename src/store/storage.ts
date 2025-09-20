const AUTH_KEY = "auth_state";

export type PersistedAuth = {
  token: string | null;
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
    gender?: string | null;
    voice_pref?: string | null;
  } | null;
};

export function saveAuth(data: PersistedAuth) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(data)); } catch {
    // noop
  }
}

export function loadAuth(): PersistedAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as PersistedAuth) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  try { localStorage.removeItem(AUTH_KEY); } catch {
    // noop
  }
}
