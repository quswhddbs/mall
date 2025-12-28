// app/api/product/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import * as productService from "@/lib/services/productService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? 1);
    const size = Number(searchParams.get("size") ?? 10);

    const result = await productService.list(page, size);

    return NextResponse.json(result);
  } catch (e: any) {
    return errorResponse(e);
  }
}
