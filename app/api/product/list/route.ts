// app/api/product/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import * as productService from "@/lib/services/productService";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest) {
  try {
    // ✅ 스프링 JWTCheckFilter 역할: 토큰 유효성 + 권한 확인
    // (필요 없으면 roles 옵션 빼도 됨)
    await requireAuth(req, { roles: ["USER", "ADMIN"] });

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? 1);
    const size = Number(searchParams.get("size") ?? 10);

    const result = await productService.list(page, size);

    return NextResponse.json(result);
  } catch (e: any) {
    // requireAuth에서 던진 에러도 여기로 옴
    // errorResponse가 status/메시지 처리 중이라면 그대로 위임
    return errorResponse(e);
  }
}
