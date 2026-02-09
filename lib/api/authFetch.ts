"use client";

import { supabase } from "@/lib/supabaseClient";
import { store } from "@/lib/store/store";
import { signOutAsync } from "@/lib/store/authSlice";

type AuthFetchOptions = RequestInit & {
  /**
   * true면 세션(토큰) 없을 때 즉시 에러
   * 보호 API 호출에 사용
   */
  requireAuth?: boolean;
};

export class AuthFetchError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "AuthFetchError";
    this.code = code;
    this.status = status;
  }
}

/**
 * ✅ 클라이언트에서 API 호출할 때 쓰는 공통 fetch
 * - Supabase 세션에서 access_token 가져와 Authorization 자동 부착
 * - 401/403이면 Redux 로그아웃(signOutAsync) 처리 (=> cart도 clearCart로 같이 정리됨)
 */
export async function authFetch(input: string, options: AuthFetchOptions = {}) {
  const { requireAuth = true, headers, ...rest } = options;

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token ?? null;

  if (requireAuth && !accessToken) {
    throw new AuthFetchError("NO_SESSION", "로그인이 필요합니다.");
  }

  const mergedHeaders = new Headers(headers);

  // JSON 기본 헤더 (FormData 업로드 제외)
  if (!mergedHeaders.has("Content-Type") && !(rest.body instanceof FormData)) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  if (accessToken) {
    mergedHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(input, {
    ...rest,
    headers: mergedHeaders,
  });

  // ✅ 401/403 공통 처리: 세션/권한 문제면 로그아웃 (auth + cart 동시 정리)
  if (res.status === 401 || res.status === 403) {
    store.dispatch(signOutAsync());
    throw new AuthFetchError("UNAUTHORIZED", "인증/권한 오류입니다.", res.status);
  }

  return res;
}

/**
 * ✅ JSON 응답용 헬퍼
 * 서버가 { msg, code } 규격이면 그걸 읽어서 공통 처리
 */
export async function authFetchJson<T = any>(
  input: string,
  options: AuthFetchOptions = {}
) {
  const res = await authFetch(input, options);

  // 204 No Content
  if (res.status === 204) {
    return null as T;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    if (!res.ok) {
      throw new AuthFetchError("NOT_JSON", text, res.status);
    }
    return text as unknown as T;
  }

  const data = await res.json();

  // ✅ 서버 공통 에러 규격({ msg, code })
  if (data && typeof data === "object" && "code" in data && "msg" in data) {
    const code = String((data as any).code);
    const msg = String((data as any).msg);

    // 토큰/세션 관련이면 로그아웃 처리
    if (code === "NO_AUTH_HEADER" || code === "INVALID_ACCESS_TOKEN") {
      store.dispatch(signOutAsync());
      throw new AuthFetchError(code, msg, res.status);
    }

    // 권한 없음: 여기서는 "로그아웃까지"는 하지 않고 에러만 던짐
    // (원하면 403 처리와 맞춰서 여기서도 로그아웃으로 통일 가능)
    if (code === "ERROR_ACCESSDENIED") {
      throw new AuthFetchError(code, msg, res.status);
    }
  }

  if (!res.ok) {
    throw new AuthFetchError(
      "HTTP_ERROR",
      "요청 처리 중 오류가 발생했습니다.",
      res.status
    );
  }

  return data as T;
}
