import { NextResponse } from "next/server";
import { findTodosPaged } from "@/lib/todoRepository";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const size = parseInt(url.searchParams.get("size") ?? "10", 10);

    const result = await findTodosPaged({ page, size });

    return NextResponse.json({
      ok: true,
      total: result.total,
      page,
      size,
      items: result.items,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "PAGING 실패", error: e.message },
      { status: 500 }
    );
  }
}
