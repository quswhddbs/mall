"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function JoinClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const join = async () => {
    setLoading(true);
    setErrorMsg(null);

    // 1) 서버에 가입 요청(프로필/권한까지 생성)
    const res = await fetch("/api/member/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pw, nickname }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setErrorMsg(data?.message ?? data?.error ?? "JOIN_FAILED");
      return;
    }

    // 2) 가입 성공 후 즉시 로그인 (Supabase 세션 생성)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.replace("/");
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Join</h1>

      <div className="max-w-md bg-white rounded p-4 border">
        <label className="block mb-2 text-sm font-medium">Email</label>
        <input
          className="w-full border p-2 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />

        <label className="block mb-2 text-sm font-medium">Password</label>
        <input
          className="w-full border p-2 rounded mb-4"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="password"
        />

        <label className="block mb-2 text-sm font-medium">Nickname</label>
        <input
          className="w-full border p-2 rounded mb-4"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="nickname (optional)"
        />

        {errorMsg && (
          <p className="text-red-600 text-sm mb-3">❌ {errorMsg}</p>
        )}

        <button
          type="button"
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
          onClick={join}
          disabled={loading}
        >
          {loading ? "Joining..." : "Join"}
        </button>

        <button
          type="button"
          className="w-full mt-2 border p-2 rounded"
          onClick={() => router.push("/member/login")}
          disabled={loading}
        >
          Back to Login
        </button>
      </div>
    </main>
  );
}
