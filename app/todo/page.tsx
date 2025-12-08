import { redirect } from "next/navigation";

export default function TodoIndexPage() {
  // /todo → /todo/list 로 리다이렉트
  redirect("/todo/list");
}