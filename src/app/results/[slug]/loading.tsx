export default function ResultsLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <section className="bg-gradient-to-b from-rani-cream to-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="mx-auto h-3 w-24 rounded bg-rani-gold/20" />
          <div className="mx-auto mt-4 h-1 w-16 rounded bg-rani-gold/20" />
          <div className="mx-auto mt-8 h-10 w-3/4 rounded-lg bg-rani-navy/10" />
          <div className="mx-auto mt-6 h-20 w-2/3 rounded-lg bg-rani-navy/5" />

          {/* Trust badges skeleton */}
          <div className="mt-10 flex items-center justify-center gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 w-40 rounded bg-rani-navy/5" />
            ))}
          </div>

          {/* Details cards skeleton */}
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-rani-border/30 bg-white p-5"
              >
                <div className="h-3 w-16 rounded bg-rani-gold/20" />
                <div className="mt-3 h-12 w-full rounded bg-rani-navy/5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery skeleton */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto h-8 w-64 rounded-lg bg-rani-navy/10" />
          <div className="mx-auto mt-4 h-5 w-96 rounded bg-rani-navy/5" />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-xl bg-rani-cream"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA skeleton */}
      <section className="bg-rani-navy py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mx-auto h-8 w-72 rounded-lg bg-white/10" />
          <div className="mx-auto mt-4 h-5 w-96 rounded bg-white/5" />
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="h-12 w-48 rounded-lg bg-white/10" />
          </div>
        </div>
      </section>
    </div>
  );
}
