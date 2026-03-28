'use client';

import { GraduationCap, BookOpen, Award } from 'lucide-react';
import { useCECredits, useCareerPath, useTrainingProgress } from '@/hooks/useProviderData';
import { CECreditTracker, CareerPathVisualization } from '@/components/dashboard/providers';

export default function ProviderTrainingPage() {
  const providerId = 'current-provider';
  const { data: ceCredits, isLoading } = useCECredits(providerId);
  const { data: careerPath } = useCareerPath(providerId);
  const { data: training } = useTrainingProgress(providerId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-rani-navy">Training & Development</h1>
        <p className="text-sm text-rani-muted font-body mt-1">CE credits, certifications, and career path</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ceCredits && <CECreditTracker summary={ceCredits} />}
            {careerPath && <CareerPathVisualization careerPath={careerPath} />}
          </div>

          {training && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-display font-semibold text-rani-navy mb-4">Training Modules</h2>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-body text-rani-navy">Completion</span>
                  <span className="text-sm font-display font-bold text-rani-navy">{training.completionRate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rani-gold rounded-full transition-all" style={{ width: `${training.completionRate}%` }} />
                </div>
              </div>

              <div className="space-y-4">
                {training.inProgress.length > 0 && (
                  <div>
                    <h3 className="text-sm font-body font-semibold text-blue-600 mb-2 flex items-center gap-1">
                      <BookOpen className="w-4 h-4" /> In Progress
                    </h3>
                    <div className="space-y-1">
                      {training.inProgress.map(m => (
                        <div key={m.id} className="text-sm font-body text-rani-navy bg-blue-50 px-3 py-2 rounded-lg">{m.title}</div>
                      ))}
                    </div>
                  </div>
                )}

                {training.available.length > 0 && (
                  <div>
                    <h3 className="text-sm font-body font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" /> Available
                    </h3>
                    <div className="space-y-1">
                      {training.available.map(m => (
                        <div key={m.id} className="text-sm font-body text-rani-muted bg-gray-50 px-3 py-2 rounded-lg">{m.title}</div>
                      ))}
                    </div>
                  </div>
                )}

                {training.completed.length > 0 && (
                  <div>
                    <h3 className="text-sm font-body font-semibold text-green-600 mb-2 flex items-center gap-1">
                      <Award className="w-4 h-4" /> Completed
                    </h3>
                    <div className="space-y-1">
                      {training.completed.map(m => (
                        <div key={m.id} className="text-sm font-body text-rani-muted bg-green-50 px-3 py-2 rounded-lg">{m.title}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
