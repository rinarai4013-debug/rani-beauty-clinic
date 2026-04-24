'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserPlus, FileText, DollarSign, Receipt, Package, ClipboardList,
  Star, Moon, Wrench, Brain,
} from 'lucide-react';

const ACTIONS = [
  { label: 'Add Lead', icon: UserPlus, href: '/dashboard/entry/lead', color: 'text-purple-500 bg-purple-50' },
  { label: 'Consult Notes', icon: FileText, href: '/dashboard/entry/consult-notes', color: 'text-blue-500 bg-blue-50' },
  { label: 'Manual Sale', icon: DollarSign, href: '/dashboard/entry/sale', color: 'text-green-500 bg-green-50' },
  { label: 'Add Expense', icon: Receipt, href: '/dashboard/entry/expense', color: 'text-red-500 bg-red-50' },
  { label: 'Inventory', icon: Package, href: '/dashboard/entry/inventory', color: 'text-amber-500 bg-amber-50' },
  { label: 'Staff Note', icon: ClipboardList, href: '/dashboard/entry/staff-note', color: 'text-indigo-500 bg-indigo-50' },
  { label: 'Add Review', icon: Star, href: '/dashboard/entry/review', color: 'text-yellow-500 bg-yellow-50' },
  { label: 'EOD Recap', icon: Moon, href: '/dashboard/entry/eod-recap', color: 'text-rani-navy bg-rani-navy/10' },
  { label: 'Room Issue', icon: Wrench, href: '/dashboard/entry/room-issue', color: 'text-orange-500 bg-orange-50' },
  { label: 'CEO Note', icon: Brain, href: '/dashboard/entry/ceo-note', color: 'text-rani-gold bg-rani-gold/10' },
];

export default function QuickActions() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
        Quick Entry
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {ACTIONS.map((action, _i) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <motion.div
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-rani-border/50 hover:border-rani-gold/30 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-body font-medium text-rani-text text-center">
                  {action.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
