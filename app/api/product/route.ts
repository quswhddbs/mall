// app/api/product/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import * as productService from "@/lib/services/productService";
import { saveFiles } from "@/lib/utils/customFileUtil";
import type { ProductDTO } from "@/lib/dto/productDTO";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const pname = String(formData.get("pname") ?? "");
    const price = Number(formData.get("price") ?? 0);
    const pdesc = (formData.get("pdesc") as string | null) ?? null;

    // ✅ files 키로 여러 개 올릴 수 있음
    const files = formData.getAll("files") as File[];

    // 1) 먼저 상품만 등록해서 pno 확보 (폴더 구분하려고)
    const pno = await productService.register({
      pname,
      price,
      pdesc,
      uploadFileNames: [], // 일단 비워둠
    } as ProductDTO);

    // 2) 파일 업로드 (Supabase Storage)
    const uploadResults = await saveFiles(files, pno);

    const uploadFileNames =
      uploadResults?.map((r) => r.originalPath) ?? [];

    // 3) 상품에 파일키 반영(교재의 setUploadFileNames + modify 흐름 치환)
    await productService.modify({
      pno,
      pname,
      price,
      pdesc,
      uploadFileNames,
    } as ProductDTO);

    return NextResponse.json({ result: pno });
  } catch (e: any) {
    return errorResponse(e);
  }
}
