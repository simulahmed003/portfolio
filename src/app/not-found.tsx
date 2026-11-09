import Link from "next/link";
import { getContent } from "@/lib/content";

export default async function NotFound() {
  const c = await getContent();
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div className="max-w-md">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-3xl font-semibold">{c.labels.notFoundTitle}</h1>
        {c.labels.notFoundText && <p className="mt-3 text-muted">{c.labels.notFoundText}</p>}
        <Link href="/" className="mt-6 inline-block text-accent hover:underline">
          {c.labels.backHome}
        </Link>
      </div>
    </main>
  );
}
