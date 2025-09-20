// src/services/auth.ts
import { api } from "./api";
import type { AxiosError } from "axios";

export type LoginPayload = { email: string; password: string };
export type UserProfile = {
  id: string;            // normalized from user_id
  email: string;
  full_name?: string | null;
  gender?: string | null;
  voice_pref?: string | null;
};
export type LoginResponse = {
  token: string;
  user: UserProfile | null;
};

function extractError(e: unknown, fallback = "Login failed"): Error {
  const err = e as AxiosError<{ message?: string; detail?: string }>;
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.detail ??
    err?.message ??
    fallback;
  return new Error(msg);
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    // Your backend returns: { ok, message, data: { token, profile: {...} } }
    const { data } = await api.post("/auth/login", payload);
    const root = data?.data ?? data;

    const token =
      root?.token ??
      data?.token ??
      data?.access_token;

    const profile = root?.profile ?? root?.user ?? null;

    const user: UserProfile | null = profile
      ? {
          id: profile.user_id ?? profile.id,
          email: profile.email,
          full_name: profile.full_name ?? null,
          gender: profile.gender ?? null,
          voice_pref: profile.voice_pref ?? null,
        }
      : null;

    return { token, user };
  } catch (e: unknown) {
    throw extractError(e);
  }
}

/** (kept) signup helper for your SignupPage */
export type SignupPayload = { full_name: string; email: string; password: string };
export async function signup(fullName: string, email: string, password: string): Promise<void> {
  try {
    const payload: SignupPayload = { full_name: fullName, email, password };
    await api.post("/auth/signup", payload);
  } catch (e: unknown) {
    throw extractError(e, "Signup failed");
  }
}
