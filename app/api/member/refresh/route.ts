import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

type RefreshBody = {
  refreshToken?: string;
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    const body = (await req.json()) as RefreshBody;
    const refreshToken = body.refreshToken?.trim();

    if (!refreshToken) {
      // 스프링 코드의 NULL_REFRASH 느낌 유지
      return NextResponse.json({ error: "NULL_REFRESH" }, { status: 400 });
    }

    if (!authHeader || authHeader.length < 7) {
      return NextResponse.json({ error: "INVALID_STRING" }, { status: 400 });
    }

    const accessToken = authHeader.substring(7);

    // Supabase v2 방식: access/refresh 세션을 주입한 뒤 refreshSession 수행
    const { error: setErr } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (setErr) {
      return NextResponse.json(
        { error: "ERROR_SET_SESSION", message: setErr.message },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      return NextResponse.json(
        { error: "ERROR_REFRESH", message: error?.message ?? "NO_SESSION" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "ERROR_REFRESH", message: e?.message ?? "UNKNOWN" },
      { status: 500 }
    );
  }
}
