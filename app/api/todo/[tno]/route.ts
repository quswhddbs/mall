import { NextResponse } from "next/server";
import { get, modify, remove } from "@/lib/services/todoService";
import type { TodoDTO } from "@/lib/dto/todoDTO";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ tno: string }> }
) {
  try {
    const { tno } = await params; // ✅ 핵심
    const tnoNum = Number(tno);

    if (isNaN(tnoNum)) {
      return NextResponse.json({ message: "잘못된 tno 값" }, { status: 400 });
    }

    const todoDTO = await get(tnoNum);
    return NextResponse.json(todoDTO);
  } catch (e: any) {
    return NextResponse.json(
      { message: "조회 실패", error: e.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ tno: string }> }
) {
  try {
    const { tno } = await params;
    const tnoNum = Number(tno);
    const body = (await req.json()) as TodoDTO;

    await modify({ ...body, tno: tnoNum });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "modify 실패", error: e.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ tno: string }> }
) {
  try {
    const { tno } = await params;
    const tnoNum = Number(tno);

    await remove(tnoNum);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "remove 실패", error: e.message },
      { status: 500 }
    );
  }
}