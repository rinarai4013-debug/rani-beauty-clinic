import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DoseTrackerProps {
  patientName: string;
  medication: string;
  currentDose: string;
  currentWeek: number;
  targetDose: string;
  doseHistory: { week: number; dose: string; date: string; status: 'completed' | 'scheduled' | 'skipped' | 'adjusted' }[];
  weightStart: number;
  weightCurrent: number;
  nextAppointment: string;
  sideEffects: string[];
}

// ─── Component ───────────────────────────────────────────────────────────────

const doseStatusIcons: Record<string, { bg: string; icon: string }> = {
  completed: { bg: 'bg-green-100 text-green-700', icon: 'check' },
  scheduled: { bg: 'bg-blue-100 text-blue-700', icon: 'clock' },
  skipped: { bg: 'bg-red-100 text-red-700', icon: 'x' },
  adjusted: { bg: 'bg-yellow-100 text-yellow-700', icon: 'adj' },
};

function DoseTracker(props: DoseTrackerProps) {
  const { patientName, medication, currentDose, currentWeek, targetDose, doseHistory, weightStart, weightCurrent, nextAppointment, sideEffects } = props;
  const weightLost = weightStart - weightCurrent;
  const weightLossPercent = ((weightLost / weightStart) * 100).toFixed(1);
  const progressPercent = Math.min(100, (currentWeek / 16) * 100);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2D3F] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">{patientName}</h3>
            <p className="text-gray-300 text-xs mt-0.5">{medication} Protocol</p>
          </div>
          <div className="bg-[#C9A96E] text-white text-xs font-bold px-3 py-1 rounded-full">
            Week {currentWeek}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Titration Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-[#C9A96E] h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>D1: Start</span>
          <span>D2: {medication === 'Semaglutide' ? '0.5mg' : '5mg'}</span>
          <span>D3: {medication === 'Semaglutide' ? '1.0mg' : '7.5mg'}</span>
          <span>D4: Target</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Current Dose</p>
          <p className="text-sm font-bold text-[#0F1D2C] mt-1">{currentDose}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Weight Lost</p>
          <p className="text-sm font-bold text-green-700 mt-1">{weightLost} lbs</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">% Loss</p>
          <p className="text-sm font-bold text-green-700 mt-1">{weightLossPercent}%</p>
        </div>
      </div>

      {/* Dose History */}
      <div className="px-5 pb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Doses</h4>
        <div className="space-y-2">
          {doseHistory.slice(-4).map((dose) => (
            <div key={dose.week} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${doseStatusIcons[dose.status].bg}`}>
                  {doseStatusIcons[dose.status].icon === 'check' ? '\u2713' : doseStatusIcons[dose.status].icon === 'x' ? '\u2717' : doseStatusIcons[dose.status].icon === 'clock' ? '\u25CB' : '\u25B3'}
                </span>
                <span className="text-gray-600">Week {dose.week}</span>
              </div>
              <span className="font-medium text-[#0F1D2C]">{dose.dose}</span>
              <span className="text-xs text-gray-400">{dose.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side Effects */}
      {sideEffects.length > 0 && (
        <div className="px-5 pb-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Active Side Effects</h4>
          <div className="flex flex-wrap gap-1.5">
            {sideEffects.map((effect) => (
              <span key={effect} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">{effect}</span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Next: <span className="font-medium text-[#0F1D2C]">{nextAppointment}</span>
        </div>
        <button className="text-xs bg-[#C9A96E] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#B8985E]">
          Log Dose
        </button>
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof DoseTracker> = {
  title: 'Dashboard/DoseTracker',
  component: DoseTracker,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DoseTracker>;

export const Default: Story = {
  args: {
    patientName: 'Jennifer L.',
    medication: 'Semaglutide',
    currentDose: '0.5 mg',
    currentWeek: 6,
    targetDose: '2.4 mg',
    doseHistory: [
      { week: 3, dose: '0.25 mg', date: 'Mar 7', status: 'completed' },
      { week: 4, dose: '0.25 mg', date: 'Mar 14', status: 'completed' },
      { week: 5, dose: '0.5 mg', date: 'Mar 21', status: 'completed' },
      { week: 6, dose: '0.5 mg', date: 'Mar 28', status: 'scheduled' },
    ],
    weightStart: 215,
    weightCurrent: 206,
    nextAppointment: 'Mar 28, 2026',
    sideEffects: ['Mild nausea', 'Reduced appetite'],
  },
};

export const AdvancedDose: Story = {
  args: {
    patientName: 'David P.',
    medication: 'Tirzepatide',
    currentDose: '10 mg',
    currentWeek: 14,
    targetDose: '15 mg',
    doseHistory: [
      { week: 11, dose: '7.5 mg', date: 'Mar 5', status: 'completed' },
      { week: 12, dose: '7.5 mg', date: 'Mar 12', status: 'completed' },
      { week: 13, dose: '10 mg', date: 'Mar 19', status: 'adjusted' },
      { week: 14, dose: '10 mg', date: 'Mar 26', status: 'completed' },
    ],
    weightStart: 280,
    weightCurrent: 242,
    nextAppointment: 'Apr 2, 2026',
    sideEffects: ['Constipation'],
  },
};

export const SkippedDose: Story = {
  args: {
    patientName: 'Rachel H.',
    medication: 'Semaglutide',
    currentDose: '1.0 mg',
    currentWeek: 10,
    targetDose: '2.4 mg',
    doseHistory: [
      { week: 7, dose: '0.5 mg', date: 'Mar 3', status: 'completed' },
      { week: 8, dose: '0.5 mg', date: 'Mar 10', status: 'completed' },
      { week: 9, dose: '1.0 mg', date: 'Mar 17', status: 'skipped' },
      { week: 10, dose: '1.0 mg', date: 'Mar 24', status: 'scheduled' },
    ],
    weightStart: 195,
    weightCurrent: 183,
    nextAppointment: 'Mar 24, 2026',
    sideEffects: ['Severe nausea', 'Vomiting', 'Fatigue'],
  },
};
