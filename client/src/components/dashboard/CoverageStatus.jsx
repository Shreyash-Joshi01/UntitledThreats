import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, CloudRain, Thermometer, Wind, Zap } from 'lucide-react';

// Thresholds — must match your backend payout_tiers
const THRESHOLDS = {
  rain: 35,      // mm/hr → heavy rain trigger
  temp: 42,      // °C    → extreme heat trigger
  aqi: 200,      // AQI   → severe air quality trigger
};

function getStatus(currentEnv, policy, payoutTiers) {
  if (!policy || policy.status !== 'active') {
    return { covered: false, reason: 'No active policy', icon: null, color: 'error' };
  }

  const { rain = 0, temp = 0, aqi = 0 } = currentEnv || {};

  if (rain >= THRESHOLDS.rain) {
    const payout = payoutTiers?.heavy_rain_60?.payout || payoutTiers?.heavy_rain_60 || 200;
    return {
      covered: true,
      eligible: true,
      trigger: 'Heavy Rain',
      icon: <CloudRain className="w-5 h-5" />,
      detail: `${rain.toFixed(1)} mm/hr detected`,
      payout,
      color: 'rain',
    };
  }

  if (temp >= THRESHOLDS.temp) {
    const payout = payoutTiers?.extreme_heat?.payout || payoutTiers?.extreme_heat || 300;
    return {
      covered: true,
      eligible: true,
      trigger: 'Extreme Heat',
      icon: <Thermometer className="w-5 h-5" />,
      detail: `${temp.toFixed(1)}°C detected`,
      payout,
      color: 'heat',
    };
  }

  if (aqi >= THRESHOLDS.aqi) {
    const payout = payoutTiers?.severe_aqi?.payout || payoutTiers?.severe_aqi || 250;
    return {
      covered: true,
      eligible: true,
      trigger: 'Severe AQI',
      icon: <Wind className="w-5 h-5" />,
      detail: `AQI ${aqi} detected`,
      payout,
      color: 'aqi',
    };
  }

  // Covered but no trigger
  return {
    covered: true,
    eligible: false,
    color: 'primary',
  };
}

const colorMap = {
  primary: {
    bg: 'bg-primary/10 border-primary/20',
    icon: 'bg-primary/15 text-primary',
    badge: 'bg-primary text-on-primary',
    text: 'text-primary',
  },
  rain: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: 'bg-blue-500/15 text-blue-500',
    badge: 'bg-blue-500 text-white',
    text: 'text-blue-600',
  },
  heat: {
    bg: 'bg-orange-500/10 border-orange-500/30',
    icon: 'bg-orange-500/15 text-orange-500',
    badge: 'bg-orange-500 text-white',
    text: 'text-orange-600',
  },
  aqi: {
    bg: 'bg-purple-500/10 border-purple-500/30',
    icon: 'bg-purple-500/15 text-purple-500',
    badge: 'bg-purple-500 text-white',
    text: 'text-purple-600',
  },
  error: {
    bg: 'bg-error/10 border-error/20',
    icon: 'bg-error/15 text-error',
    badge: 'bg-error text-white',
    text: 'text-error',
  },
};

export default function CoverageStatus({ currentEnv, policy, payoutTiers }) {
  const status = getStatus(currentEnv, policy, payoutTiers);
  const c = colorMap[status.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`rounded-2xl border p-4 ${c.bg}`}
    >
      {status.eligible ? (
        /* ── CLAIM ELIGIBLE ── */
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${c.icon}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">Am I covered right now?</p>
                <p className={`text-sm font-bold ${c.text}`}>⚡ Claim Eligible</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>
              LIVE
            </span>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-xl bg-white/40`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${c.icon}`}>
                {status.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface">{status.trigger} detected</p>
                <p className="text-[10px] text-on-surface-variant">{status.detail}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant">Auto payout</p>
              <p className={`text-base font-bold ${c.text}`}>₹{status.payout}</p>
            </div>
          </div>

          <p className="text-[10px] text-on-surface-variant mt-2 text-center">
            Payout will be credited to your UPI automatically within 10 min
          </p>
        </div>
      ) : status.covered ? (
        /* ── COVERED, NO TRIGGER ── */
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${c.icon}`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Am I covered right now?</p>
              <p className="text-sm font-bold text-primary">✅ YES — Shield Active</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Weather conditions normal. No trigger detected.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/15 text-primary">
            SAFE
          </span>
        </div>
      ) : (
        /* ── NOT COVERED ── */
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${c.icon}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Am I covered right now?</p>
              <p className="text-sm font-bold text-error">❌ NO — Not Protected</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Activate your shield to get covered.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-error/15 text-error">
            AT RISK
          </span>
        </div>
      )}
    </motion.div>
  );
}