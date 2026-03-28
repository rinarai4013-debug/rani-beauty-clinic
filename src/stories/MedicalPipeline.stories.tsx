import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelinePatient {
  id: string;
  name: string;
  program: string;
  currentDose: string;
  nextAppointment: string;
  status: 'on-track' | 'needs-attention' | 'at-risk' | 'completed';
  weeksInProgram: number;
  weightLossPercent: number;
}

interface PipelineColumn {
  id: string;
  title: string;
  color: string;
  patients: PipelinePatient[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockColumns: PipelineColumn[] = [
  {
    id: 'intake',
    title: 'Intake / GFE',
    color: '#6366F1',
    patients: [
      { id: 'p1', name: 'Sarah M.', program: 'Semaglutide', currentDose: 'Pending', nextAppointment: 'Mar 28', status: 'on-track', weeksInProgram: 0, weightLossPercent: 0 },
      { id: 'p2', name: 'Lisa K.', program: 'Tirzepatide', currentDose: 'Pending', nextAppointment: 'Mar 29', status: 'on-track', weeksInProgram: 0, weightLossPercent: 0 },
    ],
  },
  {
    id: 'titration',
    title: 'Titration (D1-D2)',
    color: '#F59E0B',
    patients: [
      { id: 'p3', name: 'Jennifer L.', program: 'Semaglutide', currentDose: '0.25 mg', nextAppointment: 'Mar 30', status: 'on-track', weeksInProgram: 3, weightLossPercent: 2.1 },
      { id: 'p4', name: 'Michael R.', program: 'Tirzepatide', currentDose: '5 mg', nextAppointment: 'Apr 1', status: 'needs-attention', weeksInProgram: 6, weightLossPercent: 3.8 },
      { id: 'p5', name: 'Amanda W.', program: 'Semaglutide', currentDose: '0.5 mg', nextAppointment: 'Mar 31', status: 'on-track', weeksInProgram: 5, weightLossPercent: 4.2 },
    ],
  },
  {
    id: 'therapeutic',
    title: 'Therapeutic (D3-D4)',
    color: '#10B981',
    patients: [
      { id: 'p6', name: 'David P.', program: 'Semaglutide', currentDose: '1.0 mg', nextAppointment: 'Apr 2', status: 'on-track', weeksInProgram: 10, weightLossPercent: 7.5 },
      { id: 'p7', name: 'Rachel H.', program: 'Tirzepatide', currentDose: '10 mg', nextAppointment: 'Apr 3', status: 'at-risk', weeksInProgram: 14, weightLossPercent: 4.1 },
    ],
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    color: '#C9A96E',
    patients: [
      { id: 'p8', name: 'Emily T.', program: 'Semaglutide', currentDose: '1.0 mg', nextAppointment: 'Apr 15', status: 'completed', weeksInProgram: 24, weightLossPercent: 14.2 },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  'on-track': 'bg-green-100 text-green-800',
  'needs-attention': 'bg-yellow-100 text-yellow-800',
  'at-risk': 'bg-red-100 text-red-800',
  'completed': 'bg-blue-100 text-blue-800',
};

function PatientCard({ patient }: { patient: PipelinePatient }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-2 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-[#0F1D2C]">{patient.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[patient.status]}`}>
          {patient.status.replace('-', ' ')}
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>{patient.program}</span>
          <span className="font-medium text-[#0F1D2C]">{patient.currentDose}</span>
        </div>
        <div className="flex justify-between">
          <span>Week {patient.weeksInProgram}</span>
          <span className="font-medium text-green-700">-{patient.weightLossPercent}%</span>
        </div>
        <div className="text-gray-400">Next: {patient.nextAppointment}</div>
      </div>
    </div>
  );
}

function MedicalPipeline({ columns }: { columns: PipelineColumn[] }) {
  const totalPatients = columns.reduce((sum, col) => sum + col.patients.length, 0);

  return (
    <div className="bg-[#F3F4F6] p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F1D2C]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Medical Pipeline
          </h2>
          <p className="text-sm text-gray-500 mt-1">{totalPatients} active patients across all stages</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-[#0F1D2C] text-white text-xs rounded-lg font-medium">+ New Patient</button>
          <button className="px-3 py-1.5 bg-white text-[#0F1D2C] text-xs rounded-lg font-medium border border-gray-200">Filter</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
              <h3 className="text-sm font-semibold text-[#0F1D2C]">{column.title}</h3>
              <span className="ml-auto text-xs bg-white px-2 py-0.5 rounded-full text-gray-500 font-medium">
                {column.patients.length}
              </span>
            </div>
            <div className="space-y-2">
              {column.patients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof MedicalPipeline> = {
  title: 'Dashboard/MedicalPipeline',
  component: MedicalPipeline,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MedicalPipeline>;

export const Default: Story = {
  args: { columns: mockColumns },
};

export const FullPipeline: Story = {
  args: {
    columns: mockColumns.map((col) => ({
      ...col,
      patients: [
        ...col.patients,
        ...col.patients.map((p) => ({ ...p, id: `${p.id}-dup`, name: `${p.name} (2)` })),
      ],
    })),
  },
};

export const EmptyPipeline: Story = {
  args: {
    columns: mockColumns.map((col) => ({ ...col, patients: [] })),
  },
};
