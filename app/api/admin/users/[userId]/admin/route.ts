import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth/requireAuth";

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function toStatusCode(code: string) {
  if (code === "NO_AUTH_HEADER") return 401;
  if (code === "INVALID_ACCESS_TOKEN") return 401;
  if (code === "ERROR_ACCESSDENIED") return 403;
  // 본인 권한 변경 금지 / 잘못된 요청은 400으로 내리자
  if (code === "CANNOT_CHANGE_SELF_ROLE") return 400;
  if (code === "MISSING_USER_ID") return 400;
  return 500;
}

type Body = {
  enabled?: boolean;
};

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  try {
    // ✅ SUPER_ADMIN만 (규칙 확정)
    const me = await requireAuth(req, { roles: ["SUPER_ADMIN"] });

    // ✅ Next.js 14 규칙: params는 await 필요
    const { userId } = await ctx.params;

    if (!userId) {
      return NextResponse.json(
        { msg: "MISSING_USER_ID", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    // ✅ 본인 권한 변경 금지 (필수 가드)
    if (me.id === userId) {
      return NextResponse.json(
        { msg: "CANNOT_CHANGE_SELF_ROLE", code: "CANNOT_CHANGE_SELF_ROLE" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as Body;
    const enabled = !!body.enabled;

    const supabaseAdmin = getServerSupabase();

    if (enabled) {
      // ADMIN 추가 (중복 방지)
      const { data: exists } = await supabaseAdmin
        .from("member_role")
        .select("user_id")
        .eq("user_id", userId)
        .eq("role", "ADMIN")
        .maybeSingle();

      if (!exists) {
        const { error: insErr } = await supabaseAdmin
          .from("member_role")
          .insert([{ user_id: userId, role: "ADMIN" }]);

        if (insErr) {
          return NextResponse.json(
            { msg: insErr.message, code: "ADMIN_GRANT_FAILED" },
            { status: 500 }
          );
        }
      }
    } else {
      // ADMIN 제거
      const { error: delErr } = await supabaseAdmin
        .from("member_role")
        .delete()
        .eq("user_id", userId)
        .eq("role", "ADMIN");

      if (delErr) {
        return NextResponse.json(
          { msg: delErr.message, code: "ADMIN_REVOKE_FAILED" },
          { status: 500 }
        );
      }
    }

    // 변경 후 roles 재조회
    const { data: rolesRows, error: roleErr } = await supabaseAdmin
      .from("member_role")
      .select("role")
      .eq("user_id", userId);

    if (roleErr) {
      return NextResponse.json(
        { msg: roleErr.message, code: "ROLE_QUERY_FAILED" },
        { status: 500 }
      );
    }

    const roles = (rolesRows ?? []).map((r: any) => r.role);

    return NextResponse.json(
      {
        result: "SUCCESS",
        userId,
        roles,
        isAdmin: roles.includes("ADMIN"),
      },
      { status: 200 }
    );
  } catch (e: any) {
    const code = e?.message ?? "UNKNOWN";
    return NextResponse.json(
      { msg: code, code },
      { status: toStatusCode(code) }
    );
  }
}
