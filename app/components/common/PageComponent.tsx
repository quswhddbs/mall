"use client";

type Props = {
  page: number;
  size: number;
  totalCount: number;
  movePage: (page: number) => void;
};

export default function PageComponent({ page, size, totalCount, movePage }: Props) {
  const totalPage = Math.max(1, Math.ceil(totalCount / size));

  // 버튼 10개 단위로 묶기 (원하면 숫자만 바꿔도 됨)
  const blockSize = 10;
  const currentBlock = Math.floor((page - 1) / blockSize);
  const startPage = currentBlock * blockSize + 1;
  const endPage = Math.min(startPage + blockSize - 1, totalPage);

  const pageNumList: number[] = [];
  for (let p = startPage; p <= endPage; p++) pageNumList.push(p);

  const prev = startPage > 1;
  const next = endPage < totalPage;
  const prevPage = startPage - 1;
  const nextPage = endPage + 1;

  return (
    <div className="m-6 flex justify-center items-center gap-2">
      {prev && (
        <button
          className="m-2 p-2 w-16 text-center font-bold text-blue-500 hover:underline"
          onClick={() => movePage(prevPage)}
        >
          Prev
        </button>
      )}

      {pageNumList.map((pageNum) => (
        <button
          key={pageNum}
          className={`m-2 p-2 w-12 text-center rounded shadow-md text-white ${
            page === pageNum ? "bg-gray-600" : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={() => movePage(pageNum)}
        >
          {pageNum}
        </button>
      ))}

      {next && (
        <button
          className="m-2 p-2 w-16 text-center font-bold text-blue-500 hover:underline"
          onClick={() => movePage(nextPage)}
        >
          Next
        </button>
      )}
    </div>
  );
}
