import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Bell, LogOut, MapPin, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { dashboardAPI, geocodeAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Components
import BottomNav from '../components/dashboard/BottomNav';
import ZoneSelector from '../components/dashboard/ZoneSelector';
import EnvironmentMonitor from '../components/dashboard/EnvironmentMonitor';
import PolicyCard from '../components/dashboard/PolicyCard';
import ClaimsTimeline from '../components/dashboard/ClaimsTimeline';
import PayoutTiers from '../components/dashboard/PayoutTiers';
import EarningsProtected from '../components/dashboard/EarningsProtected';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  // KYC state
  const [aadhaar, setAadhaar] = useState('');
  const [license, setLicense] = useState('');
  const [kycStatus, setKycStatus] = useState(null); // null | 'submitting' | 'success' | 'error'
  const [kycMessage, setKycMessage] = useState('');

  // GPS state
  const [locationStatus, setLocationStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [locationData, setLocationData] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Derive display name from email
  const displayName = user?.email
    ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Gig Worker';

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const summary = await dashboardAPI.getSummary();
      setData(summary.data);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
      if (e.message && e.message.toLowerCase().includes('not found')) {
        navigate('/onboarding', { replace: true });
      }
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ─── KYC submit ──────────────────────────────────────────────────────────────
  const submitKYC = async () => {
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    if (cleanAadhaar.length !== 12 || !/^\d+$/.test(cleanAadhaar)) {
      setKycStatus('error');
      setKycMessage('Aadhaar must be a 12-digit number.');
      return;
    }
    if (!license.trim()) {
      setKycStatus('error');
      setKycMessage('Please enter your driving license number.');
      return;
    }

    setKycStatus('submitting');
    setKycMessage('');

    try {
      // Replace this with your real KYC API call, e.g.:
      // await dashboardAPI.submitKYC({ aadhaar: cleanAadhaar, license: license.trim() });
      await new Promise(res => setTimeout(res, 1200)); // simulate network

      setKycStatus('success');
      setKycMessage('KYC submitted successfully! Verification may take 24–48 hours.');
    } catch (err) {
      console.error('KYC error:', err);
      setKycStatus('error');
      setKycMessage(err?.message || 'KYC submission failed. Please try again.');
    }
  };

  // ─── GPS / Geolocation ───────────────────────────────────────────────────────
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationData({ error: 'Geolocation is not supported by your browser.' });
      return;
    }

    setLocationStatus('loading');
    setLocationData(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          // Replace with your real reverse geocode call:
          // const result = await geocodeAPI.reverse(latitude, longitude);
          const result = await geocodeAPI.reverse(latitude, longitude);

          setLocationStatus('success');
          setLocationData({
            latitude: latitude.toFixed(5),
            longitude: longitude.toFixed(5),
            zone_code: result?.zone_code || null,
            city: result?.city || null,
            pincode: result?.pincode || null,
          });
        } catch (err) {
          console.error('Reverse geocode error:', err);
          setLocationStatus('success');
          // Still show raw coords even if geocode fails
          setLocationData({
            latitude: pos.coords.latitude.toFixed(5),
            longitude: pos.coords.longitude.toFixed(5),
            zone_code: null,
            city: null,
            pincode: null,
          });
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationStatus('error');
        setLocationData({
          error:
            err.code === 1
              ? 'Location permission denied. Please allow access in browser settings.'
              : 'Unable to retrieve your location. Please try again.',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─── Loading screen ──────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-on-surface-variant font-medium animate-pulse">Initializing Interface...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'GW';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-80 h-80 bg-rain/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[480px] mx-auto w-full relative z-10 p-4 sm:p-5">

        {/* Header Bar */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-sm">
              <span className="font-heading font-bold text-on-primary text-sm">
                {getInitials(data?.worker?.full_name)}
              </span>
            </div>
            <div>
              <p className="text-on-surface-variant text-xs font-medium">Welcome back,</p>
              <h1 className="text-lg font-heading font-bold text-on-surface leading-tight">
                {displayName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('activity')}
              className="p-2 bg-surface rounded-full shadow-sm border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {data?.claims?.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-surface rounded-full shadow-sm border border-outline-variant/30 text-on-surface-variant hover:text-error transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            {/* ── HOME ── */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                <ZoneSelector
                  currentZone={{ zone_code: data?.worker?.zone_code, city: data?.zone_info?.city }}
                  onZoneChange={() => fetchDashboardData(true)}
                />
                <EnvironmentMonitor
                  currentEnv={data?.current_env}
                  onRefresh={() => fetchDashboardData(true)}
                  isRefreshing={refreshing}
                />
              </div>
            )}

            {/* ── SHIELD ── */}
            {activeTab === 'shield' && (
              <div className="space-y-6">
                <PolicyCard
                  policy={data?.policy}
                  onPolicyUpdate={() => fetchDashboardData(true)}
                />
                <EarningsProtected stats={data?.earnings} />
                <PayoutTiers tiers={data?.payout_tiers} />
              </div>
            )}

            {/* ── ACTIVITY ── */}
            {activeTab === 'activity' && (
              <div className="space-y-6 pt-2">
                <ClaimsTimeline
                  claims={data?.claims}
                  onClaimUpdate={() => fetchDashboardData(true)}
                />
              </div>
            )}

            {/* ── PROFILE ── */}
            {activeTab === 'profile' && (
              <div className="space-y-4 mt-2">

                {/* ── Profile Info Card ── */}
                <div className="glass-panel p-6 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center mb-4 border-4 border-surface shadow-sm">
                    <span className="font-heading font-bold text-2xl text-on-primary">
                      {getInitials(displayName)}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-xl">{displayName}</h3>
                  <p className="text-on-surface-variant text-sm mb-4">{user?.email}</p>

                  <div className="w-full h-px bg-outline-variant/50 my-4" />

                  <div className="text-left space-y-3">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant text-sm">Worker ID</span>
                      <span className="font-mono text-xs font-medium">{data?.worker?.partner_id || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant text-sm">Phone</span>
                      <span className="font-medium">{data?.worker?.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant text-sm">Platform</span>
                      <span className="font-medium capitalize">{data?.worker?.platform || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant text-sm">Zone</span>
                      <span className="font-medium">
                        {data?.zone_info?.city
                          ? `${data.zone_info.city} (${data?.worker?.zone_code})`
                          : data?.worker?.zone_code || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant text-sm">UPI ID</span>
                      <span className="font-medium text-primary">{data?.worker?.upi_id || 'Not linked'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant text-sm">Risk Zone</span>
                      <span className={`font-medium capitalize ${
                        data?.worker?.zone_risk === 'high' ? 'text-error'
                        : data?.worker?.zone_risk === 'medium' ? 'text-warning'
                        : 'text-success'
                      }`}>{data?.worker?.zone_risk || '—'}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="mt-6 w-full py-2.5 rounded-xl border border-error/30 text-error hover:bg-error/10 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>

                {/* ── KYC Card ── */}
                <div className="glass-panel p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Upload className="w-4 h-4 text-primary" />
                    <h4 className="font-heading font-semibold text-base text-on-surface">KYC Verification</h4>
                  </div>

                  <div className="space-y-3">
                    {/* Aadhaar input */}
                    <div>
                      <label className="text-on-surface-variant text-xs font-medium mb-1 block">
                        Aadhaar Number
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="XXXX XXXX XXXX"
                        value={aadhaar}
                        onChange={(e) => {
                          // Auto-format with spaces: 1234 5678 9012
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                          const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
                          setAadhaar(formatted);
                          setKycStatus(null);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors font-mono tracking-widest"
                      />
                    </div>

                    {/* License input */}
                    <div>
                      <label className="text-on-surface-variant text-xs font-medium mb-1 block">
                        Driving License Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. DL-0420110012345"
                        value={license}
                        onChange={(e) => {
                          setLicense(e.target.value.toUpperCase());
                          setKycStatus(null);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors uppercase tracking-wide"
                      />
                    </div>

                    {/* Status message */}
                    {kycStatus === 'error' && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/20">
                        <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" />
                        <p className="text-error text-xs">{kycMessage}</p>
                      </div>
                    )}
                    {kycStatus === 'success' && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <p className="text-success text-xs">{kycMessage}</p>
                      </div>
                    )}

                    {/* Submit button */}
                    <button
                      onClick={submitKYC}
                      disabled={kycStatus === 'submitting' || kycStatus === 'success'}
                      className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {kycStatus === 'submitting' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : kycStatus === 'success' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Submitted
                        </>
                      ) : (
                        'Submit KYC'
                      )}
                    </button>
                  </div>
                </div>

                {/* ── GPS Location Card ── */}
                <div className="glass-panel p-5 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h4 className="font-heading font-semibold text-base text-on-surface">Current Location</h4>
                  </div>

                  <button
                    onClick={getLocation}
                    disabled={locationStatus === 'loading'}
                    className="w-full py-2.5 rounded-xl border border-primary/40 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {locationStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Fetching location...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4" />
                        {locationStatus === 'success' ? 'Refresh Location' : 'Get My Location'}
                      </>
                    )}
                  </button>

                  {/* Location error */}
                  {locationStatus === 'error' && locationData?.error && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/20">
                      <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" />
                      <p className="text-error text-xs">{locationData.error}</p>
                    </div>
                  )}

                  {/* Location success */}
                  {locationStatus === 'success' && locationData && (
                    <div className="mt-3 space-y-2 p-3 rounded-xl bg-surface border border-outline-variant/30">
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant text-xs">Latitude</span>
                        <span className="font-mono text-xs font-medium text-on-surface">{locationData.latitude}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant text-xs">Longitude</span>
                        <span className="font-mono text-xs font-medium text-on-surface">{locationData.longitude}</span>
                      </div>
                      {locationData.city && (
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant text-xs">City</span>
                          <span className="text-xs font-medium text-on-surface">{locationData.city}</span>
                        </div>
                      )}
                      {locationData.pincode && (
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant text-xs">Pincode</span>
                          <span className="font-mono text-xs font-medium text-on-surface">{locationData.pincode}</span>
                        </div>
                      )}
                      {locationData.zone_code && (
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant text-xs">Zone Code</span>
                          <span className="font-mono text-xs font-medium text-primary">{locationData.zone_code}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}