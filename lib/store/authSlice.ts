// lib/store/authSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "@/lib/supabaseClient";

export type AuthState = {
  email: string | null;
  loading: boolean;
};

const initialState: AuthState = {
  email: null,
  loading: false,
};

// ✅ 앱 시작 시: Supabase 세션 -> Redux 동기화 (실전형 핵심)
export const initAuthAsync = createAsyncThunk("auth/initAuth", async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return { email: null as string | null };
  }

  const email = data.session?.user?.email ?? null;
  return { email };
});

// ✅ 로그아웃도 Redux + Supabase 같이 정리 (9장까지 깔끔해짐)
export const signOutAsync = createAsyncThunk("auth/signOut", async () => {
  await supabase.auth.signOut();
  return { email: null as string | null };
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // 테스트나 임시 세팅용 (원하면 나중에 제거 가능)
    setEmail(state, action: PayloadAction<string | null>) {
      state.email = action.payload;
    },
    clearAuth(state) {
      state.email = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuthAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(initAuthAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.email = action.payload.email;
      })
      .addCase(initAuthAsync.rejected, (state) => {
        state.loading = false;
        state.email = null;
      })
      .addCase(signOutAsync.fulfilled, (state) => {
        state.email = null;
      });
  },
});

export const { setEmail, clearAuth } = authSlice.actions;
export default authSlice.reducer;
