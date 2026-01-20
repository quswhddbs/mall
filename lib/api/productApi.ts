// lib/api/productApi.ts
"use client";

import type { PageRequestDTO } from "@/lib/dto/pageRequestDTO";
import type { PageResponseDTO } from "@/lib/dto/pageResponseDTO";
import type { ProductDTO } from "@/lib/dto/productDTO";
import { authFetch, authFetchJson, AuthFetchError } from "@/lib/api/authFetch";

function makeQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });
  return sp.toString();
}

// POST /api/product
export const postAdd = async (product: FormData) => {
  // ✅ FormData는 authFetch 사용(Content-Type 강제 금지)
  const res = await authFetch("/api/product", {
    method: "POST",
    body: product,
    requireAuth: true,
  });

  return res.json();
};

// GET /api/product/list
export const getList = async (pageParam: PageRequestDTO) => {
  const { page, size } = pageParam;

  return authFetchJson<PageResponseDTO<ProductDTO>>(
    `/api/product/list?${makeQuery({ page, size })}`,
    { method: "GET", requireAuth: true }
  );
};

// GET /api/product/[pno]
export const getOne = async (pno: number | string) => {
  return authFetchJson<ProductDTO>(`/api/product/${pno}`, {
    method: "GET",
    requireAuth: true,
  });
};

// PUT /api/product/[pno]
export const putOne = async (pno: number | string, product: FormData) => {
  const res = await authFetch(`/api/product/${pno}`, {
    method: "PUT",
    body: product,
    requireAuth: true,
  });

  return res.json();
};

// DELETE /api/product/[pno]
export const deleteOne = async (pno: number | string) => {
  return authFetchJson<any>(`/api/product/${pno}`, {
    method: "DELETE",
    requireAuth: true,
  });
};

// 이미지 조회용
export const viewUrl = (path: string) => {
  return `/api/product/view?path=${encodeURIComponent(path)}`;
};

/**
 * ✅ 화면에서 에러 코드 쉽게 꺼내기 (선택)
 * authFetchJson은 AuthFetchError를 던진다.
 */
export function getApiErrorCode(e: unknown): string | null {
  if (!(e instanceof AuthFetchError)) return null;
  return e.code ?? null;
}
