// lib/services/todoService.ts
import type { TodoDTO } from "@/lib/dto/todoDTO";
import { supabase } from "@/lib/supabaseClient";

// DB row -> DTO 변환(중복 제거)
function toTodoDTO(row: any): TodoDTO {
  return {
    tno: row.tno,
    title: row.title,
    writer: row.writer,
    complete: row.complete,
    dueDate: row.due_date,
  };
}

// DTO -> DB payload 변환(중복 제거)
function toPayload(dto: TodoDTO) {
  return {
    title: dto.title,
    writer: dto.writer,
    complete: dto.complete ?? false,
    due_date: dto.dueDate, // DB 컬럼명에 맞춤
  };
}

// TodoService.register(TodoDTO) 대응
export async function register(todoDTO: TodoDTO): Promise<number> {
  console.log("......... register");

  const { data, error } = await supabase
    .from("tbl_todo")
    .insert(toPayload(todoDTO))
    .select("tno")
    .single();

  if (error) throw error;
  return data.tno as number;
}

// TodoService.get(Long tno) 대응
export async function get(tno: number): Promise<TodoDTO> {
  console.log("......... get", tno);

  const { data, error } = await supabase
    .from("tbl_todo")
    .select("*")
    .eq("tno", tno)
    .single();

  if (error) throw error;
  return toTodoDTO(data);
}

// TodoService.modify(TodoDTO) 대응
export async function modify(todoDTO: TodoDTO): Promise<void> {
  if (todoDTO.tno == null) {
    throw new Error("tno is required for modify()");
  }

  const { error } = await supabase
    .from("tbl_todo")
    .update(toPayload(todoDTO))
    .eq("tno", todoDTO.tno);

  if (error) throw error;
}

// TodoService.remove(Long tno) 대응
export async function remove(tno: number): Promise<void> {
  const { error } = await supabase.from("tbl_todo").delete().eq("tno", tno);
  if (error) throw error;
}

// TodoService.list(PageRequestDTO) 대응(Next 방식)
// ✅ 기존 dtoList 유지(안 깨짐) + ✅ items 추가(점진 교체)
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
    // ✅ 기존 유지
    dtoList: items,

    // ✅ 새 방식(앞으로 프론트는 이걸로 옮기면 됨)
    items,

    page: safePage,
    size: safeSize,
    totalCount,
  };
}
