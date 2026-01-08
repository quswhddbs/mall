import { Suspense } from "react";
import ReadClient from "./ReadClient";

type Ctx = {
  params: { tno: string } | Promise<{ tno: string }>;
};

export default async function Page(ctx: Ctx) {
  const { tno } = await ctx.params;

  return (
    <Suspense fallback={<div className="p-4 font-bold">Loading...</div>}>
      <ReadClient tno={tno} />
    </Suspense>
  );
}
