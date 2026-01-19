// app/api/product/[pno]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import * as productService from "@/lib/services/productService";
import {
  saveFiles,
  deleteFiles,
  expandWithThumb,
  normalizePath,
} from "@/lib/utils/customFileUtil";
import type { ProductDTO } from "@/lib/dto/productDTO";
import { requireAuth } from "@/lib/auth/requireAuth";

export const runtime = "nodejs";

type Ctx = {
  params: { pno: string } | Promise<{ pno: string }>;
};

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    // ✅ 조회: USER/ADMIN 허용
    await requireAuth(req, { roles: ["USER", "ADMIN"] });

    const { pno } = await ctx.params;
    const num = Number(pno);

    if (!Number.isInteger(num) || num <= 0) {
      return NextResponse.json({ message: "invalid pno" }, { status: 400 });
    }

    const data = await productService.get(num);
    return NextResponse.json(data);
  } catch (e: any) {
    return errorResponse(e);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    // ✅ 수정: MANAGER/ADMIN 허용 (원하면 USER도 추가 가능)
    await requireAuth(req, { roles: ["MANAGER", "ADMIN"] });

    const { pno } = await ctx.params;
    const num = Number(pno);
    if (!Number.isInteger(num) || num <= 0) {
      return NextResponse.json({ message: "invalid pno" }, { status: 400 });
    }

    // ✅ 0) 수정 전 기존 파일 목록 확보 (diff 계산용)
    let prevOriginals: string[] = [];
    try {
      const prev = await productService.get(num);
      prevOriginals = (prev.uploadFileNames ?? [])
        .filter(Boolean)
        .map(normalizePath);
    } catch {
      prevOriginals = [];
    }

    const formData = await req.formData();

    const pname = String(formData.get("pname") ?? "");
    const price = Number(formData.get("price") ?? 0);
    const pdesc = (formData.get("pdesc") as string | null) ?? null;

    // ✅ 화면에서 "유지"로 넘어온 기존 파일들
    const keepUploadFileNames = (formData.getAll("uploadFileNames") as string[])
      .map((v) => String(v))
      .filter(Boolean)
      .map(normalizePath);

    // ✅ 새로 추가된 파일들
    const files = (formData.getAll("files") as unknown as File[]).filter(Boolean);

    const uploadResults = await saveFiles(files, num);
    const newUploadFileNames =
      uploadResults?.map((r) => normalizePath(r.originalPath)) ?? [];

    const finalOriginals = [...keepUploadFileNames, ...newUploadFileNames];

    // ✅ 1) DB 반영 (교재: clearList 후 add 흐름)
    await productService.modify({
      pno: num,
      pname,
      price,
      pdesc,
      uploadFileNames: finalOriginals,
    } as ProductDTO);

    // ✅ 2) Storage 정리: (수정 전 originals) - (수정 후 originals) 삭제
    const prevSet = new Set(prevOriginals);
    const nextSet = new Set(finalOriginals);

    const removedOriginals = Array.from(prevSet).filter((path) => !nextSet.has(path));

    if (removedOriginals.length > 0) {
      const targets = expandWithThumb(removedOriginals); // 원본 + 썸네일 같이
      try {
        await deleteFiles(targets);
      } catch (e: any) {
        console.warn("[PUT product] storage remove failed:", e?.message ?? e);
      }
    }

    return NextResponse.json({ result: "OK" });
  } catch (e: any) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    // ✅ 삭제: ADMIN만 허용
    await requireAuth(req, { roles: ["ADMIN"] });

    const { pno } = await ctx.params;
    const num = Number(pno);

    if (!Number.isInteger(num) || num <= 0) {
      return NextResponse.json({ message: "invalid pno" }, { status: 400 });
    }

    // 1) 삭제 전 파일 목록 확보(원본 path)
    let originals: string[] = [];
    try {
      const product = await productService.get(num);
      originals = (product.uploadFileNames ?? []).filter(Boolean).map(normalizePath);
    } catch {
      originals = [];
    }

    // 2) soft delete
    await productService.remove(num);

    // 3) Storage: 원본 + 파생 썸네일까지 같이 삭제
    const targets = expandWithThumb(originals);
    if (targets.length > 0) {
      try {
        await deleteFiles(targets);
      } catch (e: any) {
        console.warn("[DELETE product] storage remove failed:", e?.message ?? e);
      }
    }

    return NextResponse.json({ result: "OK" });
  } catch (e: any) {
    return errorResponse(e);
  }
}
