import React, { useState } from 'react';
import { MapPin, Crosshair, Search, Loader2 } from 'lucide-react';
import { geocodeAPI, workerAPI } from '../../services/api';

export default function ZoneSelector({ currentZone, onZoneChange }) {
  const [isLocating, setIsLocating] = useState(false);
  const [manualZone, setManualZone] = useState('');
  const [error, setError] = useState(null);

  const handleGPSDetect = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await geocodeAPI.reverse(latitude, longitude);
          const { zone_code, city } = res.data;
          
          await workerAPI.updateZone(zone_code);
          onZoneChange({ zone_code, city });
          setIsLocating(false);
        } catch (err) {
          setError(err.message || 'Failed to detect zone');
          setIsLocating(false);
        }
      },
      (err) => {
        setError('Location access denied. Enter manually.');
        setIsLocating(false);
      },
      { timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualZone || manualZone.length < 6) {
      setError('Please enter a valid 6-digit PIN code');
      return;
    }
    
    setIsLocating(true);
    setError(null);
    try {
      await workerAPI.updateZone(manualZone);
      onZoneChange({ zone_code: manualZone, city: 'Manual Entry' });
      setManualZone('');
    } catch (err) {
      setError('Failed to update zone');
    }
    setIsLocating(false);
  };

  return (
    <div className="glass-panel p-4 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-on-surface-variant flex items-center gap-1">
            <MapPin className="w-4 h-4 text-primary" />
            Current Coverage Zone
          </h3>
          <p className="text-2xl font-bold font-heading mt-1">
            {currentZone?.city || 'Unknown'} 
            <span className="text-on-surface-variant font-medium text-lg ml-2 block sm:inline">
              PIN: {currentZone?.zone_code || '---'}
            </span>
          </p>
        </div>
        
        <button
          onClick={handleGPSDetect}
          disabled={isLocating}
          className="flex items-center justify-center p-3 sm:px-4 sm:py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all font-semibold text-sm"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Crosshair className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Detect GPS</span>
            </>
          )}
        </button>
      </div>

      {error && <p className="text-error text-xs mb-3">{error}</p>}

      <form onSubmit={handleManualSubmit} className="relative mt-2">
        <label htmlFor="manual_zone" className="sr-only">Enter PIN code manually</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-on-surface-variant" />
          </div>
          <input
            type="text"
            id="manual_zone"
            className="block w-full pl-10 pr-20 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm focus:ring-primary focus:border-primary placeholder-on-surface-variant/50 transition-all text-on-surface"
            placeholder="Change PIN code (e.g. 400001)"
            value={manualZone}
            onChange={(e) => setManualZone(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          />
          <button
            type="submit"
            disabled={manualZone.length < 6 || isLocating}
            className="absolute inset-y-1.5 right-1.5 px-3 py-1 bg-surface-variant hover:bg-surface-container-highest text-on-surface font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
}
