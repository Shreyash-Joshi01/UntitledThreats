import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Shield, Calendar, CloudRain, ThermometerSun,
  AlertCircle, Zap, CheckCircle2, IndianRupee
} from 'lucide-react';

export default function PolicyDetailSheet({ open, onClose, policy, worker, payoutTiers }) {
  if (!policy) return null;

  const endDate = new Date(policy.coverage_end);
  const startDate = new Date(policy.coverage_start);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  const isExpiringSoon = daysLeft <= 3;

  const riskColor =
    worker?.zone_risk === 'high' ? 'text-error' :
    worker?.zone_risk === 'medium' ? 'text-warning' :
    'text-success';

  const tierIcons = {
    heavy_rain_60: <CloudRain className="w-4 h-4 text-blue-500" />,
    heavy_rain_90: <CloudRain className="w-4 h-4 text-blue-700" />,
    extreme_heat:  <ThermometerSun className="w-4 h-4 text-orange-500" />,
    severe_aqi:    <AlertCircle className="w-4 h-4 text-purple-500" />,
    flash_flood:   <Zap className="w-4 h-4 text-indigo-500" />,
    curfew:        <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <AnimatePresence>
      {open && (
        /* Full-screen overlay that flexes children to bottom-center */
        <div className="fixed inset-0 z-50 flex items-end justify-center">

          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet — slides up, capped at mobile width */}
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
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-surface-variant transition-colors"
              >
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

              {/* Coverage summary */}
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-2">
                  Coverage summary
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] text-on-surface-variant mb-1">Weekly premium</p>
                    <p className="text-sm font-semibold text-on-surface">₹{policy.weekly_premium || 59}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] text-on-surface-variant mb-1">Zone risk</p>
                    <p className={`text-sm font-semibold capitalize ${riskColor}`}>
                      {worker?.zone_risk || '—'}
                    </p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] text-on-surface-variant mb-1">Claims this period</p>
                    <p className="text-sm font-semibold text-on-surface">
                      {policy.claims_this_period ?? 0} / 2
                    </p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-[10px] text-on-surface-variant mb-1">UPI linked</p>
                    <p className={`text-sm font-semibold ${worker?.upi_id ? 'text-success' : 'text-error'}`}>
                      {worker?.upi_id ? 'Yes' : 'Not linked'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payout tiers */}
              {payoutTiers && Object.keys(payoutTiers).length > 0 && (
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-2 flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" /> What triggers a payout
                  </p>
                  <div className="space-y-2">
                    {Object.entries(payoutTiers).map(([key, tier]) => {
                      const label = typeof tier === 'object'
                        ? tier.label
                        : key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      const payout = typeof tier === 'object' ? tier.payout : tier;
                      return (
                        <div key={key} className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="bg-surface p-1.5 rounded-lg">
                              {tierIcons[key] || <AlertCircle className="w-4 h-4 text-on-surface-variant" />}
                            </div>
                            <p className="text-sm text-on-surface">{label}</p>
                          </div>
                          <p className="text-sm font-bold text-primary">₹{payout}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auto-payout note */}
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/15">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Payouts are <span className="text-on-surface font-medium">fully automatic</span> — no claim form needed. When a trigger is detected in your zone, the amount is credited to your UPI within 10 minutes.
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