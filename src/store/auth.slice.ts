import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadAuth, saveAuth, clearAuth } from "./storage";
import { login as loginApi, type LoginPayload, type LoginResponse } from "@/services/auth";
import { setAuthToken } from "@/services/api";
import type { AxiosError } from "axios";

export type User = {
  id: string;
  email: string;
  full_name?: string | null;
  gender?: string | null;
  voice_pref?: string | null;
} | null;

export interface AuthState {
  token: string | null;
  status: "idle" | "loading" | "error";
  user: User;
  error?: string | null;
}

const persisted = loadAuth();

const initialState: AuthState = {
  token: persisted?.token ?? null,
  user: persisted?.user ?? null,
  status: "idle",
  error: null,
};

export const login = createAsyncThunk<
  LoginResponse,
  LoginPayload,
  { rejectValue: string }
>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await loginApi(payload);
      return res;
    } catch (e: unknown) {
      const err = e as AxiosError<{ message?: string }>;
      return rejectWithValue(err.response?.data?.message ?? "Login failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "idle";
      state.error = null;
      clearAuth();
      setAuthToken(null);
    },
    rehydrate(state) {
      const p = loadAuth();
      state.token = p?.token ?? null;
      state.user = p?.user ?? null;
      setAuthToken(state.token);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "idle";
        state.token = action.payload.token;
        state.user = action.payload.user ?? null;
        saveAuth({ token: state.token, user: state.user });
        setAuthToken(state.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Login failed";
      });
  },
});

export const { logout, rehydrate } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthed = (s: { auth: AuthState }) => Boolean(s.auth.token);
export const selectAuth = (s: { auth: AuthState }) => s.auth;
