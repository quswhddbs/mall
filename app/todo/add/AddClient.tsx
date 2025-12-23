"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ResultModal from "@/app/components/common/ResultModal";
import { postAddTodo } from "@/lib/api/todoApi";

type AddForm = {
  title: string;
  writer: string;
  dueDate: string;
};

const initState: AddForm = {
  title: "",
  writer: "",
  dueDate: "",
};

export default function AddClient() {
  const router = useRouter();

  const [todo, setTodo] = useState<AddForm>({ ...initState });

  // 성공/실패 메시지를 모달로 통일
  const [result, setResult] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ 중복 클릭 방지
  const [isSaving, setIsSaving] = useState(false);

  const handleChangeTodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTodo((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!todo.title.trim()) return "TITLE은 필수입니다.";
    if (!todo.writer.trim()) return "WRITER는 필수입니다.";
    if (!todo.dueDate) return "DUEDATE는 필수입니다.";
    return null;
  };

  const handleClickAdd = async () => {
    // ✅ 검증
    const msg = validate();
    if (msg) {
      setErrorMsg(msg);
      return;
    }

    // ✅ 중복 클릭 방지
    if (isSaving) return;

    setIsSaving(true);
    try {
      const res = await postAddTodo(todo);

      // 책은 result.TNO 사용. 우리는 둘 다 대응
      const newTno = (res.tno ?? res.TNO) as number | undefined;

      setResult(newTno ?? 0);
      setTodo({ ...initState });
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message ?? "등록 실패");
    } finally {
      setIsSaving(false);
    }
  };

  const closeSuccessModal = () => {
    setResult(null);
    router.push("/todo/list");
  };

  const closeErrorModal = () => {
    setErrorMsg(null);
  };

  return (
    <div className="w-full flex justify-center py-10">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-6 border">
        {/* ✅ 성공 모달 */}
        {result !== null && (
          <ResultModal
            title="Add Result"
            content={`New ${result} Added`}
            callbackFn={closeSuccessModal}
          />
        )}

        {/* ✅ 에러 모달 */}
        {errorMsg !== null && (
          <ResultModal
            title="Error"
            content={errorMsg}
            callbackFn={closeErrorModal}
          />
        )}

        <div className="text-2xl font-extrabold mb-6">Todo Add</div>

        <div className="space-y-4">
          {rowInput("TITLE", "title", "text", todo.title, handleChangeTodo)}
          {rowInput("WRITER", "writer", "text", todo.writer, handleChangeTodo)}
          {rowInput("DUEDATE", "dueDate", "date", todo.dueDate, handleChangeTodo)}
        </div>

        <div className="flex justify-end mt-8">
          <button
            type="button"
            className={`rounded-lg px-6 py-3 text-white font-bold ${
              isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={handleClickAdd}
            disabled={isSaving}
          >
            {isSaving ? "ADDING..." : "ADD"}
          </button>
        </div>
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
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
