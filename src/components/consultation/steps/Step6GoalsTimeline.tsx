'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  TrendingUp,
  RefreshCw,
  Zap,
  Sparkles,
  Gem,
  Rocket,
  Crown,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface StepProps {
  formData: Record<string, any>;
  onUpdate: (field: string, value: any) => void;
  errors: Record<string, string>;
}

interface TimelineOption {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
}

interface BudgetOption {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
}

const TIMELINE_OPTIONS: TimelineOption[] = [
  {
    id: 'event',
    label: 'I have an event',
    description: 'Looking my best for a specific occasion',
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    id: 'gradual',
    label: 'Gradual improvement',
    description: 'Steady enhancements over time',
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    id: 'maintenance',
    label: 'Ongoing maintenance',
    description: 'Keeping my results and skin healthy',
    icon: <RefreshCw className="w-6 h-6" />,
  },
  {
    id: 'asap',
    label: 'As soon as possible',
    description: 'Ready to start my transformation now',
    icon: <Zap className="w-6 h-6" />,
  },
];

const BUDGET_OPTIONS: BudgetOption[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    description: "I'm new and want to explore",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 'building-routine',
    label: 'Building My Routine',
    description: 'Ready to invest in regular treatments',
    icon: <Gem className="w-6 h-6" />,
  },
  {
    id: 'results-driven',
    label: 'Results-Driven',
    description: 'I want the best results possible',
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    id: 'all-in',
    label: 'All-In',
    description: "I'm committed to a comprehensive transformation",
    icon: <Crown className="w-6 h-6" />,
  },
];

function SelectionCard({
  isActive,
  onClick,
  icon,
  label,
  description,
  delay,
}: {
  isActive: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center
        ${
          isActive
            ? 'border-[#C9A96E] bg-[#C9A96E]/5 shadow-md'
            : 'border-[#0F1D2C]/10 bg-white hover:border-[#C9A96E]/40 hover:shadow-sm'
        }
      `}
    >
      <div
        className={`transition-colors duration-300 ${
          isActive ? 'text-[#C9A96E]' : 'text-[#0F1D2C]/40'
        }`}
      >
        {icon}
      </div>
      <span
        className={`font-body text-sm font-semibold transition-colors duration-300 ${
          isActive ? 'text-[#0F1D2C]' : 'text-[#0F1D2C]/70'
        }`}
      >
        {label}
      </span>
      <span className="font-body text-xs text-[#0F1D2C]/50 leading-tight">
        {description}
      </span>
      {isActive && (
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C9A96E] flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

export default function Step6GoalsTimeline({
  formData,
  onUpdate,
  errors,
}: StepProps) {
  const selectedTimeline = formData.timeline || '';
  const selectedBudget = formData.budget || '';

  return (
    <div className="space-y-8">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-2">
          Your Goals &amp; Timeline
        </h2>
        <p className="font-body text-sm text-[#0F1D2C]/60">
          Help us understand what you&apos;re looking for so we can match you
          with the right plan
        </p>
      </motion.div>

      {/* Goals Textarea */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-col gap-1.5"
      >
        <label
          htmlFor="goals"
          className="font-body text-sm font-medium text-[#0F1D2C]"
        >
          What results are you hoping for?
        </label>
        <textarea
          id="goals"
          rows={3}
          placeholder="Tell us about your ideal outcome - we love hearing your vision and will help you get there..."
          value={formData.goals || ''}
          onChange={(e) => onUpdate('goals', e.target.value)}
          className={`
            w-full px-4 py-3 rounded-xl bg-[#F8F6F1] border font-body text-sm text-[#0F1D2C]
            placeholder:text-[#0F1D2C]/30 transition-all duration-200 outline-none resize-none
            ${
              errors.goals
                ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                : 'border-[#C9A96E]/20 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20'
            }
          `}
        />
        {errors.goals && (
          <p className="font-body text-xs text-red-500">{errors.goals}</p>
        )}
      </motion.div>

      {/* Timeline Selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="space-y-3"
      >
        <label className="font-body text-sm font-medium text-[#0F1D2C]">
          What&apos;s your timeline?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TIMELINE_OPTIONS.map((opt, i) => (
            <SelectionCard
              key={opt.id}
              isActive={selectedTimeline === opt.id}
              onClick={() => onUpdate('timeline', opt.id)}
              icon={opt.icon}
              label={opt.label}
              description={opt.description}
              delay={0.25 + i * 0.05}
            />
          ))}
        </div>
        {errors.timeline && (
          <p className="font-body text-xs text-red-500">{errors.timeline}</p>
        )}
      </motion.div>

      {/* Event Date Picker - shown when "event" timeline selected */}
      {selectedTimeline === 'event' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-1.5"
        >
          <label
            htmlFor="eventDate"
            className="font-body text-sm font-medium text-[#0F1D2C]"
          >
            When is your event?
          </label>
          <input
            id="eventDate"
            type="date"
            value={formData.eventDate || ''}
            onChange={(e) => onUpdate('eventDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`
              w-full max-w-xs px-4 py-3 rounded-xl bg-[#F8F6F1] border font-body text-sm text-[#0F1D2C]
              transition-all duration-200 outline-none
              ${
                errors.eventDate
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                  : 'border-[#C9A96E]/20 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20'
              }
            `}
          />
          {errors.eventDate && (
            <p className="font-body text-xs text-red-500">
              {errors.eventDate}
            </p>
          )}
        </motion.div>
      )}

      {/* Budget Range */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="space-y-3"
      >
        <label className="font-body text-sm font-medium text-[#0F1D2C]">
          How would you describe your investment level?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BUDGET_OPTIONS.map((opt, i) => (
            <SelectionCard
              key={opt.id}
              isActive={selectedBudget === opt.id}
              onClick={() => onUpdate('budget', opt.id)}
              icon={opt.icon}
              label={opt.label}
              description={opt.description}
              delay={0.4 + i * 0.05}
            />
          ))}
        </div>
        {errors.budget && (
          <p className="font-body text-xs text-red-500">{errors.budget}</p>
        )}
      </motion.div>
    </div>
  );
}
