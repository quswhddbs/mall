// lib/todoRepository.ts
import { supabase } from "./supabaseClient";
import type { TodoRow } from "./types";

// 스프링의 TodoRepository 비슷한 역할 (지금은 test용으로 최소 기능만)
export async function findAllTodos(): Promise<TodoRow[]> {
  const { data, error } = await supabase
    .from("tbl_todo")
    .select("*")
    .order("tno", { ascending: false });

  if (error) {
    // 실제 서비스면 에러 로깅 후 커스텀 에러 던질 수도 있음
    throw error;
  }

  return (data ?? []) as TodoRow[];
}