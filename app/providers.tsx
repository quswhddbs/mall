"use client";

import { Provider, useDispatch } from "react-redux";
import { store } from "@/lib/store/store";
import { useEffect } from "react";
import { initAuthAsync } from "@/lib/store/authSlice";
import { supabase } from "@/lib/supabaseClient";

function AuthBootstrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // ✅ 1) 앱 시작 시: 세션 -> Redux 동기화
    dispatch(initAuthAsync() as any);

    // ✅ 2) 세션 변화 시: 즉시 Redux 동기화 (OAuth/다른 탭 로그아웃/토큰 갱신 대응)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      dispatch(initAuthAsync() as any);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthBootstrapper>{children}</AuthBootstrapper>
    </Provider>
  );
}
