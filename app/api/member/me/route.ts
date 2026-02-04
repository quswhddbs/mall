import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: Request) {
  try {
    // ✅ 로그인만 되어 있으면 OK (roles 제한 없음)
    const user = await requireAuth(req);

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        social: user.social,
        roles: user.roles, // ["USER"] | ["ADMIN"] | ...
      },
      { status: 200 }
    );
  } catch (e: any) {
    // requireAuth에서 던지는 메시지를 그대로 내려줌 (8장 규격 유지)
    const code = e?.message ?? "UNAUTHORIZED";

    // NO_AUTH_HEADER / INVALID_ACCESS_TOKEN 은 401
    return NextResponse.json(
      { msg: code, code },
      { status: 401 }
    );
  }
}
