// lib/dto/todoDTO.ts
export type TodoDTO = {
  tno: number;
  title: string;
  writer: string;
  complete?: boolean;    // 없으면 false로 처리
  dueDate: string;       // "yyyy-MM-dd" 형태로 받을 예정
};
