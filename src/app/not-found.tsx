import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <Link href="/" className="mt-6 inline-block text-accent hover:underline">Back to home</Link>
      </div>
    </main>
  );
}
