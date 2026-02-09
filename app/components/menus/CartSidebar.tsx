// app/components/menus/CartSidebar.tsx
"use client";

import { useEffect, useMemo } from "react";
import CartItem from "../cart/CartItem";
import useCart from "@/hooks/useCart";
import type { ChangeCartParam, CartItem as CartItemType } from "@/lib/api/cartApi";
import { useAppSelector } from "@/lib/store/hooks";

type AuthLike = {
  email?: string;
  nickname?: string;
  isLogin?: boolean;
  isAuthenticated?: boolean;
  user?: {
    email?: string;
    nickname?: string;
  };
};

export default function CartSidebar() {
  const { refreshCart, cartItems, changeCart } = useCart();

  const auth = useAppSelector((state) => state.auth) as unknown as AuthLike;

  const email = auth?.email ?? auth?.user?.email;
  const nickname = auth?.nickname ?? auth?.user?.nickname;

  const isLogin = auth?.isLogin ?? auth?.isAuthenticated ?? Boolean(email);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cartItems]);

  useEffect(() => {
    if (isLogin) refreshCart();
  }, [isLogin, refreshCart]);

  const handleChangeCart = (param: ChangeCartParam) => {
    changeCart(param);
  };

  if (!isLogin) return null;

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <div className="w-full flex">
          <div className="font-extrabold text-2xl w-4/5">
            {nickname ? `${nickname}'s Cart` : "My Cart"}
          </div>
          <div className="bg-orange-600 text-center text-white font-bold w-1/5 rounded-full m-1">
            {cartItems.length}
          </div>
        </div>

        <ul>
          {cartItems.map((item: CartItemType) => (
            <CartItem
              key={item.cino}
              {...item}
              email={email}
              onChangeCart={handleChangeCart}
              imageBaseUrl="/api/product/view?path="
            />
          ))}
        </ul>

        <div className="text-2xl text-right font-extrabold">TOTAL: {total}</div>
      </div>
    </div>
  );
}
