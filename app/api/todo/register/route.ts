import { NextResponse } from "next/server";
import { register } from "@/lib/services/todoService";
import type { TodoDTO } from "@/lib/dto/todoDTO";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TodoDTO;

    const tno = await register(body);

    return NextResponse.json({ ok: true, tno }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "register 실패", error: e.message },
      { status: 500 }
    );
  }
}
