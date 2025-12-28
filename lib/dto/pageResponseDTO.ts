// lib/dto/pageResponseDTO.ts
import type { PageRequestDTO } from "@/lib/dto/pageRequestDTO";

export type PageResponseDTO<E> = {
  dtoList: E[];
  pageNumList: number[];
  pageRequestDTO: Required<PageRequestDTO>;

  prev: boolean;
  next: boolean;

  totalCount: number;
  prevPage: number;
  nextPage: number;
  totalPage: number;
  current: number;
};

// 교재 PageResponseDTO.withAll(...) 계산 로직 치환
export function buildPageResponse<E>(
  dtoList: E[],
  pageRequestDTO: PageRequestDTO,
  totalCount: number
): PageResponseDTO<E> {
  const page = pageRequestDTO.page ?? 1;
  const size = pageRequestDTO.size ?? 10;

  let end = Math.ceil(page / 10.0) * 10;
  const start = end - 9;

  const last = Math.ceil(totalCount / size);
  end = end > last ? last : end;

  const prev = start > 1;
  const next = totalCount > end * size;

  const pageNumList: number[] = [];
  for (let i = start; i <= end; i++) pageNumList.push(i);

  const prevPage = prev ? start - 1 : 0;
  const nextPage = next ? end + 1 : 0;

  return {
    dtoList,
    pageNumList,
    pageRequestDTO: { page, size },
    prev,
    next,
    totalCount,
    prevPage,
    nextPage,
    totalPage: pageNumList.length,
    current: page,
  };
}
