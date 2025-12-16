import { NextResponse } from "next/server";
import { get, modify, remove } from "@/lib/services/todoService";
import type { TodoDTO } from "@/lib/dto/todoDTO";
import { errorResponse } from "@/lib/api/errorResponse";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tno: string }> }
) {
  try {
    const { tno } = await params;
    const tnoNum = Number(tno);

    // PathVariable 검증 (Spring @PathVariable 대응)
    if (isNaN(tnoNum)) {
      return NextResponse.json(
        { msg: "잘못된 tno 값" },
        { status: 400 }
      );
    }

    // Service 호출
    const todoDTO = await get(tnoNum);

    return NextResponse.json(todoDTO);
  } catch (e) {
    // 전역 예외 처리 (@RestControllerAdvice 대응)
    return errorResponse(e);
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