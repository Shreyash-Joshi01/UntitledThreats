import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Zap, IndianRupee, AlertCircle } from 'lucide-react';

const STEPS = [
  { key: 'verified',  label: 'Claim Verified',      icon: CheckCircle2 },
  { key: 'checked',   label: 'Fraud Check Passed',   icon: CheckCircle2 },
  { key: 'initiated', label: 'Payout Initiated',     icon: Zap         },
  { key: 'credited',  label: 'Amount Credited',       icon: IndianRupee },
];

const STATUS_INDEX = {
  PENDING:   0,
  VERIFIED:  1,
  INITIATED: 2,
  CREDITED:  3,
};

/**
 * PayoutTracker — Visual stepper for Razorpay claim payout status.
 *
 * Props:
 *   claimId   {string}  — claim UUID
 *   amount    {number}  — payout amount in ₹
 *   status    {string}  — one of: PENDING | VERIFIED | INITIATED | CREDITED
 *   onInitiate {fn}     — called when user taps "Initiate Payout" button
 *   loading   {bool}    — disable button while API call is in-flight
 *   error     {string}  — error message to display
 */
export default function PayoutTracker({ claimId, amount, status = 'PENDING', onInitiate, loading = false, error }) {
  const [showDetails, setShowDetails] = useState(false);
  const currentStep = STATUS_INDEX[status] ?? 0;
  const isComplete = status === 'CREDITED';

  return (
    <div className="glass-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-primary' : 'bg-warning animate-pulse'}`} />
          <span className="text-sm font-semibold text-on-surface">Instant Payout</span>
          <span className="text-[10px] bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full font-mono">
            TEST MODE
          </span>
        </div>
        <div className="font-heading font-bold text-primary flex items-center gap-0.5">
          <span className="text-xs">₹</span>
          <span>{amount?.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Step Tracker */}
      <div className="p-4">
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-outline-variant/40 z-0" />
          <motion.div
            className="absolute top-4 left-4 h-0.5 bg-primary z-0"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />

          {/* Steps */}
          <div className="relative z-10 flex justify-between">
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1 first:items-start last:items-end">
                  <motion.div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      done
                        ? 'bg-primary border-primary text-on-primary'
                        : 'bg-surface border-outline-variant text-on-surface-variant'
                    } ${active && !isComplete ? 'shadow-[0_0_0_4px] shadow-primary/20' : ''}`}
                    animate={active && !isComplete ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {done ? (
                      <StepIcon className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </motion.div>
                  <span className={`text-[9px] font-medium text-center leading-tight max-w-[56px] ${
                    done ? 'text-primary' : 'text-on-surface-variant'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA or completion message */}
        <div className="mt-5">
          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20"
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-primary font-medium">
                  ₹{amount?.toLocaleString('en-IN')} successfully credited via Razorpay Test Mode.
                </p>
              </motion.div>
            ) : status === 'PENDING' && onInitiate ? (
              <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {error && (
                  <div className="flex items-center gap-1.5 mb-2 text-error text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  id={`payout-initiate-${claimId}`}
                  onClick={() => onInitiate(claimId, amount)}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Initiate Payout via Razorpay
                    </>
                  )}
                </button>
                <p className="text-[9px] text-on-surface-variant/60 text-center mt-1.5">
                  ⚠️ Simulated via Razorpay Test Mode · No real money transferred
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-on-surface-variant"
              >
                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>Payout in progress…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Claim ID toggle */}
        <button
          onClick={() => setShowDetails(d => !d)}
          className="mt-3 text-[10px] text-on-surface-variant/50 hover:text-on-surface-variant transition-colors w-full text-center"
        >
          {showDetails ? '▲ Hide' : '▼ Show'} claim details
        </button>
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-2 rounded-lg bg-surface-variant/40 font-mono text-[10px] text-on-surface-variant break-all">
                Claim ID: {claimId}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
