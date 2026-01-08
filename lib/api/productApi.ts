// lib/api/productApi.ts

import type { PageRequestDTO } from "../dto/pageRequestDTO";
import type { PageResponseDTO } from "../dto/pageResponseDTO";
import type { ProductDTO } from "../dto/productDTO";

/**
 * errorResponse.ts 는 API route 전용이므로
 * 여기(fetch client)에서는 로컬 ApiError 사용
 */
export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(`API Error: ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function makeQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });
  return sp.toString();
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { cache: "no-store", ...init });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = isJson ? await res.json() : await res.text();
    } catch {}
    throw new ApiError(res.status, detail);
  }

  if (isJson) return (await res.json()) as T;

  return (await res.text()) as unknown as T;
}

// POST /api/product
export const postAdd = async (product: FormData) => {
  return fetchJson<any>("/api/product", {
    method: "POST",
    body: product,
  });
};

// GET /api/product/list
export const getList = async (pageParam: PageRequestDTO) => {
  const { page, size } = pageParam;
  return fetchJson<PageResponseDTO<ProductDTO>>(
    `/api/product/list?${makeQuery({ page, size })}`
  );
};

// GET /api/product/[pno]
export const getOne = async (pno: number | string) => {
  return fetchJson<ProductDTO>(`/api/product/${pno}`);
};

// PUT /api/product/[pno]
export const putOne = async (pno: number | string, product: FormData) => {
  return fetchJson<any>(`/api/product/${pno}`, {
    method: "PUT",
    body: product,
  });
};

// DELETE /api/product/[pno]
export const deleteOne = async (pno: number | string) => {
  return fetchJson<any>(`/api/product/${pno}`, {
    method: "DELETE",
  });
};

// 이미지 조회용
export const viewUrl = (path: string) => {
  return `/api/product/view?path=${encodeURIComponent(path)}`;
};
