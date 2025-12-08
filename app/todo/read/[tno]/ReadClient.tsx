"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function ReadClient({ tno }: { tno: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const page = parseInt(searchParams.get("page") ?? "1");
    const size = parseInt(searchParams.get("size") ?? "10");

    const queryStr = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    }).toString();

    const moveToModify = () => {
        router.push(`/todo/modify/${tno}?${queryStr}`);
    };

    const moveToList = () => {
        router.push(`/todo/list?${queryStr}`);
    };

    return (
  <div className="text-3xl font-extrabold">
    Todo Read Page Component {tno}

    <div className="mt-4 flex gap-4">
      <button
        onClick={moveToModify}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Go Modify
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