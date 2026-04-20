import Link from 'next/link';
import { clinicInfo } from '@/data/clinic-info';

const firstVisitChecklist = [
  'parking details come in your confirmation text and email so your arrival feels easy.',
  'bring a photo id and a quick list of current medications or supplements.',
  'arrive about 10 minutes early so we can settle in and review your goals together.',
  'wear something comfortable, especially if we are treating face, neck, or body areas.',
  'come with your questions. we love walking you through every step before we begin.',
] as const;

const firstVisitExperiences = [
  {
    name: 'signature hydrafacial',
    note: 'a gentle, high-impact reset for texture, hydration, and glow.',
  },
  {
    name: 'laser hair removal intro',
    note: 'a simple starting session with our gold-standard laser approach.',
  },
  {
    name: 'vitamin injection',
    note: 'an easy wellness boost your provider can personalize to your goals.',
  },
  {
    name: 'custom consultation roadmap',
    note: 'your good, better, best options mapped clearly so you can decide with confidence.',
  },
] as const;

export default function WelcomeClient() {
  return (
    <main className="bg-rani-cream">
      <section className="relative overflow-hidden bg-rani-navy py-20 sm:py-28">
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-rani-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-rani-gold/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-rani-gold">🪷 welcome guide</p>
          <h1 className="mt-5 font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
            welcome to the rani family, angel
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed text-white/80 sm:text-lg">
            we are so happy you are here. this page is your calm little orientation so you can walk in feeling ready,
            supported, and excited for your first visit.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center font-heading text-3xl font-bold text-rani-navy sm:text-4xl">
            what to expect on your first visit
          </h2>

          <div className="mt-10 rounded-2xl border border-rani-border bg-white p-6 sm:p-8">
            <ul className="space-y-4">
              {firstVisitChecklist.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rani-gold" />
                  <p className="font-body text-sm leading-relaxed text-rani-text">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <article className="rounded-2xl border border-rani-border bg-rani-cream p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-rani-navy">a little about rani</h2>
            <p className="mt-4 font-body text-sm leading-relaxed text-rani-text">
              we are a physician-supervised clinic in {clinicInfo.address.full}. we opened in {clinicInfo.established} as a
              woman-owned business with one goal, make advanced aesthetic and wellness care feel precise, warm, and deeply
              personal.
            </p>
          </article>

          <article className="rounded-2xl border border-rani-border bg-rani-cream p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-rani-navy">meet your medical director</h2>
            <p className="mt-4 font-body text-sm leading-relaxed text-rani-text">
              {clinicInfo.medicalDirector.name}, {clinicInfo.medicalDirector.specialty.toLowerCase()}, oversees all medical
              protocols at rani so every injection, laser plan, and wellness pathway is clinically grounded and carefully
              supervised.
            </p>
          </article>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-heading text-3xl font-bold text-rani-navy sm:text-4xl">
            what you might experience first
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {firstVisitExperiences.map((experience) => (
              <article key={experience.name} className="rounded-2xl border border-rani-border bg-white p-6">
                <h3 className="font-body text-lg font-semibold text-rani-navy">{experience.name}</h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-rani-muted">{experience.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rani-border bg-white py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-body text-base text-rani-navy sm:text-lg">
            if you have not booked yet, we can hold your first visit with love 💛
          </p>
          <div className="mt-6">
            <Link
              href={clinicInfo.booking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-rani-gold px-8 py-3.5 font-body text-sm font-semibold text-rani-navy transition hover:bg-rani-gold-light"
            >
              book your first visit ✨
            </Link>
          </div>
          <p className="mt-5 font-body text-sm text-rani-muted">with love, the rani team ✨</p>
        </div>
      </section>
    </main>
  );
}
