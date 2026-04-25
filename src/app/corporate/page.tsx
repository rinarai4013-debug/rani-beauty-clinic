import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Corporate Memberships for Seattle Employers | Rani Beauty Clinic',
  description: 'Give your team a benefit they\'ll actually use. $179/employee/month (vs $199 retail) with 5+ enrollments. Predictable invoice, zero admin, quarterly utilization reporting.',
  openGraph: {
    title: 'Corporate Angel Glow Up · Memberships for Teams',
    description: 'A differentiated retention benefit for Seattle-area employers. From $179/employee/month.',
  },
};

export default function CorporatePage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white pt-32 pb-20 md:pt-28 md:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-heading)] mb-6">
            A <span className="text-[#C9A96E]">retention benefit</span> your team will actually use
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Rani Beauty Clinic corporate memberships for Seattle-area employers.
            $179 per employee per month, minimum 5 enrollments, invoiced monthly.
          </p>
          <Link
            href="#contact"
            className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-8 py-4 rounded hover:bg-[#B89658] transition text-lg"
          >
            Request a 15-min call
          </Link>
        </div>
      </section>

      {/* Value Props */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] text-center mb-4">
          Why employers choose this over a gym card
        </h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
          Because employees actually redeem it. Utilization on corporate Rani memberships
          averages 85% vs. 18% on the typical wellness stipend.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl text-[#C9A96E] mb-3">·</div>
            <h3 className="text-xl font-semibold text-[#0F1D2C] mb-2">
              Differentiated
            </h3>
            <p className="text-gray-700">
              Every Seattle tech company offers a gym card. None of them offer a
              Hydrafacial membership. Stand out in recruiting conversations.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl text-[#C9A96E] mb-3">·</div>
            <h3 className="text-xl font-semibold text-[#0F1D2C] mb-2">
              Predictable
            </h3>
            <p className="text-gray-700">
              One invoice per month. No per-transaction surprises. No HSA paperwork.
              Budget once, forget it.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl text-[#C9A96E] mb-3">·</div>
            <h3 className="text-xl font-semibold text-[#0F1D2C] mb-2">
              Zero admin
            </h3>
            <p className="text-gray-700">
              We handle employee enrollment, billing, utilization tracking, and quarterly
              reporting. Your HR team does nothing after sign-off.
            </p>
          </div>
        </div>
      </section>

      {/* The Benefit */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] text-center mb-12">
            What each enrolled employee gets
          </h2>

          <div className="bg-[#FAF8F5] rounded-lg p-8 md:p-12">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
                  Corporate HALO
                </h3>
                <p className="text-[#C9A96E] italic">Same benefits as retail HALO · $179/employee/month</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 line-through">$199 retail</p>
                <p className="text-3xl font-bold text-[#0F1D2C]">$179</p>
                <p className="text-xs text-gray-500">per employee · per month</p>
              </div>
            </div>

            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#C9A96E] mr-3 text-xl leading-none mt-1">·</span>
                <span><strong>1 Express Hydrafacial per month</strong> · $99 retail value · 60 minutes of deep cleansing, serum delivery, glow finish</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C9A96E] mr-3 text-xl leading-none mt-1">·</span>
                <span><strong>1 small-area laser hair removal per month</strong> · upper lip, chin, sideburns, cheeks · up to $79 value</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C9A96E] mr-3 text-xl leading-none mt-1">·</span>
                <span><strong>5% member credit on everything else</strong> · stacks across 128+ services</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C9A96E] mr-3 text-xl leading-none mt-1">·</span>
                <span><strong>Priority booking</strong> · 3 days early access before appointments open publicly</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C9A96E] mr-3 text-xl leading-none mt-1">·</span>
                <span><strong>Member-only events</strong> · quarterly gatherings at the Renton clinic</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 italic mt-6 text-center">
            Employees can also enroll their spouses or partners at retail rate ($199/month).
            Typical 30·50% partner attach creates additional value for the household.
          </p>
        </div>
      </section>

      {/* Math */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] text-center mb-12">
          The economics
        </h2>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-[#0F1D2C] mb-4">For a 10-employee enrollment</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Monthly cost:</strong> $1,790</li>
                <li><strong>Annual cost:</strong> $21,480</li>
                <li><strong>Retail value delivered:</strong> $23,880 ($199 × 10 × 12)</li>
                <li><strong>Cost per employee / year:</strong> $2,148</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#0F1D2C] mb-4">Comparable benefits</h3>
              <ul className="space-y-2 text-gray-700">
                <li>Gym membership: $800·$1,500/employee/year · 18% typical utilization</li>
                <li>Mental health app: $200·$400/employee/year · 15% utilization</li>
                <li>Meal stipend: $2,400·$3,600/employee/year · varies</li>
                <li><strong>Rani Corporate: $2,148/employee/year · 85% utilization</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Structure Options */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] text-center mb-12">
            How employers structure it
          </h2>

          <div className="space-y-6">
            <div className="border-l-4 border-[#C9A96E] pl-6 py-4">
              <h3 className="text-xl font-semibold text-[#0F1D2C] mb-2">Full employer-paid benefit</h3>
              <p className="text-gray-700">
                Employer covers the full $179/month per enrolled employee. Most common
                structure for premium employers. Net cost: ~$2,148/employee/year.
              </p>
            </div>
            <div className="border-l-4 border-[#C9A96E] pl-6 py-4">
              <h3 className="text-xl font-semibold text-[#0F1D2C] mb-2">50/50 split</h3>
              <p className="text-gray-700">
                Employer pays $89/month, employee contributes $90/month via payroll deduction.
                Lower employer cost, still positions as a premium benefit.
              </p>
            </div>
            <div className="border-l-4 border-[#C9A96E] pl-6 py-4">
              <h3 className="text-xl font-semibold text-[#0F1D2C] mb-2">Employee-paid (group rate)</h3>
              <p className="text-gray-700">
                Employees self-enroll at the discounted $179 rate via payroll deduction.
                Zero cost to employer. Still meaningful as a negotiated group benefit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section id="contact" className="bg-[#0F1D2C] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] mb-6">
            15 minutes to learn more
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Rina will walk you through the pilot structure, share anonymized utilization data
            from other Seattle employers, and answer anything about your specific company.
            No sales pitch · just a conversation.
          </p>
          <div className="space-y-4">
            <a
              href="mailto:rina@ranibeautyclinic.com?subject=Corporate%20Membership%20Inquiry&body=Hi%20Rina%2C%0A%0AI%27d%20like%20to%20learn%20more%20about%20the%20corporate%20membership%20program%20for%20our%20team.%0A%0ACompany%20name%3A%20%0AEmployee%20count%3A%20%0ABest%20time%20to%20chat%3A%20%0A%0AThanks%2C%0A"
              className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-8 py-4 rounded hover:bg-[#B89658] transition text-lg"
            >
              Email rina@ranibeautyclinic.com
            </a>
            <p className="text-gray-400">
              or call <a href="tel:+14255394440" className="text-[#C9A96E] hover:underline">425·539·4440</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
