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


export async function fetchTodoOne(tno: number | string) {
  const res = await fetch(`/api/todo/${tno}`, { method: "GET" });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "read api failed");
  }

  return (await res.json()) as TodoDTO;
}

export async function postAddTodo(payload: Pick<TodoDTO, "title" | "writer" | "dueDate">) {
  const res = await fetch("/api/todo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "add api failed");
  }

  // route.ts에서 반환하는 형태 그대로 받음 (tno가 들어있을 것)
  return (await res.json()) as { tno?: number; TNO?: number } & Record<string, any>;
}


/** 삭제 */
export async function deleteTodo(tno: number | string) {
  const res = await fetch(`/api/todo/${tno}`, { method: "DELETE" });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "delete api failed");
  }

  return (await res.json()) as any;
}

/** 수정 */
export async function putTodo(todo: TodoDTO) {
  const res = await fetch(`/api/todo/${todo.tno}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(todo),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "modify api failed");
  }

  return (await res.json()) as any;
}