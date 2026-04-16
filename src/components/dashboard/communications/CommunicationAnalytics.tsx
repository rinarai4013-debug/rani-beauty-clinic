'use client';

import { motion } from 'framer-motion';
import {
  Send, CheckCheck, Eye, MousePointerClick, TrendingUp,
  DollarSign, AlertTriangle, Phone, Mail, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import StatCard, { StatCardRow } from '@/components/dashboard/shared/StatCard';
import { ChartWrapper } from '@/components/dashboard/shared';
import type { CommunicationAnalytics as AnalyticsData } from '@/types/communications';

interface CommunicationAnalyticsProps {
  data: AnalyticsData;
  isLoading?: boolean;
}

const COLORS = ['#0F1D2C', '#C9A96E', '#059669', '#6366F1', '#EC4899', '#F59E0B'];

export default function CommunicationAnalytics({
  data,
  isLoading = false,
}: CommunicationAnalyticsProps) {
  const channelData = [
    { name: 'SMS', value: data.byChannel.sms.sent, color: '#0F1D2C' },
    { name: 'Email', value: data.byChannel.email.sent, color: '#C9A96E' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <StatCardRow columns={4}>
        <StatCard
          title="Total Sent"
          value={data.totalSent}
          format="number"
          icon={Send}
          loading={isLoading}
        />
        <StatCard
          title="Avg Open Rate"
          value={data.avgOpenRate}
          format="percent"
          icon={Eye}
          loading={isLoading}
          trend={data.avgOpenRate > 25
            ? { value: data.avgOpenRate - 25, direction: 'up', label: 'vs 25% benchmark' }
            : { value: 25 - data.avgOpenRate, direction: 'down', label: 'vs 25% benchmark' }
          }
        />
        <StatCard
          title="Avg Click Rate"
          value={data.avgClickRate}
          format="percent"
          icon={MousePointerClick}
          loading={isLoading}
        />
        <StatCard
          title="Revenue Attributed"
          value={data.totalRevenueAttributed}
          format="currency"
          icon={DollarSign}
          loading={isLoading}
        />
      </StatCardRow>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Volume Trend */}
        <ChartWrapper title="Message Volume (30 Days)" loading={isLoading}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.dailyVolume}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F1D2C" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0F1D2C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }}
                labelFormatter={((d: string | number) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })) as never}
              />
              <Area type="monotone" dataKey="sent" stroke="#0F1D2C" fill="url(#colorSent)" strokeWidth={2} name="Sent" />
              <Area type="monotone" dataKey="opened" stroke="#C9A96E" fill="url(#colorOpened)" strokeWidth={2} name="Opened" />
              <Area type="monotone" dataKey="clicked" stroke="#059669" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Clicked" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Channel Distribution */}
        <ChartWrapper title="Channel Distribution" loading={isLoading}>
          <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              {/* SMS Metrics */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-rani-navy" />
                  <span className="text-xs font-body font-semibold text-rani-navy">SMS</span>
                </div>
                <div className="space-y-1 text-[11px] font-body text-rani-muted">
                  <p>Sent: <span className="font-semibold text-rani-text">{data.byChannel.sms.sent.toLocaleString()}</span></p>
                  <p>Delivery: <span className="font-semibold text-rani-text">{data.byChannel.sms.deliveryRate.toFixed(1)}%</span></p>
                  <p>Revenue: <span className="font-semibold text-rani-success">${data.revenueByChannel.sms.toLocaleString()}</span></p>
                </div>
              </div>
              {/* Email Metrics */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-rani-gold" />
                  <span className="text-xs font-body font-semibold text-rani-gold">Email</span>
                </div>
                <div className="space-y-1 text-[11px] font-body text-rani-muted">
                  <p>Sent: <span className="font-semibold text-rani-text">{data.byChannel.email.sent.toLocaleString()}</span></p>
                  <p>Open Rate: <span className="font-semibold text-rani-text">{data.byChannel.email.openRate.toFixed(1)}%</span></p>
                  <p>Revenue: <span className="font-semibold text-rani-success">${data.revenueByChannel.email.toLocaleString()}</span></p>
                </div>
              </div>
            </div>
          </div>
        </ChartWrapper>
      </div>

      {/* Delivery Funnel */}
      <ChartWrapper title="Delivery Funnel" loading={isLoading}>
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Sent', value: data.totalSent, icon: Send, color: 'text-blue-600 bg-blue-50' },
            { label: 'Delivered', value: data.totalDelivered, icon: CheckCheck, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Opened', value: data.totalOpened, icon: Eye, color: 'text-purple-600 bg-purple-50' },
            { label: 'Clicked', value: data.totalClicked, icon: MousePointerClick, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Bounced', value: data.totalBounced, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
            { label: 'Failed', value: data.totalFailed, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-1.5`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-lg font-body font-bold text-rani-navy">{value.toLocaleString()}</p>
              <p className="text-[10px] font-body text-rani-muted">{label}</p>
              {data.totalSent > 0 && (
                <p className="text-[10px] font-body text-rani-muted">
                  {((value / data.totalSent) * 100).toFixed(1)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </ChartWrapper>

      {/* Revenue by Campaign */}
      {data.revenueByCampaign.length > 0 && (
        <ChartWrapper title="Revenue by Campaign" loading={isLoading}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.revenueByCampaign.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#6B7280' }}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <YAxis
                type="category"
                dataKey="campaignName"
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={120}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={((v: number) => [`$${v.toLocaleString()}`, 'Revenue']) as never}
              />
              <Bar dataKey="revenue" fill="#0F1D2C" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </div>
  );
}
