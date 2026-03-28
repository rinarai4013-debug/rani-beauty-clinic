import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface VoicePreviewProps {
  recipientName: string;
  messageType: 'follow-up' | 'reminder' | 'reactivation' | 'welcome' | 'results';
  channel: 'sms' | 'email' | 'voice';
  message: string;
  tone: string;
  scheduledTime?: string;
  preview?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const channelIcons: Record<string, { label: string; color: string }> = {
  sms: { label: 'SMS', color: 'bg-green-100 text-green-700' },
  email: { label: 'Email', color: 'bg-blue-100 text-blue-700' },
  voice: { label: 'Voice AI', color: 'bg-purple-100 text-purple-700' },
};

const typeLabels: Record<string, { label: string; color: string }> = {
  'follow-up': { label: 'Post-Treatment Follow-Up', color: 'text-blue-600' },
  reminder: { label: 'Appointment Reminder', color: 'text-green-600' },
  reactivation: { label: 'Reactivation Campaign', color: 'text-orange-600' },
  welcome: { label: 'Welcome Message', color: 'text-purple-600' },
  results: { label: 'Results Check-In', color: 'text-teal-600' },
};

function VoicePreview({ recipientName, messageType, channel, message, tone, scheduledTime, preview = true }: VoicePreviewProps) {
  const channelConfig = channelIcons[channel];
  const typeConfig = typeLabels[messageType];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-md">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[#0F1D2C]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Rina&apos;s Voice
          </h3>
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${channelConfig.color}`}>
              {channelConfig.label}
            </span>
            {preview && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Preview</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>To: <span className="font-medium text-[#0F1D2C]">{recipientName}</span></span>
          <span>&middot;</span>
          <span className={`font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
        </div>
      </div>

      {/* Message Preview */}
      <div className="px-5 py-4">
        {channel === 'sms' ? (
          <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
            <p className="text-sm text-[#0F1D2C] leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        ) : channel === 'email' ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs text-gray-400">From: Rani Beauty Clinic &lt;noreply@ranibeautyclinic.com&gt;</p>
              <p className="text-xs text-gray-400">Subject: <span className="text-[#0F1D2C] font-medium">{typeConfig.label}</span></p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-[#0F1D2C] leading-relaxed whitespace-pre-line">{message}</p>
            </div>
          </div>
        ) : (
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-purple-700 text-xs font-bold">AI</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-800">Rina (Voice AI)</p>
                <p className="text-[10px] text-purple-500">Vapi-powered, Rani brand voice</p>
              </div>
            </div>
            <p className="text-sm text-purple-900 leading-relaxed italic whitespace-pre-line">&ldquo;{message}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Tone: <span className="text-gray-600 font-medium">{tone}</span></span>
          {scheduledTime && <span>Scheduled: <span className="text-gray-600 font-medium">{scheduledTime}</span></span>}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
        <div className="flex gap-2">
          <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-600 hover:bg-gray-50">
            Edit
          </button>
          <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-600 hover:bg-gray-50">
            Regenerate
          </button>
        </div>
        <button className="text-xs bg-[#C9A96E] text-white px-4 py-1.5 rounded-lg font-medium hover:bg-[#B8985E]">
          Send
        </button>
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof VoicePreview> = {
  title: 'Communication/VoicePreview',
  component: VoicePreview,
  parameters: { layout: 'padded', backgrounds: { default: 'light' } },
  tags: ['autodocs'],
  argTypes: {
    channel: { control: 'select', options: ['sms', 'email', 'voice'] },
    messageType: { control: 'select', options: ['follow-up', 'reminder', 'reactivation', 'welcome', 'results'] },
  },
};

export default meta;
type Story = StoryObj<typeof VoicePreview>;

export const SMSFollowUp: Story = {
  args: {
    recipientName: 'Jennifer L.',
    messageType: 'follow-up',
    channel: 'sms',
    message: 'Hi Jennifer, this is Rina from Rani Beauty Clinic checking in after your GLP-1 injection yesterday. How are you feeling today? If you experience any nausea, ginger tea and small meals can help. We are here for you. Reply STOP to opt out.',
    tone: 'Warm, clinical, supportive',
    scheduledTime: 'Tomorrow 10:00 AM',
  },
};

export const EmailReactivation: Story = {
  args: {
    recipientName: 'Amanda W.',
    messageType: 'reactivation',
    channel: 'email',
    message: 'Dear Amanda,\n\nIt has been 60 days since your last visit, and we wanted to reach out personally. Your treatment journey at Rani Beauty Clinic is important to us, and we want to make sure you have everything you need.\n\nBased on your previous treatments, we believe you would benefit from a complimentary consultation to discuss your next steps. We have availability this week and would love to see you.\n\nBook your consultation at ranibeautyclinic.com or call us at (425) 295-2819.\n\nWith care,\nRina and the Rani Team',
    tone: 'Luxury, personal, non-pushy',
  },
};

export const VoiceAICall: Story = {
  args: {
    recipientName: 'Sarah M.',
    messageType: 'reminder',
    channel: 'voice',
    message: 'Hi Sarah, this is Rina calling from Rani Beauty Clinic. I am calling to remind you about your GLP-1 injection appointment tomorrow at 2:00 PM. Please remember to eat a light meal before your visit and bring your medication log. If you need to reschedule, you can press 1 now or call us at 425-295-2819. We look forward to seeing you.',
    tone: 'Professional, warm, efficient',
    scheduledTime: 'Day before appointment, 4:00 PM',
  },
};
