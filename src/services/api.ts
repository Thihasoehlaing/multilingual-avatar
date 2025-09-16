const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const fetchSomething = async () => {
  const res = await fetch(`${API_BASE}/endpoint`);
  return res.json();
};
