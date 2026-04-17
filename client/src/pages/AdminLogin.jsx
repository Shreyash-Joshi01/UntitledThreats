import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authAPI } from '../services/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAdminAuth = useAuthStore((state) => state.setAdminAuth);
  const setSession = useAuthStore((state) => state.setSession);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authAPI.login(email, password);
      // Validated
      setSession(data.user, data.access_token);
      setAdminAuth(true);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid Email or Passcode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-surface-container-highest rounded-2xl flex items-center justify-center mb-6 shadow-glass border border-outline-variant/20">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Insurer Portal</h1>
          <p className="text-on-surface-variant mt-2">Authorized personnel only</p>
        </div>

        <Card is3D className="p-8 backdrop-blur-md bg-surface-container/80">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-on-surface-variant ml-1">Admin Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your system email (e.g., admin@gmail.com)"
                className="w-full bg-surface-container-highest border-outline-variant/30 text-on-surface focus:border-primary"
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-on-surface-variant ml-1">Secure Passcode</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-on-surface-variant" />
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 bg-surface-container-highest border-outline-variant/30 text-on-surface focus:border-primary tracking-widest"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="text-red-400 text-sm font-medium px-4 py-3 bg-red-400/10 rounded-xl border border-red-400/20"
              >
                {error}
              </motion.div>
            )}

            <Button 
              type="submit" 
              className="w-full shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate Access
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="mt-8 text-center text-xs text-on-surface-variant/60 flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" />
          <span>Protected by AES-256 Encryption & Behavioral Telemetry</span>
        </div>
      </motion.div>
    </div>
  );
}
