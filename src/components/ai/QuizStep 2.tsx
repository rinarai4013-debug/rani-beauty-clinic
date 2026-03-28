'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { QuizQuestion, QuizOption } from '@/types/ai-treatment';

interface QuizStepProps {
  question: QuizQuestion;
  currentAnswer: string | string[];
  onAnswer: (value: string | string[]) => void;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
}

export default function QuizStep({
  question,
  currentAnswer,
  onAnswer,
  onNext,
  onBack,
  currentStep,
  totalSteps,
  canProceed,
}: QuizStepProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleSingleSelect = (value: string) => {
    onAnswer(value);
  };

  const handleMultiSelect = (value: string) => {
    const current = Array.isArray(currentAnswer) ? currentAnswer : [];
    const maxSelect = question.maxSelect || 3;

    if (current.includes(value)) {
      onAnswer(current.filter(v => v !== value));
    } else if (current.length < maxSelect) {
      onAnswer([...current, value]);
    }
  };

  const isSelected = (value: string) => {
    if (Array.isArray(currentAnswer)) return currentAnswer.includes(value);
    return currentAnswer === value;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-[#0F1D2C]/60 mb-2 font-montserrat">
          <span>Question {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-[#F8F6F1] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#C9A96E] to-[#B08E5A] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl md:text-3xl font-playfair text-[#0F1D2C] mb-2">
            {question.question}
          </h2>
          {question.subtitle && (
            <p className="text-[#0F1D2C]/60 font-montserrat mb-6">{question.subtitle}</p>
          )}

          {question.type === 'multiple' && question.maxSelect && (
            <p className="text-sm text-[#C9A96E] font-montserrat mb-4">
              Select up to {question.maxSelect}
              {question.minSelect ? ` (minimum ${question.minSelect})` : ''}
            </p>
          )}

          {/* Options */}
          <div className={`grid gap-3 ${question.options && question.options.length > 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {question.options?.map((option) => (
              <motion.button
                key={option.value}
                onClick={() =>
                  question.type === 'multiple'
                    ? handleMultiSelect(option.value)
                    : handleSingleSelect(option.value)
                }
                className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected(option.value)
                    ? 'border-[#C9A96E] bg-[#C9A96E]/5 shadow-md'
                    : 'border-[#F8F6F1] bg-white hover:border-[#C9A96E]/40 hover:shadow-sm'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-3">
                  {/* Selection indicator */}
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected(option.value)
                      ? 'border-[#C9A96E] bg-[#C9A96E]'
                      : 'border-[#0F1D2C]/20'
                  }`}>
                    {isSelected(option.value) && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 text-white"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                  </div>
                  <div>
                    <span className="font-montserrat font-medium text-[#0F1D2C]">{option.label}</span>
                    {option.description && (
                      <p className="text-sm text-[#0F1D2C]/50 mt-1 font-montserrat">{option.description}</p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          disabled={currentStep === 0}
          className="px-6 py-3 font-montserrat text-[#0F1D2C]/60 hover:text-[#0F1D2C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <motion.button
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-[#0F1D2C] text-white font-montserrat font-medium rounded-xl hover:bg-[#1a2d40] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          whileHover={canProceed ? { scale: 1.02 } : {}}
          whileTap={canProceed ? { scale: 0.98 } : {}}
        >
          {currentStep === totalSteps - 1 ? 'See My Results' : 'Next'}
        </motion.button>
      </div>
    </div>
  );
}
