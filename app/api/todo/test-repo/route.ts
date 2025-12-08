// app/api/todo/test-repo/route.ts
import { NextResponse } from "next/server";
import { findAllTodos } from "@/lib/todoRepository";

export async function GET() {
  try {
    const todos = await findAllTodos();

    return NextResponse.json(
      {
        ok: true,
        count: todos.length,
        samples: todos.slice(0, 5), // 앞에서 몇 개만
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("findAllTodos error:", error?.message ?? error);

    return NextResponse.json(
      {
        ok: false,
        message: "findAllTodos 실패",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}