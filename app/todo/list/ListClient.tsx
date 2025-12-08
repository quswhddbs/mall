"use client";

import { useSearchParams } from "next/navigation";

export default function ListClient() {
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const size = parseInt(searchParams.get("size") ?? "10", 10);

  return (
    <div className="p-4 w-full bg-white">
      <div className="text-3xl font-extrabold">
        Todo List Page Component {page} --- {size}
      </div>
    </div>
  );
}