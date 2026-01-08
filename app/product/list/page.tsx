// app/product/list/page.tsx
import { Suspense } from "react";
import ListClient from "./ListClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 font-bold">Loading...</div>}>
      <ListClient />
    </Suspense>
  );
}
