import Link from 'next/link';

const giftCardOptions = [
  '$100',
  '$199',
  '$349',
  '$500',
  'custom amount',
] as const;

const experiences = [
  {
    name: 'signature hydrafacial',
    price: '$275',
    note: 'a glow reset she can see right away',
  },
  {
    name: 'sofwave',
    price: '$2,750',
    note: 'our favorite lift and tighten experience',
  },
  {
    name: 'lhr brazilian series',
    price: 'packages from $800',
    note: 'smooth results with consistent sessions',
  },
  {
    name: 'angel glow up halo membership',
    price: '$199/mo',
    note: 'a monthly ritual for steady skin confidence',
  },
] as const;

interface MothersDayClientProps {
  giftCardUrl: string;
}

export default function MothersDayClient({ giftCardUrl }: MothersDayClientProps) {
  return (
    <main className="bg-rani-cream">
      <section className="relative overflow-hidden bg-rani-navy py-20 sm:py-28">
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-rani-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-0 h-80 w-80 rounded-full bg-rani-gold/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-rani-gold">🪷 mother&apos;s day</p>
          <h1 className="mt-5 font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            give her the gift of her most radiant year
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed text-white/80 sm:text-lg">
            a rani gift card lets her choose exactly what she wants. thoughtful, easy, and always loved.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href={giftCardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-rani-gold px-8 py-3.5 font-body text-sm font-semibold text-rani-navy transition hover:bg-rani-gold-light"
            >
              shop gift cards ✨
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-heading text-3xl font-bold text-rani-navy sm:text-4xl">
            choose an amount
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center font-body text-sm text-rani-muted">
            pick a quick amount or choose custom. she can apply it to any service she is ready for.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {giftCardOptions.map((option) => (
              <div
                key={option}
                className="rounded-xl border border-rani-border bg-white px-4 py-6 text-center shadow-sm"
              >
                <p className="font-heading text-2xl font-bold text-rani-navy">{option}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-heading text-3xl font-bold text-rani-navy sm:text-4xl">
            popular experiences she can use it on
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {experiences.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-rani-border bg-rani-cream p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-body text-lg font-semibold text-rani-navy">{item.name}</h3>
                  <p className="font-body text-sm font-bold text-rani-gold">{item.price}</p>
                </div>
                <p className="mt-3 font-body text-sm text-rani-muted">{item.note}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href={giftCardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-rani-navy px-8 py-3.5 font-body text-sm font-semibold text-white transition hover:bg-rani-navy-light"
            >
              send a gift card 💛
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-rani-border bg-rani-cream py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-body text-base text-rani-navy sm:text-lg">
            the perfect gift for anyone who has ever said &quot;i should take better care of myself.&quot;
          </p>
          <p className="mt-4 font-body text-sm text-rani-muted">with love, the rani team ✨</p>
        </div>
      </section>
    </main>
  );
}
