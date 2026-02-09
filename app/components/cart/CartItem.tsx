// app/components/cart/CartItem.tsx
"use client";

import type { CartItem, ChangeCartParam } from "@/lib/api/cartApi";

type Props = CartItem & {
  email?: string;
  onChangeCart: (param: ChangeCartParam) => void;
  imageBaseUrl?: string; // 예: "/api/product/view?path="
};

function normalizePathForView(path?: string | null) {
  if (!path) return "";
  return path.startsWith("product/") ? path.replace(/^product\//, "") : path;
}

export default function CartItem({
  cino,
  pname,
  price,
  pno,
  qty,
  imageFile,
  email,
  onChangeCart,
  imageBaseUrl,
}: Props) {
  const sendQty = (nextQty: number) => {
    const safeQty = Math.max(0, nextQty);
    if (safeQty === qty) return;
    onChangeCart({ email, cino, pno, qty: safeQty });
  };

  const handleClickQty = (amount: number) => {
    sendQty(qty + amount);
  };

  const handleRemove = () => {
    sendQty(0);
  };

  const normalized = normalizePathForView(imageFile);
  const imgSrc =
    imageBaseUrl && normalized
      ? `${imageBaseUrl}${encodeURIComponent(normalized)}`
      : "";

  return (
    <li className="border-2">
      <div className="w-full border-2">
        <div className="m-1 p-1">
          {imgSrc ? <img alt="product" src={imgSrc} /> : null}
        </div>

        <div className="justify-center p-2 text-xl">
          <div>Cart Item No: {cino}</div>
          <div>Pno: {pno}</div>
          <div>Name: {pname}</div>
          <div>Price: {price}</div>

          <div className="flex">
            <div className="w-2/3">Qty: {qty}</div>

            <div>
              <button
                className="m-1 p-1 text-2xl bg-orange-500 w-8 rounded-lg"
                onClick={() => handleClickQty(1)}
              >
                +
              </button>

              <button
                className="m-1 p-1 text-2xl bg-orange-500 w-8 rounded-lg"
                onClick={() => handleClickQty(-1)}
                disabled={qty <= 0}
              >
                -
              </button>
            </div>
          </div>

          <div className="flex text-white font-bold p-2 justify-center">
            <button
              className="m-1 p-1 text-xl text-white bg-red-500 w-8 rounded-lg"
              onClick={handleRemove}
              disabled={qty <= 0}
            >
              X
            </button>
          </div>

          <div className="font-extrabold border-t-2 text-right m-2 pr-4">
            {qty * price} 원
          </div>
        </div>
      </div>
    </li>
  );
}
