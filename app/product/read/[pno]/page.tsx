// app/product/read/[pno]/page.tsx
import ReadClient from "./ReadClient";

type Params = { pno: string };
type Search = { page?: string; size?: string };

export default async function Page(props: {
  params: Params | Promise<Params>;
  searchParams?: Search | Promise<Search>;
}) {
  // ✅ Next 버전에 따라 params/searchParams가 Promise로 올 수 있어서 안전하게 풀어준다
  const params = await Promise.resolve(props.params);
  const searchParams = await Promise.resolve(props.searchParams ?? {});

  const rawPno = params.pno;
  const pno = Number(rawPno);

  const page = Number(searchParams.page ?? "1");
  const size = Number(searchParams.size ?? "10");

  console.log("rawPno:", rawPno, "/ pno:", pno, "/ page:", page, "/ size:", size);

  return <ReadClient pno={pno} page={page} size={size} />;
}
