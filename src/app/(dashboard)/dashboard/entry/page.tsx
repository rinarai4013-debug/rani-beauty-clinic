'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserPlus, FileText, DollarSign, Receipt, Package, ClipboardList,
  Star, Moon, Wrench, Brain,
} from 'lucide-react';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';

const FORM_CARDS = [
  {
    label: 'Add Lead',
    description: 'Log a new prospect from calls, walk-ins, or DMs',
    icon: UserPlus,
    href: '/dashboard/entry/lead',
    color: 'text-purple-500 bg-purple-50 border-purple-200',
    emoji: '🌟',
  },
  {
    label: 'Consult Notes',
    description: 'Record consultation outcomes and follow-up plans',
    icon: FileText,
    href: '/dashboard/entry/consult-notes',
    color: 'text-blue-500 bg-blue-50 border-blue-200',
    emoji: '📋',
  },
  {
    label: 'Manual Sale',
    description: 'Log a sale not captured by Mangomint POS',
    icon: DollarSign,
    href: '/dashboard/entry/sale',
    color: 'text-green-500 bg-green-50 border-green-200',
    emoji: '💰',
  },
  {
    label: 'Add Expense',
    description: 'Track vendor payments, supplies, and overhead',
    icon: Receipt,
    href: '/dashboard/entry/expense',
    color: 'text-red-500 bg-red-50 border-red-200',
    emoji: '🧾',
  },
  {
    label: 'Inventory Adjustment',
    description: 'Update stock counts for products and supplies',
    icon: Package,
    href: '/dashboard/entry/inventory',
    color: 'text-amber-500 bg-amber-50 border-amber-200',
    emoji: '📦',
  },
  {
    label: 'Staff Note',
    description: 'Record performance, training, or recognition notes',
    icon: ClipboardList,
    href: '/dashboard/entry/staff-note',
    color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
    emoji: '👩‍⚕️',
  },
  {
    label: 'Add Review',
    description: 'Log client reviews from Google, Yelp, or social',
    icon: Star,
    href: '/dashboard/entry/review',
    color: 'text-yellow-500 bg-yellow-50 border-yellow-200',
    emoji: '⭐',
  },
  {
    label: 'EOD Recap',
    description: 'End-of-day summary with revenue and highlights',
    icon: Moon,
    href: '/dashboard/entry/eod-recap',
    color: 'text-rani-navy bg-rani-navy/10 border-rani-navy/20',
    emoji: '🌙',
  },
  {
    label: 'Room Issue',
    description: 'Report equipment, supply, or facility issues',
    icon: Wrench,
    href: '/dashboard/entry/room-issue',
    color: 'text-orange-500 bg-orange-50 border-orange-200',
    emoji: '🔧',
  },
  {
    label: 'CEO Note',
    description: 'Capture strategic ideas, blockers, and opportunities',
    icon: Brain,
    href: '/dashboard/entry/ceo-note',
    color: 'text-rani-gold bg-rani-gold/10 border-rani-gold/30',
    emoji: '💡',
  },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function EntryHubPage() {
  return (
    <DashboardErrorBoundary pageName="Quick Entry">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Quick Entry Hub</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Log data fast — everything feeds into your dashboard
          </p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          {FORM_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} variants={item}>
                <Link href={card.href}>
                  <div className={`p-4 sm:p-5 rounded-xl border-2 hover:shadow-md transition-all cursor-pointer group ${card.color}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-white/80 shadow-sm flex-shrink-0">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-body font-semibold text-rani-navy group-hover:text-rani-navy/80">
                            {card.label}
                          </span>
                          <span className="text-lg">{card.emoji}</span>
                        </div>
                        <p className="text-xs font-body text-rani-muted mt-1">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </DashboardErrorBoundary>
  );
}
