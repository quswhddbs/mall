import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth/requireAuth";

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

function toStatusCode(code: string) {
  if (code === "NO_AUTH_HEADER") return 401;
  if (code === "INVALID_ACCESS_TOKEN") return 401;
  if (code === "ERROR_ACCESSDENIED") return 403;
  return 500;
}

export async function GET(req: Request) {
  try {
    // ✅ SUPER_ADMIN만 접근 가능 (규칙 확정)
    await requireAuth(req, { roles: ["SUPER_ADMIN"] });

    const supabaseAdmin = getServerSupabase();

    // 1) profile 전체 조회
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("member_profile")
      .select("id, email, nickname, social")
      .order("email", { ascending: true });

    if (profErr) {
      return NextResponse.json(
        { msg: profErr.message, code: "PROFILE_QUERY_FAILED" },
        { status: 500 }
      );
    }

    const ids = (profiles ?? []).map((p: any) => p.id);

    // 2) roles 조회 (한 번에)
    let rolesRows: any[] = [];
    if (ids.length > 0) {
      const { data: rolesData, error: roleErr } = await supabaseAdmin
        .from("member_role")
        .select("user_id, role")
        .in("user_id", ids);

      if (roleErr) {
        return NextResponse.json(
          { msg: roleErr.message, code: "ROLE_QUERY_FAILED" },
          { status: 500 }
        );
      }

      rolesRows = rolesData ?? [];
    }

    // 3) 합치기
    const roleMap = new Map<string, string[]>();
    for (const r of rolesRows) {
      const uid = r.user_id as string;
      const role = r.role as string;
      const arr = roleMap.get(uid) ?? [];
      arr.push(role);
      roleMap.set(uid, arr);
    }

    const users = (profiles ?? []).map((p: any) => ({
      id: p.id as string,
      email: p.email as string,
      nickname: (p.nickname ?? null) as string | null,
      social: (p.social ?? null) as boolean | null,
      roles: (roleMap.get(p.id) ?? []) as string[],
      isAdmin: (roleMap.get(p.id) ?? []).includes("ADMIN"),
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (e: any) {
    const code = e?.message ?? "UNKNOWN";
    return NextResponse.json(
      { msg: code, code },
      { status: toStatusCode(code) }
    );
  }
}
