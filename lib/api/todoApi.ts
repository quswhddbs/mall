import type { TodoDTO } from "@/lib/dto/todoDTO";

export type TodoListResponse = {
  // 기존 호환 + 새 방식 둘 다 지원
  dtoList?: TodoDTO[];
  items?: TodoDTO[];
  page: number;
  size: number;
  totalCount: number;
};

export async function fetchTodoList(page = 1, size = 10) {
  const res = await fetch(`/api/todo?page=${page}&size=${size}`, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "list api failed");
  }

  const data = (await res.json()) as TodoListResponse;

  // ✅ 앞으로는 items 우선, 없으면 dtoList로 fallback
  const items = data.items ?? data.dtoList ?? [];

  return {
    ...data,
    items, // 항상 items로 통일해서 반환
  };
}
