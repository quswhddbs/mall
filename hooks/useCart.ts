// hooks/useCart.ts
"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCartItems, postChangeCart } from "@/lib/api/cartApi";
import type { CartItem, ChangeCartParam } from "@/lib/api/cartApi";
import { useAppSelector } from "@/lib/store/hooks";

type AuthLike = {
  email?: string;
  isLogin?: boolean;
  isAuthenticated?: boolean;
  user?: { email?: string };
};

export default function useCart() {
  const qc = useQueryClient();

  // ✅ 로그인 여부 판단(프로젝트마다 auth shape가 달라서 방어)
  const auth = useAppSelector((s) => (s as any).auth) as AuthLike;
  const email = auth?.email ?? auth?.user?.email;
  const isLogin = auth?.isLogin ?? auth?.isAuthenticated ?? Boolean(email);

  // ✅ 서버 상태(장바구니 목록) = React Query
  const cartQuery = useQuery<CartItem[]>({
    queryKey: ["cart"],
    queryFn: getCartItems,
    enabled: Boolean(isLogin),
    staleTime: 1000 * 60 * 10, // 10분
  });

  // ✅ 장바구니 변경 = mutation
  const changeMutation = useMutation({
    mutationFn: (param: ChangeCartParam) => postChangeCart(param),
    onSuccess: (nextList) => {
      // 서버가 최신 리스트를 내려주면 캐시를 즉시 교체
      qc.setQueryData(["cart"], nextList);
      // 안전하게 invalidate도 같이
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const cartItems = useMemo(() => cartQuery.data ?? [], [cartQuery.data]);

  // CartSidebar에서 기존처럼 호출 가능하게 유지
  const refreshCart = useCallback(() => {
    if (!isLogin) return;
    qc.invalidateQueries({ queryKey: ["cart"] });
  }, [isLogin, qc]);

  const changeCart = useCallback(
    (param: ChangeCartParam) => {
      // 교재 흐름처럼 email을 유지하고 싶으면 여기서 보정
      const merged: ChangeCartParam = { email, ...param };
      changeMutation.mutate(merged);
    },
    [changeMutation, email]
  );

  return {
    cartItems,
    refreshCart,
    changeCart,

    // (선택) 필요 시 UI에서 사용
    isFetching: cartQuery.isFetching,
    isChanging: changeMutation.isPending,
  };
}
