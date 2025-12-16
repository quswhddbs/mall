import { NextResponse } from "next/server";

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

function getStatus(e: unknown, msg: string): number {
  const anyE = e as any;

  if (
    anyE?.code === "PGRST116" ||
    msg.includes("단일 JSON 객체") ||          // ✅ 지금 네 메시지 케이스
    msg.toLowerCase().includes("0 rows") ||
    msg.toLowerCase().includes("no rows")
  ) {
    return 404;
  }

  return 500;
}

export function errorResponse(e: unknown) {
  const msg = getMsg(e);
  const status = getStatus(e, msg);

  // ✅✅✅ 여기(바로 여기)에 추가
  if (status === 404) {
    return NextResponse.json(
      { msg: "해당 Todo가 존재하지 않습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ msg }, { status });
}
