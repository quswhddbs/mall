"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchTodoList } from "@/lib/api/todoApi";
import type { TodoDTO } from "@/lib/dto/todoDTO";
import PageComponent from "@/app/components/common/PageComponent";

type ServerData = {
  items: TodoDTO[];
  page: number;
  size: number;
  totalCount: number;
};

const initState: ServerData = {
  items: [],
  page: 1,
  size: 10,
  totalCount: 0,
};

export default function ListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const size = parseInt(searchParams.get("size") ?? "10", 10);

  const [serverData, setServerData] = useState<ServerData>(initState);

  useEffect(() => {
    fetchTodoList(page, size).then((data) => {
      setServerData(data);
    });
  }, [page, size]);

  const queryStr = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  }).toString();

  const moveToRead = (tno: number) => {
    router.push(`/todo/read/${tno}?${queryStr}`);
  };

  const movePage = (p: number) => {
    router.push(`/todo/list?page=${p}&size=${size}`);
  };

  return (
    <div className="w-full">
      {/* 리스트 영역: 폭이 좁아져도 깨지지 않게 가운데 정렬 + max width */}
      <div className="px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-3xl rounded-xl border border-blue-100 bg-white/60">
          <div className="p-4 md:p-6 space-y-3">
            {serverData.items.map((todo) => (
              <div
                key={todo.tno ?? `${todo.title}-${todo.dueDate}-${Math.random()}`}
                className="w-full rounded-xl shadow-sm border bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  if (todo.tno !== undefined) moveToRead(todo.tno);
                }}
              >
                {/* grid로 칼럼 고정: 좁아져도 날짜 잘림/찌그러짐 최소화 */}
                <div className="grid grid-cols-12 items-center gap-2 px-4 py-4">
                  <div className="col-span-2 text-lg font-extrabold text-gray-800">
                    {todo.tno}
                  </div>

                  <div className="col-span-7 font-semibold text-gray-900 truncate">
                    {todo.title}
                  </div>

                  <div className="col-span-3 text-sm text-gray-600 text-right whitespace-nowrap">
                    {todo.dueDate}
                  </div>
                </div>
              </div>
            ))}

            {serverData.items.length === 0 && (
              <div className="py-10 text-center text-gray-500">
                데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 페이지 버튼 */}
          <PageComponent
            page={page}
            size={size}
            totalCount={serverData.totalCount}
            movePage={movePage}
          />
        </div>
      </div>
    </div>
  );
}
