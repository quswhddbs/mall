// lib/services/productService.ts
import { supabase } from "@/lib/supabaseClient";
import type { ProductDTO } from "@/lib/dto/productDTO";
import type { PageRequestDTO } from "@/lib/dto/pageRequestDTO";
import { buildPageResponse } from "@/lib/dto/pageResponseDTO";

const PRODUCT_TABLE = "tbl_product";
const PRODUCT_IMAGE_TABLE = "tbl_product_image";
const BUCKET = process.env.NEXT_PUBLIC_PRODUCT_BUCKET ?? "product";

// ====== 공통 변환 ======
function toProductDTO(row: any, uploadFileNames: string[] = []): ProductDTO {
  return {
    pno: row.pno,
    pname: row.pname,
    price: row.price,
    pdesc: row.pdesc,
    delFlag: row.del_flag,
    uploadFileNames,
  };
}

function toProductPayload(dto: ProductDTO) {
  return {
    pname: dto.pname,
    price: dto.price,
    pdesc: dto.pdesc ?? null,
    del_flag: dto.delFlag ?? false,
  };
}

function toFileNameFromPath(path: string) {
  const idx = path.lastIndexOf("/");
  return idx >= 0 ? path.slice(idx + 1) : path;
}

// ====== 공통 에러(404) ======
function notFound(pno: number) {
  const err = new Error(`Product not found: pno=${pno}`);
  (err as any).status = 404;
  (err as any).code = "PRODUCT_NOT_FOUND";
  return err;
}

// ====== register ======
export async function register(productDTO: ProductDTO): Promise<number> {
  const { data, error } = await supabase
    .from(PRODUCT_TABLE)
    .insert(toProductPayload(productDTO))
    .select("pno")
    .single();

  if (error) throw error;

  const pno = data.pno as number;

  const keys = productDTO.uploadFileNames ?? [];
  if (keys.length > 0) {
    const rows = keys.map((path, idx) => ({
      pno,
      bucket: BUCKET,
      path,
      file_name: toFileNameFromPath(path),
      ord: idx,
      is_thumb: false,
    }));

    const { error: imgErr } = await supabase
      .from(PRODUCT_IMAGE_TABLE)
      .insert(rows);

    if (imgErr) throw imgErr;
  }

  return pno;
}

// ====== get ======
export async function get(pno: number): Promise<ProductDTO> {
  const { data: product, error: pErr } = await supabase
    .from(PRODUCT_TABLE)
    .select("pno,pname,price,pdesc,del_flag")
    .eq("pno", pno)
    .maybeSingle();

  if (pErr) throw pErr;
  if (!product || product.del_flag) throw notFound(pno);

  const { data: images, error: iErr } = await supabase
    .from(PRODUCT_IMAGE_TABLE)
    .select("path,ord")
    .eq("pno", pno)
    .order("ord", { ascending: true });

  if (iErr) throw iErr;

  const uploadFileNames = (images ?? []).map((x) => x.path as string);
  return toProductDTO(product, uploadFileNames);
}

// ====== modify ======
// 교재 흐름: product 수정 + 이미지 목록 전체 교체(clearList 후 add)
export async function modify(productDTO: ProductDTO): Promise<void> {
  const pno = Number(productDTO.pno);

  if (!Number.isInteger(pno) || pno <= 0) {
    throw new Error("pno is required for modify()");
  }

  // ✅ 업데이트 결과 0건이면 404
  const { data: updated, error: upErr } = await supabase
    .from(PRODUCT_TABLE)
    .update({
      pname: productDTO.pname,
      pdesc: productDTO.pdesc ?? null,
      price: productDTO.price,
    })
    .eq("pno", pno)
    .select("pno")
    .maybeSingle();

  if (upErr) throw upErr;
  if (!updated) throw notFound(pno);

  // 이미지 clear
  const { error: delErr } = await supabase
    .from(PRODUCT_IMAGE_TABLE)
    .delete()
    .eq("pno", pno);

  if (delErr) throw delErr;

  // 이미지 재삽입
  const keys = productDTO.uploadFileNames ?? [];
  if (keys.length > 0) {
    const rows = keys.map((path, idx) => ({
      pno,
      bucket: BUCKET,
      path,
      file_name: toFileNameFromPath(path),
      ord: idx,
      is_thumb: false,
    }));

    const { error: insErr } = await supabase
      .from(PRODUCT_IMAGE_TABLE)
      .insert(rows);

    if (insErr) throw insErr;
  }
}

// ====== remove ======
// 교재: soft delete (delFlag=true)
export async function remove(pno: number): Promise<void> {
  if (!Number.isInteger(pno) || pno <= 0) {
    throw new Error("pno is required for remove()");
  }

  const { data, error } = await supabase
    .from(PRODUCT_TABLE)
    .update({ del_flag: true })
    .eq("pno", pno)
    .select("pno")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFound(pno);
}

// ====== list ======
export async function list(page = 1, size = 10) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeSize = Number.isFinite(size) && size > 0 ? size : 10;

  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;

  const { data: products, error: listErr, count } = await supabase
    .from(PRODUCT_TABLE)
    .select("pno,pname,price,pdesc,del_flag", { count: "exact" })
    .eq("del_flag", false)
    .order("pno", { ascending: false })
    .range(from, to);

  if (listErr) throw listErr;

  const pnoList = (products ?? []).map((p) => p.pno as number);

  // ord=0 한 장만(리스트 썸네일용)
  let thumbMap = new Map<number, string>();
  if (pnoList.length > 0) {
    const { data: thumbs, error: tErr } = await supabase
      .from(PRODUCT_IMAGE_TABLE)
      .select("pno,path,ord")
      .in("pno", pnoList)
      .eq("ord", 0);

    if (tErr) throw tErr;

    (thumbs ?? []).forEach((row) => {
      thumbMap.set(row.pno as number, row.path as string);
    });
  }

  const dtoList: ProductDTO[] = (products ?? []).map((p) => {
    const thumb = thumbMap.get(p.pno as number);
    return toProductDTO(p, thumb ? [thumb] : []);
  });

  // ✅ 교재형 PageResponseDTO 형태도 같이 유지 가능
  const pageResponse = buildPageResponse(dtoList, { page: safePage, size: safeSize }, count ?? 0);

  // todoService.ts처럼 items도 같이 주는 형태
  return {
    ...pageResponse,
    items: dtoList,
    page: safePage,
    size: safeSize,
    totalCount: count ?? 0,
  };
}
