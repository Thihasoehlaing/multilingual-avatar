import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  withCredentials: false,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Attach token at boot if it exists (read from localStorage directly to avoid circular import)
try {
  const raw = localStorage.getItem("auth_state");
  if (raw) {
    const { token } = JSON.parse(raw) as { token?: string };
    if (token) setAuthToken(token);
  }
} catch {
  // noop
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Optionally broadcast a logout event (store will handle)
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(err);
  }
);
