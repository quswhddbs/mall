// app/api/cart/items/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { requireAuth } from "@/lib/auth/requireAuth";
import { getCartItems } from "@/lib/services/cartService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, { roles: ["USER"] });

    const userId =
      (auth as any)?.user?.id ||
      (auth as any)?.session?.user?.id ||
      (auth as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { msg: "No authenticated user", code: "NO_AUTH_USER" },
        { status: 401 }
      );
    }

    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

    if (!url || !serviceKey) {
      return NextResponse.json(
        { msg: "Missing Supabase env", code: "MISSING_SUPABASE_ENV" },
        { status: 500 }
      );
    }

    // URL 형식 검증
    new URL(url);

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const items = await getCartItems(supabase, userId);

    // ===== debug=1 이면, 실제 DB 조회 결과를 함께 내려준다 =====
    const { searchParams } = new URL(req.url);
    const debug = searchParams.get("debug") === "1";

    if (!debug) {
      return NextResponse.json(items, { status: 200 });
    }

    const pnoList = Array.from(
      new Set(items.map((x) => Number(x.pno)).filter((n) => Number.isFinite(n)))
    );

    let products: any[] = [];
    let images: any[] = [];

    if (pnoList.length > 0) {
      const { data: pData, error: pErr } = await supabase
        .from("tbl_product")
        .select("*")
        .in("pno", pnoList);

      if (pErr) throw pErr;
      products = pData ?? [];

      const { data: iData, error: iErr } = await supabase
        .from("tbl_product_image")
        .select("*")
        .in("pno", pnoList)
        .eq("ord", 0);

      if (iErr) throw iErr;
      images = iData ?? [];
    }

    return NextResponse.json(
      {
        items,
        _debug: {
          pnoList,
          productsCount: products.length,
          products,
          imagesCount: images.length,
          images,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    const msg = err?.message ?? "Server error";
    const code = err?.code ?? "SERVER_ERROR";
    const status =
      err?.status && typeof err.status === "number" ? err.status : 500;

    return NextResponse.json({ msg, code }, { status });
  }
}
