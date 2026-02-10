// app/product/modify/[pno]/ModifyClient.tsx
"use client";

import React, { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ResultModal from "@/app/components/common/ResultModal";
import { deleteOne, getOne, putOne } from "@/lib/api/productApi";

type ProductDTO = {
  pno: number;
  pname: string;
  pdesc: string;
  price: number;
  uploadFileNames?: string[];
  delFlag?: boolean;
};

const initState: ProductDTO = {
  pno: 0,
  pname: "",
  pdesc: "",
  price: 0,
  uploadFileNames: [],
  delFlag: false,
};

function normalizePathForView(path?: string) {
  if (!path) return "";
  return path.startsWith("product/") ? path.replace(/^product\//, "") : path;
}

export default function ModifyClient({ pno }: { pno: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const queryClient = useQueryClient();

  const page = Number(sp.get("page") ?? "1");
  const size = Number(sp.get("size") ?? "10");

  const [product, setProduct] = useState<ProductDTO>(initState);

  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const uploadRef = useRef<HTMLInputElement | null>(null);

  const goList = () => router.push(`/product/list?page=${page}&size=${size}`);
  const goRead = () => router.push(`/product/read/${pno}?page=${page}&size=${size}`);

  // ✅ 1) 조회는 Query (서버 상태)
  const query = useQuery({
    queryKey: ["product", String(pno)],
    queryFn: async () => {
      const data = await getOne(pno);

      // 방어: pno 숫자화 + 배열 정리
      return {
        ...data,
        pno: Number((data as any).pno ?? 0),
        uploadFileNames: (data.uploadFileNames ?? []).filter(Boolean),
      } as ProductDTO;
    },
    staleTime: 1000 * 60 * 10, // 10분 (원하면 Infinity도 가능)
  });

  // query 성공 시에만 로컬 폼 상태에 주입 (useEffect 최소화)
  React.useEffect(() => {
    if (query.isSuccess) setProduct(query.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isSuccess, query.data?.pno]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const removeOldImage = (path: string) => {
    setProduct((prev) => ({
      ...prev,
      uploadFileNames: (prev.uploadFileNames ?? []).filter((p) => p !== path),
    }));
  };

  // ✅ 2) 수정은 Mutation (서버 데이터 변경)
  const modMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("pname", product.pname);
      formData.append("pdesc", product.pdesc);
      formData.append("price", String(product.price));

      // 기존 이미지 유지 목록
      for (const path of product.uploadFileNames ?? []) {
        formData.append("uploadFileNames", path);
      }

      // 새 파일들
      const files = uploadRef.current?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i]);
        }
      }

      return putOne(pno, formData);
    },
    onSuccess: () => {
      // ✅ 상세/목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["product", String(pno)] });
      queryClient.invalidateQueries({ queryKey: ["product/list"] });

      setOkMsg("정상적으로 수정되었습니다.");
    },
    onError: (e: any) => {
      console.error(e);
      setErrMsg(e?.message ?? "수정 실패");
    },
  });

  // ✅ 3) 삭제도 Mutation
  const delMutation = useMutation({
    mutationFn: async () => {
      return deleteOne(pno);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", String(pno)] });
      queryClient.invalidateQueries({ queryKey: ["product/list"] });

      setOkMsg("정상적으로 삭제되었습니다.");
    },
    onError: (e: any) => {
      console.error(e);
      setErrMsg(e?.message ?? "삭제 실패");
    },
  });

  const isBusy = query.isFetching || modMutation.isPending || delMutation.isPending;

  const closeOkModal = () => {
    const wasDelete = delMutation.isSuccess;

    setOkMsg(null);

    if (wasDelete) {
      goList();
      return;
    }
    goRead();
  };

  const closeErrModal = () => setErrMsg(null);

  // 조회 실패 처리
  if (query.isError) {
    return (
      <div className="p-4 w-full bg-white">
        <div className="text-3xl font-extrabold mb-4">Products Modify Page</div>
        <div className="p-4 bg-red-50 text-red-700 font-bold rounded border">
          {(query.error as any)?.message ?? "불러오기 실패"}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            className="rounded p-3 text-white bg-blue-500"
            onClick={goList}
          >
            List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full bg-white">
      <div className="text-3xl font-extrabold mb-4">Products Modify Page</div>

      {/* ✅ 성공/실패 모달 */}
      {okMsg !== null && (
        <ResultModal title="Result" content={okMsg} callbackFn={closeOkModal} />
      )}
      {errMsg !== null && (
        <ResultModal title="Error" content={errMsg} callbackFn={closeErrModal} />
      )}

      {isBusy && <div className="p-4 font-bold">Loading...</div>}

      <div className="border-2 border-sky-200 mt-4 m-2 p-4">
        <div className="flex justify-center mt-2">
          <div className="relative mb-4 flex w-full flex-wrap items-stretch">
            <div className="w-1/5 p-6 text-right font-bold">PNO</div>
            <div className="w-4/5 p-6 rounded-r border border-solid shadow-md bg-gray-100">
              {product.pno}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative mb-4 flex w-full flex-wrap items-stretch">
            <div className="w-1/5 p-6 text-right font-bold">Product Name</div>
            <input
              className="w-4/5 p-6 rounded-r border border-solid border-neutral-300 shadow-md"
              name="pname"
              type="text"
              value={product.pname}
              onChange={handleChange}
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative mb-4 flex w-full flex-wrap items-stretch">
            <div className="w-1/5 p-6 text-right font-bold">Desc</div>
            <textarea
              className="w-4/5 p-6 rounded-r border border-solid border-neutral-300 shadow-md resize-y"
              name="pdesc"
              rows={4}
              value={product.pdesc}
              onChange={handleChange}
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative mb-4 flex w-full flex-wrap items-stretch">
            <div className="w-1/5 p-6 text-right font-bold">Price</div>
            <input
              className="w-4/5 p-6 rounded-r border border-solid border-neutral-300 shadow-md"
              name="price"
              type="number"
              value={product.price}
              onChange={handleChange}
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative mb-4 flex w-full flex-wrap items-stretch">
            <div className="w-1/5 p-6 text-right font-bold">Images</div>
            <div className="w-4/5 p-2 flex flex-wrap gap-3">
              {(product.uploadFileNames ?? []).length === 0 && (
                <div className="p-4 text-gray-500">No Images</div>
              )}

              {(product.uploadFileNames ?? []).map((raw, idx) => {
                const normalized = normalizePathForView(raw);
                const src = `/api/product/view?path=${encodeURIComponent(normalized)}`;

                return (
                  <div key={`${raw}-${idx}`} className="w-40 flex flex-col gap-2">
                    <img alt="img" src={src} className="rounded border" />
                    <button
                      type="button"
                      className="rounded p-2 text-sm text-white bg-blue-600"
                      onClick={() => removeOldImage(raw)}
                      disabled={isBusy}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative mb-4 flex w-full flex-wrap items-stretch">
            <div className="w-1/5 p-6 text-right font-bold">New Files</div>
            <input
              ref={uploadRef}
              className="w-4/5 p-6 rounded-r border border-solid border-neutral-300 shadow-md"
              type="file"
              multiple
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="flex justify-end p-4">
          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-32 text-white bg-red-500"
            onClick={() => delMutation.mutate()}
            disabled={isBusy}
          >
            Delete
          </button>

          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-32 text-white bg-orange-500"
            onClick={() => modMutation.mutate()}
            disabled={isBusy}
          >
            Modify
          </button>

          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-32 text-white bg-blue-500"
            onClick={goRead}
            disabled={isBusy}
          >
            Read
          </button>

          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-32 text-white bg-blue-500"
            onClick={goList}
            disabled={isBusy}
          >
            List
          </button>
        </div>
      </div>
    </div>
  );
}
