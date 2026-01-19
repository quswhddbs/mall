// lib/api/productApi.ts

import type { PageRequestDTO } from "../dto/pageRequestDTO";
import type { PageResponseDTO } from "../dto/pageResponseDTO";
import type { ProductDTO } from "../dto/productDTO";
import { supabase } from "../supabaseClient";

/**
 * errorResponse.ts 는 API route 전용이므로
 * 여기(fetch client)에서는 로컬 ApiError 사용
 *
 * ✅ 서버가 { msg, code } 형태로 내려주므로
 * detail에 code가 들어가게 만들어두면(401/403 등) 8장 Redux에서 처리 쉬움
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

type ApiErrorDetail = {
  msg?: string;
  code?: string;
};

function makeQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });
  return sp.toString();
}

/**
 * ✅ (7장 실무 필수) 공통 fetch
 * - Supabase session에서 access_token 꺼내서 Authorization 자동 첨부
 * - 401/403 응답을 ApiError(detail 포함)로 던져서 화면/Redux에서 분기 가능
 */
async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  // 1) access token (브라우저에 저장된 supabase session에서 가져옴)
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token ?? null;

  const headers = new Headers(init.headers);

  // JSON이 아닌 FormData 요청도 있어서 Content-Type은 강제하지 않음
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let detail: unknown = null;

    try {
      detail = isJson ? await res.json() : await res.text();
    } catch {
      detail = null;
    }

    // ✅ detail이 {msg, code} 형태면 그대로 유지
    throw new ApiError(res.status, detail);
  }

  if (isJson) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

// POST /api/product
export const postAdd = async (product: FormData) => {
  return apiFetch<any>("/api/product", {
    method: "POST",
    body: product,
  });
};

// GET /api/product/list
export const getList = async (pageParam: PageRequestDTO) => {
  const { page, size } = pageParam;
  return apiFetch<PageResponseDTO<ProductDTO>>(
    `/api/product/list?${makeQuery({ page, size })}`
  );
};

// GET /api/product/[pno]
export const getOne = async (pno: number | string) => {
  return apiFetch<ProductDTO>(`/api/product/${pno}`);
};

// PUT /api/product/[pno]
export const putOne = async (pno: number | string, product: FormData) => {
  return apiFetch<any>(`/api/product/${pno}`, {
    method: "PUT",
    body: product,
  });
};

// DELETE /api/product/[pno]
export const deleteOne = async (pno: number | string) => {
  return apiFetch<any>(`/api/product/${pno}`, {
    method: "DELETE",
  });
};

// 이미지 조회용
export const viewUrl = (path: string) => {
  return `/api/product/view?path=${encodeURIComponent(path)}`;
};

/**
 * ✅ 8장에서 Redux/Thunk 쓸 때 도움되는 유틸(지금은 선택)
 * 화면에서 ApiError 잡았을 때 code를 쉽게 꺼내기
 */
export function getApiErrorCode(e: unknown): string | null {
  if (!(e instanceof ApiError)) return null;
  const d = e.detail as ApiErrorDetail | null;
  return d?.code ?? null;
}
