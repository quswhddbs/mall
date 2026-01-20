"use client";

import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { signOutAsync } from "@/lib/store/authSlice";

export default function BasicMenu() {
  const dispatch = useDispatch();
  const email = useSelector((state: RootState) => state.auth.email);
  const isLogin = !!email;

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
        </ul>
      </div>

      <div className="w-1/5 flex justify-end bg-orange-300 p-4 font-medium">
        {!isLogin ? (
          <div className="text-white text-sm m-1 rounded">Login</div>
        ) : (
          <button
            className="text-white text-sm m-1 rounded"
            type="button"
            onClick={() => dispatch(signOutAsync() as any)}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
