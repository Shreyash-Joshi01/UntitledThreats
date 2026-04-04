import React from 'react';
import { Shield, ShieldAlert, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { policyAPI } from '../../services/api';

export default function PolicyCard({ policy, onPolicyUpdate }) {
  const isActive = policy?.status === 'active';
  const hasPolicy = !!policy;

  const handleActivate = async () => {
    try {
      if (hasPolicy && !isActive) {
        await policyAPI.renew();
      } else {
        await policyAPI.create('400001'); // In full implementation, pass current zone_code
      }
      onPolicyUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to activate policy');
    }
  };

  if (!hasPolicy || !isActive) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-surface mb-6 shadow-card border border-warning/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-2xl -mt-10 -mr-10"></div>
        <div className="p-5 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-warning/10 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-on-surface">No Active Coverage</h2>
              <p className="text-xs text-warning font-medium">Your earnings are currently at risk.</p>
            </div>
          </div>
          
          <button 
            onClick={handleActivate}
            className="w-full mt-4 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-dim transition-colors shadow-glow-sm"
          >
            {hasPolicy ? 'Renew Policy' : 'Activate Free Protection'}
          </button>
        </div>
      </div>
    );
  }

  // Active Policy
  const endDates = new Date(policy.coverage_end);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDates - now) / (1000 * 60 * 60 * 24)));
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface mb-6 shadow-card border border-primary/20 hover:shadow-glow transition-all duration-500">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mt-10 -mr-10 animate-pulse-slow"></div>
      
      <div className="p-5 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl relative">
              <Shield className="w-6 h-6 text-primary" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary border-2 border-surface rounded-full animate-ping"></span>
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary border-2 border-surface rounded-full"></span>
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-on-surface leading-tight">Shield Active</h2>
              <p className="text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Protected
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-on-surface-variant font-medium">Max Payout</p>
            <p className="text-xl font-heading font-bold text-on-surface">
              ₹{policy.max_weekly_payout || 0} <span className="text-sm font-normal text-on-surface-variant">/wk</span>
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-surface-container rounded-xl p-3">
            <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mb-1 text-center">
              <Calendar className="w-3.5 h-3.5" /> End Date
            </p>
            <p className="text-sm font-semibold text-center">{endDates.toLocaleDateString()}</p>
          </div>
          <div className="bg-surface-container rounded-xl p-3 flex flex-col justify-center items-center">
            <p className="text-xs text-on-surface-variant mb-1">Days Remaining</p>
            <p className="text-sm font-bold text-primary">{daysLeft} days</p>
          </div>
        </div>

        <button className="w-full mt-4 py-2 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center gap-1">
          View Policy Details
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>
      </div>
    </div>
  );
}
