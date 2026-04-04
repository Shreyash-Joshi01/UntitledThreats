import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { claimsAPI } from '../../services/api';

export default function ClaimsTimeline({ claims, onClaimUpdate }) {
  if (!claims || claims.length === 0) {
    return (
      <div className="glass-panel p-6 mb-8 text-center bg-surface-container-low border-dashed border-2 border-outline-variant">
        <p className="text-sm font-medium text-on-surface-variant">No coverage incidents yet</p>
      </div>
    );
  }

  const handleAppeal = async (id) => {
    try {
      await claimsAPI.appeal(id);
      if (onClaimUpdate) onClaimUpdate();
    } catch (err) {
      alert('Failed to submit appeal. Try again later.');
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'auto_approved':
        return { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, color: 'text-primary', badge: 'badge-approved', label: 'Approved' };
      case 'flagged':
        return { icon: <AlertTriangle className="w-4 h-4 text-warning" />, color: 'text-warning', badge: 'badge-flagged', label: 'Reviewing' };
      case 'rejected':
        return { icon: <XCircle className="w-4 h-4 text-error" />, color: 'text-error', badge: 'badge-rejected', label: 'Rejected' };
      default:
        return { icon: <Clock className="w-4 h-4 text-aqi-severe" />, color: 'text-aqi-severe', badge: 'badge-pending', label: 'Pending' };
    }
  };

  // Format event type strictly visually
  const formatEvent = (key) => key?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Event';

  return (
    <div className="mb-8">
      <h3 className="font-heading font-semibold text-on-surface mb-4 px-1">Recent Incidents</h3>
      
      <div className="space-y-4 relative">
        {/* Timeline line */}
        <div className="absolute top-2 bottom-2 left-[21px] w-0.5 bg-surface-variant z-0"></div>

        {claims.map((claim) => {
          const cfg = getStatusConfig(claim.status);
          const date = new Date(claim.initiated_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
          const time = new Date(claim.initiated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const eventInfo = claim.parametric_events || {};

          return (
            <div key={claim.id} className="relative z-10 flex gap-4 pr-1">
              {/* Timeline dot */}
              <div className="mt-1">
                <div className={`w-11 h-11 rounded-full bg-surface shadow-sm border border-outline-variant flex items-center justify-center flex-shrink-0 relative`}>
                  {cfg.icon}
                </div>
              </div>
              
              {/* Card */}
              <div className="glass-panel p-3 flex-1 flex flex-col hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface">{formatEvent(eventInfo.event_type)}</h4>
                    <span className="text-[10px] text-on-surface-variant font-medium">{date} • {time}</span>
                  </div>
                  <div>
                    <span className={cfg.badge}>{cfg.label}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="font-heading font-bold text-on-surface">
                     ₹{claim.payout_amount || 0}
                  </div>
                  
                  {claim.status === 'rejected' && (
                    <button 
                      onClick={() => handleAppeal(claim.id)}
                      className="text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
                    >
                      Appeal Decision
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
