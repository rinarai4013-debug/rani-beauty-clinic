'use client';

import { useState, useMemo } from 'react';
import type { SkincareRx, ProductRecommendation, RevenueProjection, StockRecommendation } from '@/lib/mastermind/product-engine';
import { calculateRevenueProjection, getStockRecommendations } from '@/lib/mastermind/product-engine';

// ── Props ──────────────────────────────────────────────────────────────

interface SkincareRxPanelProps {
  rx: SkincareRx;
  patientName?: string;
}

// ── Action Badge ───────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  ProductRecommendation['action'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  keep: {
    label: 'Keep',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  replace: {
    label: 'Replace',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  remove: {
    label: 'Remove',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  add: {
    label: 'Add',
    bg: 'bg-[#C9A96E]/10',
    text: 'text-rani-gold-accessible',
    border: 'border-[#C9A96E]/30',
    dot: 'bg-[#C9A96E]',
  },
};

function ActionBadge({ action }: { action: ProductRecommendation['action'] }) {
  const config = ACTION_CONFIG[action];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ── Step Label ─────────────────────────────────────────────────────────

const STEP_LABELS: Record<number, string> = {
  1: 'Cleanser',
  2: 'Toner',
  3: 'Serum / Treatment',
  4: 'Moisturizer',
  5: 'SPF',
  6: 'Eye Cream',
  7: 'Mask',
};

// ── Recommendation Card ────────────────────────────────────────────────

function RecommendationCard({ rec }: { rec: ProductRecommendation }) {
  const stepLabel = STEP_LABELS[rec.step] ?? `Step ${rec.step}`;

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all hover:shadow-md ${
        rec.action === 'remove'
          ? 'border-red-200 bg-red-50/30'
          : rec.action === 'add'
            ? 'border-[#C9A96E]/20 bg-[#C9A96E]/5'
            : rec.action === 'replace'
              ? 'border-amber-200 bg-amber-50/30'
              : 'border-[#0F1D2C]/10 bg-white'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#0F1D2C] text-white flex items-center justify-center text-xs font-bold">
            {rec.step}
          </span>
          <span className="text-[10px] font-medium text-[#0F1D2C]/40 uppercase tracking-widest">
            {stepLabel}
          </span>
        </div>
        <ActionBadge action={rec.action} />
      </div>

      {/* Current Product */}
      {rec.currentProduct && (
        <p
          className={`font-body text-sm mb-1 ${
            rec.action === 'remove'
              ? 'line-through text-red-400'
              : rec.action === 'replace'
                ? 'line-through text-[#0F1D2C]/40'
                : 'text-[#0F1D2C] font-medium'
          }`}
        >
          {rec.currentProduct}
        </p>
      )}

      {/* Replace Arrow + Recommended */}
      {rec.recommendedProduct && (rec.action === 'replace' || rec.action === 'add') && (
        <div className="mt-2">
          {rec.action === 'replace' && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-4 h-4 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="text-[10px] font-semibold text-[#C9A96E] uppercase tracking-wider">
                Upgrade to
              </span>
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold text-[#0F1D2C]">
                {rec.recommendedProduct.brand}{' '}
                <span className="font-medium">{rec.recommendedProduct.name}</span>
              </p>
              {rec.recommendedProduct.activeIngredients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {rec.recommendedProduct.activeIngredients.slice(0, 4).map((ingredient) => (
                    <span
                      key={ingredient}
                      className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#F8F6F1] text-[#0F1D2C]/60 border border-[#0F1D2C]/5"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="font-display text-lg font-bold text-[#0F1D2C]">
                ${rec.recommendedProduct.price}
              </span>
              {rec.recommendedProduct.raniCarries && (
                <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider">
                  In Stock
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reason */}
      <p className="font-body text-xs text-[#0F1D2C]/50 mt-2 leading-relaxed">
        {rec.reason}
      </p>
    </div>
  );
}

// ── Routine Column ─────────────────────────────────────────────────────

function RoutineColumn({
  title,
  icon,
  recommendations,
}: {
  title: string;
  icon: React.ReactNode;
  recommendations: ProductRecommendation[];
}) {
  if (recommendations.length === 0) {
    return (
      <div className="flex-1 min-w-[320px]">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="font-display text-lg font-bold text-[#0F1D2C]">{title}</h3>
        </div>
        <p className="font-body text-sm text-[#0F1D2C]/40 italic">
          No products submitted for this routine.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[320px]">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-display text-lg font-bold text-[#0F1D2C]">{title}</h3>
        <span className="ml-auto text-xs font-medium text-[#0F1D2C]/40">
          {recommendations.length} step{recommendations.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <RecommendationCard key={`${rec.timing}-${rec.step}-${i}`} rec={rec} />
        ))}
      </div>
    </div>
  );
}

// ── Revenue Opportunity Section ────────────────────────────────────────

function RevenueOpportunity({ projection }: { projection: RevenueProjection }) {
  return (
    <div className="rounded-2xl border border-[#C9A96E]/20 bg-gradient-to-br from-[#0F1D2C] to-[#1a2d3f] p-6 text-white">
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-5 h-5 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="font-display text-lg font-bold">Revenue Opportunity</h3>
      </div>

      {/* Per-Patient */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
          <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-1">
            Annual / Patient
          </p>
          <p className="font-display text-2xl font-bold text-[#C9A96E]">
            ${projection.perPatientAnnual.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
          <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-1">
            Margin / Patient
          </p>
          <p className="font-display text-2xl font-bold text-emerald-400">
            ${projection.perPatientMargin.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Monthly Projections */}
      <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
        Monthly Revenue Projection
      </h4>
      <div className="space-y-3">
        {[
          { label: '50 patients/mo', revenue: projection.monthly50, margin: projection.margin50 },
          { label: '100 patients/mo', revenue: projection.monthly100, margin: projection.margin100 },
          { label: '200 patients/mo', revenue: projection.monthly200, margin: projection.margin200 },
        ].map((tier) => (
          <div key={tier.label} className="flex items-center justify-between">
            <span className="text-sm text-white/60">{tier.label}</span>
            <div className="flex items-center gap-4">
              <span className="font-display text-sm font-bold text-white">
                ${tier.revenue.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                (${tier.margin.toLocaleString()} margin)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* $100K goal indicator */}
      {projection.monthly100 >= 100000 && (
        <div className="mt-4 rounded-lg bg-[#C9A96E]/20 border border-[#C9A96E]/30 p-3 text-center">
          <p className="text-sm font-bold text-[#C9A96E]">
            $100K/month target achievable at 100 patients/month
          </p>
        </div>
      )}
    </div>
  );
}

// ── Stock Recommendations Section ──────────────────────────────────────

function StockSection({ stocks }: { stocks: StockRecommendation[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? stocks : stocks.slice(0, 5);
  const totalMonthlyRevenue = stocks.reduce((s, r) => s + r.projectedMonthlyRevenue, 0);
  const totalMonthlyMargin = stocks.reduce((s, r) => s + r.projectedMonthlyMargin, 0);

  return (
    <div className="rounded-2xl border border-[#C9A96E]/20 bg-[#F8F6F1] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-rani-gold-accessible" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="font-display text-lg font-bold text-[#0F1D2C]">
            Products to Stock
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#0F1D2C]/40">Projected monthly</p>
          <p className="font-display text-lg font-bold text-rani-gold-accessible">
            ${totalMonthlyRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium">
            ${totalMonthlyMargin.toLocaleString()} margin
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {displayed.map((stock) => (
          <div
            key={stock.product.id}
            className="flex items-center justify-between rounded-xl bg-white border border-[#0F1D2C]/5 p-3 hover:shadow-sm transition-shadow"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-body text-sm font-semibold text-[#0F1D2C] truncate">
                  {stock.product.brand}
                </p>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#0F1D2C]/5 text-[#0F1D2C]/50 uppercase tracking-wider">
                  {stock.product.category}
                </span>
              </div>
              <p className="font-body text-xs text-[#0F1D2C]/50 truncate">
                {stock.product.name}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 ml-3">
              <div className="text-right">
                <p className="font-display text-sm font-bold text-[#0F1D2C]">
                  ${stock.product.price}
                </p>
                <p className="text-[10px] text-[#0F1D2C]/40">
                  {Math.round(stock.product.margin * 100)}% margin
                </p>
              </div>
              <div className="text-right min-w-[80px]">
                <p className="text-xs font-semibold text-rani-gold-accessible">
                  ${stock.projectedMonthlyRevenue.toLocaleString()}/mo
                </p>
                <p className="text-[10px] text-[#0F1D2C]/40">
                  ~{stock.projectedMonthlyUnits} units
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stocks.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full text-center text-xs font-semibold text-rani-gold-accessible hover:text-[#b8943d] transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${stocks.length} Products`}
        </button>
      )}
    </div>
  );
}

// ── Contraindications Banner ───────────────────────────────────────────

function ContraindicationsBanner({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <h3 className="font-display text-sm font-bold text-red-700">
          Contraindications & Warnings
        </h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 font-body text-xs text-red-600 leading-relaxed">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export default function SkincareRxPanel({ rx, patientName }: SkincareRxPanelProps) {
  const projection = useMemo(() => calculateRevenueProjection(rx), [rx]);
  const stockRecs = useMemo(() => getStockRecommendations(100), []);

  const totalRecommended = [...rx.amRoutine, ...rx.pmRoutine].filter(
    (r) => r.action === 'replace' || r.action === 'add'
  ).length;

  // AM icon (sun)
  const amIcon = (
    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );

  // PM icon (moon)
  const pmIcon = (
    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-[#0F1D2C]">
            Skincare Rx{patientName ? ` for ${patientName}` : ''}
          </h2>
          <p className="font-body text-sm text-[#0F1D2C]/50 mt-1">
            {rx.summary}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-medium text-[#0F1D2C]/40 uppercase tracking-widest">
              Products Recommended
            </p>
            <p className="font-display text-2xl font-bold text-rani-gold-accessible">
              {totalRecommended}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Keep',
            count: [...rx.amRoutine, ...rx.pmRoutine].filter((r) => r.action === 'keep').length,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Replace',
            count: [...rx.amRoutine, ...rx.pmRoutine].filter((r) => r.action === 'replace').length,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Remove',
            count: [...rx.amRoutine, ...rx.pmRoutine].filter((r) => r.action === 'remove').length,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
          {
            label: 'Add',
            count: [...rx.amRoutine, ...rx.pmRoutine].filter((r) => r.action === 'add').length,
            color: 'text-rani-gold-accessible',
            bg: 'bg-[#C9A96E]/10',
          },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-xl ${bg} border border-[#0F1D2C]/5 p-3 text-center`}>
            <p className={`font-display text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-[10px] font-medium text-[#0F1D2C]/40 uppercase tracking-widest mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Contraindications */}
      <ContraindicationsBanner items={rx.contraindications} />

      {/* AM / PM Columns */}
      <div className="flex gap-6 flex-col lg:flex-row">
        <RoutineColumn title="AM Routine" icon={amIcon} recommendations={rx.amRoutine} />
        <RoutineColumn title="PM Routine" icon={pmIcon} recommendations={rx.pmRoutine} />
      </div>

      {/* Revenue Opportunity */}
      <RevenueOpportunity projection={projection} />

      {/* Products to Stock */}
      <StockSection stocks={stockRecs} />
    </div>
  );
}
