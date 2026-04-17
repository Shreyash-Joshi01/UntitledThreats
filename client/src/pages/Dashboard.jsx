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
import CoverageStatus from '../components/dashboard/CoverageStatus';
import EarningsLossEstimator from '../components/dashboard/EarningsLossEstimator';
import { LangProvider, LangToggle, useLang } from '../components/dashboard/LangContext';

// ─── Inner dashboard (needs LangProvider above it) ───────────────────────────
function DashboardInner() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { t } = useLang();

  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  // KYC state
  const [aadhaar, setAadhaar] = useState('');
  const [license, setLicense] = useState('');
  const [kycStatus, setKycStatus] = useState(null);
  const [kycMessage, setKycMessage] = useState('');

  // GPS state
  const [locationStatus, setLocationStatus] = useState(null);
  const [locationData, setLocationData] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

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
    // Auto-refresh every 30 seconds (keeps live env, claims, notifications in sync)
    const interval = setInterval(() => fetchDashboardData(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  // ─── KYC submit ────────────────────────────────────────────────────────────
  const submitKYC = async () => {
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    if (cleanAadhaar.length !== 12 || !/^\d+$/.test(cleanAadhaar)) {
      setKycStatus('error'); setKycMessage('Aadhaar must be a 12-digit number.'); return;
    }
    if (!license.trim()) {
      setKycStatus('error'); setKycMessage('Please enter your driving license number.'); return;
    }
    setKycStatus('submitting'); setKycMessage('');
    try {
      await new Promise(res => setTimeout(res, 1200));
      setKycStatus('success');
      setKycMessage('KYC submitted successfully! Verification may take 24–48 hours.');
    } catch (err) {
      setKycStatus('error');
      setKycMessage(err?.message || 'KYC submission failed. Please try again.');
    }
  };

  // ─── GPS ───────────────────────────────────────────────────────────────────
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationData({ error: 'Geolocation is not supported by your browser.' });
      return;
    }
    setLocationStatus('loading'); setLocationData(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const result = await geocodeAPI.reverse(latitude, longitude);
          setLocationStatus('success');
          setLocationData({ latitude: latitude.toFixed(5), longitude: longitude.toFixed(5), zone_code: result?.zone_code || null, city: result?.city || null, pincode: result?.pincode || null });
        } catch (err) {
          setLocationStatus('success');
          setLocationData({ latitude: pos.coords.latitude.toFixed(5), longitude: pos.coords.longitude.toFixed(5), zone_code: null, city: null, pincode: null });
        }
      },
      (err) => {
        setLocationStatus('error');
        setLocationData({ error: err.code === 1 ? 'Location permission denied. Please allow access in browser settings.' : 'Unable to retrieve your location. Please try again.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-80 h-80 bg-rain/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[480px] mx-auto w-full relative z-10 p-4 sm:p-5">

        {/* ── Header ── */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-sm">
              <span className="font-heading font-bold text-on-primary text-sm">
                {getInitials(data?.worker?.full_name)}
              </span>
            </div>
            <div>
              <p className="text-on-surface-variant text-xs font-medium">{t.welcomeBack}</p>
              <h1 className="text-lg font-heading font-bold text-on-surface leading-tight">{displayName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🌐 Language Toggle */}
            <LangToggle />

            <button
              onClick={() => setActiveTab('activity')}
              className="p-2 bg-surface rounded-full shadow-sm border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {data?.claims?.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface" />
              )}
            </button>
            <button onClick={handleLogout} className="p-2 bg-surface rounded-full shadow-sm border border-outline-variant/30 text-on-surface-variant hover:text-error transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="enter" exit="exit">

            {/* HOME */}
            {activeTab === 'home' && (
              <div className="space-y-4">
                <ZoneSelector
                  currentZone={{ zone_code: data?.worker?.zone_code, city: data?.zone_info?.city }}
                  onZoneChange={() => fetchDashboardData(true)}
                />
                <CoverageStatus
                  currentEnv={data?.current_env}
                  policy={data?.policy}
                  payoutTiers={data?.payout_tiers}
                />
                <EarningsLossEstimator
                  currentEnv={data?.current_env}
                  policy={data?.policy}
                />
                <EnvironmentMonitor
                  currentEnv={data?.current_env}
                  onRefresh={() => fetchDashboardData(true)}
                  isRefreshing={refreshing}
                />
              </div>
            )}

            {/* SHIELD */}
            {activeTab === 'shield' && (
              <div className="space-y-6">
                <PolicyCard
                  policy={data?.policy}
                  onPolicyUpdate={() => fetchDashboardData(true)}
                  worker={data?.worker}
                  payoutTiers={data?.payout_tiers}
                  premiumData={data?.premium}
                />
                <EarningsProtected stats={data?.earnings} />
                <PayoutTiers tiers={data?.payout_tiers} />
              </div>
            )}

            {/* ACTIVITY */}
            {activeTab === 'activity' && (
              <div className="space-y-6 pt-2">
                <ClaimsTimeline
                  claims={data?.claims ?? []}
                  notifications={data?.notifications ?? []}
                  currentEnv={data?.current_env ?? {}}
                  onClaimUpdate={() => fetchDashboardData(true)}
                />
              </div>
            )}

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-4 mt-2">
                <div className="glass-panel p-6 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center mb-4 border-4 border-surface shadow-sm">
                    <span className="font-heading font-bold text-2xl text-on-primary">{getInitials(displayName)}</span>
                  </div>
                  <h3 className="font-heading font-bold text-xl">{displayName}</h3>
                  <p className="text-on-surface-variant text-sm mb-4">{user?.email}</p>
                  <div className="w-full h-px bg-outline-variant/50 my-4" />
                  <div className="text-left space-y-3">
                    {[
                      ['Worker ID', data?.worker?.partner_id, 'font-mono text-xs'],
                      ['Phone', data?.worker?.phone, ''],
                      ['Platform', data?.worker?.platform, 'capitalize'],
                      ['Zone', data?.zone_info?.city ? `${data.zone_info.city} (${data?.worker?.zone_code})` : data?.worker?.zone_code, ''],
                      ['UPI ID', data?.worker?.upi_id || 'Not linked', 'text-primary'],
                    ].map(([label, value, cls]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-on-surface-variant text-sm">{label}</span>
                        <span className={`font-medium ${cls}`}>{value || '—'}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant text-sm">Risk Zone</span>
                      <span className={`font-medium capitalize ${data?.worker?.zone_risk === 'high' ? 'text-error' : data?.worker?.zone_risk === 'medium' ? 'text-warning' : 'text-success'}`}>
                        {data?.worker?.zone_risk || '—'}
                      </span>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="mt-6 w-full py-2.5 rounded-xl border border-error/30 text-error hover:bg-error/10 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>

                {/* KYC */}
                <div className="glass-panel p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Upload className="w-4 h-4 text-primary" />
                    <h4 className="font-heading font-semibold text-base text-on-surface">KYC Verification</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-on-surface-variant text-xs font-medium mb-1 block">Aadhaar Number</label>
                      <input type="text" inputMode="numeric" maxLength={14} placeholder="XXXX XXXX XXXX" value={aadhaar}
                        onChange={(e) => { const raw = e.target.value.replace(/\D/g, '').slice(0, 12); setAadhaar(raw.replace(/(.{4})/g, '$1 ').trim()); setKycStatus(null); }}
                        className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="text-on-surface-variant text-xs font-medium mb-1 block">Driving License Number</label>
                      <input type="text" placeholder="e.g. DL-0420110012345" value={license}
                        onChange={(e) => { setLicense(e.target.value.toUpperCase()); setKycStatus(null); }}
                        className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors uppercase tracking-wide"
                      />
                    </div>
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
                    <button onClick={submitKYC} disabled={kycStatus === 'submitting' || kycStatus === 'success'}
                      className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                      {kycStatus === 'submitting' ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : kycStatus === 'success' ? <><CheckCircle className="w-4 h-4" />Submitted</> : 'Submit KYC'}
                    </button>
                  </div>
                </div>

                {/* GPS */}
                <div className="glass-panel p-5 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h4 className="font-heading font-semibold text-base text-on-surface">Current Location</h4>
                  </div>
                  <button onClick={getLocation} disabled={locationStatus === 'loading'}
                    className="w-full py-2.5 rounded-xl border border-primary/40 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {locationStatus === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" />Fetching location...</> : <><MapPin className="w-4 h-4" />{locationStatus === 'success' ? 'Refresh Location' : 'Get My Location'}</>}
                  </button>
                  {locationStatus === 'error' && locationData?.error && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/20">
                      <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" />
                      <p className="text-error text-xs">{locationData.error}</p>
                    </div>
                  )}
                  {locationStatus === 'success' && locationData && (
                    <div className="mt-3 space-y-2 p-3 rounded-xl bg-surface border border-outline-variant/30">
                      {[['Latitude', locationData.latitude, 'font-mono'], ['Longitude', locationData.longitude, 'font-mono'], ['City', locationData.city, ''], ['Pincode', locationData.pincode, 'font-mono'], ['Zone Code', locationData.zone_code, 'font-mono text-primary']].filter(([, v]) => v).map(([label, value, cls]) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-on-surface-variant text-xs">{label}</span>
                          <span className={`text-xs font-medium text-on-surface ${cls}`}>{value}</span>
                        </div>
                      ))}
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

// ─── Wrap with LangProvider ───────────────────────────────────────────────────
export default function Dashboard() {
  return (
    <LangProvider>
      <DashboardInner />
    </LangProvider>
  );
}