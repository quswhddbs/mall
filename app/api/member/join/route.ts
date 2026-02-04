import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type JoinBody = {
  email?: string;
  pw?: string;
  password?: string;
  nickname?: string;
};

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as JoinBody;

    const email = body.email?.trim();
    const password = (body.pw ?? body.password)?.trim();
    const nickname = body.nickname?.trim() || "USER";

    if (!email || !password) {
      return NextResponse.json(
        { error: "INVALID_JOIN_PAYLOAD" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getServerSupabase();

    // 1️⃣ Auth 사용자 생성
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createErr || !created.user) {
      return NextResponse.json(
        { error: "ERROR_JOIN", message: createErr?.message ?? "NO_USER" },
        { status: 400 }
      );
    }

    const userId = created.user.id;

    // 2️⃣ member_profile 존재 여부 확인
    const { data: existingProfile } = await supabaseAdmin
      .from("member_profile")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profErr } = await supabaseAdmin
        .from("member_profile")
        .insert([
          {
            id: userId,
            email,
            nickname,
            social: false,
          },
        ]);

      if (profErr) {
        return NextResponse.json(
          { error: "ERROR_PROFILE_INSERT", message: profErr.message },
          { status: 500 }
        );
      }
    }

    // 3️⃣ member_role 존재 여부 확인
    const { data: existingRole } = await supabaseAdmin
      .from("member_role")
      .select("user_id")
      .eq("user_id", userId)
      .eq("role", "USER")
      .maybeSingle();

    if (!existingRole) {
      const { error: roleErr } = await supabaseAdmin
        .from("member_role")
        .insert([{ user_id: userId, role: "USER" }]);

      if (roleErr) {
        return NextResponse.json(
          { error: "ERROR_ROLE_INSERT", message: roleErr.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { result: "SUCCESS", id: userId, email },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "ERROR_JOIN", message: e?.message ?? "UNKNOWN" },
      { status: 500 }
    );
  }
}
