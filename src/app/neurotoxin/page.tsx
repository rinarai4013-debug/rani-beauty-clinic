import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Botox & Neurotoxin · Coming to Rani Beauty Clinic | Renton, WA',
  description: 'Join the waitlist for neurotoxin injections at Rani Beauty Clinic · Botox, Dysport, Xeomin, Jeuveau. Physician-supervised. Founding-client pricing for the first 30 days.',
  openGraph: {
    title: 'Neurotoxin · Coming Soon to Rani Beauty Clinic',
    description: 'Join the waitlist. Founding-client pricing. Physician-supervised by Dr. Alexander Landfield.',
  },
};

export default function NeurotoxinPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white pt-32 pb-20 md:pt-28 md:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-[#C9A96E] text-[#0F1D2C] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded mb-6">
            Launching Q3 2026
          </span>
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-heading)] mb-6">
            Botox, Dysport, <span className="text-[#C9A96E]">and the pursuit of ease</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Our physician-supervised neurotoxin service is opening later this year.
            Join the waitlist · founding clients receive 10% off for the first 30 days.
          </p>
          <Link
            href="#waitlist"
            className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-8 py-4 rounded hover:bg-[#B89658] transition text-lg"
          >
            Join the Waitlist
          </Link>
        </div>
      </section>

      {/* What to Expect */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] text-center mb-12">
          What to expect when we open
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-xl font-semibold text-[#0F1D2C] mb-4">Four neurotoxin options</h3>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Botox</strong> · the original and most studied</li>
              <li><strong>Dysport</strong> · faster onset, smoother diffusion</li>
              <li><strong>Xeomin</strong> · naked toxin, lower immunogenicity risk</li>
              <li><strong>Jeuveau</strong> · aesthetic-only formulation</li>
            </ul>
            <p className="text-sm text-gray-500 italic mt-4">
              Mom will help you select based on your goals, prior experience, and what
              your facial muscles respond to.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-xl font-semibold text-[#0F1D2C] mb-4">Treatment areas</h3>
            <ul className="space-y-2 text-gray-700">
              <li>Glabella (11s) · frown lines between the brows</li>
              <li>Frontalis · forehead lines</li>
              <li>Crow&apos;s feet · around the eyes</li>
              <li>Bunny lines · the nose bridge</li>
              <li>Gummy smile correction</li>
              <li>Masseter reduction · jawline slimming, TMJ relief</li>
              <li>Platysmal bands · neck lift</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Clinical Standards */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] text-center mb-12">
            Our clinical standards
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl text-[#C9A96E] font-bold mt-1">·</span>
              <div>
                <h3 className="font-semibold text-[#0F1D2C]">Physician supervision</h3>
                <p className="text-gray-700">
                  All neurotoxin treatments are administered under the standing order of
                  Dr. Alexander Landfield, MD · our Medical Director · following a
                  Good Faith Evaluation per WA state regulation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-3xl text-[#C9A96E] font-bold mt-1">·</span>
              <div>
                <h3 className="font-semibold text-[#0F1D2C]">Dedicated injector</h3>
                <p className="text-gray-700">
                  Mom is an MA-P with advanced injector training (Allergan Medical Institute
                  and Galderma Advanced Injector Program) and 100+ supervised live
                  injections before solo practice.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-3xl text-[#C9A96E] font-bold mt-1">·</span>
              <div>
                <h3 className="font-semibold text-[#0F1D2C]">Two-week follow-up included</h3>
                <p className="text-gray-700">
                  Every treatment includes a 2-week check-in visit. Touch-ups within that
                  window (up to 10 units) are included at no additional charge.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-3xl text-[#C9A96E] font-bold mt-1">·</span>
              <div>
                <h3 className="font-semibold text-[#0F1D2C]">Before / after documentation</h3>
                <p className="text-gray-700">
                  Clinical photos at rest and in animation at every visit. Stored in your
                  HIPAA-protected chart so you can see your own progression over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] text-center mb-4">
          Expected pricing
        </h2>
        <p className="text-center text-gray-600 mb-12">
          Waitlist members get the first month&apos;s pricing, which will be 10% below these rates.
        </p>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0F1D2C] text-white">
              <tr>
                <th className="text-left p-4 font-semibold">Service</th>
                <th className="text-right p-4 font-semibold">Units</th>
                <th className="text-right p-4 font-semibold">Expected price</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="p-4">Botox · small area (glabella only)</td>
                <td className="text-right p-4">20·25</td>
                <td className="text-right p-4 font-semibold">$299</td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="p-4">Botox · upper face</td>
                <td className="text-right p-4">40·50</td>
                <td className="text-right p-4 font-semibold">$579</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4">Botox · full face</td>
                <td className="text-right p-4">60·80</td>
                <td className="text-right p-4 font-semibold">$879</td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="p-4">Dysport · 1 area</td>
                <td className="text-right p-4">40·50</td>
                <td className="text-right p-4 font-semibold">$289</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4">Dysport · upper face</td>
                <td className="text-right p-4">70·90</td>
                <td className="text-right p-4 font-semibold">$549</td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="p-4">Masseter (per side) · TMJ / jawline slimming</td>
                <td className="text-right p-4">40·60</td>
                <td className="text-right p-4 font-semibold">$599·$899</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-center text-sm text-gray-500 italic mt-6">
          Member pricing · ROYAL AURA members receive 15% off, ELITE AURA 10%, GLOW 5%.
          Membership pricing stacks with waitlist founding-client pricing.
        </p>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="bg-[#0F1D2C] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] mb-6">
            Join the waitlist
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            You&apos;ll be first to know when we open. Founding clients get 10% off
            for the first 30 days. No commitment · just early access.
          </p>

          <form
            action="/api/contact"
            method="POST"
            className="bg-white rounded-lg p-6 md:p-8 text-left text-gray-900 max-w-md mx-auto"
          >
            <input type="hidden" name="formType" value="neurotoxin-waitlist" />
            <input type="hidden" name="interestTag" value="interest:botox-fillers" />

            <div className="mb-4">
              <label htmlFor="firstName" className="block text-sm font-semibold mb-1">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#C9A96E]"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-semibold mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#C9A96E]"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-semibold mb-1">Phone (optional · for SMS launch alert)</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#C9A96E]"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="interest" className="block text-sm font-semibold mb-1">I&apos;m most interested in</label>
              <select
                id="interest"
                name="interest"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#C9A96E]"
              >
                <option>Botox · first time or returning</option>
                <option>Dysport · looking for faster onset</option>
                <option>Masseter / jawline slimming</option>
                <option>Not sure yet · want a consult first</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="flex items-start text-sm">
                <input type="checkbox" name="smsConsent" className="mr-2 mt-1" />
                <span>I consent to SMS from Rani Beauty Clinic about the launch. Reply STOP anytime to opt out.</span>
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-[#0F1D2C] text-white font-semibold px-6 py-3 rounded hover:bg-[#1A2D42] transition"
            >
              Join Waitlist
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
