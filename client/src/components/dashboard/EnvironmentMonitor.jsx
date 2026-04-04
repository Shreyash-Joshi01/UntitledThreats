import React, { useEffect, useState } from 'react';
import { RefreshCw, Droplet, Thermometer, Wind, AlertTriangle } from 'lucide-react';

export default function EnvironmentMonitor({ currentEnv, onRefresh, isRefreshing }) {
  const [animatedEnv, setAnimatedEnv] = useState({ temp: 0, rain: 0, aqi: 0 });

  useEffect(() => {
    // Simple interpolation for numbers
    if (currentEnv) {
      setTimeout(() => {
        setAnimatedEnv({
          temp: currentEnv.temp || 0,
          rain: currentEnv.rain || 0,
          aqi: currentEnv.aqi || 0,
        });
      }, 100);
    }
  }, [currentEnv]);

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { label: 'Good', color: 'text-aqi-good', bg: 'bg-aqi-good/20' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-aqi-moderate', bg: 'bg-aqi-moderate/20' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'text-aqi-unhealthy', bg: 'bg-aqi-unhealthy/20' };
    if (aqi <= 300) return { label: 'Severe', color: 'text-aqi-severe', bg: 'bg-aqi-severe/20' };
    return { label: 'Hazardous', color: 'text-aqi-hazardous', bg: 'bg-aqi-hazardous/20' };
  };

  const aqiStatus = getAQIStatus(animatedEnv.aqi);
  const rainPercent = Math.min((animatedEnv.rain / 50) * 100, 100);
  const tempPercent = Math.min(Math.max((animatedEnv.temp - 15) / 35, 0) * 100, 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading font-semibold text-on-surface">Live Environment</h3>
        <button 
          onClick={onRefresh} 
          className="p-1 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        
        {/* Rainfall Tile */}
        <div className="glass-panel p-4 flex flex-col justify-between overflow-hidden relative">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-rain-bg p-2 rounded-xl">
              <Droplet className="w-5 h-5 text-rain" />
            </div>
            {animatedEnv.rain > 35 && <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rain opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rain"></span>
            </span>}
          </div>
          <div>
            <h4 className="text-on-surface-variant text-sm font-medium">Rainfall</h4>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-heading">{animatedEnv.rain.toFixed(1)}</span>
              <span className="text-xs text-on-surface-variant">mm/hr</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-surface-variant rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-rain gauge-fill rounded-full" 
              style={{ width: `${rainPercent}%` }}
            />
          </div>
        </div>

        {/* Temperature Tile */}
        <div className="glass-panel p-4 flex flex-col justify-between overflow-hidden relative">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-heat-bg p-2 rounded-xl">
              <Thermometer className="w-5 h-5 text-heat" />
            </div>
            {animatedEnv.temp > 42 && <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-heat opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-heat"></span>
            </span>}
          </div>
          <div>
            <h4 className="text-on-surface-variant text-sm font-medium">Temperature</h4>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-heading">{animatedEnv.temp.toFixed(1)}</span>
              <span className="text-xs text-on-surface-variant">°C</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-surface-variant rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-heat gauge-fill rounded-full" 
              style={{ width: `${tempPercent}%` }}
            />
          </div>
        </div>

        {/* AQI Tile */}
        <div className="glass-panel p-4 flex flex-col justify-between overflow-hidden relative">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-aqi-bg p-2 rounded-xl">
              <Wind className="w-5 h-5 text-aqi-severe" />
            </div>
          </div>
          <div>
            <h4 className="text-on-surface-variant text-sm font-medium">Air Quality</h4>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-heading">{animatedEnv.aqi.toFixed(0)}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${aqiStatus.bg} ${aqiStatus.color}`}>
                {aqiStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts Tile */}
        <div className="glass-panel p-4 flex flex-col justify-between overflow-hidden relative">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-error/10 p-2 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
          </div>
          <div>
            <h4 className="text-on-surface-variant text-sm font-medium">Live Alerts</h4>
            <div className="mt-1">
              {currentEnv?.alerts?.length > 0 ? (
                <div className="text-sm font-semibold text-error mb-1 truncate">
                  {currentEnv.alerts[0].event}
                </div>
              ) : (
                <div className="text-sm font-semibold text-primary mb-1">
                  All Clear
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
