import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProtocolViewerProps {
  protocol: {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    description: string;
    riskLevel: 'low' | 'moderate' | 'high';
    pricing: { min: number; max: number; unit: string };
    sessionDuration: number;
    dosingSchedule: { week: number; dose: string; frequency: string; notes?: string }[];
    contraindications: string[];
    sideEffects: string[];
    aftercare: { timeframe: string; instruction: string; priority: 'critical' | 'important' | 'recommended' }[];
    labRequirements: { testName: string; frequency: string; timing: string }[];
    tags: string[];
    lastUpdated: string;
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

const riskBadges: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-red-100 text-red-700 border-red-200',
};

const priorityDots: Record<string, string> = {
  critical: 'bg-red-500',
  important: 'bg-yellow-500',
  recommended: 'bg-blue-400',
};

const tabs = ['Overview', 'Dosing', 'Safety', 'Aftercare', 'Labs'];

function TreatmentProtocol({ protocol }: ProtocolViewerProps) {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2D3F] px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{protocol.category} &middot; {protocol.subcategory}</p>
            <h2 className="text-xl font-bold text-white mt-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              {protocol.name}
            </h2>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${riskBadges[protocol.riskLevel]}`}>
            {protocol.riskLevel} risk
          </span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-300">
          <span>${protocol.pricing.min}-${protocol.pricing.max} {protocol.pricing.unit}</span>
          <span>&middot;</span>
          <span>{protocol.sessionDuration} min sessions</span>
          <span>&middot;</span>
          <span>Updated {protocol.lastUpdated}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#C9A96E] text-[#C9A96E]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {activeTab === 'Overview' && (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{protocol.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {protocol.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Dosing' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#0F1D2C]">Titration Schedule</h4>
            <div className="space-y-2">
              {protocol.dosingSchedule.map((dose) => (
                <div key={dose.week} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="w-12 h-12 bg-[#0F1D2C] rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400">WK</p>
                      <p className="text-sm font-bold text-white">{dose.week}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-[#0F1D2C]">{dose.dose}</span>
                      <span className="text-xs text-gray-400">{dose.frequency}</span>
                    </div>
                    {dose.notes && <p className="text-xs text-gray-500">{dose.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Safety' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2">Contraindications</h4>
              <ul className="space-y-1">
                {protocol.contraindications.map((c, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">&times;</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-700 mb-2">Potential Side Effects</h4>
              <ul className="space-y-1">
                {protocol.sideEffects.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">!</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'Aftercare' && (
          <div className="space-y-2">
            {protocol.aftercare.map((care, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDots[care.priority]}`} />
                <div>
                  <p className="text-xs font-semibold text-[#0F1D2C] mb-0.5">{care.timeframe}</p>
                  <p className="text-xs text-gray-600">{care.instruction}</p>
                </div>
                <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">{care.priority}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Labs' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Test</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Frequency</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Timing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {protocol.labRequirements.map((lab, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-[#0F1D2C]">{lab.testName}</td>
                      <td className="px-3 py-2 text-gray-600">{lab.frequency}</td>
                      <td className="px-3 py-2 text-gray-500">{lab.timing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
        <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600">Print Protocol</button>
        <button className="text-xs bg-[#C9A96E] text-white px-4 py-1.5 rounded-lg font-medium">Apply to Patient</button>
      </div>
    </div>
  );
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const semaglutideProtocol = {
  id: 'glp1-semaglutide',
  name: 'Semaglutide (GLP-1) Weight Loss Protocol',
  category: 'Wellness',
  subcategory: 'GLP-1',
  description: 'Medical weight management program using semaglutide, a GLP-1 receptor agonist that reduces appetite and promotes satiety. Administered as a weekly subcutaneous injection with a structured 4-phase titration schedule to optimize tolerance and results. Physician-supervised with comprehensive lab monitoring.',
  riskLevel: 'moderate' as const,
  pricing: { min: 399, max: 599, unit: 'per month' },
  sessionDuration: 30,
  dosingSchedule: [
    { week: 1, dose: '0.25 mg', frequency: 'Once weekly', notes: 'Initial titration. Focus on establishing routine and monitoring tolerance.' },
    { week: 5, dose: '0.5 mg', frequency: 'Once weekly', notes: 'D2 escalation. Expect possible increase in GI side effects.' },
    { week: 9, dose: '1.0 mg', frequency: 'Once weekly', notes: 'Therapeutic dose. Significant appetite suppression.' },
    { week: 13, dose: '2.4 mg', frequency: 'Once weekly', notes: 'Maximum dose. Only if plateau and good tolerance.' },
  ],
  contraindications: [
    'Personal or family history of medullary thyroid carcinoma (MTC)',
    'Multiple endocrine neoplasia syndrome type 2 (MEN2)',
    'History of pancreatitis',
    'Pregnancy or breastfeeding',
    'Type 1 diabetes',
    'Severe gastrointestinal disease',
  ],
  sideEffects: [
    'Nausea (40-50%, most common)',
    'Diarrhea (20-30%)',
    'Constipation (20-30%)',
    'Headache (10-15%)',
    'Fatigue (15-25%)',
    'Injection site reaction (5-10%)',
  ],
  aftercare: [
    { timeframe: 'Immediately post-injection', instruction: 'Apply gentle pressure for 10 seconds. Do not rub.', priority: 'important' as const },
    { timeframe: 'First 24 hours', instruction: 'Eat light, small meals. Stay hydrated (minimum 64 oz water).', priority: 'critical' as const },
    { timeframe: 'Ongoing weekly', instruction: 'Maintain consistent injection day and time each week.', priority: 'critical' as const },
    { timeframe: 'Ongoing daily', instruction: 'Minimum 60-80g protein daily, 64+ oz water, daily multivitamin.', priority: 'important' as const },
    { timeframe: 'Quarterly', instruction: 'Complete quarterly lab work before appointment.', priority: 'critical' as const },
  ],
  labRequirements: [
    { testName: 'Comprehensive metabolic panel', frequency: 'Quarterly', timing: 'Baseline, week 12, every 12 weeks' },
    { testName: 'Hemoglobin A1c', frequency: 'Quarterly', timing: 'Baseline, week 12, every 12 weeks' },
    { testName: 'Lipid panel', frequency: 'Quarterly', timing: 'Baseline, week 12, every 12 weeks' },
    { testName: 'Thyroid panel (TSH, free T4)', frequency: 'Biannually', timing: 'Baseline, then every 6 months' },
    { testName: 'Amylase and lipase', frequency: 'Quarterly', timing: 'Baseline, then every 12 weeks' },
    { testName: 'Vitamin B12', frequency: 'Biannually', timing: 'Month 6, then annually' },
  ],
  tags: ['glp-1', 'semaglutide', 'weight-loss', 'injection', 'titration'],
  lastUpdated: '2026-03-26',
};

const botoxProtocol = {
  id: 'botox-forehead',
  name: 'Botox - Forehead Lines',
  category: 'Injectable',
  subcategory: 'Neurotoxin',
  description: 'Neuromodulator injection to soften horizontal forehead lines by relaxing the frontalis muscle. Achieves a naturally smooth forehead while preserving brow position and expressiveness.',
  riskLevel: 'low' as const,
  pricing: { min: 250, max: 500, unit: 'per area' },
  sessionDuration: 15,
  dosingSchedule: [
    { week: 1, dose: '15-20 units', frequency: 'Single session', notes: 'Initial treatment. Conservative dosing for first-time patients.' },
    { week: 2, dose: 'Touch-up if needed', frequency: 'Single session', notes: 'Assess results at 2 weeks. Add 2-5 units if asymmetry.' },
    { week: 12, dose: '15-20 units', frequency: 'Retreatment', notes: 'Retreatment at 3-4 months. Do not retreat before 90 days.' },
  ],
  contraindications: [
    'Known hypersensitivity to botulinum toxin',
    'Infection at proposed injection site',
    'Neuromuscular disorders (myasthenia gravis)',
    'Pregnancy or breastfeeding',
  ],
  sideEffects: [
    'Brow ptosis (most common from over-treatment)',
    'Bruising at injection sites',
    'Headache (transient, 24-48 hours)',
    'Asymmetry',
  ],
  aftercare: [
    { timeframe: 'First 4 hours', instruction: 'Stay upright. Gently exercise treated muscles.', priority: 'critical' as const },
    { timeframe: 'First 24 hours', instruction: 'No exercise, alcohol, or lying face-down.', priority: 'important' as const },
    { timeframe: '2 weeks', instruction: 'Return for follow-up assessment and possible touch-up.', priority: 'important' as const },
  ],
  labRequirements: [],
  tags: ['botox', 'neurotoxin', 'forehead', 'wrinkles', 'injectable'],
  lastUpdated: '2026-03-26',
};

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof TreatmentProtocol> = {
  title: 'Clinical/TreatmentProtocol',
  component: TreatmentProtocol,
  parameters: { layout: 'padded', backgrounds: { default: 'light' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TreatmentProtocol>;

export const GLP1Protocol: Story = {
  args: { protocol: semaglutideProtocol },
};

export const BotoxProtocol: Story = {
  args: { protocol: botoxProtocol },
};

export const HighRiskProtocol: Story = {
  args: {
    protocol: {
      ...semaglutideProtocol,
      name: 'Custom High-Complexity Protocol',
      riskLevel: 'high' as const,
      description: 'Complex multi-medication protocol requiring intensive monitoring and specialist supervision. This protocol combines multiple therapeutic agents with narrow therapeutic windows.',
      pricing: { min: 800, max: 1200, unit: 'per month' },
      tags: ['complex', 'high-risk', 'multi-agent', 'specialist'],
    },
  },
};
