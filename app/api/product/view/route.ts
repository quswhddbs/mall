// app/api/product/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import { supabase } from "@/lib/supabaseClient";
import { normalizePath, toThumbPathFromOriginal } from "@/lib/utils/customFileUtil";

export const runtime = "nodejs";

const BUCKET = process.env.NEXT_PUBLIC_PRODUCT_BUCKET ?? "product";

async function signedUrlOrThrow(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data?.signedUrl) {
    const err = new Error(error?.message ?? "signed url failed");
    (err as any).status = 404;
    throw err;
  }
  return data.signedUrl;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const raw = sp.get("path");
    const wantThumb = sp.get("thumb") === "1";

    if (!raw) {
      return NextResponse.json({ message: "path is required" }, { status: 400 });
    }

    // ✅ product/original/... 같은 경우 normalizePath가 product/ 제거함
    const normalized = normalizePath(raw);

    // ✅ thumb 우선
    if (wantThumb) {
      const thumbPath = toThumbPathFromOriginal(normalized);
      try {
        const url = await signedUrlOrThrow(thumbPath);
        return NextResponse.redirect(url, 307);
      } catch {
        // fallback to original
      }
    }

    const url = await signedUrlOrThrow(normalized);
    return NextResponse.redirect(url, 307);
  } catch (e: any) {
    return errorResponse(e);
  }
}
