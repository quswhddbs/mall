// app/product/read/[pno]/page.tsx
import ReadClient from "./ReadClient";

type Ctx = {
  params: { pno: string } | Promise<{ pno: string }>;
};

export default async function Page(ctx: Ctx) {
  const { pno } = await ctx.params;
  const num = Number(pno);

  return <ReadClient pno={num} />;
}
