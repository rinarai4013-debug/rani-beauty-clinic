import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Digital Gift Cards | Rani Beauty Clinic',
  description: 'Give the gift of Rani · digital gift cards from $199. Signature Hydrafacial, skin transformation packages, and Angel Glow Up memberships. Instant delivery, redeemable for 12 months.',
  openGraph: {
    title: 'Give the Gift of Rani · Digital Gift Cards',
    description: 'Three curated gift experiences from $199 to $999. Instant digital delivery. Redeemable for 12 months.',
    images: ['/og/gifts-hero.jpg'],
  },
};

type GiftTier = {
  name: string;
  price: number;
  tagline: string;
  includes: string[];
  positioning: string;
  slug: string;
};

const GIFT_TIERS: GiftTier[] = [
  {
    name: 'Gift of Glow',
    price: 199,
    tagline: 'The first visit she\'ll remember',
    includes: [
      '1 Signature Hydrafacial · 60 minutes',
      'Deep pore cleansing, serum delivery, finishing glow',
      'Redeemable for 12 months',
    ],
    positioning: 'For the mom, sister, or friend who\'s never treated herself to a medspa visit. Our most-requested service, as a first introduction.',
    slug: 'glow',
  },
  {
    name: 'Gift of Radiance',
    price: 499,
    tagline: 'A two-month skin ritual',
    includes: [
      '2 Signature Hydrafacials',
      '1 VI Peel (any variant)',
      'Post-peel home kit included',
      'Redeemable for 12 months',
    ],
    positioning: 'For someone who already has a skincare routine and wants to elevate it. Results that compound across two months.',
    slug: 'radiance',
  },
  {
    name: 'Gift of Transformation',
    price: 999,
    tagline: 'The full skin reset',
    includes: [
      '1 RF Microneedling Full Face ($750 value)',
      '1 Signature Hydrafacial',
      '1 ND:Yag Laser Facial (any type)',
      'Before / after photo documentation',
      'Redeemable for 12 months',
    ],
    positioning: 'For the person in your life who deserves a true transformation. Our flagship gift, chosen for moments that matter.',
    slug: 'transformation',
  },
];

export default function GiftsPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white pt-32 pb-20 md:pt-28 md:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-heading)] mb-6">
            Give the <span className="text-[#C9A96E]">Gift</span> of Rani
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Three curated digital gift cards. Instant delivery. Redeemable for 12 months.
            Something she&apos;ll actually use · not another candle.
          </p>
          <Link
            href="#gifts"
            className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-8 py-4 rounded hover:bg-[#B89658] transition text-lg"
          >
            Choose a Gift
          </Link>
        </div>
      </section>

      {/* Gift Cards */}
      <section id="gifts" className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {GIFT_TIERS.map((tier) => (
            <article
              key={tier.slug}
              className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
            >
              <div className="bg-[#0F1D2C] text-white p-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-heading)]">
                  {tier.name}
                </h2>
                <p className="text-[#C9A96E] italic mt-2">{tier.tagline}</p>
                <div className="text-5xl font-bold mt-6">${tier.price}</div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.includes.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-[#C9A96E] mr-3 text-xl leading-none mt-1">·</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-600 italic border-t border-gray-200 pt-4 mb-6">
                  {tier.positioning}
                </p>
                <a
                  href={`/api/gifts/purchase?tier=${tier.slug}&amount=${tier.price}`}
                  className="block w-full bg-[#0F1D2C] text-white text-center font-semibold px-6 py-3 rounded hover:bg-[#1A2D42] transition"
                >
                  Purchase Gift
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-10 max-w-2xl mx-auto">
          Gift cards are delivered instantly via email to the recipient you specify. Each is
          redeemable for the stated service within 12 months. Unused value can be applied to
          any service at Rani Beauty Clinic.
        </p>
      </section>

      {/* Gift Memberships */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-4 text-center">
            Or gift a membership
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            For the person who deserves ongoing care, not a one-time visit.
            Angel Glow Up memberships as 3, 6, or 12-month digital gift blocks.
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="border border-gray-200 rounded p-6">
              <h3 className="font-bold text-lg text-[#0F1D2C]">Gift HALO · 3 months</h3>
              <p className="text-3xl font-bold text-[#C9A96E] my-2">$597</p>
              <p className="text-gray-700">Monthly Express Hydrafacial + monthly small-area laser hair removal + 5% member credit + priority booking. 3 months of the Rani ritual.</p>
            </div>
            <div className="border border-gray-200 rounded p-6">
              <h3 className="font-bold text-lg text-[#0F1D2C]">Gift GLOW · 6 months</h3>
              <p className="text-3xl font-bold text-[#C9A96E] my-2">$2,094</p>
              <p className="text-gray-700">Monthly Signature Hydrafacial + $149 LHR credit + 10% member credit + 1-week priority booking. Half a year of transformation.</p>
            </div>
            <div className="border border-gray-200 rounded p-6">
              <h3 className="font-bold text-lg text-[#0F1D2C]">Gift ELITE AURA · 12 months</h3>
              <p className="text-3xl font-bold text-[#C9A96E] my-2">$5,490</p>
              <p className="text-gray-700">Everything in GLOW + monthly advanced treatment credit (Laser Facial or RF Microneedling) + 15% member credit + VIP booking. A full year of the premium tier.</p>
            </div>
            <div className="border border-gray-200 rounded p-6">
              <h3 className="font-bold text-lg text-[#0F1D2C]">Gift ROYAL AURA · 12 months</h3>
              <p className="text-3xl font-bold text-[#C9A96E] my-2">$9,990</p>
              <p className="text-gray-700">Our flagship · 2 Hydrafacials monthly, unlimited laser hair removal, $750 advanced credit, concierge SMS access, private appointment windows. The gift for the person who has everything.</p>
            </div>
          </div>

          <div className="text-center mt-10">
            <a
              href="/api/gifts/membership-purchase"
              className="inline-block bg-[#0F1D2C] text-white font-semibold px-8 py-4 rounded hover:bg-[#1A2D42] transition"
            >
              Gift a Membership
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#FAF8F5] py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl text-[#C9A96E] font-bold mb-3">1</div>
              <h3 className="font-semibold text-lg text-[#0F1D2C] mb-2">Choose + pay</h3>
              <p className="text-gray-600">Pick a tier, enter the recipient&apos;s email and a personal note, checkout.</p>
            </div>
            <div>
              <div className="text-5xl text-[#C9A96E] font-bold mb-3">2</div>
              <h3 className="font-semibold text-lg text-[#0F1D2C] mb-2">Instant delivery</h3>
              <p className="text-gray-600">Recipient gets a beautifully designed digital gift card · immediately.</p>
            </div>
            <div>
              <div className="text-5xl text-[#C9A96E] font-bold mb-3">3</div>
              <h3 className="font-semibold text-lg text-[#0F1D2C] mb-2">They book</h3>
              <p className="text-gray-600">Redeemable at ranibeautyclinic.com/book within 12 months.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-[#0F1D2C] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-3">
            Need help choosing?
          </h3>
          <p className="text-gray-300 mb-6">
            Call Rina directly · she&apos;ll help you pick based on who the gift is for.
          </p>
          <a
            href="tel:+14255394440"
            className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-6 py-3 rounded hover:bg-[#B89658] transition"
          >
            425·539·4440
          </a>
        </div>
      </section>
    </main>
  );
}
