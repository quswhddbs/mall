// lib/dto/cartItemDTO.ts

export interface CartItemDTO {
  pno?: number;     // 상품 번호 (추가/변경 시 필요)
  qty: number;      // 0 이하이면 삭제 규칙
  cino?: number;    // 있으면 해당 아이템 qty 변경/삭제
}
