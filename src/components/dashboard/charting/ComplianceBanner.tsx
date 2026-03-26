'use client';

import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

interface ComplianceBannerProps {
  isCompliant: boolean;
  blocksCheckout: boolean;
  completionPercentage: number;
  missingRequired: string[];
  status: 'draft' | 'complete' | 'signed' | 'reviewed' | 'amended';
}

export default function ComplianceBanner({
  isCompliant,
  blocksCheckout,
  completionPercentage,
  missingRequired,
  status,
}: ComplianceBannerProps) {
  if (status === 'signed' || status === 'reviewed') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">
              Chart {status === 'reviewed' ? 'Reviewed by Medical Director' : 'Signed & Complete'}
            </p>
            <p className="text-sm text-emerald-600">Checkout is cleared for this appointment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isCompliant && status === 'complete') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Chart Complete - Ready for Signature</p>
            <p className="text-sm text-emerald-600">All required fields are filled. Sign to finalize.</p>
          </div>
        </div>
      </div>
    );
  }

  if (blocksCheckout) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">
              CHECKOUT BLOCKED - Complete Chart Before Checkout
            </p>
            <p className="text-sm text-red-600 mt-1">
              {completionPercentage}% complete. Missing: {missingRequired.slice(0, 5).join(', ')}
              {missingRequired.length > 5 && ` +${missingRequired.length - 5} more`}
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-red-200">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Draft with warnings
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-3">
        {completionPercentage > 0 ? (
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-semibold text-amber-800">
            Chart In Progress - {completionPercentage}% Complete
          </p>
          {missingRequired.length > 0 && (
            <p className="text-sm text-amber-600 mt-1">
              Remaining: {missingRequired.slice(0, 4).join(', ')}
              {missingRequired.length > 4 && ` +${missingRequired.length - 4} more`}
            </p>
          )}
          <div className="mt-2 h-2 w-full rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
