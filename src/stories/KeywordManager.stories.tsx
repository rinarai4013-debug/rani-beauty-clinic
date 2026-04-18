import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  difficulty: number;
  currentRank: number | null;
  targetRank: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  status: 'tracking' | 'ranked' | 'lost' | 'new';
}

interface KeywordManagerProps {
  keywords: Keyword[];
  totalTracked: number;
  avgPosition: number;
  top10Count: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

const trendIcons: Record<string, { symbol: string; color: string }> = {
  up: { symbol: '\u2191', color: 'text-green-600' },
  down: { symbol: '\u2193', color: 'text-red-600' },
  stable: { symbol: '\u2194', color: 'text-gray-400' },
};

const statusBadges: Record<string, string> = {
  tracking: 'bg-blue-100 text-blue-700',
  ranked: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  new: 'bg-purple-100 text-purple-700',
};

const difficultyColor = (d: number): string => {
  if (d <= 30) return 'text-green-600';
  if (d <= 60) return 'text-yellow-600';
  return 'text-red-600';
};

function KeywordManager({ keywords, totalTracked, avgPosition, top10Count }: KeywordManagerProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#0F1D2C]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Keyword Manager
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">SEO tracking for ranibeautyclinic.com</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-[#0F1D2C]">{totalTracked}</p>
            <p className="text-[10px] text-gray-400">Tracked</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-rani-gold-accessible">{avgPosition.toFixed(1)}</p>
            <p className="text-[10px] text-gray-400">Avg. Pos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{top10Count}</p>
            <p className="text-[10px] text-gray-400">Top 10</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="px-4 py-2 text-left font-medium">Keyword</th>
              <th className="px-3 py-2 text-center font-medium">Volume</th>
              <th className="px-3 py-2 text-center font-medium">Difficulty</th>
              <th className="px-3 py-2 text-center font-medium">Rank</th>
              <th className="px-3 py-2 text-center font-medium">CPC</th>
              <th className="px-3 py-2 text-center font-medium">Trend</th>
              <th className="px-3 py-2 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {keywords.map((kw) => (
              <tr key={kw.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-[#0F1D2C]">{kw.keyword}</p>
                    <p className="text-[10px] text-gray-400">{kw.category}</p>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-600">{kw.volume.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`text-xs font-medium ${difficultyColor(kw.difficulty)}`}>{kw.difficulty}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`text-sm font-bold ${kw.currentRank && kw.currentRank <= 10 ? 'text-green-700' : kw.currentRank && kw.currentRank <= 20 ? 'text-yellow-700' : 'text-gray-400'}`}>
                    {kw.currentRank ?? '---'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-600">${kw.cpc.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`text-sm font-bold ${trendIcons[kw.trend].color}`}>{trendIcons[kw.trend].symbol}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadges[kw.status]}`}>{kw.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
        <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600">+ Add Keyword</button>
        <button className="text-xs text-rani-gold-accessible font-medium">Export Report</button>
      </div>
    </div>
  );
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockKeywords: Keyword[] = [
  { id: '1', keyword: 'medspa renton wa', volume: 720, difficulty: 35, currentRank: 3, targetRank: 1, cpc: 8.50, trend: 'up', category: 'Brand / Local', status: 'ranked' },
  { id: '2', keyword: 'semaglutide weight loss renton', volume: 390, difficulty: 28, currentRank: 5, targetRank: 3, cpc: 12.30, trend: 'up', category: 'GLP-1', status: 'ranked' },
  { id: '3', keyword: 'botox near me', volume: 14800, difficulty: 72, currentRank: 18, targetRank: 10, cpc: 15.20, trend: 'stable', category: 'Injectables', status: 'tracking' },
  { id: '4', keyword: 'hydrafacial renton', volume: 210, difficulty: 22, currentRank: 2, targetRank: 1, cpc: 6.80, trend: 'up', category: 'Skin Treatments', status: 'ranked' },
  { id: '5', keyword: 'tirzepatide clinic seattle', volume: 480, difficulty: 32, currentRank: 8, targetRank: 5, cpc: 14.50, trend: 'up', category: 'GLP-1', status: 'ranked' },
  { id: '6', keyword: 'laser hair removal renton', volume: 590, difficulty: 42, currentRank: 12, targetRank: 5, cpc: 9.20, trend: 'down', category: 'Laser', status: 'tracking' },
  { id: '7', keyword: 'nad injection near me', volume: 260, difficulty: 18, currentRank: null, targetRank: 5, cpc: 11.00, trend: 'stable', category: 'Wellness', status: 'new' },
  { id: '8', keyword: 'medical weight loss bellevue', volume: 650, difficulty: 55, currentRank: 25, targetRank: 10, cpc: 13.80, trend: 'stable', category: 'GLP-1', status: 'tracking' },
];

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof KeywordManager> = {
  title: 'Marketing/KeywordManager',
  component: KeywordManager,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof KeywordManager>;

export const Default: Story = {
  args: {
    keywords: mockKeywords,
    totalTracked: 42,
    avgPosition: 11.3,
    top10Count: 5,
  },
};

export const StrongRankings: Story = {
  args: {
    keywords: mockKeywords.map((kw) => ({
      ...kw,
      currentRank: kw.currentRank ? Math.max(1, kw.currentRank - 5) : 4,
      trend: 'up' as const,
      status: 'ranked' as const,
    })),
    totalTracked: 42,
    avgPosition: 5.2,
    top10Count: 8,
  },
};

export const NewCampaign: Story = {
  args: {
    keywords: mockKeywords.map((kw) => ({
      ...kw,
      currentRank: null,
      status: 'new' as const,
      trend: 'stable' as const,
    })),
    totalTracked: 8,
    avgPosition: 0,
    top10Count: 0,
  },
};
