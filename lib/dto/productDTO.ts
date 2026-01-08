// lib/dto/productDTO.ts
export type ProductDTO = {
  // ✅ 등록(Add) 단계에서는 pno가 아직 없으므로 optional
  // ✅ 조회(Read) / 수정(Modify) 이후에는 값이 들어오게 됨
  pno?: number;

  pname: string;

  // ✅ route.ts에서 null을 넣을 수 있으므로 null 허용
  pdesc?: string | null;

  price: number;

  delFlag?: boolean;

  uploadFileNames?: string[];
};
