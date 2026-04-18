import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface IntakeFormProps {
  variant: 'glp1' | 'peptide' | 'hormone';
  onSubmit?: (data: Record<string, string>) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const formConfigs = {
  glp1: {
    title: 'GLP-1 Weight Management Intake',
    subtitle: 'Please complete all fields for your initial evaluation',
    sections: [
      {
        name: 'Personal Information',
        fields: [
          { id: 'firstName', label: 'First Name', type: 'text', required: true },
          { id: 'lastName', label: 'Last Name', type: 'text', required: true },
          { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
          { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
          { id: 'email', label: 'Email', type: 'email', required: true },
        ],
      },
      {
        name: 'Medical History',
        fields: [
          { id: 'height', label: 'Height (inches)', type: 'number', required: true },
          { id: 'weight', label: 'Current Weight (lbs)', type: 'number', required: true },
          { id: 'goalWeight', label: 'Goal Weight (lbs)', type: 'number', required: false },
          { id: 'thyroidHistory', label: 'Family History of Thyroid Cancer?', type: 'select', options: ['No', 'Yes', 'Unknown'], required: true },
          { id: 'pancreatitisHistory', label: 'History of Pancreatitis?', type: 'select', options: ['No', 'Yes'], required: true },
          { id: 'medications', label: 'Current Medications', type: 'textarea', required: false },
        ],
      },
      {
        name: 'Weight Loss History',
        fields: [
          { id: 'previousAttempts', label: 'Previous Weight Loss Methods', type: 'textarea', required: false },
          { id: 'dietaryRestrictions', label: 'Dietary Restrictions', type: 'text', required: false },
          { id: 'exerciseLevel', label: 'Current Exercise Level', type: 'select', options: ['Sedentary', 'Light (1-2x/week)', 'Moderate (3-4x/week)', 'Active (5+x/week)'], required: true },
        ],
      },
    ],
  },
  peptide: {
    title: 'Peptide Therapy Intake',
    subtitle: 'Help us understand your health goals for peptide therapy',
    sections: [
      {
        name: 'Personal Information',
        fields: [
          { id: 'firstName', label: 'First Name', type: 'text', required: true },
          { id: 'lastName', label: 'Last Name', type: 'text', required: true },
          { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
          { id: 'email', label: 'Email', type: 'email', required: true },
        ],
      },
      {
        name: 'Treatment Goals',
        fields: [
          { id: 'primaryGoal', label: 'Primary Goal', type: 'select', options: ['Anti-Aging', 'Injury Recovery', 'Gut Health', 'Sleep Improvement', 'Sexual Health', 'Energy / Cognitive'], required: true },
          { id: 'cancerHistory', label: 'History of Cancer?', type: 'select', options: ['No', 'Yes (in remission)', 'Yes (active)'], required: true },
          { id: 'allergies', label: 'Known Allergies', type: 'textarea', required: false },
          { id: 'medications', label: 'Current Medications', type: 'textarea', required: false },
        ],
      },
    ],
  },
  hormone: {
    title: 'Hormone Optimization Intake',
    subtitle: 'Comprehensive assessment for your hormone therapy evaluation',
    sections: [
      {
        name: 'Personal Information',
        fields: [
          { id: 'firstName', label: 'First Name', type: 'text', required: true },
          { id: 'lastName', label: 'Last Name', type: 'text', required: true },
          { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
          { id: 'sex', label: 'Biological Sex', type: 'select', options: ['Female', 'Male'], required: true },
        ],
      },
      {
        name: 'Symptom Assessment',
        fields: [
          { id: 'fatigue', label: 'Fatigue Level (1-10)', type: 'number', required: true },
          { id: 'libido', label: 'Libido Level (1-10)', type: 'number', required: true },
          { id: 'mood', label: 'Mood Stability (1-10)', type: 'number', required: true },
          { id: 'sleep', label: 'Sleep Quality (1-10)', type: 'number', required: true },
          { id: 'symptoms', label: 'Additional Symptoms', type: 'textarea', required: false },
        ],
      },
      {
        name: 'Medical History',
        fields: [
          { id: 'cancerHistory', label: 'History of Hormone-Sensitive Cancer?', type: 'select', options: ['No', 'Yes'], required: true },
          { id: 'bloodClots', label: 'History of Blood Clots?', type: 'select', options: ['No', 'Yes'], required: true },
          { id: 'medications', label: 'Current Medications', type: 'textarea', required: false },
          { id: 'fertility', label: 'Fertility Considerations?', type: 'select', options: ['No plans', 'Future plans', 'Currently trying', 'N/A'], required: true },
        ],
      },
    ],
  },
};

function IntakeForm({ variant, onSubmit }: IntakeFormProps) {
  const config = formConfigs[variant];
  const [currentSection, setCurrentSection] = useState(0);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#0F1D2C] px-6 py-5">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
          {config.title}
        </h2>
        <p className="text-sm text-gray-300 mt-1">{config.subtitle}</p>
      </div>

      {/* Progress */}
      <div className="px-6 pt-4">
        <div className="flex gap-1">
          {config.sections.map((section, i) => (
            <div key={section.name} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${i <= currentSection ? 'bg-[#C9A96E]' : 'bg-gray-200'}`}
              />
              <p className={`text-xs mt-1 ${i <= currentSection ? 'text-rani-gold-accessible font-medium' : 'text-gray-400'}`}>
                {section.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[#0F1D2C]">{config.sections[currentSection].name}</h3>
        {config.sections[currentSection].fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                rows={3}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            ) : field.type === 'select' ? (
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white">
                <option value="">Select...</option>
                {field.options?.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-6 flex justify-between">
        <button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${currentSection === 0 ? 'invisible' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Back
        </button>
        <button
          onClick={() => {
            if (currentSection < config.sections.length - 1) {
              setCurrentSection(currentSection + 1);
            } else {
              onSubmit?.({});
            }
          }}
          className="px-6 py-2 bg-[#C9A96E] text-white rounded-lg text-sm font-medium hover:bg-[#B8985E] transition-colors"
        >
          {currentSection === config.sections.length - 1 ? 'Submit' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof IntakeForm> = {
  title: 'Forms/IntakeForm',
  component: IntakeForm,
  parameters: { layout: 'padded', backgrounds: { default: 'light' } },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['glp1', 'peptide', 'hormone'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof IntakeForm>;

export const GLP1Intake: Story = {
  args: { variant: 'glp1' },
};

export const PeptideIntake: Story = {
  args: { variant: 'peptide' },
};

export const HormoneIntake: Story = {
  args: { variant: 'hormone' },
};
