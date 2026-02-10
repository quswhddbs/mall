"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { authFetchJson } from "@/lib/api/authFetch";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  email: string;
  nickname: string | null;
  social: boolean | null;
  roles: string[];
  isAdmin: boolean;
};

export default function UsersClient() {
  const router = useRouter();

  const email = useSelector((state: RootState) => state.auth.email);
  const roles = useSelector((state: RootState) => state.auth.roles);
  const authLoading = useSelector((state: RootState) => state.auth.loading);

  const isLogin = !!email;
  const isSuperAdmin = roles?.includes("SUPER_ADMIN");

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ 로그인 + SUPER_ADMIN만 진입 허용
  const canRender = useMemo(
    () => isLogin && isSuperAdmin,
    [isLogin, isSuperAdmin]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await authFetchJson<{ users: AdminUser[] }>(
        "/api/admin/users",
        { method: "GET" }
      );
      setUsers(data.users);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "FAILED_TO_LOAD_USERS");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAdmin = async (userId: string, enabled: boolean) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await authFetchJson(`/api/admin/users/${userId}/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      await loadUsers();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "FAILED_TO_TOGGLE_ADMIN");
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ auth 동기화 중이면 판단/리다이렉트 보류 (SUPER_ADMIN이 튕기는 문제 방지)
    if (authLoading) return;

    // ✅ 로그인 안 됨 → 로그인으로
    if (!isLogin) {
      router.replace("/member/login");
      return;
    }

    // ✅ SUPER_ADMIN 아니면 → 메인
    if (!isSuperAdmin) {
      router.replace("/");
      return;
    }

    // ✅ SUPER_ADMIN이면 로드
    loadUsers();
  }, [authLoading, isLogin, isSuperAdmin, loadUsers, router]);

  // ✅ 순간 노출 방지: authLoading 또는 권한 미충족이면 렌더 0
  if (authLoading) return null;
  if (!canRender) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Admin Users</h1>
        <button
          className="px-3 py-2 rounded bg-black text-white text-sm"
          type="button"
          onClick={loadUsers}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-800 text-sm">
          {errorMsg}
        </div>
      )}

      {loading && <div className="text-sm">Loading...</div>}

      <div className="overflow-auto border rounded">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Nickname</th>
              <th className="text-left p-2">Roles</th>
              <th className="text-left p-2">Social</th>
              <th className="text-left p-2">Admin</th>
              <th className="text-left p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.nickname ?? "-"}</td>
                <td className="p-2">{u.roles.join(", ") || "-"}</td>
                <td className="p-2">{String(u.social ?? false)}</td>
                <td className="p-2">
                  {u.isAdmin ? (
                    <span className="px-2 py-1 rounded bg-green-200">ADMIN</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-gray-200">USER</span>
                  )}
                </td>
                <td className="p-2">
                  {u.isAdmin ? (
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white"
                      type="button"
                      disabled={loading}
                      onClick={() => toggleAdmin(u.id, false)}
                    >
                      Remove ADMIN
                    </button>
                  ) : (
                    <button
                      className="px-3 py-1 rounded bg-blue-600 text-white"
                      type="button"
                      disabled={loading}
                      onClick={() => toggleAdmin(u.id, true)}
                    >
                      Grant ADMIN
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {users.length === 0 && !loading && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={6}>
                  No users
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        * 이 화면/API는 SUPER_ADMIN만 접근 가능
      </p>
    </div>
  );
}
