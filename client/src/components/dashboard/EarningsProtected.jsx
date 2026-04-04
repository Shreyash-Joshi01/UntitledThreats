import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function EarningsProtected({ stats }) {
  if (!stats) return null;

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="glass-panel p-5 mb-6 bg-gradient-to-br from-surface to-surface-container-low border-b-4 border-b-primary">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-semibold text-on-surface">Earnings Impact</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Protected this month */}
        <div>
          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">
            Protected ({currentMonth})
          </p>
          <p className="text-2xl font-bold font-heading text-primary">
            ₹{stats.protected_this_month || 0}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1">
            Across {stats.claims_this_month || 0} alerts
          </p>
        </div>
        
        {/* Total Return */}
        <div className="border-l border-outline-variant/30 pl-4">
          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">
            Lifetime Shield Value
          </p>
          <p className="text-xl font-bold font-heading text-on-surface">
            ₹{stats.total_all_time || 0}
          </p>
          <div className="w-full bg-surface-variant h-1 rounded-full mt-2 overflow-hidden">
             <div className="bg-primary h-full w-[80%] rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
