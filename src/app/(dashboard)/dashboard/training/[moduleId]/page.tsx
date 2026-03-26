'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BookOpen, Award, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getModuleBySlug, ROLE_LABELS, ROLE_COLORS } from '@/data/training/modules';
import SectionViewer from '@/components/dashboard/training/SectionViewer';
import CertificateBadge from '@/components/dashboard/training/CertificateBadge';

export default function ModuleViewerPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const module = getModuleBySlug(moduleId);

  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [quizScores, setQuizScores] = useState<Record<number, number>>({});
  const [moduleComplete, setModuleComplete] = useState(false);

  const handleSectionComplete = useCallback((sectionIndex: number, score: number) => {
    setCompletedSections(prev => {
      if (prev.includes(sectionIndex)) return prev;
      const updated = [...prev, sectionIndex];
      // Check if all sections are done
      if (module && updated.length === module.sections.length) {
        setTimeout(() => setModuleComplete(true), 500);
      }
      return updated;
    });
    setQuizScores(prev => ({ ...prev, [sectionIndex]: score }));

    // POST to API
    fetch(`/api/dashboard/training/${moduleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionIndex, quizScore: score, action: 'complete_section' }),
    }).catch(console.error);
  }, [module, moduleId]);

  if (!module) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700">Module not found</h2>
        <p className="text-gray-400 mt-1">The training module "{moduleId}" does not exist.</p>
        <Link
          href="/dashboard/training"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-[#C9A96E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Training Center
        </Link>
      </div>
    );
  }

  const roleColor = ROLE_COLORS[module.role];
  const roleLabel = ROLE_LABELS[module.role];
  const allScores = Object.values(quizScores);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/training"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Training Center
      </Link>

      {/* Module header */}
      <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1a2d42] rounded-xl p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: roleColor }}
            >
              {roleLabel}
            </span>
            <h1 className="text-2xl font-bold text-white font-['Playfair_Display'] mt-3">
              {module.title}
            </h1>
            <p className="text-gray-400 mt-2 max-w-2xl">
              {module.description}
            </p>
            <div className="flex items-center gap-5 mt-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {module.duration} min
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> {module.sections.length} sections
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4" /> {module.sections.reduce((a, s) => a + s.quiz.length, 0)} quiz questions
              </span>
            </div>
            {module.prerequisites.length > 0 && (
              <p className="text-xs text-gray-500 mt-3">
                Prerequisites: {module.prerequisites.join(', ')}
              </p>
            )}
          </div>

          {/* Completion status */}
          <div className="flex flex-col items-end gap-2">
            {moduleComplete ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <CertificateBadge
                  staffName="You"
                  moduleTitle={module.title}
                  role={module.role}
                  score={avgScore}
                  completedAt={new Date().toISOString()}
                  size="sm"
                />
              </motion.div>
            ) : (
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {completedSections.length}/{module.sections.length} sections
                </p>
                <div className="w-32 bg-gray-700 rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full bg-[#C9A96E] transition-all duration-500"
                    style={{ width: `${(completedSections.length / module.sections.length) * 100}%` }}
                  />
                </div>
                {avgScore > 0 && (
                  <p className={`text-sm font-medium mt-2 ${avgScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Avg Score: {avgScore}%
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module complete banner */}
      {moduleComplete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            avgScore >= 80
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className={`w-6 h-6 ${avgScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div>
              <p className={`font-semibold ${avgScore >= 80 ? 'text-emerald-800' : 'text-amber-800'}`}>
                {avgScore >= 80 ? 'Module Complete - Certified!' : 'Module Complete - Review Recommended'}
              </p>
              <p className={`text-sm ${avgScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                Average score: {avgScore}%. {avgScore >= 80 ? 'You passed all quizzes.' : 'Score 80%+ on all quizzes to earn certification.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section viewer */}
      <SectionViewer
        sections={module.sections}
        moduleTitle={module.title}
        onComplete={handleSectionComplete}
        completedSections={completedSections}
      />
    </div>
  );
}
