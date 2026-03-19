'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  ArrowLeft, Mail, Phone, Calendar, DollarSign, Star,
  MessageSquare, CreditCard, Crown, AlertTriangle, Clock, TrendingUp,
} from 'lucide-react';
import RecommendationsPanel from '@/components/dashboard/panels/RecommendationsPanel';
import { DashboardErrorBoundary, PanelSkeleton, KPIRowSkeleton, SkeletonBar, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';

interface ClientAppointment {
  id: string; service: string; category: string; provider: string;
  date: string; time: string; duration: number; status: string; amountPaid: number; isConsult: boolean;
}
interface ClientTransaction {
  id: string; date: string; type: string; amount: number; paymentMethod: string; service: string; status: string;
}
interface ClientMembership {
  id: string; tier: string; monthlyPrice: number; status: string; startDate: string; churnRiskScore: number;
}
interface ClientMessage {
  id: string; date: string; channel: string; direction: string; subject: string; status: string;
}
interface ClientReview {
  id: string; rating: number; text: string; date: string; platform: string; sentiment: string;
}
interface ClientProfile {
  id: string; firstName: string; lastName: string; name: string; email: string; phone: string;
  status: string; preferredContact: string; ltv: number; visitCount: number;
  lastVisitDate: string; daysSinceLastVisit: number; membershipTier: string; membershipStatus: string;
  appointments: ClientAppointment[]; transactions: ClientTransaction[];
  memberships: ClientMembership[]; messages: ClientMessage[]; reviews: ClientReview[];
}

const STATUS_COLORS: Record<string, string> = {
  'New Lead': 'bg-purple-100 text-purple-700', 'Active': 'bg-green-100 text-green-700',
  'Lapsed 30': 'bg-yellow-100 text-yellow-700', 'Lapsed 60': 'bg-orange-100 text-orange-700',
  'Lapsed 90': 'bg-red-100 text-red-700', 'Churned': 'bg-gray-100 text-gray-500',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: client, isLoading, error, mutate } = useDashboardData<ClientProfile>(
    id ? `/clients/${id}?full=true` : null, { refreshInterval: 60000 }
  );

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Client Profile">
        <div className="space-y-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <InlineError message="Failed to load client profile" onRetry={() => mutate()} />
        </div>
      </DashboardErrorBoundary>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBar className="h-4 w-16" />
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-6">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <SkeletonBar className="h-6 w-48" />
              <SkeletonBar className="h-3 w-64" />
            </div>
          </div>
        </div>
        <KPIRowSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <DashboardEmptyState icon="users" title="Client not found" description="This client profile could not be loaded. They may have been removed." action={{ label: 'Go Back', onClick: () => router.back() }} />
      </div>
    );
  }

  const appointments = client.appointments || [];
  const transactions = client.transactions || [];
  const memberships = client.memberships || [];
  const messages = client.messages || [];
  const reviews = client.reviews || [];
  const activeMembership = memberships.find(m => m.status === 'Active');

  const churnRisk = client.daysSinceLastVisit > 90 ? 'high'
    : client.daysSinceLastVisit > 60 ? 'medium'
    : client.daysSinceLastVisit > 30 ? 'low' : 'none';

  return (
    <DashboardErrorBoundary pageName="Client Profile">
      <div className="space-y-5 sm:space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-rani-navy to-rani-navy-light flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl font-heading text-rani-gold">{client.firstName?.[0]}{client.lastName?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">{client.name}</h1>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-body font-semibold ${STATUS_COLORS[client.status] || 'bg-gray-100 text-gray-500'}`}>{client.status || 'Unknown'}</span>
                {activeMembership && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-body font-semibold bg-rani-gold/10 text-rani-gold">
                    <Crown className="w-3 h-3" /> {activeMembership.tier}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs sm:text-sm font-body text-rani-muted">
                {client.email && <span className="inline-flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{client.email}</span>}
                {client.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{client.phone}</span>}
              </div>
            </div>
            {churnRisk !== 'none' && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-body font-semibold flex-shrink-0 ${
                churnRisk === 'high' ? 'bg-red-50 text-red-600' : churnRisk === 'medium' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {churnRisk === 'high' ? 'High Churn Risk' : churnRisk === 'medium' ? 'Medium Risk' : 'Monitor'}
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={<DollarSign className="w-4 h-4" />} label="Lifetime Value" value={formatCurrency(client.ltv)} />
          <StatCard icon={<Calendar className="w-4 h-4" />} label="Total Visits" value={String(client.visitCount)} />
          <StatCard icon={<Clock className="w-4 h-4" />} label="Last Visit" value={client.lastVisitDate ? `${client.daysSinceLastVisit}d ago` : 'Never'} />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Avg Ticket" value={client.visitCount > 0 ? formatCurrency(client.ltv / client.visitCount) : '$0'} />
        </div>

        {/* Tabs Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Appointments */}
          <SectionPanel icon={Calendar} title="Appointments" count={appointments.length} delay={0.1}>
            {appointments.length === 0 ? (
              <DashboardEmptyState icon="calendar" title="No appointments" description="Appointment history will appear once bookings are made." compact />
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {appointments.slice(0, 15).map(appt => (
                  <div key={appt.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-rani-cream/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-body font-medium text-rani-navy truncate">{appt.service}</p>
                      <p className="text-xs font-body text-rani-muted">{formatDate(appt.date)} {appt.time && `at ${appt.time}`} &middot; {appt.provider}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      {appt.amountPaid > 0 && <p className="text-sm font-body font-semibold text-rani-navy">{formatCurrency(appt.amountPaid)}</p>}
                      <p className={`text-xs font-body ${appt.status === 'completed' ? 'text-green-600' : appt.status === 'no_show' ? 'text-red-500' : 'text-rani-muted'}`}>{appt.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>

          {/* Transactions */}
          <SectionPanel icon={CreditCard} title="Transactions" count={transactions.length} delay={0.15}>
            {transactions.length === 0 ? (
              <DashboardEmptyState icon="dollar" title="No transactions" description="Payment history will appear here." compact />
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {transactions.slice(0, 15).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-rani-cream/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-body font-medium text-rani-navy truncate">{tx.service || tx.type}</p>
                      <p className="text-xs font-body text-rani-muted">{formatDate(tx.date)} &middot; {tx.paymentMethod}</p>
                    </div>
                    <p className="text-sm font-body font-semibold text-rani-navy flex-shrink-0 ml-3">{formatCurrency(tx.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>

          {/* Memberships */}
          <SectionPanel icon={Crown} title="Memberships" count={memberships.length} delay={0.2}>
            {memberships.length === 0 ? (
              <DashboardEmptyState icon="star" title="No memberships" description="Membership history will appear here." compact />
            ) : (
              <div className="space-y-3">
                {memberships.map(m => (
                  <div key={m.id} className={`p-3 sm:p-4 rounded-xl border ${m.status === 'Active' ? 'border-rani-gold/30 bg-rani-gold/5' : 'border-rani-border'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-body font-semibold text-rani-navy">{m.tier}</span>
                      <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full ${m.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
                    </div>
                    <p className="text-xs font-body text-rani-muted">{formatCurrency(m.monthlyPrice)}/mo &middot; Since {formatDate(m.startDate)}</p>
                    {m.churnRiskScore > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${m.churnRiskScore > 70 ? 'bg-red-400' : m.churnRiskScore > 40 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ width: `${m.churnRiskScore}%` }} />
                        </div>
                        <span className="text-xs font-body text-rani-muted">{m.churnRiskScore}% risk</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>

          {/* Messages */}
          <SectionPanel icon={MessageSquare} title="Messages" count={messages.length} delay={0.25}>
            {messages.length === 0 ? (
              <DashboardEmptyState icon="message" title="No messages" description="Communication log will appear here." compact />
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {messages.slice(0, 15).map(msg => (
                  <div key={msg.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-rani-cream/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${msg.direction === 'outbound' ? 'bg-blue-400' : 'bg-green-400'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-body font-medium text-rani-navy truncate">{msg.subject || msg.channel}</p>
                        <p className="text-xs font-body text-rani-muted">{formatDate(msg.date)} &middot; {msg.channel}</p>
                      </div>
                    </div>
                    <span className="text-xs font-body text-rani-muted flex-shrink-0 ml-2">{msg.status}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>

          <RecommendationsPanel clientId={id} />

          {/* Reviews */}
          {reviews.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-4 sm:p-5 lg:col-span-2">
              <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-rani-gold" /> Reviews ({reviews.length})
              </h3>
              <div className="space-y-3">
                {reviews.map(review => (
                  <div key={review.id} className="p-3 sm:p-4 rounded-xl border border-rani-border">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-rani-gold fill-rani-gold' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs font-body text-rani-muted">{review.platform} &middot; {formatDate(review.date)}</span>
                      {review.sentiment && (
                        <span className={`text-xs font-body px-1.5 py-0.5 rounded ${review.sentiment === 'positive' ? 'bg-green-50 text-green-600' : review.sentiment === 'negative' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>{review.sentiment}</span>
                      )}
                    </div>
                    {review.text && <p className="text-sm font-body text-rani-text leading-relaxed">{review.text}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3 sm:p-4">
      <div className="flex items-center gap-2 text-rani-gold mb-1">{icon}</div>
      <p className="text-base sm:text-lg font-heading text-rani-navy">{value}</p>
      <p className="text-[10px] sm:text-xs font-body text-rani-muted">{label}</p>
    </div>
  );
}

function SectionPanel({ icon: Icon, title, count, delay, children }: { icon: React.ElementType; title: string; count: number; delay: number; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-4 sm:p-5">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-rani-gold" /> {title} ({count})
      </h3>
      {children}
    </motion.div>
  );
}
