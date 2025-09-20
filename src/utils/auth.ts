export const AUTH_TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function isAuthed(): boolean {
  return !!getToken();
}

/** Call this after a successful login */
export function saveToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/** Optional logout helper */
export function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
