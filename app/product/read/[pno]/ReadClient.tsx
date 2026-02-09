"use client";

import { useEffect, useState } from "react";
import { getOne } from "@/lib/api/productApi";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductDTO } from "@/lib/dto/productDTO";
import useCart from "@/hooks/useCart";
import { useAppSelector } from "@/lib/store/hooks";

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

type AuthLike = {
  email?: string;
  nickname?: string;
  user?: { email?: string; nickname?: string };
  isLogin?: boolean;
  isAuthenticated?: boolean;
};

export default function ReadClient({ pno }: { pno: number }) {
  const router = useRouter();
  const sp = useSearchParams();

  const page = Number(sp.get("page") ?? 1);
  const size = Number(sp.get("size") ?? 10);

  const [product, setProduct] = useState<ProductDTO>(initState);

  // ✅ 장바구니
  const { cartItems, changeCart } = useCart();

  // ✅ 로그인 정보(UX 보조용) - 실제 보안은 서버에서 requireAuth로 처리
  const auth = useAppSelector((state) => state.auth) as unknown as AuthLike;
  const email = auth?.email ?? auth?.user?.email;

  useEffect(() => {
    getOne(pno).then((data: ProductDTO) => {
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

  // ✅ 교재 11.4: 상품 조회에서 장바구니 추가
  const handleClickAddCart = () => {
    // UX 보조: 로그인 안 되어 있으면 로그인 페이지 유도
    if (!email) {
      alert("로그인 후 장바구니를 사용할 수 있습니다.");
      router.push("/member/login");
      return;
    }

    const targetPno = Number(pno);
    let qty = 1;

    const addedItem = cartItems.find((item) => item.pno === targetPno);

    if (addedItem) {
      const ok = window.confirm("이미 추가된 상품입니다. 추가하시겠습니까?");
      if (!ok) return;
      qty = addedItem.qty + 1;
    }

    // 서버는 requireAuth로 사용자 식별(토큰) / 교재 흐름 유지 위해 email도 같이 보냄
    changeCart({ email, pno: targetPno, qty });
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
            <img key={i} alt="product" className="p-4 w-1/2" src={imgSrc} />
          );
        })}
      </div>

      <div className="flex justify-end p-4">
        {/* ✅ Add Cart 추가 */}
        <button
          type="button"
          className="inline-block rounded p-4 m-2 text-xl w-32 text-white bg-green-500"
          onClick={handleClickAddCart}
        >
          Add Cart
        </button>

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
