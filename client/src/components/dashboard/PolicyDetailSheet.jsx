import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Shield, Calendar, CloudRain, ThermometerSun,
  AlertCircle, Zap, CheckCircle2, IndianRupee, Clock, TrendingUp
} from 'lucide-react';

export default function PolicyDetailSheet({ open, onClose, policy, worker, payoutTiers }) {
  if (!policy) return null;

  const endDate   = new Date(policy.coverage_end);
  const startDate = new Date(policy.coverage_start);
  const now       = new Date();
  const daysLeft  = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const daysUsed  = totalDays - daysLeft;
  const progressPct = Math.min(100, Math.round((daysUsed / totalDays) * 100));
  const isExpiringSoon = daysLeft <= 3;

  const riskColor =
    worker?.zone_risk === 'high'   ? 'text-error' :
    worker?.zone_risk === 'medium' ? 'text-warning' :
    'text-success';

  const claimsUsed  = policy.claims_this_period ?? 0;
  const claimsLimit = 2;
  const claimsPct   = Math.min(100, Math.round((claimsUsed / claimsLimit) * 100));

  // ─── Dynamic Premium Model ─────────────────────────────────────────────────
  const BASE_PREMIUM = 50;
  const zoneRisk = worker?.zone_risk || 'medium';

  const riskAddon =
    zoneRisk === 'high'   ? { label: 'High-risk zone surcharge', value: 25 } :
    zoneRisk === 'medium' ? { label: 'Medium-risk zone factor',  value: 9  } :
                            { label: 'Low-risk zone discount',   value: -5 };

  const forecastAddon = { label: 'Weekly forecast adjustment', value: 0 };
  const dynamicPremium = BASE_PREMIUM + riskAddon.value + forecastAddon.value;

  const breakdownRows = [
    { label: 'Base premium',      value: BASE_PREMIUM,        sign: '' },
    { label: riskAddon.label,     value: riskAddon.value,     sign: riskAddon.value >= 0 ? '+' : '' },
    { label: forecastAddon.label, value: forecastAddon.value, sign: '+' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">

          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-[430px] bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-outline-variant" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/30">
              <h2 className="font-heading font-bold text-lg text-on-surface">Policy Details</h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-variant transition-colors">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 pb-10">

              {/* Status banner */}
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl relative">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-background animate-ping" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-background" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">Shield Active</p>
                    <p className="text-xs text-primary flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Protected
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant">Max payout</p>
                  <p className="font-heading font-bold text-lg text-on-surface">
                    ₹{policy.max_weekly_payout}
                    <span className="text-xs font-normal text-on-surface-variant"> /wk</span>
                  </p>
                </div>
              </div>

              {/* Coverage dates */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <p className="text-[10px] text-on-surface-variant mb-1 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" /> Start
                  </p>
                  <p className="text-xs font-semibold text-on-surface">{startDate.toLocaleDateString()}</p>
                </div>
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <p className="text-[10px] text-on-surface-variant mb-1 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" /> End
                  </p>
                  <p className="text-xs font-semibold text-on-surface">{endDate.toLocaleDateString()}</p>
                </div>
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <p className="text-[10px] text-on-surface-variant mb-1">Days left</p>
                  <p className={`text-xs font-bold ${isExpiringSoon ? 'text-error' : 'text-primary'}`}>
                    {daysLeft}d {isExpiringSoon ? '⚠️' : ''}
                  </p>
                </div>
              </div>

              {/* Coverage progress bar */}
              <div className="bg-surface-container rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Coverage period used
                  </p>
                  <p className="text-[10px] font-semibold text-on-surface">{daysUsed} / {totalDays} days</p>
                </div>
                <div className="w-full h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Coverage summary */}
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-2">
                  Coverage summary
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] text-on-surface-variant mb-1">Weekly premium</p>
                    <p className="text-sm font-semibold text-on-surface">₹{dynamicPremium}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] text-on-surface-variant mb-1">Zone risk</p>
                    <p className={`text-sm font-semibold capitalize ${riskColor}`}>
                      {worker?.zone_risk || '—'}
                    </p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] text-on-surface-variant mb-1">UPI linked</p>
                    <p className={`text-sm font-semibold ${worker?.upi_id ? 'text-success' : 'text-error'}`}>
                      {worker?.upi_id ? 'Yes' : 'Not linked'}
                    </p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] text-on-surface-variant mb-1">Zone</p>
                    <p className="text-sm font-semibold text-on-surface font-mono">
                      {worker?.zone_code || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Premium Breakdown Card ── */}
              <div className="rounded-xl border border-primary/20 overflow-hidden">
                <div className="bg-primary/10 px-3 py-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Dynamic Pricing Model
                  </p>
                </div>
                <div className="bg-surface-container px-3 py-2 space-y-2">
                  {breakdownRows.map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <p className="text-[11px] text-on-surface-variant">{row.label}</p>
                      <p className={`text-[11px] font-semibold ${
                        row.value < 0 ? 'text-success' :
                        i === 0 ? 'text-on-surface' : 'text-warning'
                      }`}>
                        {i > 0 ? (row.value >= 0 ? '+' : '') : ''}₹{Math.abs(row.value)}
                      </p>
                    </div>
                  ))}
                  <div className="border-t border-outline-variant/40 pt-2 flex justify-between items-center">
                    <p className="text-xs font-bold text-on-surface">Total / week</p>
                    <p className="text-sm font-bold text-primary">₹{dynamicPremium}</p>
                  </div>
                </div>
                <div className="bg-surface-container/50 px-3 py-1.5 border-t border-outline-variant/20">
                  <p className="text-[10px] text-on-surface-variant">
                    Premium adjusts weekly based on zone flood history, risk classification, and weather forecasts.
                  </p>
                </div>
              </div>

              {/* Claims usage bar */}
              <div className="bg-surface-container rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-on-surface-variant">Claims used this period</p>
                  <p className="text-[10px] font-semibold text-on-surface">{claimsUsed} / {claimsLimit}</p>
                </div>
                <div className="w-full h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${claimsUsed >= claimsLimit ? 'bg-error' : 'bg-primary'}`}
                    style={{ width: `${claimsPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1.5">
                  {claimsLimit - claimsUsed} claim{claimsLimit - claimsUsed !== 1 ? 's' : ''} remaining this week
                </p>
              </div>

              {/* Auto-payout note */}
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/15">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Payouts are <span className="text-on-surface font-medium">fully automatic</span> — no claim form needed.
                  When a trigger is detected in your zone, the amount is credited to your UPI within 10 minutes.
                </p>
              </div>

              {/* Expiring soon */}
              {isExpiringSoon && (
                <div className="p-3 bg-error/10 rounded-xl border border-error/20">
                  <p className="text-xs text-error font-medium mb-2 text-center">
                    Policy expiring in {daysLeft} day{daysLeft !== 1 ? 's' : ''}! Renew to stay protected.
                  </p>
                  <button className="w-full py-2 bg-error text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
                    Renew Policy
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}