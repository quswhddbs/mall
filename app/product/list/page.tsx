import ListClient from "./ListClient";

export default function Page() {
  return (
    <div className="p-4 w-full bg-white">
      <div className="text-3xl font-extrabold">Product List Page</div>
      <ListClient />
    </div>
  );
}
