// lib/utils/customFileUtil.ts
import { supabase } from "@/lib/supabaseClient";

export type UploadResult = {
  originalPath: string; // ✅ 버킷 내부 path (버킷명 포함 X)
  thumbPath?: string;   // ✅ 버킷 내부 path (버킷명 포함 X)
  fileName: string;
  contentType?: string;
  size?: number;
};

const BUCKET = process.env.NEXT_PUBLIC_PRODUCT_BUCKET ?? "product";

// ✅ 매우 중요: path에는 버킷명을 절대 넣지 않는다.
// 버킷명은 from(BUCKET)에서 이미 지정됨.
const ORIGINAL_PREFIX =
  process.env.NEXT_PUBLIC_PRODUCT_ORIGINAL_PREFIX ?? "original";
const THUMB_PREFIX =
  process.env.NEXT_PUBLIC_PRODUCT_THUMB_PREFIX ?? "thumb";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isImage(contentType?: string | null) {
  return !!contentType && contentType.startsWith("image/");
}

/**
 * Spring: UUID_originalName 저장 + 이미지면 s_UUID... 썸네일 생성
 * Next/Supabase: Storage에 original 업로드 + image면 thumb 경로도 준비
 */
export async function saveFiles(
  files: File[] | null | undefined,
  pno?: number
): Promise<UploadResult[] | null> {
  if (!files || files.length === 0) return null;

  const results: UploadResult[] = [];
  const folder = typeof pno === "number" ? `${pno}` : "temp";

  for (const file of files) {
    const savedName = `${uuid()}_${file.name}`;

    // ✅ 예: original/5/uuid_test1.jpg
    const originalPath = `${ORIGINAL_PREFIX}/${folder}/${savedName}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(originalPath, file, {
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

    // 이미지면 썸네일 경로만 먼저 잡아둠(실제 생성은 다음 단계에서 sharp로)
    if (isImage(file.type)) {
      // 교재 개념: s_ + savedName
      const thumbName = `s_${savedName}`.replace(/\.[^.]+$/, ".webp");

      // ✅ 예: thumb/5/s_uuid_test1.webp
      const thumbPath = `${THUMB_PREFIX}/${folder}/${thumbName}`;
      result.thumbPath = thumbPath;
    }

    results.push(result);
  }

  return results;
}

/**
 * public URL 얻기 (개발단계: public bucket 가정)
 * ✅ path는 "original/5/..." 처럼 버킷 내부 경로만 넣는다.
 */
export function getPublicUrl(path: string): string {
  const normalized = normalizePath(path);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(normalized);
  return data.publicUrl;
}

/**
 * Storage에 저장된 path가 혹시 "product/original/..." 같이 들어온 경우를 대비한 안전장치
 * ✅ 버킷명(product/)이 앞에 붙어 있으면 제거
 */
export function normalizePath(path: string): string {
  if (!path) return path;
  const prefix = `${BUCKET}/`;
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

/**
 * 원본 + 썸네일 삭제
 */
export async function deleteFiles(paths: string[] | null | undefined) {
  if (!paths || paths.length === 0) return;

  const normalized = paths.map(normalizePath);

  const { error } = await supabase.storage.from(BUCKET).remove(normalized);
  if (error) throw new Error(error.message);
}
