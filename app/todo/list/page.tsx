"use client";

import { useSearchParams } from "next/navigation";

export default function ListPage() {
  const searchParams = useSearchParams();

  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page") as string)
    : 1;

  const size = searchParams.get("size")
    ? parseInt(searchParams.get("size") as string)
    : 10;

  return (
    <div className="p-4 w-full bg-white">
      <div className="text-3xl font-extrabold">
        Todo List Page Component {page} --- {size}
      </div>
    </div>
  );
}