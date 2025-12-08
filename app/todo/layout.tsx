"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TodoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleClickList = () => {
    router.push("/todo/list");
  };

  const handleClickAdd = () => {
    router.push("/todo/add");
  };

  return (
    <div className="w-full m-2 p-2">
      {/* LIST / ADD 영역 */}
      <div className="w-full flex m-2 p-2">
        <div
          className="text-xl m-1 p-2 w-20 font-extrabold text-center underline cursor-pointer"
          onClick={handleClickList}
        >
          LIST
        </div>

        <div
          className="text-xl m-1 p-2 w-20 font-extrabold text-center underline cursor-pointer"
          onClick={handleClickAdd}
        >
          ADD
        </div>
      </div>

      {/* Outlet 위치 */}
      <div className="flex flex-wrap w-full">{children}</div>
    </div>
  );
}