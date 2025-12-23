import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import { list, register } from "@/lib/services/todoService";
import type { TodoDTO } from "@/lib/dto/todoDTO";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const size = parseInt(searchParams.get("size") ?? "10", 10);

    const data = await list(page, size);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json(); // {title, writer, dueDate}

    // register()가 TodoDTO를 받게 되어 있으니, 최소 형태로 DTO 만들어 전달
    const dto: TodoDTO = {
      tno: 0,
      title: body.title ?? "",
      writer: body.writer ?? "",
      dueDate: body.dueDate ?? "",
      complete: false,
    };

    const tno = await register(dto);

    // 프론트(AddClient)가 res.tno 로 읽을 수 있게 통일
    return NextResponse.json({ tno }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
