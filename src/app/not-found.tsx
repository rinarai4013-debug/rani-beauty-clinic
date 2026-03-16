import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-5xl font-bold text-rani-navy">404</h1>
      <p className="mt-4 font-body text-lg text-rani-text/70">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-rani-gold px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy transition-colors hover:bg-rani-gold-light"
      >
        Back to Home
      </Link>
    </div>
  );
}
