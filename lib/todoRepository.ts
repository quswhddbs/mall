import { supabase } from "./supabaseClient";
import type { TodoRow } from "./types";

// 전체 조회 (이미 있음)
export async function findAllTodos(): Promise<TodoRow[]> {
  const { data, error } = await supabase
    .from("tbl_todo")
    .select("*")
    .order("tno", { ascending: false });

  if (error) throw error;

  return (data ?? []) as TodoRow[];
}

// ✅ 데이터 추가 (save 역할)
export async function insertTodo(todo: {
  title: string;
  writer: string;
  due_date: string;
}) {
  const { data, error } = await supabase
    .from("tbl_todo")
    .insert(todo)
    .select();

  if (error) throw error;

  return data;
}

// READ: findById
export async function findTodoById(tno: number): Promise<TodoRow> {
  const { data, error } = await supabase
    .from("tbl_todo")
    .select("*")
    .eq("tno", tno)
    .single(); // 한 건만

  if (error) throw error;
  return data as TodoRow;
}

// MODIFY: updateById (JPA의 save(update) 느낌)
export async function updateTodoById(
  tno: number,
  patch: { title?: string; complete?: boolean; due_date?: string }
): Promise<TodoRow> {
  const { data, error } = await supabase
    .from("tbl_todo")
    .update(patch)
    .eq("tno", tno)
    .select("*")
    .single();

  if (error) throw error;
  return data as TodoRow;
}

// DELETE: deleteById
export async function deleteTodoById(tno: number): Promise<void> {
  const { error } = await supabase.from("tbl_todo").delete().eq("tno", tno);
  if (error) throw error;
}

// PAGING: findAll(page,size,sort desc tno)
export async function findTodosPaged(params: {
  page: number; // 1부터
  size: number;
}): Promise<{ total: number; items: TodoRow[] }> {
  const { page, size } = params;

  const from = (page - 1) * size;
  const to = from + size - 1;

  // count까지 같이 받기 (exact는 느릴 수 있지만 지금은 학습용이라 OK)
  const { data, error, count } = await supabase
    .from("tbl_todo")
    .select("*", { count: "exact" })
    .order("tno", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    total: count ?? 0,
    items: (data ?? []) as TodoRow[],
  };
}
