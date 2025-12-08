// lib/types.ts

// Supabase의 tbl_todo 테이블 한 줄(row) 구조
export type TodoRow = {
  tno: number;
  title: string | null;
  writer: string | null;
  complete: boolean | null;
  due_date: string | null; // Supabase는 date를 문자열로 줘서 string으로 받음
};