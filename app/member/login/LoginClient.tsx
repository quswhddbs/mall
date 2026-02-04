"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginClient() {
  const router = useRouter();

  const [email, setEmail] = useState("user1@aaa.com");
  const [password, setPassword] = useState("1111");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
      <h1 className="text-2xl font-bold mb-4">Login</h1>

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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
        />

        {errorMsg && (
          <p className="text-red-600 text-sm mb-3">❌ {errorMsg}</p>
        )}

        <button
          type="button"
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
          onClick={login}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          className="w-full mt-2 border p-2 rounded"
          onClick={() => router.push("/member/join")}
          disabled={loading}
        >
          Join
        </button>
      </div>
    </main>
  );
}
