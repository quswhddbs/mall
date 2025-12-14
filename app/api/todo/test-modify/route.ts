import { NextResponse } from "next/server";
import { findTodoById, updateTodoById } from "@/lib/todoRepository";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tno = parseInt(url.searchParams.get("tno") ?? "33", 10);

    // JPA처럼: findById → 값 변경 → save
    const before = await findTodoById(tno);

    const after = await updateTodoById(tno, {
      title: `Modified ${tno}...`,
      complete: true,
      due_date: "2023-10-10",
    });

    return NextResponse.json({ ok: true, before, after });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "MODIFY 실패", error: e.message },
      { status: 500 }
    );
  }
}
