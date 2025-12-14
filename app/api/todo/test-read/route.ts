import { NextResponse } from "next/server";
import { findTodoById } from "@/lib/todoRepository";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tno = parseInt(url.searchParams.get("tno") ?? "33", 10);

    const todo = await findTodoById(tno);

    return NextResponse.json({ ok: true, todo });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "READ 실패", error: e.message },
      { status: 500 }
    );
  }
}
