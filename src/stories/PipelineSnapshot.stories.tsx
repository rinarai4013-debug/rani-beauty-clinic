import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelineSnapshotProps {
  stages: { name: string; count: number; revenue: number; color: string }[];
  conversionRate: number;
  avgTimeInPipeline: string;
  newThisWeek: number;
  completedThisMonth: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

function PipelineSnapshot({ stages, conversionRate, avgTimeInPipeline, newThisWeek, completedThisMonth }: PipelineSnapshotProps) {
  const totalPatients = stages.reduce((sum, s) => sum + s.count, 0);
  const totalRevenue = stages.reduce((sum, s) => sum + s.revenue, 0);
  const maxCount = Math.max(...stages.map((s) => s.count));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-[#0F1D2C]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Pipeline Snapshot
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{totalPatients} patients &middot; ${totalRevenue.toLocaleString()} MRR</p>
      </div>

      {/* Funnel Visualization */}
      <div className="px-5 py-4 space-y-2">
        {stages.map((stage) => {
          const widthPercent = Math.max(20, (stage.count / maxCount) * 100);
          return (
            <div key={stage.name} className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-600 font-medium text-right truncate">{stage.name}</div>
              <div className="flex-1 relative">
                <div
                  className="h-7 rounded-lg flex items-center px-2 transition-all"
                  style={{ width: `${widthPercent}%`, backgroundColor: stage.color + '20', borderLeft: `3px solid ${stage.color}` }}
                >
                  <span className="text-xs font-bold" style={{ color: stage.color }}>{stage.count}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400 w-16 text-right">${stage.revenue.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Conversion</p>
          <p className="text-lg font-bold text-[#0F1D2C]">{conversionRate}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Avg. Time</p>
          <p className="text-lg font-bold text-[#0F1D2C]">{avgTimeInPipeline}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">New This Week</p>
          <p className="text-lg font-bold text-green-600">+{newThisWeek}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Completed (Mo)</p>
          <p className="text-lg font-bold text-[#C9A96E]">{completedThisMonth}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof PipelineSnapshot> = {
  title: 'Dashboard/PipelineSnapshot',
  component: PipelineSnapshot,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PipelineSnapshot>;

export const Default: Story = {
  args: {
    stages: [
      { name: 'Intake', count: 8, revenue: 0, color: '#6366F1' },
      { name: 'Titration', count: 18, revenue: 8910, color: '#F59E0B' },
      { name: 'Therapeutic', count: 12, revenue: 7188, color: '#10B981' },
      { name: 'Maintenance', count: 6, revenue: 2994, color: '#C9A96E' },
    ],
    conversionRate: 72,
    avgTimeInPipeline: '14 wks',
    newThisWeek: 3,
    completedThisMonth: 4,
  },
};

export const GrowthPhase: Story = {
  args: {
    stages: [
      { name: 'Intake', count: 15, revenue: 0, color: '#6366F1' },
      { name: 'Titration', count: 28, revenue: 13860, color: '#F59E0B' },
      { name: 'Therapeutic', count: 20, revenue: 11980, color: '#10B981' },
      { name: 'Maintenance', count: 10, revenue: 4990, color: '#C9A96E' },
    ],
    conversionRate: 78,
    avgTimeInPipeline: '12 wks',
    newThisWeek: 7,
    completedThisMonth: 8,
  },
};

export const EarlyStage: Story = {
  args: {
    stages: [
      { name: 'Intake', count: 5, revenue: 0, color: '#6366F1' },
      { name: 'Titration', count: 6, revenue: 2970, color: '#F59E0B' },
      { name: 'Therapeutic', count: 2, revenue: 1198, color: '#10B981' },
      { name: 'Maintenance', count: 0, revenue: 0, color: '#C9A96E' },
    ],
    conversionRate: 45,
    avgTimeInPipeline: '6 wks',
    newThisWeek: 2,
    completedThisMonth: 0,
  },
};
