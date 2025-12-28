// lib/dto/productDTO.ts
export type ProductDTO = {
  pno?: number;

  pname: string;
  price: number;
  pdesc?: string | null;

  delFlag?: boolean;

  // ✅ 교재: files (MultipartFile 목록)
  // Next: Client에서만 사용 (FormData로 보내기 때문에 타입만 유지)
  files?: File[];

  // ✅ 교재: uploadFileNames (저장된 파일명 목록)
  // Next/Supabase: 지금은 "Storage path(키)"를 넣어도 되고,
  // 교재 흐름 유지하려면 그냥 string[]로 유지하면 됨.
  uploadFileNames?: string[];
};
