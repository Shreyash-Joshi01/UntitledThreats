import React, { useState } from 'react';
import { MapPin, Crosshair, Search, Loader2 } from 'lucide-react';
import { workerAPI } from '../../services/api';

export default function ZoneSelector({ currentZone, onZoneChange }) {
  const [isLocating, setIsLocating] = useState(false);
  const [manualZone, setManualZone] = useState('');
  const [error, setError] = useState(null);
  const [liveAddress, setLiveAddress] = useState(null);
  const [detectedCity, setDetectedCity] = useState(null);
  const [detectedPin, setDetectedPin] = useState(null);

  const handleGPSDetect = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // ── Step 1: Nominatim (free, no auth needed) ──────────────────
          // This always works regardless of your backend token status
          const nominatimRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const nominatimData = await nominatimRes.json();
          const addr = nominatimData.address || {};

          // City name
          const nominatimCity =
            addr.city || addr.state_district || addr.town || addr.county || 'Unknown';

          // Full readable locality: "Potheri, Tambaram, Chennai"
          const parts = [
            addr.neighbourhood || addr.suburb || addr.village || addr.hamlet,
            addr.town || addr.city_district || addr.county,
            addr.city || addr.state_district,
          ].filter(Boolean);

          const addressLine = parts.length > 0 ? parts.join(', ') : nominatimCity;

          // Pincode from Nominatim
          const pincode = addr.postcode || null;

          // ── Step 2: Update UI immediately with Nominatim data ─────────
          setDetectedCity(nominatimCity);
          setLiveAddress(addressLine);
          if (pincode) setDetectedPin(pincode);
          onZoneChange({
            zone_code: pincode || currentZone?.zone_code || '---',
            city: nominatimCity,
          });

          // ── Step 3: Try backend silently (don't crash if it fails) ────
          try {
            await workerAPI.updateZone(pincode || '000000');
          } catch {
            // Backend failed (expired token etc.) — UI already updated, ignore
          }

        } catch (err) {
          // Nominatim itself failed (no internet etc.)
          console.error('Nominatim error:', err);
          setError('Could not fetch location details. Check your internet connection.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        // Browser denied permission
        const messages = {
          1: 'Location permission denied. Please allow access in your browser settings.',
          2: 'Location unavailable. Try again.',
          3: 'Location request timed out. Try again.',
        };
        setError(messages[err.code] || 'Failed to get location.');
        setIsLocating(false);
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
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
    setLiveAddress(null);
    setDetectedCity(null);
    setDetectedPin(null);

    try {
      await workerAPI.updateZone(manualZone);
      onZoneChange({ zone_code: manualZone, city: null });
      setManualZone('');
    } catch (err) {
      setError('Failed to update zone. Please try again.');
    }
    setIsLocating(false);
  };

  const displayCity = detectedCity || currentZone?.city;

  return (
    <div className="glass-panel p-4 mb-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium text-on-surface-variant flex items-center gap-1">
            <MapPin className="w-4 h-4 text-primary" />
            Current Coverage Zone
          </h3>

          {/* City — only shown if we have one */}
          {displayCity && (
            <p className="text-2xl font-bold font-heading mt-1">{displayCity}</p>
          )}

          {/* PIN on its own line */}
          <p className="text-on-surface-variant font-medium text-base mt-0.5">
            PIN: {detectedPin || currentZone?.zone_code || '---'}
          </p>

          {/* Locality line after GPS detect */}
          {liveAddress && (
            <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {liveAddress}
            </p>
          )}
        </div>

        <button
          onClick={handleGPSDetect}
          disabled={isLocating}
          className="flex items-center justify-center p-3 sm:px-4 sm:py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all font-semibold text-sm shrink-0"
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

      {error && (
        <p className="text-error text-xs mb-3 mt-1">{error}</p>
      )}

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
            onChange={(e) =>
              setManualZone(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
            }
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