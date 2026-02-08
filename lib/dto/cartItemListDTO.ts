// lib/dto/cartItemListDTO.ts

export interface CartItemListDTO {
  cino: number;      // cart item id (bigserial)
  qty: number;

  pno: number;       // product id
  pname: string;
  price: number;

  imageFile: string | null; // 대표 이미지(없을 수 있음)
}
