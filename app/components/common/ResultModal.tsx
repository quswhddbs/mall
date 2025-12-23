"use client";

export default function ResultModal({
  title,
  content,
  callbackFn,
}: {
  title: string;
  content: string;
  callbackFn?: () => void;
}) {
  const close = () => {
    if (callbackFn) callbackFn();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex h-full w-full justify-center bg-black/20"
      onClick={close}
    >
      <div
        className="bg-white shadow opacity-100 rounded mt-10 mb-10 px-6 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()} // ✅ 박스 클릭은 닫히지 않게
      >
        <div className="mt-6 mb-6 text-2xl border-b-4 border-gray-500 font-bold">
          {title}
        </div>

        <div className="text-3xl border-orange-400 border-b-4 pt-4 pb-6">
          {content}
        </div>

        <div className="justify-end flex">
          <button
            className="rounded bg-blue-500 mt-4 mb-6 px-6 py-3 text-lg text-white"
            onClick={close}
            type="button"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
}
