import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdCreativeProps {
  platform: 'instagram' | 'facebook' | 'google';
  headline: string;
  primaryText: string;
  cta: string;
  imageDescription: string;
  targetAudience: string;
  estimatedReach: string;
  estimatedCPL: string;
  score: number;
  variant: 'A' | 'B' | 'C';
  status: 'draft' | 'active' | 'paused' | 'testing';
}

// ─── Component ───────────────────────────────────────────────────────────────

const platformStyles: Record<string, { bg: string; text: string; label: string }> = {
  instagram: { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-white', label: 'Instagram' },
  facebook: { bg: 'bg-blue-600', text: 'text-white', label: 'Facebook' },
  google: { bg: 'bg-white border border-gray-200', text: 'text-gray-800', label: 'Google Ads' },
};

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  testing: 'bg-blue-100 text-blue-700',
};

function AdCreative(props: AdCreativeProps) {
  const { platform, headline, primaryText, cta, imageDescription, targetAudience, estimatedReach, estimatedCPL, score, variant, status } = props;
  const pConfig = platformStyles[platform];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-sm">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-[#0F1D2C]">Ad Creative</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">Variant {variant}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[status]}`}>{status}</span>
      </div>

      {/* Platform Preview */}
      <div className={`mx-4 mt-4 rounded-lg overflow-hidden ${pConfig.bg}`}>
        {/* Mock Image Area */}
        <div className="h-48 bg-gradient-to-br from-[#0F1D2C]/80 to-[#C9A96E]/40 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-white text-xs opacity-70 mb-2">{imageDescription}</p>
            <p className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
              {headline}
            </p>
          </div>
        </div>
        {/* Caption */}
        <div className={`px-4 py-3 ${platform === 'google' ? 'bg-white' : 'bg-white'}`}>
          <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{primaryText}</p>
          <button className="mt-2 text-xs bg-[#C9A96E] text-white px-4 py-1.5 rounded font-medium w-full">
            {cta}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <div className="text-center">
          <p className="text-xs text-gray-500">Ad Score</p>
          <p className={`text-lg font-bold ${score >= 80 ? 'text-green-700' : score >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
            {score}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Est. Reach</p>
          <p className="text-sm font-bold text-[#0F1D2C]">{estimatedReach}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Est. CPL</p>
          <p className="text-sm font-bold text-[#0F1D2C]">{estimatedCPL}</p>
        </div>
      </div>

      {/* Target */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-400">
          Target: <span className="text-gray-600">{targetAudience}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
        <div className="flex gap-2">
          <button className="text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-600">Edit Copy</button>
          <button className="text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-600">A/B Test</button>
        </div>
        <button className="text-xs bg-[#0F1D2C] text-white px-3 py-1 rounded-lg font-medium">Launch</button>
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof AdCreative> = {
  title: 'Marketing/AdCreative',
  component: AdCreative,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
  argTypes: {
    platform: { control: 'select', options: ['instagram', 'facebook', 'google'] },
    status: { control: 'select', options: ['draft', 'active', 'paused', 'testing'] },
    variant: { control: 'select', options: ['A', 'B', 'C'] },
  },
};

export default meta;
type Story = StoryObj<typeof AdCreative>;

export const Default: Story = {
  args: {
    platform: 'instagram',
    headline: 'Your Weight Loss Journey Starts Here',
    primaryText: 'Medical weight management with GLP-1 therapy at Rani Beauty Clinic. Physician-supervised, personalized treatment plans with proven results. See what 10-15% body weight reduction feels like.',
    cta: 'Book Your Consultation',
    imageDescription: 'Before/after transformation photo with luxury clinic interior',
    targetAudience: 'Women 30-55, Renton/Bellevue area, health-conscious',
    estimatedReach: '12.5K',
    estimatedCPL: '$28',
    score: 84,
    variant: 'A',
    status: 'active',
  },
};

export const BotoxAd: Story = {
  args: {
    platform: 'facebook',
    headline: 'Refresh, Not Freeze',
    primaryText: 'Natural-looking results from expert injectors at Rani Beauty Clinic. Our approach preserves your expressions while softening lines. Because looking like yourself, just refreshed, is always the goal.',
    cta: 'See Our Results',
    imageDescription: 'Close-up of smooth, glowing skin with soft lighting',
    targetAudience: 'Women 35-60, household income $100K+, Renton/Bellevue/Seattle',
    estimatedReach: '18.2K',
    estimatedCPL: '$22',
    score: 91,
    variant: 'B',
    status: 'testing',
  },
};

export const DraftAd: Story = {
  args: {
    platform: 'google',
    headline: 'Medical Weight Loss in Renton, WA',
    primaryText: 'FDA-guided GLP-1 weight management programs. Semaglutide and tirzepatide, physician-supervised with monthly monitoring. Starting at $399/month. Rani Beauty Clinic.',
    cta: 'Get Started Today',
    imageDescription: 'N/A (text ad)',
    targetAudience: 'Adults 25-65, searching "weight loss clinic near me", "semaglutide Renton"',
    estimatedReach: '8.1K',
    estimatedCPL: '$35',
    score: 72,
    variant: 'C',
    status: 'draft',
  },
};
