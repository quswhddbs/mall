// lib/api/todoApi.ts
"use client";

import type { TodoDTO } from "@/lib/dto/todoDTO";
import { authFetchJson } from "@/lib/api/authFetch";

export type TodoListResponse = {
  // 기존 호환 + 새 방식 둘 다 지원
  dtoList?: TodoDTO[];
  items?: TodoDTO[];
  page: number;
  size: number;
  totalCount: number;
};

export async function fetchTodoList(page = 1, size = 10) {
  const data = await authFetchJson<TodoListResponse>(`/api/todo?page=${page}&size=${size}`, {
    method: "GET",
    requireAuth: true,
  });

  // ✅ 앞으로는 items 우선, 없으면 dtoList로 fallback
  const items = data.items ?? data.dtoList ?? [];

  return {
    ...data,
    items, // 항상 items로 통일해서 반환
  };
}

export async function fetchTodoOne(tno: number | string) {
  return authFetchJson<TodoDTO>(`/api/todo/${tno}`, {
    method: "GET",
    requireAuth: true,
  });
}

export async function postAddTodo(payload: Pick<TodoDTO, "title" | "writer" | "dueDate">) {
  return authFetchJson<{ tno?: number; TNO?: number } & Record<string, any>>(`/api/todo`, {
    method: "POST",
    body: JSON.stringify(payload),
    requireAuth: true,
  });
}

/** 삭제 */
export async function deleteTodo(tno: number | string) {
  return authFetchJson<any>(`/api/todo/${tno}`, {
    method: "DELETE",
    requireAuth: true,
  });
}

/** 수정 */
export async function putTodo(todo: TodoDTO) {
  return authFetchJson<any>(`/api/todo/${todo.tno}`, {
    method: "PUT",
    body: JSON.stringify(todo),
    requireAuth: true,
  });
}
