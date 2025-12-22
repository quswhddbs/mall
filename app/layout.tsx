import "./globals.css";
import BasicMenu from "./components/menus/BasicMenu";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <BasicMenu />

        {/* 메인 + 사이드 */}
        <div className="w-full flex flex-col md:flex-row gap-1 my-5">
          {/* Main */}
          <main className="bg-sky-300 flex-1 px-5 py-10 flex justify-center">
            <div className="w-full max-w-5xl">{children}</div>
          </main>

          {/* Sidebar */}

          <aside className="bg-green-300 w-full md:w-72 px-5 py-4 md:py-10">
            <h1 className="text-2xl md:text-4xl">Sidebar</h1>
          </aside>


        </div>
      </body>
    </html>
  );
}
