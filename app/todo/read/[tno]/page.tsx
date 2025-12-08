import ReadClient from "./ReadClient";

export default async function Page({
  params,
}: {
  params: Promise<{ tno: string }>;
}) {
  // ✅ Promise인 params를 await 해서 실제 값 꺼내기
  const { tno } = await params;

  return <ReadClient tno={tno} />;
}