import { api } from "./api";
import type { AxiosError } from "axios";

/** The raw shape returned by your backend (as seen in login response). */
export type ProfileApiModel = {
  user_id?: string;
  id?: string;
  email?: string;
  full_name?: string | null;
  gender?: string | null;
  voice_pref?: string | null;
};

/** A normalized shape you can use elsewhere in the app if needed. */
export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  gender?: string | null;
  voice_pref?: string | null;
};

function extractError(e: unknown, fallback = "Request failed"): Error {
  const err = e as AxiosError<{ message?: string; detail?: string }>;
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.detail ??
    err?.message ??
    fallback;
  return new Error(msg);
}

export function normalizeProfile(p: ProfileApiModel | null | undefined): UserProfile {
  return {
    id: (p?.user_id ?? p?.id ?? "").toString(),
    email: p?.email ?? "",
    full_name: p?.full_name ?? null,
    gender: p?.gender ?? null,
    voice_pref: p?.voice_pref ?? null,
  };
}

/**
 * Fetch the current user's profile.
 * Default endpoint: GET /profile   (change to /users/me if your API uses that)
 */
export async function getProfile(): Promise<ProfileApiModel> {
  try {
    // Supports both {data:{...}} envelope and flat payloads
    const { data } = await api.get("/users/me");
    return (data?.data ?? data) as ProfileApiModel;
  } catch (e: unknown) {
    throw extractError(e, "Failed to load profile");
  }
}

/**
 * Update the current user's profile.
 * Default endpoint: PATCH /profile   (change to /users/me if your API uses that)
 *
 * Accepts partial fields; send only what changed.
 */
export type UpdateProfilePayload = {
  full_name?: string | null;
  gender?: string | null;
  voice_pref?: string | null;
};

export async function updateProfile(payload: UpdateProfilePayload): Promise<ProfileApiModel> {
  try {
    const { data } = await api.put("/users/me", payload);
    // Return raw profile as your ProfilePage currently expects
    return (data?.data ?? data) as ProfileApiModel;
  } catch (e: unknown) {
    throw extractError(e, "Failed to update profile");
  }
}
