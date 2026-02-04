import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "@/lib/supabaseClient";

export type AuthState = {
  email: string | null;
  roles: string[];
  loading: boolean;
};

const initialState: AuthState = {
  email: null,
  roles: [],
  loading: false,
};

// ✅ 앱 시작 시 세션 + role 동기화
export const initAuthAsync = createAsyncThunk("auth/init", async () => {
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session?.access_token) {
    return { email: null, roles: [] };
  }

  const res = await fetch("/api/member/me", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    return { email: null, roles: [] };
  }

  const json = await res.json();

  return {
    email: json.email ?? null,
    roles: json.roles ?? [],
  };
});

export const signOutAsync = createAsyncThunk("auth/signOut", async () => {
  await supabase.auth.signOut();
  return { email: null, roles: [] };
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initAuthAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(initAuthAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.email = action.payload.email;
        state.roles = action.payload.roles;
      })
      .addCase(initAuthAsync.rejected, (state) => {
        state.loading = false;
        state.email = null;
        state.roles = [];
      })
      .addCase(signOutAsync.fulfilled, (state) => {
        state.email = null;
        state.roles = [];
      });
  },
});

export default authSlice.reducer;
