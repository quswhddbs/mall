"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function ModifyClient({ tno }: { tno: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 기존처럼 page/size 같은 쿼리는 유지 가능
  const page = parseInt(searchParams.get("page") ?? "1");
  const size = parseInt(searchParams.get("size") ?? "10");

  const queryStr = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  }).toString();

  const moveToRead = () => {
    router.push(`/todo/read/${tno}?${queryStr}`);
  };

  const moveToList = () => {
    router.push(`/todo/list?${queryStr}`);
  };

  return (
    <div className="text-3xl font-extrabold">
      Todo Modify Page ({tno})
      <div className="mt-4 flex gap-4">
        <button
          onClick={moveToRead}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go Read
        </button>
        <button
          onClick={moveToList}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Go List
        </button>
      </div>
    </div>
  );
}