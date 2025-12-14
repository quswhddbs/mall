import { NextResponse } from "next/server";
import { deleteTodoById } from "@/lib/todoRepository";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tno = parseInt(url.searchParams.get("tno") ?? "1", 10);

    await deleteTodoById(tno);

    return NextResponse.json({ ok: true, deleted: tno });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "DELETE 실패", error: e.message },
      { status: 500 }
    );
  }
}
