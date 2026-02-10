// app/api/product/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import * as productService from "@/lib/services/productService";
import { saveFiles } from "@/lib/utils/customFileUtil";
import { requireAuth } from "@/lib/auth/requireAuth"; // ✅ 추가

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // ✅ 여기 핵심: ADMIN만 상품 등록 가능
    await requireAuth(req, { roles: ["ADMIN", "SUPER_ADMIN"] });

    const formData = await req.formData();

    const pname = String(formData.get("pname") ?? "").trim();
    const priceRaw = String(formData.get("price") ?? "0").trim();
    const price = Number(priceRaw);

    const pdescRaw = formData.get("pdesc");
    const pdesc = pdescRaw == null ? null : String(pdescRaw);

    if (!pname) {
      return NextResponse.json({ message: "pname is required" }, { status: 400 });
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: "price must be a number >= 0" }, { status: 400 });
    }

    const files = formData.getAll("files").filter(Boolean) as File[];

    if (files.length > 5) {
      return NextResponse.json({ message: "max 5 files allowed" }, { status: 400 });
    }

    for (const f of files) {
      if (f.type && !f.type.startsWith("image/")) {
        return NextResponse.json({ message: "only image files are allowed" }, { status: 400 });
      }
    }

    const pno = await productService.register({
      pname,
      price,
      pdesc,
      uploadFileNames: [],
    });

    const uploadResults = files.length ? await saveFiles(files, pno) : null;
    const uploadFileNames = uploadResults?.map((r) => r.originalPath) ?? [];

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
