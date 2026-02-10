"use client";

import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { signOutAsync } from "@/lib/store/authSlice";
import { useQueryClient } from "@tanstack/react-query";

export default function BasicMenu() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const { email, roles } = useSelector((state: RootState) => state.auth);
  const isLogin = !!email;

  // ✅ SUPER_ADMIN만 Admin 메뉴 노출
  const isSuperAdmin = roles.includes("SUPER_ADMIN");

  const handleLogout = async () => {
    // 1) Supabase 세션 종료 + Redux(auth/cart) 초기화
    await dispatch(signOutAsync() as any);

    // 2) ✅ React Query 캐시 초기화 (최소: cart만)
    queryClient.removeQueries({ queryKey: ["cart"] });
  };

  return (
    <nav id="navbar" className="flex bg-blue-300">
      <div className="w-4/5 bg-gray-500">
        <ul className="flex p-4 text-white font-bold">
          <li className="pr-6 text-2xl">
            <Link href="/">Main</Link>
          </li>
          <li className="pr-6 text-2xl">
            <Link href="/about">About</Link>
          </li>

          {isLogin && (
            <>
              <li className="pr-6 text-2xl">
                <Link href="/todo/list">Todo</Link>
              </li>
              <li className="pr-6 text-2xl">
                <Link href="/product/list">Product</Link>
              </li>
            </>
          )}

          {isSuperAdmin && (
            <li className="pr-6 text-2xl text-yellow-300">
              <Link href="/admin/users">Admin</Link>
            </li>
          )}
        </ul>
      </div>

      <div className="w-1/5 flex justify-end bg-orange-300 p-4 font-medium">
        {!isLogin ? (
          <Link className="text-white text-sm m-1 rounded" href="/member/login">
            Login
          </Link>
        ) : (
          <button
            className="text-white text-sm m-1 rounded"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
