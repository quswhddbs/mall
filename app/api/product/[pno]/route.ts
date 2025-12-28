// app/api/product/[pno]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import * as productService from "@/lib/services/productService";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ pno: string }> }
) {
  try {
    const { pno } = await ctx.params; // ✅ 중요

    const pnoNum = Number(pno);

    if (!Number.isInteger(pnoNum) || pnoNum <= 0) {
      return NextResponse.json({ msg: "Invalid pno" }, { status: 400 });
    }

    const dto = await productService.get(pnoNum);

    return NextResponse.json(dto);
  } catch (e: any) {
    return errorResponse(e);
  }
}


export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ pno: string }> }
) {
  try {
    const { pno } = await ctx.params;
    const pnoNum = Number(pno);

    if (!Number.isInteger(pnoNum) || pnoNum <= 0) {
      return NextResponse.json({ msg: "Invalid pno" }, { status: 400 });
    }

    const body = await req.json();

    await productService.modify({
      pno: pnoNum,
      pname: body.pname,
      price: body.price,
      pdesc: body.pdesc ?? null,
      uploadFileNames: body.uploadFileNames ?? [], // 지금은 파일 없음
    });

    return NextResponse.json({ RESULT: "SUCCESS" });
  } catch (e: any) {
    return errorResponse(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ pno: string }> }
) {
  try {
    const { pno } = await ctx.params;
    const pnoNum = Number(pno);

    if (!Number.isInteger(pnoNum) || pnoNum <= 0) {
      return NextResponse.json({ msg: "Invalid pno" }, { status: 400 });
    }

    await productService.remove(pnoNum);

    return NextResponse.json({ RESULT: "SUCCESS" });
  } catch (e: any) {
    return errorResponse(e);
  }
}
