'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowLeft, Trophy, RotateCcw } from 'lucide-react';
import type { QuizQuestion } from '@/data/training/modules';

interface QuizSectionProps {
  questions: QuizQuestion[];
  sectionTitle: string;
  onComplete: (_score: number) => void;
  onBack: () => void;
}

export default function QuizSection({ questions, sectionTitle, onComplete, onBack }: QuizSectionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<{ questionIdx: number; selected: number; correct: boolean }[]>([]);

  const question = questions[currentQuestion];
  const isCorrect = selectedOption === question?.correctIndex;
  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= 80;

  const handleSelect = (optionIndex: number) => {
    if (answered) return;
    setSelectedOption(optionIndex);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setAnswered(true);
    const correct = selectedOption === question.correctIndex;
    if (correct) setCorrectCount(prev => prev + 1);
    setAnswers(prev => [...prev, { questionIdx: currentQuestion, selected: selectedOption, correct }]);
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setAnswered(false);
    setCorrectCount(0);
    setShowResults(false);
    setAnswers([]);
  };

  if (showResults) {
    const finalScore = Math.round(((correctCount + (isCorrect && answered ? 0 : 0)) / totalQuestions) * 100);

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className={`px-8 py-8 text-center ${passed ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
          <Trophy className={`w-12 h-12 mx-auto mb-3 ${passed ? 'text-yellow-300' : 'text-white/70'}`} />
          <h3 className="text-2xl font-bold text-white font-['Playfair_Display'] mb-2">
            {passed ? 'Congratulations!' : 'Almost There!'}
          </h3>
          <p className="text-white/90 text-lg">
            You scored <span className="font-bold">{finalScore}%</span> ({correctCount}/{totalQuestions} correct)
          </p>
          <p className="text-white/70 text-sm mt-1">
            {passed ? 'You passed this section quiz.' : 'You need 80% to pass. Review the material and try again.'}
          </p>
        </div>

        <div className="px-8 py-6 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Review</h4>
          {answers.map((answer, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${answer.correct ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-2">
                {answer.correct ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">{questions[answer.questionIdx].question}</p>
                  {!answer.correct && (
                    <p className="text-xs text-gray-600 mt-1">
                      {questions[answer.questionIdx].explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to content
          </button>
          <div className="flex gap-3">
            {!passed && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 border border-amber-200"
              >
                <RotateCcw className="w-4 h-4" /> Retry Quiz
              </button>
            )}
            <button
              onClick={() => onComplete(finalScore)}
              className="px-6 py-2 text-sm font-semibold text-white bg-[#C9A96E] rounded-lg hover:bg-[#b89558] shadow-md"
            >
              {passed ? 'Complete Section' : 'Continue Anyway'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Quiz header */}
      <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-[#0F1D2C] to-[#1a2d42]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#C9A96E] font-medium uppercase tracking-wider mb-1">Quiz</p>
            <h3 className="text-lg font-semibold text-white font-['Playfair_Display']">
              {sectionTitle}
            </h3>
          </div>
          <span className="text-sm text-gray-400">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1.5 mt-3">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full ${
                idx < currentQuestion
                  ? answers[idx]?.correct ? 'bg-emerald-500' : 'bg-red-400'
                  : idx === currentQuestion
                  ? 'bg-[#C9A96E]'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-lg font-medium text-[#0F1D2C] mb-6">
              {question.question}
            </p>

            <div className="space-y-3">
              {question.options.map((option, idx) => {
                let optionStyle = 'bg-gray-50 border-gray-200 hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/5';
                if (selectedOption === idx && !answered) {
                  optionStyle = 'bg-[#C9A96E]/10 border-[#C9A96E] ring-2 ring-[#C9A96E]/20';
                }
                if (answered) {
                  if (idx === question.correctIndex) {
                    optionStyle = 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200';
                  } else if (idx === selectedOption && !isCorrect) {
                    optionStyle = 'bg-red-50 border-red-400 ring-2 ring-red-200';
                  } else {
                    optionStyle = 'bg-gray-50 border-gray-200 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={answered}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        answered && idx === question.correctIndex
                          ? 'bg-emerald-500 text-white'
                          : answered && idx === selectedOption && !isCorrect
                          ? 'bg-red-400 text-white'
                          : selectedOption === idx
                          ? 'bg-[#C9A96E] text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm text-gray-700">{option}</span>
                      {answered && idx === question.correctIndex && (
                        <CheckCircle className="w-5 h-5 text-emerald-600 ml-auto shrink-0" />
                      )}
                      {answered && idx === selectedOption && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-500 ml-auto shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {answered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}
              >
                <p className={`text-sm font-medium mb-1 ${isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite right.'}
                </p>
                <p className="text-sm text-gray-600">{question.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to content
        </button>
        {!answered ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#C9A96E] rounded-lg hover:bg-[#b89558] shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0F1D2C] rounded-lg hover:bg-[#1a2d42] shadow-md"
          >
            {currentQuestion < totalQuestions - 1 ? 'Next Question' : 'View Results'}
          </button>
        )}
      </div>
    </div>
  );
}
