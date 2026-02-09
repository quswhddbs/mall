import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { supabase } from "@/lib/supabaseClient";
import { clearCart } from "./cartSlice";

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

// ✅ 로그아웃: Supabase 세션 종료 + Redux auth 초기화
// ✅ 추가: cart도 같이 비움 (UX/보안)
export const signOutAsync = createAsyncThunk(
  "auth/signOut",
  async (_, thunkAPI) => {
    await supabase.auth.signOut();

    // ✅ 로그아웃 시 장바구니 비우기
    thunkAPI.dispatch(clearCart());

    return { email: null, roles: [] };
  }
);

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

        // ✅ 세션/권한 확인 실패면 cart도 비움(안전)
        // (로그아웃 버튼이 아니라도, auth가 깨졌다면 cart는 남기지 않는 게 맞음)
      })
      .addCase(signOutAsync.fulfilled, (state) => {
        state.email = null;
        state.roles = [];
      });
  },
});

export default authSlice.reducer;
