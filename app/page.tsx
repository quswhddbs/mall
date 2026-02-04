"use client";

import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "quswhddbs85@gmail.com",
      password: "12qwaszx!",
    });

    console.log("login data:", data);
    console.log("login error:", error);
  };

  // ✅ [추가] 로그아웃
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    console.log("logout error:", error);
  };

  return (
    <main>
      <button onClick={login}>테스트 로그인</button>
      <button onClick={logout}>로그아웃</button>
    </main>
  );
}
