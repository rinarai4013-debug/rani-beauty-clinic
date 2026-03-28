'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Pill, Users, DollarSign, TrendingUp,
  RefreshCw, Calendar, ShoppingBag, Activity,
  BarChart3, ArrowUpRight, ArrowDownRight,
  Clock, AlertTriangle, ChevronRight,
  Syringe, Heart, Shield, Beaker,
} from 'lucide-react';

/**
 * Medical Services Overview Dashboard
 *
 * Service catalog with pricing, active patient counts, revenue by category,
 * dose distribution, refill calendar, and cross-sell opportunities.
 */

// Service catalog
const SERVICE_CATALOG = [
  {
    id: 'semaglutide_standard',
    name: 'Semaglutide Standard',
    category: 'GLP-1 Weight Loss',
    price: 399,
    priceType: 'monthly' as const,
    description: 'GLP-1 receptor agonist for weight management',
    icon: Pill,
  },
  {
    id: 'semaglutide_premium',
    name: 'Semaglutide Premium',
    category: 'GLP-1 Weight Loss',
    price: 499,
    priceType: 'monthly' as const,
    description: 'Enhanced protocol with premium support',
    icon: Pill,
  },
  {
    id: 'tirzepatide_standard',
    name: 'Tirzepatide Standard',
    category: 'GLP-1 Weight Loss',
    price: 499,
    priceType: 'monthly' as const,
    description: 'Dual GIP/GLP-1 agonist for weight management',
    icon: Pill,
  },
  {
    id: 'tirzepatide_premium',
    name: 'Tirzepatide Premium',
    category: 'GLP-1 Weight Loss',
    price: 599,
    priceType: 'monthly' as const,
    description: 'Premium dual-agonist protocol',
    icon: Pill,
  },
  {
    id: 'vitamin_d3',
    name: 'Vitamin D3 Injection',
    category: 'Wellness Injections',
    price: 50,
    priceType: 'per_visit' as const,
    description: 'Immune support + mood enhancement',
    icon: Syringe,
  },
  {
    id: 'tri_immune',
    name: 'Tri-Immune Injection',
    category: 'Wellness Injections',
    price: 75,
    priceType: 'per_visit' as const,
    description: 'Vitamin C, zinc, glutathione complex',
    icon: Shield,
  },
  {
    id: 'glutathione',
    name: 'Glutathione Injection',
    category: 'Wellness Injections',
    price: 100,
    priceType: 'per_visit' as const,
    description: 'Master antioxidant + detox support',
    icon: Beaker,
  },
  {
    id: 'b12',
    name: 'B12 Injection',
    category: 'Wellness Injections',
    price: 35,
    priceType: 'per_visit' as const,
    description: 'Energy + metabolism booster',
    icon: Syringe,
  },
  {
    id: 'nad_plus',
    name: 'NAD+ Injection',
    category: 'Wellness Injections',
    price: 150,
    priceType: 'per_visit' as const,
    description: 'Cellular energy + anti-aging',
    icon: Heart,
  },
  {
    id: 'rx_skincare',
    name: 'Rx Skincare (Tretinoin)',
    category: 'Rx Skincare',
    price: 99,
    priceType: 'monthly' as const,
    description: 'Prescription-strength skin renewal',
    icon: Beaker,
  },
];

interface PipelineOverview {
  totalPatients: number;
  activePatients: number;
  mrr: number;
  byMedication: Record<string, number>;
  byStage: Record<string, number>;
}

interface RefillCalendarItem {
  name: string;
  medication: string;
  dueDate: string;
  daysUntilDue: number;
  monthlyPrice: number;
}

interface CrossSellOp {
  patientName: string;
  currentService: string;
  suggestedService: string;
  price: number;
  confidence: string;
}

export default function MedicalDashboard() {
  const [pipelineData, setPipelineData] = useState<PipelineOverview | null>(null);
  const [refillCalendar, setRefillCalendar] = useState<RefillCalendarItem[]>([]);
  const [crossSellOps, setCrossSellOps] = useState<CrossSellOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pipelineRes, refillsRes, moneyRes] = await Promise.all([
        fetch('/api/ops/pipeline').then((r) => r.json()).catch(() => null),
        fetch('/api/ops/refills?window=14').then((r) => r.json()).catch(() => null),
        fetch('/api/ops/money').then((r) => r.json()).catch(() => null),
      ]);

      if (pipelineRes?.success) {
        const snap = pipelineRes.data.snapshot;
        const byMed: Record<string, number> = {};
        const byStage: Record<string, number> = {};

        for (const stage of snap.stages) {
          byStage[stage.label] = stage.count;
          for (const p of stage.patients) {
            const med = p.medication || 'Unknown';
            byMed[med] = (byMed[med] || 0) + 1;
          }
        }

        setPipelineData({
          totalPatients: snap.totalPatients,
          activePatients: snap.activePatients,
          mrr: snap.mrr,
          byMedication: byMed,
          byStage,
        });
      }

      if (refillsRes?.success) {
        const items: RefillCalendarItem[] = [];
        for (const window of refillsRes.data.byWindow) {
          for (const p of window.patients) {
            items.push({
              name: p.name,
              medication: p.medication,
              dueDate: '', // Relative date
              daysUntilDue: p.daysUntilDue,
              monthlyPrice: p.monthlyPrice,
            });
          }
        }
        setRefillCalendar(items.slice(0, 10));
      }

      if (moneyRes?.success) {
        const ops: CrossSellOp[] = moneyRes.data.crossSellOpportunities?.items?.slice(0, 8)?.map((c: Record<string, unknown>) => ({
          patientName: c.patientName,
          currentService: 'GLP-1',
          suggestedService: c.suggestedService,
          price: c.price,
          confidence: c.confidence,
        })) || [];
        setCrossSellOps(ops);
      }
    } catch {
      // Handled by UI state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group services by category
  const categories = Array.from(new Set(SERVICE_CATALOG.map((s) => s.category)));
  const filteredServices = activeCategory
    ? SERVICE_CATALOG.filter((s) => s.category === activeCategory)
    : SERVICE_CATALOG;

  // Calculate dose distribution from pipeline data
  const doseDistribution = pipelineData?.byMedication || {};
  const totalMedPatients = Object.values(doseDistribution).reduce((s, v) => s + v, 0) || 1;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-white">Medical Services</h1>
        <p className="text-xs sm:text-sm font-body text-gray-400 mt-1">
          Service catalog, patient distribution, revenue by category, and cross-sell opportunities
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500">Active Patients</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? '--' : pipelineData?.activePatients || 0}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {pipelineData?.totalPatients || 0} total in pipeline
          </p>
        </div>
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#C9A96E]" />
            <span className="text-xs text-gray-500">Medical MRR</span>
          </div>
          <p className="text-2xl font-bold text-[#C9A96E]">
            ${loading ? '--' : (pipelineData?.mrr || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            ${((pipelineData?.mrr || 0) * 12).toLocaleString()}/yr projected
          </p>
        </div>
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-gray-500">Services</span>
          </div>
          <p className="text-2xl font-bold text-white">{SERVICE_CATALOG.length}</p>
          <p className="text-[10px] text-gray-500 mt-1">{categories.length} categories</p>
        </div>
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-500">Refills Due</span>
          </div>
          <p className="text-2xl font-bold text-white">{refillCalendar.length}</p>
          <p className="text-[10px] text-gray-500 mt-1">Next 14 days</p>
        </div>
      </div>

      {/* Service Catalog */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-body font-medium text-gray-400 uppercase tracking-wider">
            Service Catalog
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2 py-1 rounded text-xs transition ${
                !activeCategory ? 'bg-[#C9A96E]/20 text-[#C9A96E]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-2 py-1 rounded text-xs transition ${
                  activeCategory === cat ? 'bg-[#C9A96E]/20 text-[#C9A96E]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredServices.map((service) => {
            const Icon = service.icon;
            const patientCount = doseDistribution[service.id] || 0;

            return (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#C9A96E]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{service.name}</h4>
                      <p className="text-[10px] text-gray-500">{service.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#C9A96E]">${service.price}</p>
                    <p className="text-[10px] text-gray-500">/{service.priceType.replace('_', ' ')}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{service.description}</p>
                {patientCount > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-600" />
                    <span className="text-[10px] text-gray-500">{patientCount} active patients</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Two Column: Dose Distribution + Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dose Distribution */}
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-medium text-white">Medication Distribution</h3>
          </div>
          {Object.keys(doseDistribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(doseDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([med, count]) => {
                  const pct = Math.round((count / totalMedPatients) * 100);
                  const colors: Record<string, string> = {
                    semaglutide: 'bg-blue-500',
                    tirzepatide: 'bg-violet-500',
                  };
                  const barColor = Object.entries(colors).find(([key]) => med.toLowerCase().includes(key))?.[1] || 'bg-gray-500';

                  return (
                    <div key={med}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-300 capitalize">{med}</span>
                        <span className="text-xs text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No medication data available</p>
            </div>
          )}
        </div>

        {/* Revenue by Service Category */}
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-[#C9A96E]" />
            <h3 className="text-sm font-medium text-white">Revenue by Category</h3>
          </div>
          <div className="space-y-3">
            {categories.map((category) => {
              const services = SERVICE_CATALOG.filter((s) => s.category === category);
              const avgPrice = Math.round(services.reduce((s, svc) => s + svc.price, 0) / services.length);
              const serviceCount = services.length;

              // Estimate revenue contribution
              const isGlp1 = category.includes('GLP-1');
              const revenueShare = isGlp1 ? 70 : category.includes('Wellness') ? 20 : 10;

              return (
                <div key={category} className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{category}</span>
                    <span className="text-xs text-[#C9A96E]">{revenueShare}% of revenue</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">
                      {serviceCount} services | avg ${avgPrice}
                    </span>
                    <div className="h-1.5 w-24 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C9A96E] rounded-full"
                        style={{ width: `${revenueShare}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column: Refill Calendar + Cross-sell */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Refill Calendar */}
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-medium text-white">Refill Calendar</h3>
            </div>
            <a href="/dashboard/ops" className="text-xs text-[#C9A96E] hover:underline flex items-center gap-1">
              Run /refills <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          {refillCalendar.length > 0 ? (
            <div className="space-y-2">
              {refillCalendar.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    item.daysUntilDue <= 0
                      ? 'bg-red-500/10 border border-red-500/20'
                      : item.daysUntilDue <= 3
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-gray-800/30 border border-gray-700/30'
                  }`}
                >
                  <div>
                    <p className="text-xs text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-500">{item.medication}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      item.daysUntilDue <= 0 ? 'text-red-400' : item.daysUntilDue <= 3 ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      {item.daysUntilDue <= 0
                        ? `${Math.abs(item.daysUntilDue)}d overdue`
                        : item.daysUntilDue === 0
                          ? 'Due today'
                          : `${item.daysUntilDue}d`
                      }
                    </p>
                    <p className="text-[10px] text-[#C9A96E]">${item.monthlyPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No refills due in the next 14 days</p>
            </div>
          )}
        </div>

        {/* Cross-sell Opportunities */}
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-medium text-white">Cross-sell Opportunities</h3>
            </div>
            <a href="/dashboard/ops" className="text-xs text-[#C9A96E] hover:underline flex items-center gap-1">
              Run /money <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          {crossSellOps.length > 0 ? (
            <div className="space-y-2">
              {crossSellOps.map((op, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                  <div>
                    <p className="text-xs text-white">{op.patientName}</p>
                    <p className="text-[10px] text-gray-500">
                      {op.currentService} + {op.suggestedService}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-[#C9A96E]">+${op.price}/mo</p>
                    <p className={`text-[10px] ${
                      op.confidence === 'high' ? 'text-green-400' : op.confidence === 'medium' ? 'text-amber-400' : 'text-gray-500'
                    }`}>
                      {op.confidence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No cross-sell opportunities detected</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/dashboard/ops"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-lg text-sm text-[#C9A96E] hover:bg-[#C9A96E]/20 transition"
        >
          Ops Command Center
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
        <a
          href="/dashboard/ops/pipeline"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-400 hover:bg-blue-500/20 transition"
        >
          Full Pipeline
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
        <a
          href="/dashboard/ops/intake"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 hover:bg-green-500/20 transition"
        >
          New Intake
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
