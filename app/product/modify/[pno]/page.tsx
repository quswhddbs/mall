// app/product/modify/[pno]/page.tsx
import { Suspense } from "react";
import ModifyClient from "./ModifyClient";

type Ctx = {
  params: { pno: string } | Promise<{ pno: string }>;
};

export default async function Page(ctx: Ctx) {
  const { pno } = await ctx.params;
  const num = Number(pno);

  return (
    <Suspense fallback={<div className="p-4 font-bold">Loading...</div>}>
      <ModifyClient pno={num} />
    </Suspense>
  );
}
