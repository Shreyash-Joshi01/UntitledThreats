import React from 'react';
import { IndianRupee, CloudRain, ThermometerSun, AlertCircle } from 'lucide-react';

export default function PayoutTiers({ tiers }) {
  if (!tiers || Object.keys(tiers).length === 0) return null;

  const renderIcon = (type) => {
    switch(type) {
      case 'heavy_rain_60':
      case 'heavy_rain_90':
        return <CloudRain className="w-4 h-4 text-rain" />;
      case 'extreme_heat':
        return <ThermometerSun className="w-4 h-4 text-heat" />;
      case 'severe_aqi':
        return <AlertCircle className="w-4 h-4 text-aqi-severe" />;
      case 'flash_flood':
        return <AlertCircle className="w-4 h-4 text-flood" />;
      case 'curfew':
        return <AlertCircle className="w-4 h-4 text-curfew" />;
      default:
        return <AlertCircle className="w-4 h-4 text-on-surface-variant" />;
    }
  };

  const formatName = (key) => {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="glass-panel p-4 mb-6">
      <h3 className="font-heading font-semibold text-on-surface mb-3 flex items-center gap-1.5">
        <IndianRupee className="w-4 h-4 text-primary" />
        Guaranteed Payout Tiers
      </h3>
      
      <div className="space-y-2">
        {Object.entries(tiers).map(([key, tier]) => {
          const label = typeof tier === 'object' ? tier.label : key;
          const payout = typeof tier === 'object' ? tier.payout : tier;
          return (
            <div key={key} className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-surface p-1.5 rounded-lg shadow-sm">
                  {renderIcon(key)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface leading-tight">{label}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">Automated</p>
                </div>
              </div>
              <div className="text-primary font-bold font-heading">
                ₹{payout}
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-[11px] text-on-surface-variant mt-3 text-center opacity-80">
        Payouts automatically deposit to your linked UPI.
      </p>
    </div>
  );
}
