// app/api/product/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = process.env.NEXT_PUBLIC_PRODUCT_BUCKET ?? "product";

function normalize(p: string) {
  // 앞 슬래시 제거
  let x = p.trim().replace(/^\/+/, "");

  // 혹시 "bucket/..." 형태로 들어오면 bucket 제거 (product/original -> original)
  const bucketPrefix = `${BUCKET}/`;
  if (x.startsWith(bucketPrefix)) x = x.slice(bucketPrefix.length);

  return x;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("path");

  if (!raw) {
    return NextResponse.json({ msg: "path required" }, { status: 400 });
  }

  // 후보 경로 2개를 시도:
  // 1) "original/..." (정석)
  // 2) "product/original/..." (예전에 잘못 저장된 케이스)
  const p1 = normalize(raw);
  const p2 = raw.startsWith("product/") ? normalize(raw) : `product/${p1}`;

  const candidates = Array.from(new Set([p1, p2]));

  for (const path of candidates) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // 실제 존재하는지 HEAD로 확인 후 redirect (없으면 다음 후보)
    const res = await fetch(data.publicUrl, { method: "HEAD" });
    if (res.ok) {
      return NextResponse.redirect(data.publicUrl);
    }
  }

  return NextResponse.json(
    { msg: "Object not found", pathTried: candidates },
    { status: 404 }
  );
}
