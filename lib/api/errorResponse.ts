import { NextResponse } from "next/server";

type ApiErrorBody = {
  msg: string;
  code?: string;
};

function getMsg(e: unknown): string {
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;

  if (e && typeof e === "object") {
    const anyE = e as any;
    if (typeof anyE.message === "string") return anyE.message;
    if (typeof anyE.details === "string") return anyE.details;
    if (typeof anyE.hint === "string") return anyE.hint;
  }

  return "알 수 없는 오류";
}

function getStatusAndCode(msg: string): { status: number; code?: string } {
  // ✅ requireAuth에서 던지는 에러 코드들
  switch (msg) {
    case "NO_AUTH_HEADER":
      return { status: 401, code: "NO_AUTH_HEADER" };
    case "EMPTY_TOKEN":
      return { status: 401, code: "EMPTY_TOKEN" };
    case "INVALID_ACCESS_TOKEN":
      return { status: 401, code: "INVALID_ACCESS_TOKEN" };
    case "ERROR_ACCESSDENIED":
      return { status: 403, code: "ERROR_ACCESSDENIED" };
    case "PROFILE_NOT_FOUND":
      return { status: 404, code: "PROFILE_NOT_FOUND" };
    case "ROLE_NOT_FOUND":
      return { status: 404, code: "ROLE_NOT_FOUND" };
  }

  // ✅ Supabase "no rows"류 메시지(프로젝트에서 실제로 튀는 문구들)
  const lower = msg.toLowerCase();
  if (
    msg.includes("단일 JSON 객체") ||
    lower.includes("0 rows") ||
    lower.includes("no rows")
  ) {
    return { status: 404, code: "NOT_FOUND" };
  }

  return { status: 500, code: "INTERNAL_ERROR" };
}

// ✅✅✅ named export (route.ts에서 import { errorResponse } 가능)
export function errorResponse(e: unknown) {
  const msg = getMsg(e);
  const { status, code } = getStatusAndCode(msg);

  const body: ApiErrorBody = { msg, code };
  return NextResponse.json(body, { status });
}
