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

        {/* 메뉴 */}
        <BasicMenu />

        {/* 메인 + 사이드 영역 */}
        <div className="bg-white my-5 w-full flex flex-col space-y-1 md:flex-row md:space-x-1 md:space-y-0"> 

          {/* Main */}
          <main className="bg-sky-300 md:w-2/3 lg:w-3/4 px-5 py-40">
            {children}
          </main>

          {/* Sidebar */}
          <aside className="bg-green-300 md:w-1/3 lg:w-1/4 px-5 py-40">
            <h1 className="text-2xl md:text-4xl">Sidebar</h1>
          </aside>
        </div>

      </body>
    </html>
  );
}