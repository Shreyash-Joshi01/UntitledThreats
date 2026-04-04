import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Bell, LogOut } from 'lucide-react';
import { dashboardAPI } from '../services/api';
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

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Derive display name from email (e.g. shreyash@gmail.com → "Shreyash")
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

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

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
            {activeTab === 'home' && (
              <div className="space-y-6">
                <ZoneSelector 
                  currentZone={{ zone_code: data?.worker?.zone_code, city: data?.zone_info?.city }} 
                  onZoneChange={() => fetchDashboardData(true)} 
                />
                
                <PolicyCard 
                  policy={data?.policy} 
                  onPolicyUpdate={() => fetchDashboardData(true)} 
                />
                
                <EnvironmentMonitor 
                  currentEnv={data?.current_env} 
                  onRefresh={() => fetchDashboardData(true)}
                  isRefreshing={refreshing}
                />
              </div>
            )}

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

            {activeTab === 'activity' && (
              <div className="space-y-6 pt-2">
                <ClaimsTimeline 
                  claims={data?.claims} 
                  onClaimUpdate={() => fetchDashboardData(true)} 
                />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="glass-panel p-6 mb-8 mt-2 text-center">
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
                  <span className="text-on-surface-variant text-sm">Zone / Pin</span>
                  <span className="font-medium">{data?.worker?.zone_code || '—'}</span>
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
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
