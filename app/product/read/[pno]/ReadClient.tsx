"use client";

import { useEffect, useState } from "react";
import { getOne } from "@/lib/api/productApi";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductDTO } from "@/lib/dto/productDTO";

const initState: ProductDTO = {
  pno: 0,
  pname: "",
  price: 0,
  pdesc: "",
  delFlag: false,
  uploadFileNames: [],
};

function normalizePathForView(path?: string) {
  if (!path) return "";
  return path.startsWith("product/") ? path.replace(/^product\//, "") : path;
}

export default function ReadClient({ pno }: { pno: number }) {
  const router = useRouter();
  const sp = useSearchParams();

  const page = Number(sp.get("page") ?? 1);
  const size = Number(sp.get("size") ?? 10);

  const [product, setProduct] = useState<ProductDTO>(initState);

  useEffect(() => {
    getOne(pno).then((data: ProductDTO) => {
      // ✅ pno undefined 방어 (타입/응답 꼬임 대비)
      setProduct({
        ...data,
        pno: Number((data as any).pno ?? 0),
        uploadFileNames: (data.uploadFileNames ?? []).filter(Boolean),
      });
    });
  }, [pno]);

  const moveToList = () => {
    router.push(`/product/list?page=${page}&size=${size}`);
  };

  const moveToModify = () => {
    router.push(`/product/modify/${pno}?page=${page}&size=${size}`);
  };

  return (
    <div className="border-2 border-sky-200 mt-10 m-2 p-4">
      <div className="flex justify-center mt-10">
        <div className="relative mb-4 flex w-full flex-wrap items-stretch">
          <div className="w-1/5 p-6 text-right font-bold">PNO</div>
          <div className="w-4/5 p-6 rounded-r border border-solid shadow-md">
            {product.pno}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative mb-4 flex w-full flex-wrap items-stretch">
          <div className="w-1/5 p-6 text-right font-bold">PNAME</div>
          <div className="w-4/5 p-6 rounded-r border border-solid shadow-md">
            {product.pname}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative mb-4 flex w-full flex-wrap items-stretch">
          <div className="w-1/5 p-6 text-right font-bold">PRICE</div>
          <div className="w-4/5 p-6 rounded-r border border-solid shadow-md">
            {product.price}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative mb-4 flex w-full flex-wrap items-stretch">
          <div className="w-1/5 p-6 text-right font-bold">PDESC</div>
          <div className="w-4/5 p-6 rounded-r border border-solid shadow-md">
            {product.pdesc ?? ""}
          </div>
        </div>
      </div>

      <div className="w-full justify-center flex flex-col m-auto items-center">
        {(product.uploadFileNames ?? []).map((raw, i) => {
          const normalized = normalizePathForView(raw);
          const imgSrc = normalized
            ? `/api/product/view?path=${encodeURIComponent(normalized)}`
            : "";

          return (
            <img
              key={i}
              alt="product"
              className="p-4 w-1/2"
              src={imgSrc}
            />
          );
        })}
      </div>

      <div className="flex justify-end p-4">
        <button
          type="button"
          className="inline-block rounded p-4 m-2 text-xl w-32 text-white bg-red-500"
          onClick={moveToModify}
        >
          Modify
        </button>
        <button
          type="button"
          className="rounded p-4 m-2 text-xl w-32 text-white bg-blue-500"
          onClick={moveToList}
        >
          List
        </button>
      </div>
    </div>
  );
}
