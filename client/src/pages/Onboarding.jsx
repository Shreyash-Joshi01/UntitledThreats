import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, Lock, Phone, Mail, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { authAPI, workerAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const pageVariants = {
  initial: { opacity: 0, x: 20, filter: "blur(10px)", scale: 0.95 },
  animate: { opacity: 1, x: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, filter: "blur(10px)", scale: 0.95, transition: { duration: 0.3, ease: "easeIn" } },
};

const PLATFORMS = [
  { value: 'zepto',   label: '⚡ Zepto' },
  { value: 'blinkit', label: '🟡 Blinkit' },
  { value: 'both',    label: '🔗 Both' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const setSession = useAuthStore(state => state.setSession);

  // 'auth' step → credentials form. 'otp' step → email OTP confirm (register only)
  const [step, setStep] = useState('auth');
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    email: '', password: '',
    phone: '', upi_id: '', zone_code: '', platform: '',
  });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handlePlatformSelect = (value) => {
    setFormData({ ...formData, platform: value });
    setError(null);
  };

  // ── STEP 1 ──────────────────────────────────────────────────────────────────
  const handleAuthSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        // Login: direct email + password → session
        const res = await authAPI.login(formData.email, formData.password);
        const { access_token, user } = res.data;
        if (!access_token) throw new Error('Login failed. Please try again.');
        setSession(user, access_token);
        navigate('/dashboard');
      } else {
        // Register: validate worker fields first
        if (!formData.phone || !formData.upi_id || !formData.zone_code || !formData.platform) {
          throw new Error('Please fill in Phone, UPI ID, Pin Code, and Platform.');
        }
        // Create account → Supabase sends OTP email
        await authAPI.register(formData.email, formData.password);
        // Show OTP screen
        setStep('otp');
      }
    } catch (err) {
      const msg = err.message || 'Authentication failed';
      if (msg.toLowerCase().includes('already registered')) {
        setError('This email is already registered. Switch to Login.');
        setMode('login');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2 (register only) ───────────────────────────────────────────────────
  const handleOtpSubmit = async () => {
    const token = otp.join('');
    if (token.length !== 6) { setError('Enter all 6 digits.'); return; }

    setError(null);
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(formData.email, token);
      const { access_token, user } = res.data;
      if (!access_token) throw new Error('OTP verified but session missing. Try logging in.');

      setSession(user, access_token);

      // Save worker profile now that we have a valid session
      await workerAPI.registerProfile({
        phone: formData.phone,
        upi_id: formData.upi_id,
        zone_code: formData.zone_code,
        platform: formData.platform,
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  // ── RENDERS ──────────────────────────────────────────────────────────────────
  const renderAuthForm = () => (
    <motion.div key="auth" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="text-center space-y-2 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-glass">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-on-surface">GigShield</h1>
        <p className="text-on-surface-variant text-sm font-body">Security for the gig economy.</p>
      </div>

      <div className="flex bg-surface-container p-1 rounded-xl">
        <button onClick={() => { setMode('login'); setError(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'login' ? 'bg-surface text-on-surface shadow' : 'text-on-surface-variant'}`}>
          Login
        </button>
        <button onClick={() => { setMode('register'); setError(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'register' ? 'bg-surface text-on-surface shadow' : 'text-on-surface-variant'}`}>
          Register
        </button>
      </div>

      <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 w-5 h-5 text-on-surface-variant pointer-events-none" />
          <Input name="email" type="email" placeholder="Email Address" className="pl-12" value={formData.email} onChange={handleChange} />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-on-surface-variant pointer-events-none" />
          <Input name="password" type="password" placeholder="Password" className="pl-12" value={formData.password} onChange={handleChange} />
        </div>

        {mode === 'register' && (
          <>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 w-5 h-5 text-on-surface-variant pointer-events-none" />
              <Input name="phone" type="tel" placeholder="Phone Number" className="pl-12 font-mono" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <Input name="zone_code" placeholder="Pin Code" className="pl-9 text-sm" value={formData.zone_code} onChange={handleChange} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-on-surface-variant font-bold text-sm pointer-events-none">₹</span>
                <Input name="upi_id" placeholder="UPI ID" className="pl-7 text-sm" value={formData.upi_id} onChange={handleChange} />
              </div>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant mb-2 font-medium">Your platform</p>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map(p => (
                  <button key={p.value} type="button" onClick={() => handlePlatformSelect(p.value)}
                    className={`py-2.5 px-2 rounded-xl text-sm font-medium border transition-all ${
                      formData.platform === p.value
                        ? 'bg-primary text-on-primary border-primary shadow-md scale-[1.03]'
                        : 'bg-surface text-on-surface-variant border-outline-variant/40 hover:border-primary/50'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-error text-sm text-center leading-snug">{error}</p>}

      <Button className="w-full" onClick={handleAuthSubmit} disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : (mode === 'login' ? 'Secure Login' : 'Create Account')}
        {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
      </Button>
    </motion.div>
  );

  const renderOtpForm = () => (
    <motion.div key="otp" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-on-surface">Verify Email</h2>
        <p className="text-on-surface-variant text-sm font-body">
          We sent a 6-digit code to<br />
          <span className="text-on-surface font-semibold">{formData.email}</span>
        </p>
      </div>

      <div className="flex justify-between gap-2">
        {otp.map((digit, i) => (
          <Input
            key={i}
            ref={(el) => (otpRefs.current[i] = el)}
            className="w-12 h-14 text-center text-xl font-mono p-0 rounded-xl"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            inputMode="numeric"
          />
        ))}
      </div>

      <div className="text-center">
        <button
          className="text-on-surface-variant text-sm hover:text-primary transition-colors"
          onClick={() => { setOtp(['','','','','','']); authAPI.register(formData.email, formData.password); }}
        >
          Resend Code
        </button>
      </div>

      {error && <p className="text-error text-sm text-center">{error}</p>}

      <Button className="w-full mt-4" onClick={handleOtpSubmit} disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Confirm & Continue'}
      </Button>

      <button
        className="w-full text-center text-on-surface-variant text-xs hover:text-primary transition-colors"
        onClick={() => { setStep('auth'); setOtp(['','','','','','']); setError(null); }}
      >
        ← Back
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md relative z-10 perspective-1000">
        <Card is3D className="p-8">
          <AnimatePresence mode="wait">
            {step === 'auth' ? renderAuthForm() : renderOtpForm()}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
