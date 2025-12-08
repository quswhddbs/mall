import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  // todos 테이블에서 1개만 읽어보는 테스트
  const { data, error } = await supabase.from("tbl_todo").select("*").limit(1);

  if (error) {
    // DB 연결은 됐지만 쿼리/테이블 문제일 수도 있음
    return NextResponse.json(
      { ok: false, message: "DB error", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message: "DB 연결 및 쿼리 성공",
      sample: data,
    },
    { status: 200 }
  );
}