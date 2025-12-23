import { NextResponse } from "next/server";
import { get, modify, remove } from "@/lib/services/todoService";
import type { TodoDTO } from "@/lib/dto/todoDTO";
import { errorResponse } from "@/lib/api/errorResponse";

async function parseTno(params: Promise<{ tno: string }>) {
  const { tno } = await params;
  const tnoNum = Number(tno);

  if (!Number.isInteger(tnoNum) || tnoNum <= 0) {
    return { ok: false as const, res: NextResponse.json({ message: "잘못된 tno 값" }, { status: 400 }) };
  }

  return { ok: true as const, tnoNum };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tno: string }> }
) {
  try {
    const parsed = await parseTno(params);
    if (!parsed.ok) return parsed.res;

    const todoDTO = await get(parsed.tnoNum);
    return NextResponse.json(todoDTO, { status: 200 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ tno: string }> }
) {
  try {
    const parsed = await parseTno(params);
    if (!parsed.ok) return parsed.res;

    let body: Partial<TodoDTO>;
    try {
      body = (await req.json()) as Partial<TodoDTO>;
    } catch {
      return NextResponse.json({ message: "요청 바디가 올바르지 않습니다." }, { status: 400 });
    }

    // 최소 검증 (원하면 더 강화 가능)
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json({ message: "title은 필수입니다." }, { status: 400 });
    }
    if (typeof body.writer !== "string" || body.writer.trim().length === 0) {
      return NextResponse.json({ message: "writer는 필수입니다." }, { status: 400 });
    }
    if (typeof body.dueDate !== "string") {
      return NextResponse.json({ message: "dueDate 형식이 올바르지 않습니다." }, { status: 400 });
    }
    if (typeof body.complete !== "boolean") {
      return NextResponse.json({ message: "complete 형식이 올바르지 않습니다." }, { status: 400 });
    }

    await modify({
      tno: parsed.tnoNum,
      title: body.title,
      writer: body.writer,
      dueDate: body.dueDate,
      complete: body.complete,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tno: string }> }
) {
  try {
    const parsed = await parseTno(params);
    if (!parsed.ok) return parsed.res;

    await remove(parsed.tnoNum);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return errorResponse(e);
  }
}
