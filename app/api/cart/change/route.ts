// app/api/cart/change/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { requireAuth } from "@/lib/auth/requireAuth";
import type { CartItemDTO } from "@/lib/dto/cartItemDTO";
import { addOrModifyCartItem, removeCartItem } from "@/lib/services/cartService";

export const runtime = "nodejs";

function cleanEnv(v?: string) {
  return (v ?? "").replace(/\uFEFF/g, "").trim(); // BOM/공백 제거
}

/**
 * ✅ 실무 안정화: cino가 내 cart에 속하는지 검증
 * - 존재하지 않으면 404
 * - 남의 것이면 403
 *
 * ⚠️ SupabaseClient 타입 충돌 방지 위해 supabase는 any로 받는다.
 */
async function assertCartItemOwner(supabase: any, userId: string, cino: number) {
  const { data: item, error: itemErr } = await supabase
    .from("cart_item")
    .select("cino, cart_cno")
    .eq("cino", cino)
    .maybeSingle();

  if (itemErr) throw itemErr;

  if (!item) {
    return {
      ok: false as const,
      status: 404,
      body: { msg: "Cart item not found", code: "CART_ITEM_NOT_FOUND" },
    };
  }

  const cartCno = Number(item.cart_cno);

  const { data: cart, error: cartErr } = await supabase
    .from("cart")
    .select("cno, user_id")
    .eq("cno", cartCno)
    .maybeSingle();

  if (cartErr) throw cartErr;

  if (!cart) {
    return {
      ok: false as const,
      status: 404,
      body: { msg: "Cart not found for item", code: "CART_NOT_FOUND" },
    };
  }

  if (String(cart.user_id) !== String(userId)) {
    return {
      ok: false as const,
      status: 403,
      body: { msg: "Not owner of cart item", code: "NOT_OWNER_OF_CART_ITEM" },
    };
  }

  return { ok: true as const };
}

export async function POST(req: Request) {
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

    const body = (await req.json()) as CartItemDTO;

    if (typeof body?.qty !== "number") {
      return NextResponse.json(
        { msg: "qty must be a number", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!url || !serviceKey) {
      return NextResponse.json(
        { msg: "Missing Supabase env", code: "MISSING_SUPABASE_ENV" },
        { status: 500 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          msg: "Invalid NEXT_PUBLIC_SUPABASE_URL",
          code: "INVALID_SUPABASE_URL",
          hint: `len=${url.length}, head=${JSON.stringify(url.slice(0, 30))}`,
        },
        { status: 500 }
      );
    }

    // ✅ 타입 충돌 방지: any로 고정
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    }) as any;

    // ✅ qty <= 0 : 삭제 케이스
    if (body.qty <= 0) {
      if (body.cino == null) {
        return NextResponse.json(
          { msg: "cino is required when qty <= 0", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }

      const cino = Number(body.cino);
      if (!Number.isFinite(cino) || cino <= 0) {
        return NextResponse.json(
          { msg: "Invalid cino", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }

      const ownerCheck = await assertCartItemOwner(supabase, userId, cino);
      if (!ownerCheck.ok) {
        return NextResponse.json(ownerCheck.body, { status: ownerCheck.status });
      }

      const items = await removeCartItem(supabase, userId, cino);
      return NextResponse.json(items, { status: 200 });
    }

    // ✅ qty > 0 : 추가/수정 케이스
    // cino가 있으면 “수정”이므로 소유 검증 먼저
    if (body.cino != null) {
      const cino = Number(body.cino);
      if (!Number.isFinite(cino) || cino <= 0) {
        return NextResponse.json(
          { msg: "Invalid cino", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }

      const ownerCheck = await assertCartItemOwner(supabase, userId, cino);
      if (!ownerCheck.ok) {
        return NextResponse.json(ownerCheck.body, { status: ownerCheck.status });
      }
    }

    const items = await addOrModifyCartItem(supabase, userId, body);
    return NextResponse.json(items, { status: 200 });
  } catch (err: any) {
    const msg = err?.message ?? "Server error";
    const code = err?.code ?? "SERVER_ERROR";
    const status =
      err?.status && typeof err.status === "number" ? err.status : 500;

    return NextResponse.json({ msg, code }, { status });
  }
}
