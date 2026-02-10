// app/product/list/ListClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageComponent from "@/app/components/common/PageComponent";
import { getList } from "@/lib/api/productApi";
import type { ProductDTO } from "@/lib/dto/productDTO";
import { useAppSelector } from "@/lib/store/hooks";

type ServerData = {
  items?: ProductDTO[];
  page?: number;
  size?: number;
  totalCount?: number;

  // 방어(예전 형태)
  dtoList?: ProductDTO[];
};

const initState: ServerData = {
  items: [],
  dtoList: [],
  page: 1,
  size: 10,
  totalCount: 0,
};

function normalizePathForView(path?: string) {
  if (!path) return "";
  // ✅ DB에 혹시 product/original/... 처럼 버킷명이 붙어 들어온 경우 제거
  return path.startsWith("product/") ? path.replace(/^product\//, "") : path;
}

export default function ListClient() {
  
  
  const auth = useAppSelector((state) => state.auth);
console.log("auth in product list:", auth);

  
  const router = useRouter();
  const sp = useSearchParams();

  const page = Number(sp.get("page") ?? 1);
  const size = Number(sp.get("size") ?? 10);

  const [serverData, setServerData] = useState<ServerData>(initState);

  // ✅ Admin만 Add 버튼 보이게
  const roles = useAppSelector((state) => state.auth.roles);
  const isAdmin = Array.isArray(roles) && roles.includes("ADMIN");

  useEffect(() => {
    getList({ page, size }).then((data: any) => setServerData(data));
  }, [page, size]);

  // ✅ items 우선, 없으면 dtoList 사용
  const list = useMemo(() => {
    const items = (serverData.items ?? []) as ProductDTO[];
    if (items.length > 0) return items;
    return ((serverData.dtoList ?? []) as ProductDTO[]) || [];
  }, [serverData]);

  const totalCount = Number(serverData.totalCount ?? 0);

  const moveToRead = (pno: number) => {
    router.push(`/product/read/${pno}?page=${page}&size=${size}`);
  };

  const movePage = (targetPage: number) => {
    router.push(`/product/list?page=${targetPage}&size=${size}`);
  };

  const moveToAdd = () => {
    router.push(`/product/add?page=${page}&size=${size}`);
  };

  return (
    <div className="border-2 border-blue-100 mt-10 mr-2 ml-2">
      {/* ✅ 교재의 Products 메뉴(ADD) 역할 */}
      <div className="flex justify-end p-4">
        {isAdmin ? (
          <button
            type="button"
            className="rounded px-4 py-2 bg-green-600 text-white font-bold"
            onClick={moveToAdd}
          >
            + Add Product
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap mx-auto p-6">
        {list.map((product) => {
          const rawPath = product.uploadFileNames?.[0];
          const normalized = normalizePathForView(rawPath);

          // ✅ List는 썸네일 우선(thumb=1)
          const imgSrc = normalized
            ? `/api/product/view?path=${encodeURIComponent(normalized)}&thumb=1`
            : "";

          return (
            <div
              key={Number(product.pno)}
              className="w-1/2 p-1 rounded shadow-md border-2 cursor-pointer"
              onClick={() => moveToRead(Number(product.pno))}
            >
              <div className="flex flex-col h-full">
                <div className="font-extrabold text-2xl p-2 w-full">
                  {Number(product.pno)}
                </div>

                <div className="text-1xl m-1 p-2 w-full flex flex-col">
                  <div className="w-full overflow-hidden">
                    {imgSrc ? (
                      <img
                        alt="product"
                        className="m-auto rounded-md w-60"
                        src={imgSrc}
                      />
                    ) : (
                      <div className="m-auto rounded-md w-60 h-40 flex items-center justify-center border">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="bottom-0 font-extrabold bg-white">
                    <div className="text-center p-1">이름: {product.pname}</div>
                    <div className="text-center p-1">가격: {product.price}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PageComponent
        page={page}
        size={size}
        totalCount={totalCount}
        movePage={movePage}
      />
    </div>
  );
}
