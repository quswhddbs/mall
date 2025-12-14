import { NextResponse } from "next/server";
import { insertTodo } from "@/lib/todoRepository";

export async function GET() {
  try {
    for (let i = 1; i <= 100; i++) {
      await insertTodo({
        title: `Title...${i}`,
        writer: "user00",
        due_date: "2023-12-31",
      });
    }

    return NextResponse.json(
      { ok: true, message: "100개 데이터 INSERT 완료" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: "INSERT 실패",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
