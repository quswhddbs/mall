"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResultModal from "@/app/components/common/ResultModal";
import type { TodoDTO } from "@/lib/dto/todoDTO";
import { fetchTodoOne, putTodo, deleteTodo } from "@/lib/api/todoApi";

const initState: TodoDTO = {
  tno: 0,
  title: "",
  writer: "",
  dueDate: "",
  complete: false,
};

export default function ModifyClient({ tno }: { tno: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const size = parseInt(searchParams.get("size") ?? "10", 10);

  const queryStr = useMemo(() => {
    return new URLSearchParams({
      page: String(page),
      size: String(size),
    }).toString();
  }, [page, size]);

  const tnoNum = useMemo(() => Number(tno), [tno]);

  const [todo, setTodo] = useState<TodoDTO>({ ...initState });
  const [result, setResult] = useState<"Modified" | "Deleted" | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTodoOne(tno)
      .then((data) => {
        // dueDate가 null/undefined로 오면 date input이 깨질 수 있어서 방어
        setTodo({
          ...data,
          dueDate: data.dueDate ?? "",
        });
      })
      .catch((e) => {
        console.error(e);
        router.push(`/todo/list?${queryStr}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tno, queryStr]);

  const handleChangeTodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTodo((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeTodoComplete = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTodo((prev) => ({ ...prev, complete: value === "Y" }));
  };

  const handleClickModify = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await putTodo({
        ...todo,
        // URL 기준으로 확정
        tno: todo.tno || tnoNum,
      });
      setResult("Modified");
    } catch (e) {
      console.error(e);
      alert((e as any)?.message ?? "수정 실패");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClickDelete = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await deleteTodo(tno);
      setResult("Deleted");
    } catch (e) {
      console.error(e);
      alert((e as any)?.message ?? "삭제 실패");
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    if (result === "Deleted") {
      router.push(`/todo/list?${queryStr}`);
    } else {
      router.push(`/todo/read/${tno}?${queryStr}`);
    }
  };

  return (
    <div className="w-full flex justify-center py-10">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-6 border">
        {result && (
          <ResultModal title="처리결과" content={result} callbackFn={closeModal} />
        )}

        <div className="text-2xl font-extrabold mb-6">Todo Modify</div>

        <div className="space-y-4">
          {rowText("TNO", todo.tno)}
          {rowText("WRITER", todo.writer)}

          {rowInput("TITLE", "title", "text", todo.title, handleChangeTodo)}
          {rowInput("DUEDATE", "dueDate", "date", todo.dueDate, handleChangeTodo)}

          <div className="grid grid-cols-3 items-center gap-3">
            <div className="text-right font-bold text-gray-700">COMPLETE</div>
            <select
              className="col-span-2 rounded-lg border px-4 py-3 bg-gray-50"
              onChange={handleChangeTodoComplete}
              value={todo.complete ? "Y" : "N"}
            >
              <option value="Y">Completed</option>
              <option value="N">Not Yet</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            className={`rounded-lg px-6 py-3 text-white font-bold ${
              isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={handleClickDelete}
            disabled={isSaving}
          >
            Delete
          </button>

          <button
            type="button"
            className={`rounded-lg px-6 py-3 text-white font-bold ${
              isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={handleClickModify}
            disabled={isSaving}
          >
            Modify
          </button>
        </div>
      </div>
    </div>
  );
}

function rowText(label: string, value: any) {
  return (
    <div className="grid grid-cols-3 items-center gap-3">
      <div className="text-right font-bold text-gray-700">{label}</div>
      <div className="col-span-2 rounded-lg border px-4 py-3 bg-gray-100">
        {String(value ?? "")}
      </div>
    </div>
  );
}

function rowInput(
  label: string,
  name: string,
  type: string,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
) {
  return (
    <div className="grid grid-cols-3 items-center gap-3">
      <div className="text-right font-bold text-gray-700">{label}</div>
      <input
        className="col-span-2 rounded-lg border px-4 py-3 bg-gray-50"
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
      />
    </div>
  );
}
