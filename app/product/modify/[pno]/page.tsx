// app/product/modify/[pno]/page.tsx
import ModifyClient from "./ModifyClient";

type Params = { pno: string };

// Next 최신 버전에서 params가 Promise로 내려오는 케이스가 있어 async로 안전 처리
export default async function Page({ params }: { params: Promise<Params> | Params }) {
  const resolved = (typeof (params as any)?.then === "function")
    ? await (params as Promise<Params>)
    : (params as Params);

  const rawPno = resolved?.pno;
  const pno = Number(rawPno);

  // 여기서 서버 콘솔에 찍히도록 (네가 확인하기 좋게)
  console.log("ModifyPage rawPno:", rawPno, "/ pno:", pno);

  if (!rawPno || Number.isNaN(pno)) {
    return <div className="p-6 text-red-600 font-bold">잘못된 상품 번호입니다.</div>;
  }

  return <ModifyClient pno={pno} />;
}
