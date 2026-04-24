'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle } from 'lucide-react';
import type { TrainingSection } from '@/data/training/modules';
import QuizSection from './QuizSection';

interface SectionViewerProps {
  sections: TrainingSection[];
  moduleTitle: string;
  onComplete?: (_sectionIndex: number, _quizScore: number) => void;
  completedSections?: number[];
}

export default function SectionViewer({ sections, moduleTitle, onComplete, completedSections = [] }: SectionViewerProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [sectionRead, setSectionRead] = useState(false);

  const section = sections[currentSection];
  const isCompleted = completedSections.includes(currentSection);
  const totalSections = sections.length;

  const handleQuizComplete = (score: number) => {
    onComplete?.(currentSection, score);
    setShowQuiz(false);
    setSectionRead(false);
    // Auto-advance to next section after quiz
    if (currentSection < totalSections - 1) {
      setTimeout(() => {
        setCurrentSection(currentSection + 1);
      }, 1500);
    }
  };

  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollPercent = (target.scrollTop + target.clientHeight) / target.scrollHeight;
    if (scrollPercent > 0.9) {
      setSectionRead(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-500">
            Section {currentSection + 1} of {totalSections}
          </h2>
          <span className="text-sm text-gray-400">
            {completedSections.length}/{totalSections} completed
          </span>
        </div>
        <div className="flex gap-1.5">
          {sections.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentSection(idx); setShowQuiz(false); setSectionRead(false); }}
              className={`flex-1 h-2 rounded-full transition-all ${
                completedSections.includes(idx)
                  ? 'bg-emerald-500'
                  : idx === currentSection
                  ? 'bg-[#C9A96E]'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((s, idx) => (
          <button
            key={idx}
            onClick={() => { setCurrentSection(idx); setShowQuiz(false); setSectionRead(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              idx === currentSection
                ? 'bg-[#0F1D2C] text-white'
                : completedSections.includes(idx)
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {completedSections.includes(idx) && <CheckCircle className="w-3.5 h-3.5" />}
            <BookOpen className="w-3.5 h-3.5" />
            Section {idx + 1}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!showQuiz ? (
          <motion.div
            key={`content-${currentSection}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Section content */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#0F1D2C] to-[#1a2d42]">
                <h3 className="text-xl font-semibold text-white font-['Playfair_Display']">
                  {section.title}
                </h3>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-300 mt-2">
                    <CheckCircle className="w-3.5 h-3.5" /> Section completed
                  </span>
                )}
              </div>

              <div
                className="px-8 py-6 max-h-[60vh] overflow-y-auto prose prose-sm max-w-none"
                onScroll={handleContentScroll}
              >
                {section.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Actions */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (currentSection > 0) {
                      setCurrentSection(currentSection - 1);
                      setShowQuiz(false);
                      setSectionRead(false);
                    }
                  }}
                  disabled={currentSection === 0}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  onClick={() => setShowQuiz(true)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    sectionRead || isCompleted
                      ? 'bg-[#C9A96E] text-white hover:bg-[#b89558] shadow-md'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? 'Retake Quiz' : 'Take Quiz'}
                </button>

                <button
                  onClick={() => {
                    if (currentSection < totalSections - 1) {
                      setCurrentSection(currentSection + 1);
                      setShowQuiz(false);
                      setSectionRead(false);
                    }
                  }}
                  disabled={currentSection === totalSections - 1}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`quiz-${currentSection}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <QuizSection
              questions={section.quiz}
              sectionTitle={section.title}
              onComplete={handleQuizComplete}
              onBack={() => setShowQuiz(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
