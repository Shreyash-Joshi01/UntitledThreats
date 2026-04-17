import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, MessageCircle, ChevronDown, ChevronUp, CloudRain } from 'lucide-react';
import { claimsAPI, payoutAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from './LangContext';
import PayoutTracker from './PayoutTracker';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
          <p className="font-bold mb-1">Activity Tab Error:</p>
          <p>{this.state.error?.message || String(this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Render WhatsApp *bold* as <strong> ──────────────────────────────────────
function renderWAText(text) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── Build messages using language strings ────────────────────────────────────
function buildMessages(weatherData, t) {
  const now = new Date();
  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const intensity = Number(weatherData?.rain_intensity ?? weatherData?.rainfall_mm ?? 12.4);
  const zone = weatherData?.zone_code ?? weatherData?.zone ?? '603203';
  const city = weatherData?.city ?? weatherData?.location ?? 'Potheri, Chengalpattu';
  const isTriggered = intensity >= 35;
  const intensityStr = intensity.toFixed(1);

  if (!isTriggered) {
    return [{
      id: 1,
      time: fmt(new Date(now.getTime() - 5 * 60 * 1000)),
      text: t.waMsgShield(city, intensityStr, zone),
    }];
  }

  const claimId = `#CLM-${now.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  return [
    {
      id: 1,
      time: fmt(new Date(now.getTime() - 75 * 60 * 1000)),
      text: t.waMsgAlert(city, zone, intensityStr),
    },
    {
      id: 2,
      time: fmt(new Date(now.getTime() - 15 * 60 * 1000)),
      text: t.waMsgPayout(claimId),
    },
    {
      id: 3,
      time: fmt(new Date(now.getTime() - 6 * 60 * 1000)),
      text: t.waMsgSuccess,
    },
  ];
}

// ─── How It Works message ─────────────────────────────────────────────────────
function HowItWorksMessage({ t }) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="bg-white rounded-xl rounded-tl-none p-3 max-w-[88%] shadow-sm">
      <p className="text-[11px] font-bold text-[#075E54] mb-1">Untitled Threats</p>
      <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">
        {renderWAText(t.waHowItWorks)}
      </p>
      <p className="text-[9px] text-gray-400 text-right mt-1">{time} ✓✓</p>
    </div>
  );
}

// ─── WhatsApp Simulation ──────────────────────────────────────────────────────
function WhatsAppSimulation({ currentEnv, hasClaims, notifications = [] }) {
  const { t, lang } = useLang();
  const safeEnv = currentEnv || {};
  const liveIntensity = Number(safeEnv?.rain_intensity ?? safeEnv?.rainfall_mm ?? 0);
  const isTriggered = liveIntensity >= 35;

  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);

  // Prefer real notifications from server, fall back to mock
  const hasRealNotifs = notifications && notifications.length > 0;
  const [messages, setMessages] = useState(() =>
    hasRealNotifs
      ? notifications.map((n, i) => ({
          id: n.id || i,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: n.body,
        }))
      : buildMessages(safeEnv, t)
  );

  // Rebuild messages when notifications, language or weather changes
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setMessages(notifications.map((n, i) => ({
        id: n.id || i,
        time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: n.body,
      })));
    } else {
      setMessages(buildMessages(safeEnv, t));
    }
    setExpanded(false);
    setVisibleCount(1);
  }, [lang, currentEnv, notifications]);

  const handleExpand = () => {
    setExpanded(true);
    setVisibleCount(1);
    setTimeout(() => setVisibleCount(2), 800);
    setTimeout(() => setVisibleCount(3), 1600);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageCircle className="w-4 h-4 text-[#25D366]" />
        <h3 className="font-heading font-semibold text-on-surface">{t.waAlerts}</h3>
        <span className="text-[10px] bg-[#25D366]/15 text-[#25D366] font-bold px-2 py-0.5 rounded-full">LIVE</span>
        {hasRealNotifs && (
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full ml-1">
            {notifications.length} alert{notifications.length !== 1 ? 's' : ''}
          </span>
        )}
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isTriggered ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          <CloudRain className="w-3 h-3" />
          {liveIntensity.toFixed(1)} mm/hr
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm">
        {/* WA Header */}
        <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">UT</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Untitled Threats</p>
            <p className="text-white/70 text-[10px]">{t.waSubtitle}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isTriggered || hasRealNotifs ? 'bg-red-400' : 'bg-[#25D366]'}`} />
            <span className="text-white/70 text-[10px]">{isTriggered ? t.waAlertActive : hasRealNotifs ? 'Alert Active' : t.waMonitoring}</span>
          </div>
        </div>

        {/* Chat area */}
        <div className="bg-[#ECE5DD] p-3 space-y-3 min-h-[80px]">
          {!hasClaims && !isTriggered && !hasRealNotifs ? (
            <HowItWorksMessage t={t} />
          ) : !expanded ? (
            <div>
              <div className="bg-white rounded-xl rounded-tl-none p-3 max-w-[85%] shadow-sm">
                <p className="text-[11px] font-bold text-[#075E54] mb-1">Untitled Threats</p>
                <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                  {renderWAText((messages[0]?.text || '').substring(0, 90))}...
                </p>
                <p className="text-[9px] text-gray-400 text-right mt-1">{messages[0]?.time} ✓✓</p>
              </div>
              {messages.length > 1 && (
                <button onClick={handleExpand} className="mt-3 w-full py-2 bg-[#25D366] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                  <ChevronDown className="w-3.5 h-3.5" /> {t.waViewJourney}
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {messages.slice(0, visibleCount).map((msg, i) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <div className="bg-white rounded-xl rounded-tl-none p-3 max-w-[88%] shadow-sm">
                    <p className="text-[11px] font-bold text-[#075E54] mb-1">Untitled Threats</p>
                    <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">{renderWAText(msg.text)}</p>
                    <p className="text-[9px] text-gray-400 text-right mt-1">{msg.time} ✓✓</p>
                  </div>
                  {i < messages.length - 1 && i >= visibleCount - 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 p-2 bg-white rounded-xl rounded-tl-none w-16 shadow-sm mt-2">
                      {[0, 1, 2].map(j => (
                        <div key={j} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              ))}
              {visibleCount >= messages.length && messages.length > 1 && (
                <button onClick={() => setExpanded(false)} className="mt-1 w-full py-1.5 bg-white/60 text-gray-600 text-xs font-medium rounded-xl flex items-center justify-center gap-1 hover:bg-white transition-colors">
                  <ChevronUp className="w-3.5 h-3.5" /> {t.waCollapse}
                </button>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F0F0F0] px-3 py-2">
          <div className="bg-white rounded-full px-3 py-1.5">
            <p className="text-[10px] text-gray-400">{t.waFooter}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inner ClaimsTimeline ─────────────────────────────────────────────────────
function ClaimsTimelineInner({ claims, notifications = [], currentEnv, onClaimUpdate }) {
  const { t } = useLang();
  const [payoutStatus, setPayoutStatus] = useState({});  // claimId → 'PENDING'|'INITIATED'|'CREDITED'
  const [payoutLoading, setPayoutLoading] = useState({});
  const [payoutError, setPayoutError] = useState({});

  const handleAppeal = async (id) => {
    try {
      await claimsAPI.appeal(id);
      if (onClaimUpdate) onClaimUpdate();
    } catch (err) {
      alert('Failed to submit appeal. Try again later.');
    }
  };

  const handleInitiatePayout = async (claimId, amount) => {
    setPayoutLoading(l => ({ ...l, [claimId]: true }));
    setPayoutError(e => ({ ...e, [claimId]: null }));
    try {
      // Step 1: Create Razorpay order from backend
      const orderData = await payoutAPI.createOrder(claimId, amount);
      if (!orderData?.data) throw new Error('Failed to create payout order');

      const { order_id, amount: orderAmount, currency, razorpay_key } = orderData.data;

      // Step 2: Open Razorpay checkout widget (Test Mode)
      const rzp = new window.Razorpay({
        key: razorpay_key,
        amount: orderAmount,
        currency,
        name: 'GigShield',
        description: `Claim Payout`,
        order_id,
        handler: async (response) => {
          // Step 3: Verify signature on backend
          try {
            await payoutAPI.verify(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              claimId
            );
            setPayoutStatus(s => ({ ...s, [claimId]: 'CREDITED' }));
          } catch {
            setPayoutError(e => ({ ...e, [claimId]: 'Payment verification failed. Contact support.' }));
          }
        },
        theme: { color: '#6366F1' },
        modal: { ondismiss: () => setPayoutLoading(l => ({ ...l, [claimId]: false })) },
        // Test UPI: success@razorpay or failure@razorpay
      });

      setPayoutStatus(s => ({ ...s, [claimId]: 'INITIATED' }));
      rzp.open();
    } catch (err) {
      setPayoutError(e => ({ ...e, [claimId]: err.message || 'Payout failed. Try again.' }));
    } finally {
      setPayoutLoading(l => ({ ...l, [claimId]: false }));
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'auto_approved': return { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, badge: 'badge-approved', label: 'Approved' };
      case 'flagged':       return { icon: <AlertTriangle className="w-4 h-4 text-warning" />, badge: 'badge-flagged',  label: 'Reviewing' };
      case 'rejected':      return { icon: <XCircle className="w-4 h-4 text-error" />,         badge: 'badge-rejected', label: 'Rejected' };
      default:              return { icon: <Clock className="w-4 h-4 text-aqi-severe" />,       badge: 'badge-pending',  label: 'Pending' };
    }
  };

  const formatEvent = (key) =>
    key?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Event';

  const safeClaims = Array.isArray(claims) ? claims : [];
  const hasClaims = safeClaims.length > 0;

  return (
    <div className="mb-8">
      <WhatsAppSimulation currentEnv={currentEnv || {}} hasClaims={hasClaims} notifications={notifications} />

      <h3 className="font-heading font-semibold text-on-surface mb-4 px-1">{t.recentIncidents}</h3>

      {!hasClaims ? (
        <div className="glass-panel p-6 text-center bg-surface-container-low border-dashed border-2 border-outline-variant">
          <p className="text-sm font-medium text-on-surface-variant">{t.noIncidents}</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">{t.noIncidentsHint}</p>
        </div>
      ) : (
        <div className="space-y-4 relative">
          <div className="absolute top-2 bottom-2 left-[21px] w-0.5 bg-surface-variant z-0" />
          {safeClaims.map((claim) => {
            const cfg  = getStatusConfig(claim.status);
            const date = new Date(claim.initiated_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
            const time = new Date(claim.initiated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const eventInfo = claim.parametric_events || {};
            return (
              <div key={claim.id} className="relative z-10 flex gap-4 pr-1">
                <div className="mt-1">
                  <div className="w-11 h-11 rounded-full bg-surface shadow-sm border border-outline-variant flex items-center justify-center flex-shrink-0">
                    {cfg.icon}
                  </div>
                </div>
                <div className="glass-panel p-3 flex-1 flex flex-col hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-on-surface">{formatEvent(eventInfo.event_type)}</h4>
                      <span className="text-[10px] text-on-surface-variant font-medium">{date} • {time}</span>
                    </div>
                    <span className={cfg.badge}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="font-heading font-bold text-on-surface">₹{claim.payout_amount || 0}</div>
                    {claim.status === 'rejected' && (
                      <button onClick={() => handleAppeal(claim.id)} className="text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1 rounded-full transition-colors">
                        {t.appealDecision}
                      </button>
                    )}
                  </div>
                  {claim.status === 'auto_approved' && (
                    <div className="mt-3">
                      <PayoutTracker
                        claimId={claim.id}
                        amount={claim.payout_amount}
                        status={payoutStatus[claim.id] || (claim.payout_reference && !claim.payout_reference.startsWith('UPI-MOCK') ? 'CREDITED' : 'PENDING')}
                        onInitiate={handleInitiatePayout}
                        loading={payoutLoading[claim.id] || false}
                        error={payoutError[claim.id]}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Export with Error Boundary ───────────────────────────────────────────────
export default function ClaimsTimeline(props) {
  return (
    <ErrorBoundary>
      <ClaimsTimelineInner {...props} />
    </ErrorBoundary>
  );
}