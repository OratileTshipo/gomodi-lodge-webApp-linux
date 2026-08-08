import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 className="text-ink font-semibold text-3xl md:text-4xl">Page not found</h1>
      <p className="text-stone mt-3 text-base">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block btn-primary px-6 py-3 rounded-lg font-semibold text-base"
      >
        Back to Home
      </Link>
    </main>
  );
}
