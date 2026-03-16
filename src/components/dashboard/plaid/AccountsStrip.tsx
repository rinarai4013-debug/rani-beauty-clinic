'use client';

import { CreditCard, Building2, Wallet } from 'lucide-react';
import type { PlaidAccount } from '@/types/plaid';

interface AccountsStripProps {
  accounts: PlaidAccount[];
}

const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  depository: Building2,
  credit: CreditCard,
  default: Wallet,
};

export default function AccountsStrip({ accounts }: AccountsStripProps) {
  if (!accounts.length) return null;

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balances.current || 0), 0);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
      {accounts.map((account, i) => {
        const Icon = ACCOUNT_ICONS[account.type] || ACCOUNT_ICONS.default;
        return (
          <div
            key={account.id}
            className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 min-w-[220px]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rani-navy/5 flex items-center justify-center">
                <Icon className="w-4 h-4 text-rani-navy" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-body font-medium text-rani-navy truncate">
                  {account.name}
                </p>
                <p className="text-[10px] font-body text-rani-muted">
                  {account.institutionName} {account.mask ? `••${account.mask}` : ''}
                </p>
              </div>
            </div>
            <div>
              <p className="text-lg font-body font-bold text-rani-navy">
                ${(account.balances.current || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              {account.balances.available !== null && account.balances.available !== account.balances.current && (
                <p className="text-[10px] font-body text-rani-muted mt-0.5">
                  ${account.balances.available.toLocaleString('en-US', { minimumFractionDigits: 2 })} available
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Total card */}
      {accounts.length > 1 && (
        <div
          className="flex-shrink-0 bg-rani-navy rounded-xl p-4 min-w-[220px]"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-rani-gold" />
            </div>
            <p className="text-xs font-body font-medium text-white/70">Total Balance</p>
          </div>
          <p className="text-lg font-body font-bold text-white">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] font-body text-white/40 mt-0.5">
            {accounts.length} accounts
          </p>
        </div>
      )}
    </div>
  );
}
