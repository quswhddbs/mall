import ModifyClient from "./ModifyClient";

// Next.js 최신 규칙: params는 Promise 형태 → async 로 받아야 함
export default async function Page({
  params,
}: {
  params: Promise<{ tno: string }>;
}) {
  const { tno } = await params; // ← Promise 해제

  return <ModifyClient tno={tno} />;
}