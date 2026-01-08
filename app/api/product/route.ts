// app/api/product/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import * as productService from "@/lib/services/productService";
import { saveFiles } from "@/lib/utils/customFileUtil";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const pname = String(formData.get("pname") ?? "").trim();
    const priceRaw = String(formData.get("price") ?? "0").trim();
    const price = Number(priceRaw);

    const pdescRaw = formData.get("pdesc");
    const pdesc = pdescRaw == null ? null : String(pdescRaw);

    if (!pname) {
      return NextResponse.json({ message: "pname is required" }, { status: 400 });
    }

    // ✅ 가격 검증(실무 기본)
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: "price must be a number >= 0" }, { status: 400 });
    }

    // ✅ "files" 키로 여러 개 업로드
    const files = formData.getAll("files").filter(Boolean) as File[];

    // ✅ 파일 제한(너무 과하면 서버 터짐 방지)
    if (files.length > 5) {
      return NextResponse.json({ message: "max 5 files allowed" }, { status: 400 });
    }

    // ✅ 파일 타입 검증(이미지만 받는 정책이면 이렇게)
    for (const f of files) {
      if (f.type && !f.type.startsWith("image/")) {
        return NextResponse.json({ message: "only image files are allowed" }, { status: 400 });
      }
    }

    // 1) 상품 먼저 등록해서 pno 확보
    const pno = await productService.register({
      pname,
      price,
      pdesc,
      uploadFileNames: [],
    });

    // 2) Storage 업로드
    const uploadResults = files.length ? await saveFiles(files, pno) : null;
    const uploadFileNames = uploadResults?.map((r) => r.originalPath) ?? [];

    // 3) 이미지 목록 반영
    if (uploadFileNames.length > 0) {
      await productService.modify({
        pno,
        pname,
        price,
        pdesc,
        uploadFileNames,
      });
    }

    return NextResponse.json({ result: pno });
  } catch (e: any) {
    return errorResponse(e);
  }
}
