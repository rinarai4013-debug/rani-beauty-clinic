'use client';

import { useState } from 'react';

// =============================================================================
// White-Label Admin Page
// Theme editor, color picker, logo upload, typography, domain config, preview
// =============================================================================

const PRESET_THEMES = [
  { id: 'luxury', name: 'Luxury', primary: '#0F1D2C', secondary: '#C9A96E', accent: '#F3D6BE' },
  { id: 'medical', name: 'Medical', primary: '#1E40AF', secondary: '#0D9488', accent: '#F59E0B' },
  { id: 'wellness', name: 'Wellness', primary: '#059669', secondary: '#8B5CF6', accent: '#F97316' },
  { id: 'modern', name: 'Modern', primary: '#4F46E5', secondary: '#06B6D4', accent: '#EC4899' },
  { id: 'minimal', name: 'Minimal', primary: '#1F2937', secondary: '#6B7280', accent: '#3B82F6' },
];

const FONT_OPTIONS = [
  'Playfair Display', 'Inter', 'Lora', 'DM Sans', 'Poppins',
  'Montserrat', 'Work Sans', 'Raleway', 'Manrope', 'Cormorant Garamond',
];

const PREVIEW_MODES = ['desktop', 'tablet', 'mobile'] as const;

type PreviewMode = typeof PREVIEW_MODES[number];

export default function WhiteLabelPage() {
  const [activePreset, setActivePreset] = useState('luxury');
  const [primaryColor, setPrimaryColor] = useState('#0F1D2C');
  const [secondaryColor, setSecondaryColor] = useState('#C9A96E');
  const [accentColor, setAccentColor] = useState('#F3D6BE');
  const [headingFont, setHeadingFont] = useState('Playfair Display');
  const [bodyFont, setBodyFont] = useState('Montserrat');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'logos' | 'domain' | 'components'>('colors');
  const [subdomain, setSubdomain] = useState('my-clinic');
  const [customDomain, setCustomDomain] = useState('');
  const [logoFile, setLogoFile] = useState<string | null>(null);

  // Contrast check (simple visual indicator)
  const contrastOk = primaryColor !== '#FFFFFF' && primaryColor !== '#ffffff';

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESET_THEMES.find((p) => p.id === presetId);
    if (preset) {
      setActivePreset(presetId);
      setPrimaryColor(preset.primary);
      setSecondaryColor(preset.secondary);
      setAccentColor(preset.accent);
    }
  };

  const previewWidths: Record<PreviewMode, string> = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">White-Label Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Customize the branding, colors, typography, and domain for your tenant portal.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Reset to Default
          </button>
          <button className="px-5 py-2 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Editor */}
        <div className="lg:col-span-1 space-y-4">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm">
            <div className="flex gap-1">
              {(['colors', 'typography', 'logos', 'domain', 'components'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-xl transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-[#0F1D2C] text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-gray-900">Theme Presets</h3>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_THEMES.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      activePreset === preset.id
                        ? 'border-[#0F1D2C] bg-gray-50 ring-1 ring-[#0F1D2C]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.primary }} />
                      <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.secondary }} />
                      <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.accent }} />
                    </div>
                    <span className="text-[10px] text-gray-500">{preset.name}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-gray-900">Custom Colors</h3>

                {[
                  { label: 'Primary', value: primaryColor, setter: setPrimaryColor, desc: 'Main brand color for buttons and headers' },
                  { label: 'Secondary', value: secondaryColor, setter: setSecondaryColor, desc: 'Supporting color for accents' },
                  { label: 'Accent', value: accentColor, setter: setAccentColor, desc: 'Highlight and CTA color' },
                ].map((color) => (
                  <div key={color.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-700">{color.label}</label>
                      <span className="text-[10px] text-gray-400 font-mono">{color.value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color.value}
                        onChange={(e) => color.setter(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                      <input
                        type="text"
                        value={color.value}
                        onChange={(e) => color.setter(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{color.desc}</p>
                  </div>
                ))}

                {/* Contrast Warning */}
                <div className={`p-3 rounded-xl text-xs ${contrastOk ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  <div className="flex items-center gap-2">
                    <span>{contrastOk ? 'AA' : '!'}</span>
                    <span>
                      {contrastOk
                        ? 'Text contrast passes WCAG AA standards'
                        : 'Warning: Text contrast may not meet accessibility standards'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-gray-900">Typography</h3>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Heading Font</label>
                <select
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
                <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                  <p style={{ fontFamily: headingFont }} className="text-xl font-bold text-gray-900">
                    Heading Preview
                  </p>
                  <p style={{ fontFamily: headingFont }} className="text-sm text-gray-500 mt-1">
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Body Font</label>
                <select
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
                <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                  <p style={{ fontFamily: bodyFont }} className="text-sm text-gray-700 leading-relaxed">
                    Body text preview. This is how your paragraph text, descriptions, and general content will appear throughout the platform.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-700 mb-3">Type Scale Preview</p>
                <div className="space-y-2">
                  {['3xl', '2xl', 'xl', 'lg', 'base', 'sm', 'xs'].map((size) => (
                    <div key={size} className="flex items-baseline gap-3">
                      <span className="text-[10px] text-gray-400 w-8 flex-shrink-0">{size}</span>
                      <p className={`text-${size} text-gray-900`} style={{ fontFamily: size.includes('x') || size === 'lg' ? headingFont : bodyFont }}>
                        Sample Text
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Logos Tab */}
          {activeTab === 'logos' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-gray-900">Logo Management</h3>

              {[
                { label: 'Primary Logo', accept: '.svg,.png,.webp', hint: 'SVG, PNG, or WebP. Max 2MB. Recommended: 180x48px', id: 'primary' },
                { label: 'Icon / Square Logo', accept: '.svg,.png,.webp', hint: 'Square format. Max 512KB. Recommended: 64x64px', id: 'icon' },
                { label: 'Favicon', accept: '.ico,.png,.svg', hint: 'ICO or PNG. Max 256KB. 32x32px', id: 'favicon' },
                { label: 'Dark Mode Logo', accept: '.svg,.png,.webp', hint: 'Light-colored version for dark backgrounds', id: 'dark' },
              ].map((logo) => (
                <div key={logo.id}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{logo.label}</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition-colors cursor-pointer">
                    <input type="file" accept={logo.accept} className="hidden" id={`logo-${logo.id}`} />
                    <label htmlFor={`logo-${logo.id}`} className="cursor-pointer">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-500">Click to upload</p>
                      <p className="text-[10px] text-gray-400 mt-1">{logo.hint}</p>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Domain Tab */}
          {activeTab === 'domain' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-gray-900">Domain Configuration</h3>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Subdomain</label>
                <div className="flex items-center gap-0">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                  />
                  <span className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-r-xl text-sm text-gray-500">
                    .ranios.com
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Your portal: https://{subdomain}.ranios.com
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Custom Domain (Enterprise)</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="app.yourclinic.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                />
              </div>

              {customDomain && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-700">DNS Records Required</h4>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-mono text-gray-700">CNAME</p>
                        <p className="text-[10px] text-gray-400">{customDomain}</p>
                      </div>
                      <p className="text-xs font-mono text-gray-500">cname.vercel-dns.com</p>
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-mono text-gray-700">TXT</p>
                        <p className="text-[10px] text-gray-400">_vercel.{customDomain}</p>
                      </div>
                      <p className="text-xs font-mono text-gray-500 truncate max-w-[120px]">vc-domain-verify=...</p>
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                    </div>
                  </div>
                  <button className="w-full py-2 text-xs font-medium text-[#0F1D2C] border border-[#0F1D2C] rounded-xl hover:bg-[#0F1D2C]/5 transition-colors">
                    Verify DNS Records
                  </button>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">SSL Certificate</p>
                    <p className="text-[10px] text-gray-400">Auto-provisioned via Let&apos;s Encrypt</p>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Components Tab */}
          {activeTab === 'components' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-gray-900">Component Styles</h3>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Button Style</p>
                <div className="grid grid-cols-3 gap-2">
                  {['rounded-lg', 'rounded-xl', 'rounded-full'].map((radius) => (
                    <button
                      key={radius}
                      className={`py-2 px-3 text-xs font-medium text-white ${radius} transition-all`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      Button
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Card Style</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl border border-gray-200">
                    <p className="text-xs font-medium text-gray-700">Bordered</p>
                    <p className="text-[10px] text-gray-400">Clean with border</p>
                  </div>
                  <div className="p-3 rounded-xl shadow-md">
                    <p className="text-xs font-medium text-gray-700">Shadow</p>
                    <p className="text-[10px] text-gray-400">Elevated with shadow</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Input Style</p>
                <input
                  type="text"
                  placeholder="Sample input field"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Navigation Style</p>
                <div className="space-y-2">
                  {['Light (white)', 'Dark (primary color)', 'Transparent + blur'].map((style) => (
                    <label key={style} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="navStyle" className="w-3.5 h-3.5" />
                      <span className="text-xs text-gray-600">{style}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            {/* Preview Controls */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Live Preview</h3>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {PREVIEW_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                      previewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Frame */}
            <div className="bg-gray-50 rounded-xl p-4 overflow-hidden">
              <div
                className={`mx-auto bg-white rounded-lg overflow-hidden shadow-lg transition-all ${previewWidths[previewMode]}`}
                style={{ maxWidth: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '100%' }}
              >
                {/* Preview Nav */}
                <div
                  className="h-14 flex items-center px-4 border-b border-gray-100"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: secondaryColor }}>
                      <span className="text-[10px] font-bold" style={{ color: primaryColor }}>C</span>
                    </div>
                    <span className="text-sm font-bold text-white" style={{ fontFamily: headingFont }}>
                      Your Clinic
                    </span>
                  </div>
                </div>

                {/* Preview Hero */}
                <div className="p-8 text-center" style={{ backgroundColor: primaryColor }}>
                  <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: headingFont }}>
                    Welcome to Your Dashboard
                  </h2>
                  <p className="text-sm text-white/70 mb-4" style={{ fontFamily: bodyFont }}>
                    AI-powered operations for your practice
                  </p>
                  <button
                    className="px-6 py-2.5 rounded-xl text-sm font-bold"
                    style={{ backgroundColor: secondaryColor, color: primaryColor }}
                  >
                    Get Started
                  </button>
                </div>

                {/* Preview Cards */}
                <div className="p-6 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Revenue', value: '$42,800', change: '+23%' },
                    { label: 'Clients', value: '2,147', change: '+12%' },
                    { label: 'Bookings', value: '384', change: '+8%' },
                    { label: 'Health Score', value: '87/100', change: 'Good' },
                  ].map((card) => (
                    <div key={card.label} className="p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-500" style={{ fontFamily: bodyFont }}>
                        {card.label}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5" style={{ fontFamily: headingFont }}>
                        {card.value}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: accentColor, color: primaryColor }}
                      >
                        {card.change}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Preview Footer */}
                <div className="px-6 py-3 border-t border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400" style={{ fontFamily: bodyFont }}>
                    Powered by RaniOS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
