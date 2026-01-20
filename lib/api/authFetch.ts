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
 * - 401/403 또는 서버 에러코드(NO_AUTH_HEADER/INVALID_ACCESS_TOKEN/ERROR_ACCESSDENIED)면
 *   Redux 로그아웃(signOutAsync) 처리
 *
 * 사용 예)
 * const data = await authFetchJson("/api/todo/list?page=1&size=10");
 */
export async function authFetch(input: string, options: AuthFetchOptions = {}) {
  const { requireAuth = true, headers, ...rest } = options;

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token ?? null;

  if (requireAuth && !accessToken) {
    // 로그인 페이지는 9장에서 만들 예정이므로 여기서는 에러만 던짐
    throw new AuthFetchError("NO_SESSION", "로그인이 필요합니다.");
  }

  const mergedHeaders = new Headers(headers);

  // JSON을 보내는 요청이라면 기본 Content-Type 넣어주기(파일 업로드는 FormData라서 제외)
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

  // ✅ 401/403은 공통 로그아웃 처리 (토큰 만료/권한 문제 포함)
  if (res.status === 401 || res.status === 403) {
    store.dispatch(signOutAsync() as any);
    throw new AuthFetchError("UNAUTHORIZED", "인증/권한 오류입니다.", res.status);
  }

  return res;
}

/**
 * ✅ JSON 응답용 헬퍼 (가장 자주 씀)
 * 서버가 { msg, code } 규격이면 그걸 읽어서 공통 처리
 */
export async function authFetchJson<T = any>(input: string, options: AuthFetchOptions = {}) {
  const res = await authFetch(input, options);

  // 204 No Content 같은 경우
  if (res.status === 204) {
    return null as T;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    // JSON이 아닐 수도 있으니 텍스트로 처리
    const text = await res.text();
    // 성공인데 JSON 아님 → 그대로 리턴(필요하면 호출부에서 사용)
    // 실패면 아래에서 catch될 수 있게 처리
    if (!res.ok) {
      throw new AuthFetchError("NOT_JSON", text, res.status);
    }
    return text as unknown as T;
  }

  const data = await res.json();

  // ✅ 서버 공통 에러 규격({ msg, code }) 처리
  if (data && typeof data === "object" && "code" in data && "msg" in data) {
    const code = String((data as any).code);
    const msg = String((data as any).msg);

    // 토큰/인가 관련 코드면 로그아웃 처리(세션 정리)
    if (code === "NO_AUTH_HEADER" || code === "INVALID_ACCESS_TOKEN") {
      store.dispatch(signOutAsync() as any);
      throw new AuthFetchError(code, msg, res.status);
    }

    if (code === "ERROR_ACCESSDENIED") {
      // 권한 없음(로그아웃까지는 상황에 따라 다르지만, 일단 UI는 막아야 함)
      throw new AuthFetchError(code, msg, res.status);
    }
  }

  // HTTP 에러인데 서버가 JSON으로 다른 걸 준 경우
  if (!res.ok) {
    throw new AuthFetchError("HTTP_ERROR", "요청 처리 중 오류가 발생했습니다.", res.status);
  }

  return data as T;
}
