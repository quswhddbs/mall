"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getNum(param: string | null, defaultValue: number) {
  if (!param) return defaultValue;
  const n = parseInt(param, 10);
  return Number.isNaN(n) ? defaultValue : n;
}

export default function useCustomMove() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [refresh, setRefresh] = useState(false);

  const page = getNum(searchParams.get("page"), 1);
  const size = getNum(searchParams.get("size"), 10);

  const queryDefault = useMemo(() => {
    return new URLSearchParams({
      page: String(page),
      size: String(size),
    }).toString();
  }, [page, size]);

  const moveToList = useCallback(
    (pageParam?: { page?: number; size?: number }) => {
      const p = pageParam?.page ?? page;
      const s = pageParam?.size ?? size;

      const queryStr = new URLSearchParams({
        page: String(p),
        size: String(s),
      }).toString();

      router.push(`/todo/list?${queryStr}`);
      setRefresh(r => !r);
    },
    [router, page, size]
  );

  const moveToModify = useCallback(
    (tno: number | string) => {
      router.push(`/todo/modify/${tno}?${queryDefault}`);
    },
    [router, queryDefault]
  );

  const moveToRead = useCallback(
    (tno: number | string) => {
      router.push(`/todo/read/${tno}?${queryDefault}`);
    },
    [router, queryDefault]
  );

  return { moveToList, moveToModify, moveToRead, page, size, refresh };
}
