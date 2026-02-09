// hooks/useCart.ts
"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { getCartItemsAsync, postChangeCartAsync } from "@/lib/store/cartSlice";
import type { ChangeCartParam } from "@/lib/api/cartApi";

export default function useCart() {
  const dispatch = useAppDispatch();

  // ✅ 이제 state.cart가 RootState에 존재
  const cartItems = useAppSelector((state) => state.cart);

  const refreshCart = useCallback(() => {
    dispatch(getCartItemsAsync());
  }, [dispatch]);

  const changeCart = useCallback(
    (param: ChangeCartParam) => {
      dispatch(postChangeCartAsync(param));
    },
    [dispatch]
  );

  return { cartItems, refreshCart, changeCart };
}
