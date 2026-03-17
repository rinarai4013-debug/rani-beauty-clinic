'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Star,
  MessageSquare,
  CreditCard,
  Crown,
  AlertTriangle,
  User,
  Clock,
  TrendingUp,
} from 'lucide-react';
import RecommendationsPanel from '@/components/dashboard/panels/RecommendationsPanel';

interface ClientAppointment {
  id: string;
  service: string;
  category: string;
  provider: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  amountPaid: number;
  isConsult: boolean;
}

interface ClientTransaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  paymentMethod: string;
  service: string;
  status: string;
}

interface ClientMembership {
  id: string;
  tier: string;
  monthlyPrice: number;
  status: string;
  startDate: string;
  churnRiskScore: number;
}

interface ClientMessage {
  id: string;
  date: string;
  channel: string;
  direction: string;
  subject: string;
  status: string;
}

interface ClientReview {
  id: string;
  rating: number;
  text: string;
  date: string;
  platform: string;
  sentiment: string;
}

interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  preferredContact: string;
  ltv: number;
  visitCount: number;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  membershipTier: string;
  membershipStatus: string;
  appointments: ClientAppointment[];
  transactions: ClientTransaction[];
  memberships: ClientMembership[];
  messages: ClientMessage[];
  reviews: ClientReview[];
}

const STATUS_COLORS: Record<string, string> = {
  'New Lead': 'bg-purple-100 text-purple-700',
  'Active': 'bg-green-100 text-green-700',
  'Lapsed 30': 'bg-yellow-100 text-yellow-700',
  'Lapsed 60': 'bg-orange-100 text-orange-700',
  'Lapsed 90': 'bg-red-100 text-red-700',
  'Churned': 'bg-gray-100 text-gray-500',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: client, isLoading } = useDashboardData<ClientProfile>(
    id ? `/clients/${id}?full=true` : null,
    { refreshInterval: 60000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rani-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-body text-rani-muted">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-rani-muted font-body">Client not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-rani-gold hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const appointments = client.appointments || [];
  const transactions = client.transactions || [];
  const memberships = client.memberships || [];
  const messages = client.messages || [];
  const reviews = client.reviews || [];
  const activeMembership = memberships.find(m => m.status === 'Active');

  // Churn risk indicator
  const churnRisk = client.daysSinceLastVisit > 90 ? 'high'
    : client.daysSinceLastVisit > 60 ? 'medium'
    : client.daysSinceLastVisit > 30 ? 'low'
    : 'none';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rani-navy to-rani-navy-light flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-heading text-rani-gold">
              {client.firstName?.[0]}{client.lastName?.[0]}
            </span>
          </div>

          {/* Name + Status */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-heading text-rani-navy">{client.name}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-body font-semibold ${STATUS_COLORS[client.status] || 'bg-gray-100 text-gray-500'}`}>
                {client.status || 'Unknown'}
              </span>
              {activeMembership && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-body font-semibold bg-rani-gold/10 text-rani-gold">
                  <Crown className="w-3 h-3" />
                  {activeMembership.tier}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm font-body text-rani-muted">
              {client.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {client.email}
                </span>
              )}
              {client.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {client.phone}
                </span>
              )}
            </div>
          </div>

          {/* Churn Risk Badge */}
          {churnRisk !== 'none' && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-body font-semibold ${
              churnRisk === 'high' ? 'bg-red-50 text-red-600' :
              churnRisk === 'medium' ? 'bg-orange-50 text-orange-600' :
              'bg-yellow-50 text-yellow-600'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {churnRisk === 'high' ? 'High Churn Risk' : churnRisk === 'medium' ? 'Medium Risk' : 'Monitor'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="Lifetime Value" value={formatCurrency(client.ltv)} />
        <StatCard icon={<Calendar className="w-4 h-4" />} label="Total Visits" value={String(client.visitCount)} />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Last Visit" value={client.lastVisitDate ? `${client.daysSinceLastVisit}d ago` : 'Never'} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Avg Ticket" value={client.visitCount > 0 ? formatCurrency(client.ltv / client.visitCount) : '$0'} />
      </div>

      {/* Tabs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-5"
        >
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rani-gold" />
            Appointments ({appointments.length})
          </h3>
          {appointments.length === 0 ? (
            <p className="text-sm font-body text-rani-muted py-4 text-center">No appointments found.</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {appointments.slice(0, 15).map(appt => (
                <div key={appt.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-rani-cream/50 transition-colors">
                  <div>
                    <p className="text-sm font-body font-medium text-rani-navy">{appt.service}</p>
                    <p className="text-xs font-body text-rani-muted">
                      {formatDate(appt.date)} {appt.time && `at ${appt.time}`} &middot; {appt.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    {appt.amountPaid > 0 && (
                      <p className="text-sm font-body font-semibold text-rani-navy">{formatCurrency(appt.amountPaid)}</p>
                    )}
                    <p className={`text-xs font-body ${appt.status === 'completed' ? 'text-green-600' : appt.status === 'no_show' ? 'text-red-500' : 'text-rani-muted'}`}>
                      {appt.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-5"
        >
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rani-gold" />
            Transactions ({transactions.length})
          </h3>
          {transactions.length === 0 ? (
            <p className="text-sm font-body text-rani-muted py-4 text-center">No transactions found.</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {transactions.slice(0, 15).map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-rani-cream/50 transition-colors">
                  <div>
                    <p className="text-sm font-body font-medium text-rani-navy">{tx.service || tx.type}</p>
                    <p className="text-xs font-body text-rani-muted">{formatDate(tx.date)} &middot; {tx.paymentMethod}</p>
                  </div>
                  <p className="text-sm font-body font-semibold text-rani-navy">{formatCurrency(tx.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Memberships */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-5"
        >
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-rani-gold" />
            Memberships ({memberships.length})
          </h3>
          {memberships.length === 0 ? (
            <p className="text-sm font-body text-rani-muted py-4 text-center">No membership history.</p>
          ) : (
            <div className="space-y-3">
              {memberships.map(m => (
                <div key={m.id} className={`p-4 rounded-xl border ${m.status === 'Active' ? 'border-rani-gold/30 bg-rani-gold/5' : 'border-rani-border'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-body font-semibold text-rani-navy">{m.tier}</span>
                    <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full ${m.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs font-body text-rani-muted">
                    {formatCurrency(m.monthlyPrice)}/mo &middot; Since {formatDate(m.startDate)}
                  </p>
                  {m.churnRiskScore > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${m.churnRiskScore > 70 ? 'bg-red-400' : m.churnRiskScore > 40 ? 'bg-yellow-400' : 'bg-green-400'}`}
                          style={{ width: `${m.churnRiskScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-body text-rani-muted">{m.churnRiskScore}% risk</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Communication Log */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-5"
        >
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rani-gold" />
            Messages ({messages.length})
          </h3>
          {messages.length === 0 ? (
            <p className="text-sm font-body text-rani-muted py-4 text-center">No messages logged.</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {messages.slice(0, 15).map(msg => (
                <div key={msg.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-rani-cream/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${msg.direction === 'outbound' ? 'bg-blue-400' : 'bg-green-400'}`} />
                    <div>
                      <p className="text-sm font-body font-medium text-rani-navy">{msg.subject || msg.channel}</p>
                      <p className="text-xs font-body text-rani-muted">{formatDate(msg.date)} &middot; {msg.channel}</p>
                    </div>
                  </div>
                  <span className="text-xs font-body text-rani-muted">{msg.status}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* AI Recommendations */}
        <RecommendationsPanel clientId={id} />

        {/* Reviews */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-5 lg:col-span-2"
          >
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-rani-gold" />
              Reviews ({reviews.length})
            </h3>
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="p-4 rounded-xl border border-rani-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-rani-gold fill-rani-gold' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-body text-rani-muted">{review.platform} &middot; {formatDate(review.date)}</span>
                    {review.sentiment && (
                      <span className={`text-xs font-body px-1.5 py-0.5 rounded ${
                        review.sentiment === 'positive' ? 'bg-green-50 text-green-600' :
                        review.sentiment === 'negative' ? 'bg-red-50 text-red-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>{review.sentiment}</span>
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
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
      <div className="flex items-center gap-2 text-rani-gold mb-1">{icon}</div>
      <p className="text-lg font-heading text-rani-navy">{value}</p>
      <p className="text-xs font-body text-rani-muted">{label}</p>
    </div>
  );
}
