// lib/api/cartApi.ts
import { authFetchJson } from "./authFetch";

export type CartItem = {
  cino: number;
  pno: number;
  pname: string;
  price: number;
  qty: number;
  imageFile?: string | null;
};

export type ChangeCartParam = {
  email?: string; // 서버가 email을 안쓰면 생략 가능 (일단 교재 흐름 유지용)
  cino?: number;
  pno: number;
  qty: number;
};

export async function getCartItems(): Promise<CartItem[]> {
  // Next.js API Route: /api/cart/items
  return await authFetchJson<CartItem[]>("/api/cart/items", { method: "GET" });
}

export async function postChangeCart(param: ChangeCartParam): Promise<CartItem[]> {
  // Next.js API Route: /api/cart/change
  return await authFetchJson<CartItem[]>("/api/cart/change", {
    method: "POST",
    body: JSON.stringify(param),
  });
}
