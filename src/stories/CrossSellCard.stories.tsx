import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CrossSellCardProps {
  patientName: string;
  currentTreatment: string;
  recommendations: {
    id: string;
    treatment: string;
    reason: string;
    confidence: number;
    priceRange: string;
    timing: string;
    category: 'addon' | 'upgrade' | 'complementary' | 'seasonal';
  }[];
}

// ─── Component ───────────────────────────────────────────────────────────────

const categoryBadges: Record<string, string> = {
  addon: 'bg-purple-100 text-purple-700',
  upgrade: 'bg-blue-100 text-blue-700',
  complementary: 'bg-green-100 text-green-700',
  seasonal: 'bg-orange-100 text-orange-700',
};

function CrossSellCard({ patientName, currentTreatment, recommendations }: CrossSellCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-md">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#0F1D2C]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Cross-Sell Opportunities
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{patientName} &middot; Currently on {currentTreatment}</p>
          </div>
          <div className="bg-[#C9A96E]/10 text-[#C9A96E] text-xs font-bold px-2.5 py-1 rounded-full">
            {recommendations.length} recs
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {recommendations.map((rec) => (
          <div key={rec.id} className="px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[#0F1D2C]">{rec.treatment}</h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${categoryBadges[rec.category]}`}>
                  {rec.category}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-12 bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${rec.confidence >= 80 ? 'bg-green-500' : rec.confidence >= 60 ? 'bg-yellow-500' : 'bg-gray-400'}`}
                    style={{ width: `${rec.confidence}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-7">{rec.confidence}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1.5">{rec.reason}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#C9A96E] font-medium">{rec.priceRange}</span>
              <span className="text-gray-400">{rec.timing}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">Potential revenue uplift</span>
        <button className="text-xs bg-[#0F1D2C] text-white px-3 py-1.5 rounded-lg font-medium">Present to Patient</button>
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof CrossSellCard> = {
  title: 'Dashboard/CrossSellCard',
  component: CrossSellCard,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CrossSellCard>;

export const Default: Story = {
  args: {
    patientName: 'Jennifer L.',
    currentTreatment: 'Semaglutide (D2)',
    recommendations: [
      { id: '1', treatment: 'B12 Injection', reason: 'GLP-1 patients are at elevated risk for B12 depletion. Weekly B12 supports energy during caloric deficit.', confidence: 92, priceRange: '$35/injection', timing: 'Add to next visit', category: 'addon' },
      { id: '2', treatment: 'Lipo-Mino Injection', reason: 'Lipotropic support accelerates fat metabolism and complements GLP-1 weight loss.', confidence: 85, priceRange: '$45/injection', timing: 'Add to next visit', category: 'complementary' },
      { id: '3', treatment: 'VIP Transform Package', reason: 'Patient is responding well to GLP-1. Package upgrade provides comprehensive support and better value.', confidence: 68, priceRange: '$2,499-$3,499/6mo', timing: 'Discuss at next visit', category: 'upgrade' },
    ],
  },
};

export const BotoxPatient: Story = {
  args: {
    patientName: 'Amanda W.',
    currentTreatment: 'Botox Forehead',
    recommendations: [
      { id: '1', treatment: 'Lip Filler', reason: 'Patient has expressed interest in lip enhancement during previous visits.', confidence: 78, priceRange: '$650-$800/syringe', timing: '2 weeks after Botox', category: 'complementary' },
      { id: '2', treatment: 'HydraFacial', reason: 'Seasonal recommendation: spring skin refresh pairs well with neurotoxin treatment.', confidence: 72, priceRange: '$275/session', timing: 'Schedule separately', category: 'seasonal' },
      { id: '3', treatment: 'Glutathione Injection', reason: 'Skin brightening complement to aesthetic injectables. Enhances overall glow.', confidence: 65, priceRange: '$100/injection', timing: 'Same visit possible', category: 'addon' },
    ],
  },
};

export const HormonePatient: Story = {
  args: {
    patientName: 'David P.',
    currentTreatment: 'Testosterone (Men)',
    recommendations: [
      { id: '1', treatment: 'Sermorelin Protocol', reason: 'Growth hormone support complements testosterone optimization for body composition and recovery.', confidence: 88, priceRange: '$250-$450/mo', timing: 'Start after T stabilized', category: 'complementary' },
      { id: '2', treatment: 'NAD+ Injection', reason: 'Cellular energy and anti-aging support. Popular add-on for hormone optimization patients.', confidence: 74, priceRange: '$150-$500/injection', timing: 'Add to monthly visit', category: 'addon' },
    ],
  },
};
