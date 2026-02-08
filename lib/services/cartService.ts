// lib/services/cartService.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartItemListDTO } from "@/lib/dto/cartItemListDTO";
import type { CartItemDTO } from "@/lib/dto/cartItemDTO";

const PRODUCT_TABLE = "tbl_product";
const PRODUCT_IMAGE_TABLE = "tbl_product_image";

type CartRow = {
  cno: number | string;
  user_id: string;
};

type CartItemRow = {
  cino: number | string;
  qty: number;
  product_pno: number | string;
  cart_cno: number | string;
};

async function getCartByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<CartRow | null> {
  const { data, error } = await supabase
    .from("cart")
    .select("cno, user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as CartRow) ?? null;
}

async function getOrCreateCart(
  supabase: SupabaseClient,
  userId: string
): Promise<CartRow> {
  const cart = await getCartByUserId(supabase, userId);
  if (cart) return cart;

  const { data, error } = await supabase
    .from("cart")
    .insert({ user_id: userId })
    .select("cno, user_id")
    .single();

  if (error) throw error;
  return data as CartRow;
}

export async function getCartItems(
  supabase: SupabaseClient,
  userId: string
): Promise<CartItemListDTO[]> {
  // 1) cart 확인 (없으면 빈 배열)
  const cart = await getCartByUserId(supabase, userId);
  if (!cart) return [];

  const cno = Number(cart.cno);

  // 2) cart_item 조회
  const { data, error } = await supabase
    .from("cart_item")
    .select("cino, qty, product_pno, cart_cno")
    .eq("cart_cno", cno)
    .order("cino", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as CartItemRow[];
  if (rows.length === 0) return [];

  // 3) pno 목록 추출
  const pnoList = Array.from(
    new Set(rows.map((r) => Number(r.product_pno)).filter((n) => Number.isFinite(n)))
  );

  // 4) 상품 정보 조회 (삭제상품(del_flag=true) 제외)
  const productMap = new Map<number, { pname: string; price: number }>();
  const deletedPnoSet = new Set<number>();

  if (pnoList.length > 0) {
    const { data: products, error: pErr } = await supabase
      .from(PRODUCT_TABLE)
      .select("pno,pname,price,del_flag")
      .in("pno", pnoList);

    if (pErr) throw pErr;

    (products ?? []).forEach((p: any) => {
      const pno = Number(p.pno);
      if (!Number.isFinite(pno)) return;

      if (p?.del_flag === true) {
        deletedPnoSet.add(pno);
        return;
      }

      productMap.set(pno, {
        pname: String(p.pname ?? ""),
        price: Number(p.price ?? 0),
      });
    });
  }

  // ✅ 실무 안정화: 삭제된 상품이 cart_item에 있으면 자동 제거
  // - 교재에는 없지만 운영에서 필수로 들어가는 방어
  const deletedItems = rows.filter((r) => deletedPnoSet.has(Number(r.product_pno)));
  if (deletedItems.length > 0) {
    const cinoList = deletedItems.map((r) => Number(r.cino)).filter((n) => Number.isFinite(n));
    if (cinoList.length > 0) {
      const { error: delErr } = await supabase
        .from("cart_item")
        .delete()
        .in("cino", cinoList)
        .eq("cart_cno", cno);

      if (delErr) throw delErr;
    }
  }

  // 5) 대표 이미지(ord=0) 조회 (삭제상품 제외된 pno만)
  const alivePnoList = pnoList.filter((pno) => !deletedPnoSet.has(pno));

  const imageMap = new Map<number, string>();
  if (alivePnoList.length > 0) {
    const { data: thumbs, error: tErr } = await supabase
      .from(PRODUCT_IMAGE_TABLE)
      .select("pno,path,ord")
      .in("pno", alivePnoList)
      .eq("ord", 0);

    if (tErr) throw tErr;

    (thumbs ?? []).forEach((row: any) => {
      const pno = Number(row.pno);
      const path = String(row.path ?? "");
      if (Number.isFinite(pno) && path) imageMap.set(pno, path);
    });
  }

  // 6) DTO 변환 (삭제상품 제외)
  const filtered = rows.filter((r) => !deletedPnoSet.has(Number(r.product_pno)));

  return filtered.map((row) => {
    const pno = Number(row.product_pno);
    const pinfo = productMap.get(pno);

    return {
      cino: Number(row.cino),
      qty: row.qty,
      pno,
      pname: pinfo?.pname ?? "",
      price: pinfo?.price ?? 0,
      imageFile: imageMap.get(pno) ?? null,
    };
  });
}

export async function addOrModifyCartItem(
  supabase: SupabaseClient,
  userId: string,
  dto: CartItemDTO
): Promise<CartItemListDTO[]> {
  const cart = await getOrCreateCart(supabase, userId);
  const cno = Number(cart.cno);

  const qty = dto.qty;

  // 1) cino가 있으면 해당 아이템 qty 변경
  if (dto.cino != null) {
    const cino = Number(dto.cino);

    const { error: updateError } = await supabase
      .from("cart_item")
      .update({ qty })
      .eq("cino", cino)
      .eq("cart_cno", cno);

    if (updateError) throw updateError;

    return getCartItems(supabase, userId);
  }

  // 2) cino가 없으면 pno 필요
  if (dto.pno == null) {
    const err: any = new Error("pno is required when cino is not provided");
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const pno = Number(dto.pno);

  // 3) 이미 동일 상품이 담겨있는지 확인 (unique(cart_cno, product_pno))
  const { data: exist, error: existError } = await supabase
    .from("cart_item")
    .select("cino, qty, product_pno, cart_cno")
    .eq("cart_cno", cno)
    .eq("product_pno", pno)
    .maybeSingle();

  if (existError) throw existError;

  if (exist) {
    const { error: updateError } = await supabase
      .from("cart_item")
      .update({ qty })
      .eq("cino", Number((exist as any).cino))
      .eq("cart_cno", cno);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase.from("cart_item").insert({
      cart_cno: cno,
      product_pno: pno,
      qty,
    });

    if (insertError) throw insertError;
  }

  return getCartItems(supabase, userId);
}

export async function removeCartItem(
  supabase: SupabaseClient,
  userId: string,
  cino: number
): Promise<CartItemListDTO[]> {
  const cart = await getCartByUserId(supabase, userId);

  if (!cart) return [];

  const cno = Number(cart.cno);

  const { error } = await supabase
    .from("cart_item")
    .delete()
    .eq("cino", cino)
    .eq("cart_cno", cno);

  if (error) throw error;

  return getCartItems(supabase, userId);
}
