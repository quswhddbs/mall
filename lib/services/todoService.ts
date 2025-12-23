// lib/services/todoService.ts
import type { TodoDTO } from "@/lib/dto/todoDTO";
import { supabase } from "@/lib/supabaseClient";

// ====== 공통 변환 ======
function toTodoDTO(row: any): TodoDTO {
  return {
    tno: row.tno,
    title: row.title,
    writer: row.writer,
    complete: row.complete,
    dueDate: row.due_date,
  };
}

function toPayload(dto: TodoDTO) {
  return {
    title: dto.title,
    writer: dto.writer,
    complete: dto.complete ?? false,
    due_date: dto.dueDate,
  };
}

// ====== 공통 에러(404) ======
function notFound(tno: number) {
  const err = new Error(`Todo not found: tno=${tno}`);
  // errorResponse에서 status로 활용 가능하게 힌트 부여
  (err as any).status = 404;
  (err as any).code = "TODO_NOT_FOUND";
  return err;
}

// ====== register ======
export async function register(todoDTO: TodoDTO): Promise<number> {
  const { data, error } = await supabase
    .from("tbl_todo")
    .insert(toPayload(todoDTO))
    .select("tno")
    .single();

  if (error) throw error;
  return data.tno as number;
}

// ====== get ======
export async function get(tno: number): Promise<TodoDTO> {
  const { data, error } = await supabase
    .from("tbl_todo")
    .select("*")
    .eq("tno", tno)
    .maybeSingle(); // ✅ 없는 경우 data=null, error=null 가능

  if (error) throw error;
  if (!data) throw notFound(tno);

  return toTodoDTO(data);
}

// ====== modify ======
export async function modify(todoDTO: TodoDTO): Promise<void> {
  const tno = Number(todoDTO.tno);

  if (!Number.isInteger(tno) || tno <= 0) {
    throw new Error("tno is required for modify()");
  }

  // ✅ 업데이트 결과를 받아 0건이면 404 처리
  const { data, error } = await supabase
    .from("tbl_todo")
    .update(toPayload(todoDTO))
    .eq("tno", tno)
    .select("tno")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFound(tno);
}

// ====== remove ======
export async function remove(tno: number): Promise<void> {
  if (!Number.isInteger(tno) || tno <= 0) {
    throw new Error("tno is required for remove()");
  }

  // ✅ 삭제 결과를 받아 0건이면 404 처리
  const { data, error } = await supabase
    .from("tbl_todo")
    .delete()
    .eq("tno", tno)
    .select("tno")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFound(tno);
}

// ====== list ======
export async function list(page = 1, size = 10) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeSize = Number.isFinite(size) && size > 0 ? size : 10;

  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;

  const { data, error, count } = await supabase
    .from("tbl_todo")
    .select("*", { count: "exact" })
    .order("tno", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const items = (data ?? []).map(toTodoDTO);
  const totalCount = count ?? 0;

  return {
    dtoList: items,
    items,
    page: safePage,
    size: safeSize,
    totalCount,
  };
}
