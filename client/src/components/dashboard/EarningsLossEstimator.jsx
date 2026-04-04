import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, Shield, Clock, CloudRain, Thermometer, Wind, Zap } from 'lucide-react';

// Based on project doc: ₹600–900/day, ~8-10 hrs/day = ₹75–112/hr, avg ₹90/hr
const HOURLY_RATE = 90;

const THRESHOLDS = {
  rain: 35,
  temp: 42,
  aqi: 200,
};

// Minutes remaining until payout threshold is hit
// e.g. heavy rain needs 60 min sustained → estimator counts projected loss
const SCENARIOS = {
  rain: {
    label: 'Heavy Rain',
    icon: <CloudRain className="w-4 h-4" />,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    barColor: 'bg-blue-500',
    tiers: [
      { minutes: 60, payout: 200, label: '60 min sustained' },
      { minutes: 90, payout: 350, label: '90 min sustained' },
    ],
  },
  temp: {
    label: 'Extreme Heat',
    icon: <Thermometer className="w-4 h-4" />,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    barColor: 'bg-orange-500',
    tiers: [
      { minutes: 120, payout: 200, label: '2 hrs sustained' },
    ],
  },
  aqi: {
    label: 'Severe AQI',
    icon: <Wind className="w-4 h-4" />,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    barColor: 'bg-purple-500',
    tiers: [
      { minutes: 180, payout: 500, label: '3 hrs sustained' },
    ],
  },
};

function getActiveScenario(currentEnv) {
  if (!currentEnv) return null;
  if ((currentEnv.rain || 0) >= THRESHOLDS.rain) return 'rain';
  if ((currentEnv.temp || 0) >= THRESHOLDS.temp) return 'temp';
  if ((currentEnv.aqi || 0) >= THRESHOLDS.aqi) return 'aqi';
  return null;
}

export default function EarningsLossEstimator({ currentEnv, policy }) {
  const [elapsed, setElapsed] = useState(0); // simulated minutes elapsed
  const activeKey = getActiveScenario(currentEnv);
  const isActive = !!activeKey && policy?.status === 'active';
  const scenario = activeKey ? SCENARIOS[activeKey] : null;

  // Simulate elapsed time ticking up when a trigger is active
  useEffect(() => {
    if (!isActive) { setElapsed(0); return; }
    const interval = setInterval(() => {
      setElapsed(prev => Math.min(prev + 1, 200));
    }, 3000); // tick every 3s for demo (represents 1 real minute)
    return () => clearInterval(interval);
  }, [isActive]);

  // Calculate earnings lost so far
  const earningsLost = Math.round((elapsed / 60) * HOURLY_RATE);

  // Find next payout tier
  const nextTier = scenario?.tiers.find(t => elapsed < t.minutes);
  const currentTier = scenario?.tiers.filter(t => elapsed >= t.minutes).pop();
  const progressTier = nextTier || scenario?.tiers[scenario.tiers.length - 1];
  const progressPercent = progressTier
    ? Math.min((elapsed / progressTier.minutes) * 100, 100)
    : 100;

  if (!isActive) {
    // No active trigger — show calm state
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-outline-variant/30 bg-surface p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <TrendingDown className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">Earnings Estimator</p>
            <p className="text-[10px] text-on-surface-variant">Monitors income impact in real time</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-xs text-on-surface-variant">No disruption detected</p>
          </div>
          <p className="text-xs font-bold text-primary">₹0 at risk</p>
        </div>
        <p className="text-[10px] text-on-surface-variant text-center mt-2">
          If weather triggers activate, this will show your projected earnings loss and payout
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${scenario.bg} ${scenario.border}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${scenario.bg}`}>
            <TrendingDown className={`w-4 h-4 ${scenario.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">Earnings Impact</p>
            <p className={`text-[10px] font-medium flex items-center gap-1 ${scenario.color}`}>
              {scenario.icon} {scenario.label} ongoing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
          <Clock className="w-3 h-3" />
          {elapsed} min
        </div>
      </div>

      {/* Loss vs Payout row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/50 rounded-xl p-3">
          <p className="text-[10px] text-on-surface-variant mb-1">Earnings lost so far</p>
          <p className="text-lg font-bold text-error">−₹{earningsLost}</p>
          <p className="text-[10px] text-on-surface-variant">@ ₹{HOURLY_RATE}/hr avg</p>
        </div>
        <div className="bg-white/50 rounded-xl p-3">
          <p className="text-[10px] text-on-surface-variant mb-1">
            {currentTier ? 'Payout earned' : 'Next payout'}
          </p>
          <p className={`text-lg font-bold ${currentTier ? 'text-primary' : scenario.color}`}>
            {currentTier ? `₹${currentTier.payout}` : `₹${nextTier?.payout || 0}`}
          </p>
          <p className="text-[10px] text-on-surface-variant">
            {currentTier ? 'Auto-processing' : `at ${nextTier?.label}`}
          </p>
        </div>
      </div>

      {/* Progress to next payout */}
      {nextTier && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-on-surface-variant">
              Progress to ₹{nextTier.payout} payout
            </p>
            <p className={`text-[10px] font-bold ${scenario.color}`}>
              {nextTier.minutes - elapsed} min remaining
            </p>
          </div>
          <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${scenario.barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Payout tiers status */}
      <div className="space-y-1.5">
        {scenario.tiers.map((tier, i) => {
          const achieved = elapsed >= tier.minutes;
          return (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                achieved ? 'bg-primary/10 border border-primary/20' : 'bg-white/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {achieved
                  ? <Zap className="w-3.5 h-3.5 text-primary" />
                  : <Clock className="w-3.5 h-3.5 text-on-surface-variant" />
                }
                <p className="text-xs text-on-surface">{tier.label}</p>
              </div>
              <p className={`text-xs font-bold ${achieved ? 'text-primary' : 'text-on-surface-variant'}`}>
                {achieved ? '✅' : '⏳'} ₹{tier.payout}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <p className="text-[10px] text-on-surface-variant text-center mt-3">
        {currentTier
          ? '⚡ Payout is being processed automatically to your UPI'
          : `If this continues ${nextTier?.minutes - elapsed} more min, ₹${nextTier?.payout} will be credited automatically`
        }
      </p>
    </motion.div>
  );
}