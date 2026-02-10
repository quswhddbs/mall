// app/product/add/AddClient.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import ResultModal from "@/app/components/common/ResultModal";
import { postAdd } from "@/lib/api/productApi";

type AddForm = {
  pname: string;
  pdesc: string;
  price: number;
};

const initState: AddForm = {
  pname: "",
  pdesc: "",
  price: 0,
};

export default function AddClient() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [product, setProduct] = useState<AddForm>({ ...initState });
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const validate = () => {
    if (!product.pname.trim()) return "상품명(pname)은 필수입니다.";
    if (!product.pdesc.trim()) return "설명(pdesc)은 필수입니다.";
    if (!product.price || product.price <= 0) return "가격(price)은 1 이상이어야 합니다.";
    return null;
  };

  const addMutation = useMutation({
    mutationFn: (formData: FormData) => postAdd(formData),
    onSuccess: async (data: any) => {
      // ✅ 목록 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: ["product/list"] });
      await queryClient.invalidateQueries({ queryKey: ["product/list", 1, 10] });

      const pno = data?.pno ?? data?.PNo ?? data?.result ?? "";
      setResultMsg(pno ? `Add Success (pno: ${pno})` : "Add Success");
      setProduct({ ...initState });
      if (uploadRef.current) uploadRef.current.value = "";
    },
    onError: (e: any) => {
      console.error(e);
      setErrorMsg(e?.message ?? "등록 실패");
    },
  });

  const handleClickAdd = () => {
    const msg = validate();
    if (msg) {
      setErrorMsg(msg);
      return;
    }

    const files = uploadRef.current?.files;

    const formData = new FormData();
    formData.append("pname", product.pname);
    formData.append("pdesc", product.pdesc);
    formData.append("price", String(product.price));

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
    }

    addMutation.mutate(formData);
  };

  const closeSuccess = () => {
    setResultMsg(null);
    router.push("/product/list?page=1&size=10");
  };

  const closeError = () => {
    setErrorMsg(null);
  };

  return (
    <div className="p-4 w-full bg-white">
      {resultMsg !== null && (
        <ResultModal title="Add Result" content={resultMsg} callbackFn={closeSuccess} />
      )}

      {errorMsg !== null && (
        <ResultModal title="Error" content={errorMsg} callbackFn={closeError} />
      )}

      <div className="text-3xl font-extrabold mb-4">Products Add Page</div>

      {addMutation.isPending ? (
        <div className="p-4 font-bold">Loading...</div>
      ) : null}

      <div className="border-2 border-sky-200 mt-4 m-2 p-4">
        <div className="flex justify-center">
          <div className="relative mb-4 flex w-full flex-wrap items-stretch">
            <div className="w-1/5 p-6 text-right font-bold">Product Name</div>
            <input
              className="w-4/5 p-6 rounded-r border border-solid border-neutral-300 shadow-md"
              name="pname"
              type="text"
              value={product.pname}
              onChange={handleChange}
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
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative mb-4 flex w-full flex-wrap items-stretch">
            <div className="w-1/5 p-6 text-right font-bold">Files</div>
            <input
              ref={uploadRef}
              className="w-4/5 p-6 rounded-r border border-solid border-neutral-300 shadow-md"
              type="file"
              multiple
            />
          </div>
        </div>

        <div className="flex justify-end">
          <div className="relative mb-4 flex p-4 flex-wrap items-stretch">
            <button
              type="button"
              className="rounded p-4 w-36 bg-blue-600 text-xl text-white disabled:bg-gray-400"
              onClick={handleClickAdd}
              disabled={addMutation.isPending}
            >
              {addMutation.isPending ? "ADDING..." : "ADD"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
