"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchTodoOne } from "@/lib/api/todoApi";
import type { TodoDTO } from "@/lib/dto/todoDTO";

export default function ReadClient({ tno }: { tno: string }) {
  const initState: TodoDTO = {
    tno: 0,
    title: "",
    writer: "",
    dueDate: "",
    complete: false,
  };

  const [todo, setTodo] = useState<TodoDTO>(initState);

  useEffect(() => {
    fetchTodoOne(tno).then(setTodo);
  }, [tno]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") ?? "1");
  const size = parseInt(searchParams.get("size") ?? "10");

  const queryStr = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  }).toString();

  const moveToModify = () => router.push(`/todo/modify/${tno}?${queryStr}`);
  const moveToList = () => router.push(`/todo/list?${queryStr}`);

  return (
    <div className="w-full flex justify-center py-10">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-6 border">
        <div className="text-2xl font-extrabold mb-6">Todo Read</div>

        <div className="space-y-3">
          {row("Tno", todo.tno)}
          {row("Writer", todo.writer)}
          {row("Title", todo.title)}
          {row("Due Date", todo.dueDate)}
          {row("Complete", todo.complete ? "Completed" : "Not Yet")}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            className="rounded-lg px-5 py-3 text-base text-white bg-blue-600 hover:bg-blue-700"
            onClick={moveToList}
          >
            List
          </button>

          <button
            type="button"
            className="rounded-lg px-5 py-3 text-base text-white bg-red-600 hover:bg-red-700"
            onClick={moveToModify}
          >
            Modify
          </button>
        </div>
      </div>
    </div>
  );
}

function row(label: string, value: any) {
  return (
    <div className="grid grid-cols-3 items-center gap-3">
      <div className="text-right font-bold text-gray-700">{label}</div>
      <div className="col-span-2 rounded-lg border px-4 py-3 bg-gray-50">
        {String(value ?? "")}
      </div>
    </div>
  );
}
