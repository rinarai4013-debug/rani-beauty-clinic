'use client';

import { useState } from 'react';

const PRODUCTS = [
  {
    category: 'Skin Tightening',
    items: [
      {
        name: 'Tighten',
        ingredient: 'GHK-Cu 0.5%',
        price: 149,
        desc: 'Entry-level peptide skin tightening. Perfect for starting your skin journey.',
      },
      {
        name: 'Tighten Plus',
        ingredient: 'GHK-Cu 2%',
        price: 179,
        desc: 'Enhanced concentration for visible tightening results.',
        popular: true,
      },
      {
        name: 'Tighten Max',
        ingredient: 'GHK-Cu 4%',
        price: 199,
        desc: 'Maximum strength for patients with significant skin laxity from weight loss.',
      },
    ],
  },
  {
    category: 'Cellular Rejuvenation',
    items: [
      {
        name: 'NADvantage',
        ingredient: 'NAD+ 10%',
        price: 149,
        desc: 'NAD+ glow cream for cellular rejuvenation and radiant, youthful skin.',
      },
    ],
  },
  {
    category: 'Anti-Aging',
    items: [
      {
        name: 'Illuminate',
        ingredient: 'Retinoid 0.05% / HA / Vitamin C',
        price: 99,
        desc: 'Gentle retinoid therapy with hydration and brightening.',
      },
      {
        name: 'Plump',
        ingredient: 'Retinoid 0.05% / HA 0.2%',
        price: 99,
        desc: 'Retinoid with hyaluronic acid for plumping and fine line reduction.',
      },
      {
        name: 'Plump Max',
        ingredient: 'Retinoid 0.1% / Niacinamide / HA',
        price: 149,
        desc: 'Advanced retinoid with niacinamide for comprehensive anti-aging.',
        popular: true,
      },
    ],
  },
  {
    category: 'Brightening',
    items: [
      {
        name: 'Glow',
        ingredient: 'Kojic Acid 5% / HA / Vitamin C',
        price: 99,
        desc: 'Brightening cream for uneven skin tone and dullness.',
      },
      {
        name: 'Corrector',
        ingredient: 'Hydroquinone 6%',
        price: 99,
        desc: 'Targeted treatment for dark spots and hyperpigmentation.',
      },
      {
        name: 'Miracle',
        ingredient: 'HQ 4% / Retinoid / Kojic Acid',
        price: 99,
        desc: 'Triple-action brightening for stubborn hyperpigmentation.',
      },
    ],
  },
  {
    category: 'Texture & Redness',
    items: [
      {
        name: 'Renew',
        ingredient: 'Azelaic Acid 10% / Niacinamide',
        price: 99,
        desc: 'Smoothing treatment for texture, redness, and mild rosacea.',
      },
      {
        name: 'Erase',
        ingredient: 'Retinoid 0.1% / Clindamycin 2%',
        price: 99,
        desc: 'Medical-grade acne treatment with retinoid and antibiotic.',
      },
    ],
  },
  {
    category: 'Hair Restoration',
    items: [
      {
        name: 'ManeTain',
        ingredient: 'Minoxidil 5% / Finasteride / Retinoid / Vitamin E',
        price: 149,
        desc: 'Prescription hair restoration spray for thinning hair.',
      },
    ],
  },
];

export default function RxSkincarePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    concern: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: `Rx Skincare Lead — Primary concern: ${formData.concern}`,
          source: 'rx-skincare-landing-page',
        }),
      });
    } catch {
      // Still show success
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="bg-[#F8F6F1]">
      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1D2C] via-[#1B2A4A] to-[#0F1D2C] opacity-80" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-sans text-[#C9A96E] uppercase tracking-[0.2em] text-sm mb-4">
            Prescription Skincare
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
            Medical-Grade Results.{' '}
            <span className="text-[#C9A96E]">Prescribed for You.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Custom-compounded by a licensed pharmacy. Prescribed by our physician.
            These are not drugstore products.
          </p>
          <a
            href="#consult"
            className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-8 py-4 rounded-lg hover:bg-[#D4B86A] transition text-lg"
          >
            Schedule Your Consultation
          </a>
        </div>
      </section>

      {/* Why Rx */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#0F1D2C] mb-12">
            Why <span className="text-[#C9A96E]">Prescription</span> Skincare?
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#C9A96E] text-2xl">Rx</span>
              </div>
              <h3 className="font-semibold text-[#0F1D2C] mb-2">Higher Concentrations</h3>
              <p className="text-gray-600 text-sm">
                Active ingredients at therapeutic levels that drugstore products can&apos;t legally contain.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#C9A96E] text-2xl">🧬</span>
              </div>
              <h3 className="font-semibold text-[#0F1D2C] mb-2">Custom Compounded</h3>
              <p className="text-gray-600 text-sm">
                Made specifically for your skin by a licensed 503A compounding pharmacy. Not mass-produced.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#C9A96E] text-2xl">👩‍⚕️</span>
              </div>
              <h3 className="font-semibold text-[#0F1D2C] mb-2">Physician-Guided</h3>
              <p className="text-gray-600 text-sm">
                Your skincare protocol is designed by a medical provider who understands your skin and your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Menu */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#0F1D2C] mb-12">
            Our <span className="text-[#C9A96E]">Rx Skincare</span> Menu
          </h2>

          {PRODUCTS.map((cat) => (
            <div key={cat.category} className="mb-12">
              <h3 className="font-serif text-xl text-[#0F1D2C] mb-4 border-b border-[#C9A96E]/30 pb-2">
                {cat.category}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.items.map((item) => (
                  <div
                    key={item.name}
                    className={`rounded-xl p-5 border ${
                      item.popular
                        ? 'border-[#C9A96E] bg-[#C9A96E]/5'
                        : 'border-gray-200 bg-[#F8F6F1]'
                    }`}
                  >
                    {item.popular && (
                      <span className="text-[#C9A96E] text-xs uppercase tracking-wider font-semibold">
                        Most Popular
                      </span>
                    )}
                    <h4 className="font-semibold text-[#0F1D2C] text-lg">{item.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{item.ingredient}</p>
                    <p className="text-gray-600 text-sm mb-3">{item.desc}</p>
                    <p className="font-bold text-[#0F1D2C]">
                      ${item.price}
                      <span className="text-gray-500 font-normal text-sm">/jar</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-[#0F1D2C] rounded-xl p-6 sm:p-8 text-center mt-8">
            <p className="text-[#C9A96E] font-serif text-xl mb-2">
              Weight Loss Patient?
            </p>
            <p className="text-gray-300 mb-4">
              Our Tighten line with GHK-Cu peptide is specifically designed for patients losing weight.
              Start at Month 2 of your GLP-1 program to keep your skin firm as the pounds come off.
            </p>
            <a
              href="#consult"
              className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-6 py-3 rounded-lg hover:bg-[#D4B86A] transition"
            >
              Add Skincare to My Program
            </a>
          </div>
        </div>
      </section>

      {/* Consultation Form */}
      <section id="consult" className="py-16 sm:py-20 bg-[#0F1D2C]">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl text-center text-white mb-2">
            Book a <span className="text-[#C9A96E]">Skincare Consultation</span>
          </h2>
          <p className="text-center text-gray-400 mb-8">
            Tell us about your skin goals and we&apos;ll build your custom protocol.
          </p>

          {submitted ? (
            <div className="bg-[#1B2A4A] rounded-xl p-8 text-center">
              <p className="text-[#C9A96E] text-2xl font-serif mb-2">We&apos;ll Be in Touch!</p>
              <p className="text-gray-300">
                Our team will reach out within 24 hours with your personalized skincare recommendations.
                Call <a href="tel:4255394440" className="text-[#C9A96E] hover:underline">(425) 539-4440</a> anytime.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#1B2A4A] text-white border border-[#2D4A7A] focus:border-[#C9A96E] focus:outline-none placeholder:text-gray-500"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#1B2A4A] text-white border border-[#2D4A7A] focus:border-[#C9A96E] focus:outline-none placeholder:text-gray-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#1B2A4A] text-white border border-[#2D4A7A] focus:border-[#C9A96E] focus:outline-none placeholder:text-gray-500"
              />
              <select
                value={formData.concern}
                onChange={(e) => setFormData({ ...formData, concern: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#1B2A4A] text-white border border-[#2D4A7A] focus:border-[#C9A96E] focus:outline-none"
              >
                <option value="">Primary skin concern...</option>
                <option>Skin tightening (weight loss)</option>
                <option>Anti-aging / Fine lines</option>
                <option>Hyperpigmentation / Dark spots</option>
                <option>Acne / Texture</option>
                <option>Redness / Rosacea</option>
                <option>Hair thinning</option>
                <option>General glow-up</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C9A96E] text-[#0F1D2C] font-semibold py-4 rounded-lg hover:bg-[#D4B86A] transition disabled:opacity-50 text-lg"
              >
                {loading ? 'Submitting...' : 'Schedule Your Consultation'}
              </button>
              <p className="text-gray-500 text-xs text-center">
                All skincare products are compounded by a licensed pharmacy and prescribed by our physician.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#C9A96E] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#0F1D2C] font-serif text-xl mb-4">
            Your skin deserves better than drugstore.
          </p>
          <a
            href="tel:4255394440"
            className="inline-block bg-[#0F1D2C] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1B2A4A] transition"
          >
            Call (425) 539-4440
          </a>
        </div>
      </section>
    </div>
  );
}
