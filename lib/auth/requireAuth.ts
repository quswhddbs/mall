import { createClient } from "@supabase/supabase-js";

type RequireAuthOptions = {
  // 예: ["USER", "ADMIN"]
  roles?: string[];
};

export type AuthUser = {
  id: string;
  email: string | null;
  nickname: string | null;
  social: boolean | null;
  roles: string[];
};

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 서버 전용: 서비스 롤 키로 "토큰 유효성 확인 + DB조회" 가능
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function isExpiredTokenError(err: any): boolean {
  const msg = (err?.message ?? "").toString().toLowerCase();
  const code = (err?.code ?? "").toString().toLowerCase();

  // Supabase 에러 메시지는 환경에 따라 다를 수 있어 넓게 커버
  return (
    msg.includes("expired") ||
    msg.includes("jwt expired") ||
    msg.includes("token is expired") ||
    code.includes("jwt_expired")
  );
}

export async function requireAuth(
  req: Request,
  options: RequireAuthOptions = {}
): Promise<AuthUser> {
  const authHeader = req.headers.get("authorization");

 // ✅ 여기 추가
 // console.log("AUTH HEADER:", authHeader);

  
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new Error("NO_AUTH_HEADER");
  }

  const accessToken = authHeader.slice(7).trim();

  // ✅ 여기 추가
  // console.log("ACCESS TOKEN:", accessToken?.slice(0, 30));

  if (!accessToken) {
    throw new Error("EMPTY_TOKEN");
  }

  const supabaseAdmin = getServerSupabase();

  // 1) 토큰 유효성 확인 (user 추출)
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);

  if (userErr || !userData.user) {
    // 만료면 따로 구분 가능(8장에서 refresh/재로그인 UX 만들기 쉬움)
    if (isExpiredTokenError(userErr)) {
      throw new Error("INVALID_ACCESS_TOKEN"); // (원하면 EXPIRED_TOKEN으로 바꿔도 됨)
    }
    throw new Error("INVALID_ACCESS_TOKEN");
  }

  const user = userData.user;

  // 2) 우리 DB에서 profile + roles 조회
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("member_profile")
    .select("nickname, social")
    .eq("id", user.id)
    .single();

  if (profErr || !profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const { data: rolesRows, error: roleErr } = await supabaseAdmin
    .from("member_role")
    .select("role")
    .eq("user_id", user.id);

  if (roleErr) {
    throw new Error("ROLE_NOT_FOUND");
  }

  const roles = (rolesRows ?? []).map((r: any) => r.role);

  // 3) (선택) ROLE 체크
  if (options.roles && options.roles.length > 0) {
    const ok = options.roles.some((need) => roles.includes(need));
    if (!ok) {
      throw new Error("ERROR_ACCESSDENIED");
    }
  }

  return {
    id: user.id,
    email: user.email ?? null,
    nickname: profile.nickname ?? null,
    social: profile.social ?? null,
    roles,
  };
}


