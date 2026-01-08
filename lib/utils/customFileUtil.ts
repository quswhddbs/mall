// lib/utils/customFileUtil.ts
import { supabase } from "@/lib/supabaseClient";
import sharp from "sharp";

export type UploadResult = {
  originalPath: string; // 버킷 내부 path (버킷명 포함 X)
  thumbPath?: string; // 버킷 내부 path (버킷명 포함 X)
  fileName: string;
  contentType?: string;
  size?: number;
};

const BUCKET = process.env.NEXT_PUBLIC_PRODUCT_BUCKET ?? "product";

// ✅ path에는 버킷명을 절대 넣지 않는다.
const ORIGINAL_PREFIX = process.env.NEXT_PUBLIC_PRODUCT_ORIGINAL_PREFIX ?? "original";
const THUMB_PREFIX = process.env.NEXT_PUBLIC_PRODUCT_THUMB_PREFIX ?? "thumb";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isImage(contentType?: string | null) {
  return !!contentType && contentType.startsWith("image/");
}

/** ✅ 업로드용 파일명 정리(경로문자/특수문자/공백/너무 긴 이름 방지) */
function sanitizeFileName(name: string) {
  // 확장자 분리
  const dot = name.lastIndexOf(".");
  const extRaw = dot >= 0 ? name.slice(dot) : "";
  const bodyRaw = dot >= 0 ? name.slice(0, dot) : name;

  // ✅ body는 영문/숫자/._- 만 허용 (한글/공백/특수문자 전부 '_'로)
  let body = bodyRaw
    .replace(/[\/\\]+/g, "_")                 // 경로문자 제거
    .replace(/[\u0000-\u001F\u007F]/g, "")    // 제어문자 제거
    .replace(/\s+/g, "_")                     // 공백 -> _
    .replace(/[^a-zA-Z0-9._-]/g, "_")         // ✅ 핵심: ASCII 외 전부 _
    .replace(/_+/g, "_")                      // _ 연속 정리
    .replace(/^_+|_+$/g, "");                 // 앞뒤 _ 제거

  // ext도 안전하게(점 포함)
  let ext = extRaw
    .replace(/[\/\\]+/g, "")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .slice(0, 10);

  if (!ext.startsWith(".") && ext.length > 0) ext = `.${ext}`;

  if (body.length > 60) body = body.slice(0, 60);
  if (!body) body = "file";

  return `${body}${ext || ""}`;
}


/** 버킷명(product/)이 path 앞에 붙어있으면 제거 */
export function normalizePath(path: string): string {
  if (!path) return path;
  const prefix = `${BUCKET}/`;
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

/** public URL 얻기 (public bucket일 때만 의미 있음) */
export function getPublicUrl(path: string): string {
  const normalized = normalizePath(path);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(normalized);
  return data.publicUrl;
}

/** 원본 path -> 썸네일 path로 변환 (규칙 고정) */
export function toThumbPathFromOriginal(originalPath: string): string {
  const normalized = normalizePath(originalPath);

  // original/{folder}/{uuid_name.ext}
  // -> thumb/{folder}/s_uuid_name.webp
  const parts = normalized.split("/");
  if (parts.length < 3) return normalized; // 방어

  const prefix = parts[0]; // original
  const folder = parts[1];
  const file = parts.slice(2).join("/");

  if (prefix !== ORIGINAL_PREFIX) return normalized;

  const savedName = file; // uuid_name.ext
  const thumbName = `s_${savedName}`.replace(/\.[^.]+$/, ".webp");

  return `${THUMB_PREFIX}/${folder}/${thumbName}`;
}

/**
 * Spring: UUID_originalName 저장 + 이미지면 s_UUID... 썸네일 생성
 * Next/Supabase: Storage에 original 업로드 + image면 thumb(webp)도 실제 생성/업로드
 */
export async function saveFiles(
  files: File[] | null | undefined,
  pno?: number
): Promise<UploadResult[] | null> {
  if (!files || files.length === 0) return null;

  const results: UploadResult[] = [];
  const folder = typeof pno === "number" ? `${pno}` : "temp";

  for (const file of files) {
    const safeName = sanitizeFileName(file.name);
    const savedName = `${uuid()}_${safeName}`;

    // ✅ 예: original/5/uuid_test1.jpg
    const originalPath = `${ORIGINAL_PREFIX}/${folder}/${savedName}`;

    // 1) 원본 업로드
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(originalPath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

    if (upErr) throw new Error(upErr.message);

    const result: UploadResult = {
      originalPath,
      fileName: file.name,
      contentType: file.type || undefined,
      size: file.size,
    };

    // 2) 이미지면 썸네일(webp) 생성 후 업로드
    if (isImage(file.type)) {
      const thumbPath = toThumbPathFromOriginal(originalPath);

      // File -> Buffer
      const arrayBuf = await file.arrayBuffer();
      const input = Buffer.from(arrayBuf);

      // sharp: webp 480px(가로 기준) / 용량 절감
      const webp = await sharp(input)
        .rotate()
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const { error: thumbErr } = await supabase.storage.from(BUCKET).upload(thumbPath, webp, {
        upsert: false,
        contentType: "image/webp",
      });

      if (thumbErr) throw new Error(thumbErr.message);

      result.thumbPath = thumbPath;
    }

    results.push(result);
  }

  return results;
}

/** 원본 + 썸네일 삭제 */
export async function deleteFiles(paths: string[] | null | undefined) {
  if (!paths || paths.length === 0) return;

  const normalized = paths.map(normalizePath);

  const { error } = await supabase.storage.from(BUCKET).remove(normalized);
  if (error) throw new Error(error.message);
}

/** 원본 배열 -> (원본 + 파생 썸네일)까지 같이 지울 목록 만들기 */
export function expandWithThumb(paths: string[] | null | undefined) {
  const originals = (paths ?? []).filter(Boolean).map(normalizePath);
  const thumbs = originals
    .filter((p) => p.startsWith(`${ORIGINAL_PREFIX}/`))
    .map(toThumbPathFromOriginal);

  // 중복 제거
  return Array.from(new Set([...originals, ...thumbs]));
}
