'use client';

import { useState } from 'react';

const FONTS = ['Inter', 'Playfair Display', 'Montserrat', 'Poppins', 'Lato', 'Roboto', 'Raleway', 'Merriweather', 'Nunito', 'DM Sans'];

export default function TenantBranding() {
  const [brand, setBrand] = useState({
    clinicName: 'Glow Medical Spa',
    tagline: 'Your Glow, Perfected',
    primary: '#C9A96E',
    secondary: '#0F1D2C',
    accent: '#E8D5B5',
    background: '#FFFFFF',
    headingFont: 'Playfair Display',
    bodyFont: 'Montserrat',
    domain: '',
    domainStatus: null as string | null,
    loginLayout: 'centered',
    showPoweredBy: true,
  });

  const update = (key: string, value: string | boolean) => setBrand(prev => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Customization</h1>
          <p className="text-gray-500">Make RaniOS your own with custom branding</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Preview</button>
          <button className="px-4 py-2 bg-[#C9A96E] text-white rounded-lg text-sm font-medium hover:bg-[#b89558]">Publish</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="space-y-6">
          {/* Clinic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinic Identity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <input type="text" value={brand.clinicName} onChange={e => update('clinicName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input type="text" value={brand.tagline} onChange={e => update('tagline', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-500">Drop logo here or click to upload (SVG, PNG)</div>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Color Theme</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'primary', label: 'Primary' },
                { key: 'secondary', label: 'Secondary' },
                { key: 'accent', label: 'Accent' },
                { key: 'background', label: 'Background' },
              ].map(c => (
                <div key={c.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{c.label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={(brand as Record<string, unknown>)[c.key] as string} onChange={e => update(c.key, e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                    <input type="text" value={(brand as Record<string, unknown>)[c.key] as string} onChange={e => update(c.key, e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Typography</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heading Font</label>
                <select value={brand.headingFont} onChange={e => update('headingFont', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Font</label>
                <select value={brand.bodyFont} onChange={e => update('bodyFont', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Domain</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <div className="flex gap-2">
                  <input type="text" value={brand.domain} onChange={e => update('domain', e.target.value)} placeholder="app.yourclinic.com" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <button className="px-4 py-2 bg-[#0F1D2C] text-white rounded-lg text-sm font-medium">Verify</button>
                </div>
              </div>
              <p className="text-xs text-gray-500">Add a CNAME record pointing to your-tenant.cname.ranios.com</p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Mock Login Page */}
            <div className="p-8 text-center" style={{ background: brand.secondary }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-3" style={{ background: brand.primary }} />
              <h3 className="text-white text-xl font-bold" style={{ fontFamily: brand.headingFont }}>{brand.clinicName}</h3>
              <p className="text-gray-300 text-sm mt-1" style={{ fontFamily: brand.bodyFont }}>{brand.tagline}</p>
            </div>
            <div className="p-6" style={{ background: brand.background }}>
              <div className="space-y-3">
                <input type="text" placeholder="Email" className="w-full border rounded-lg px-3 py-2 text-sm" readOnly />
                <input type="password" placeholder="Password" className="w-full border rounded-lg px-3 py-2 text-sm" readOnly />
                <button className="w-full py-2 rounded-lg text-white text-sm font-medium" style={{ background: brand.primary }}>Sign In</button>
              </div>
              {brand.showPoweredBy && (
                <p className="text-center text-xs text-gray-400 mt-4">Powered by RaniOS</p>
              )}
            </div>
          </div>

          {/* Color Swatches */}
          <div className="mt-4 flex gap-2">
            {[brand.primary, brand.secondary, brand.accent, brand.background].map((c, i) => (
              <div key={i} className="flex-1 h-8 rounded-lg border border-gray-200" style={{ background: c }} title={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
