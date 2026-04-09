'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Award, Users, TrendingUp } from 'lucide-react';
import { useCECredits, useCareerPath, useTrainingProgress, useSkillCertifications, useTrainingBudget } from '@/hooks/useProviderData';
import KPICard from '@/components/dashboard/cards/KPICard';
import { CECreditTracker, CareerPathVisualization, SkillMatrix } from '@/components/dashboard/providers';
import { DashboardErrorBoundary, PanelSkeleton, KPIRowSkeleton, InlineError } from '@/components/dashboard/shared';

const PROVIDERS = [
  { id: 'rina', name: 'Rina' },
  { id: 'mom', name: 'Mom' },
];

const SERVICES = ['Botox', 'Fillers', 'Sofwave', 'HydraFacial', 'PicoWay', 'RF Microneedling', 'VI Peel', 'PRX-T33', 'Laser Hair Removal', 'Wellness Injections', 'GLP-1 Weight Loss'];

export default function DevelopmentPage() {
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].id);
  const { data: ceCredits, isLoading, error, mutate } = useCECredits(selectedProvider);
  const { data: careerPath } = useCareerPath(selectedProvider);
  const { data: training } = useTrainingProgress(selectedProvider);
  const { data: certifications } = useSkillCertifications();
  const { data: budget } = useTrainingBudget(selectedProvider);

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Development">
        <InlineError message="Failed to load development data" onRetry={() => mutate()} />
      </DashboardErrorBoundary>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-rani-navy">Professional Development</h1>
          <p className="text-sm text-rani-muted font-body mt-1">CE credits, certifications, training, and career growth</p>
        </div>
        <div className="flex gap-2">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${selectedProvider === p.id ? 'bg-rani-navy text-white' : 'bg-gray-100 text-rani-navy hover:bg-gray-200'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <KPIRowSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="CE Credits" value={ceCredits?.completedCredits ?? 0} suffix={`/${ceCredits?.requiredCredits ?? 0}`} icon="star" />
          <KPICard title="Training Complete" value={training?.completionRate ?? 0} suffix="%" icon="target" />
          <KPICard title="Modules Done" value={training?.completed.length ?? 0} icon="calendar" />
          <KPICard title="Budget Available" value={budget?.available ?? 0} prefix="$" icon="dollar-sign" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CE Credits */}
        {ceCredits && <CECreditTracker summary={ceCredits} />}

        {/* Career Path */}
        {careerPath && <CareerPathVisualization careerPath={careerPath} />}
      </div>

      {/* Training Progress */}
      {training && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold text-rani-navy mb-4">Training Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-body font-semibold text-green-600 mb-2 flex items-center gap-1">
                <Award className="w-4 h-4" /> Completed ({training.completed.length})
              </h3>
              <div className="space-y-1">
                {training.completed.map(m => (
                  <div key={m.id} className="text-xs font-body text-rani-muted bg-green-50 px-2 py-1.5 rounded">{m.title}</div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-body font-semibold text-blue-600 mb-2 flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> In Progress ({training.inProgress.length})
              </h3>
              <div className="space-y-1">
                {training.inProgress.map(m => (
                  <div key={m.id} className="text-xs font-body text-rani-muted bg-blue-50 px-2 py-1.5 rounded">{m.title}</div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-body font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <GraduationCap className="w-4 h-4" /> Available ({training.available.length})
              </h3>
              <div className="space-y-1">
                {training.available.map(m => (
                  <div key={m.id} className="text-xs font-body text-rani-muted bg-gray-50 px-2 py-1.5 rounded">{m.title}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Matrix */}
      {certifications && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold text-rani-navy mb-4">Certification Matrix</h2>
          <SkillMatrix
            matrix={certifications.matrix}
            providerNames={Object.fromEntries(PROVIDERS.map(p => [p.id, p.name]))}
            services={SERVICES}
          />
          {certifications.coverageGaps.length > 0 && (
            <div className="mt-3 p-2 bg-amber-50 rounded-lg text-xs text-amber-600 font-body">
              Coverage gaps: {certifications.coverageGaps.map(g => g.service).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Training Budget */}
      {budget && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold text-rani-navy mb-4">Training Budget</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-rani-muted font-body">Annual Budget</p>
              <p className="font-display font-bold text-rani-navy">${budget.annualBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-rani-muted font-body">Spent</p>
              <p className="font-display font-bold text-rani-navy">${budget.spent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-rani-muted font-body">Committed</p>
              <p className="font-display font-bold text-amber-500">${budget.committed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-rani-muted font-body">Available</p>
              <p className="font-display font-bold text-green-600">${budget.available.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
