import { NextResponse } from "next/server";
import { list } from "@/lib/services/todoService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const size = Number(searchParams.get("size") ?? 10);

    const result = await list(page, size);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { message: "list 실패", error: e.message },
      { status: 500 }
    );
  }
}
