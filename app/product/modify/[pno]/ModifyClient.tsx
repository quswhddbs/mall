// app/product/modify/[pno]/ModifyClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  const page = Number(sp.get("page") ?? "1");
  const size = Number(sp.get("size") ?? "10");

  const [product, setProduct] = useState<ProductDTO>(initState);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const uploadRef = useRef<HTMLInputElement | null>(null);

  const goList = () => router.push(`/product/list?page=${page}&size=${size}`);
  const goRead = () => router.push(`/product/read/${pno}?page=${page}&size=${size}`);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setMsg(null);

      try {
        const res = await fetch(`/api/product/${pno}`, { cache: "no-store" });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as ProductDTO;

        if (mounted) {
          setProduct({
            ...data,
            pno: Number((data as any).pno ?? 0),
            uploadFileNames: (data.uploadFileNames ?? []).filter(Boolean),
          });
        }
      } catch (e: any) {
        if (mounted) setMsg(e?.message ?? "불러오기 실패");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [pno]);

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

  const handleClickModify = async () => {
    setLoading(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append("pname", product.pname);
      formData.append("pdesc", product.pdesc);
      formData.append("price", String(product.price));

      for (const path of product.uploadFileNames ?? []) {
        formData.append("uploadFileNames", path);
      }

      const files = uploadRef.current?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i]);
        }
      }

      const res = await fetch(`/api/product/${pno}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      goRead();
    } catch (e: any) {
      setMsg(e?.message ?? "수정 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleClickDelete = async () => {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/product/${pno}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      // ✅ soft delete 성공 → 리스트로
      goList();
    } catch (e: any) {
      setMsg(e?.message ?? "삭제 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 w-full bg-white">
      <div className="text-3xl font-extrabold mb-4">Products Modify Page</div>

      {loading && <div className="p-4 font-bold">Loading...</div>}

      {msg && (
        <div className="p-4 bg-red-50 text-red-700 font-bold rounded border">
          {msg}
        </div>
      )}

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
                      disabled={loading}
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
            />
          </div>
        </div>

        <div className="flex justify-end p-4">
          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-32 text-white bg-red-500"
            onClick={handleClickDelete}
            disabled={loading}
          >
            Delete
          </button>

          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-32 text-white bg-orange-500"
            onClick={handleClickModify}
            disabled={loading}
          >
            Modify
          </button>

          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-32 text-white bg-blue-500"
            onClick={goRead}
          >
            Read
          </button>

          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-32 text-white bg-blue-500"
            onClick={goList}
          >
            List
          </button>
        </div>
      </div>
    </div>
  );
}
