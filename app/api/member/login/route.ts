import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

type LoginBody = {
  email?: string;
  pw?: string; // 교재 흐름( pw ) 유지
  password?: string; // 혹시 프론트에서 password로 보내도 받게끔
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;

    const email = body.email?.trim();
    const password = (body.pw ?? body.password)?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "INVALID_LOGIN_PAYLOAD" },
        { status: 400 }
      );
    }

    // Supabase Auth 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: "ERROR_LOGIN", message: error?.message ?? "NO_SESSION" },
        { status: 401 }
      );
    }

    const { session, user } = data;

    // 스프링 예제처럼 access/refresh만 우선 내려줌
    return NextResponse.json(
      {
        email: user.email,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        // 필요하면 나중 단계에서 user_metadata/roles 확장
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "ERROR_LOGIN", message: e?.message ?? "UNKNOWN" },
      { status: 500 }
    );
  }
}
