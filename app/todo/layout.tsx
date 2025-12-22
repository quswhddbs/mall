"use client";

import { useRouter } from "next/navigation";

export default function TodoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleClickList = () => router.push("/todo/list");
  const handleClickAdd = () => router.push("/todo/add");

  return (
    <div className="w-full flex justify-center px-2 py-4">
      <div className="w-full max-w-5xl">
        {/* LIST / ADD */}
        <div className="flex gap-3 px-2 py-2">
          <button
            className="text-xl px-4 py-2 font-extrabold underline"
            onClick={handleClickList}
            type="button"
          >
            LIST
          </button>

          <button
            className="text-xl px-4 py-2 font-extrabold underline"
            onClick={handleClickAdd}
            type="button"
          >
            ADD
          </button>
        </div>

        {/* 내용 */}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
