import { useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card } from '../ui/Card';
import { ShieldAlert, TrendingUp, AlertTriangle, Loader2, CheckCircle, Server, Activity } from 'lucide-react';

export default function MLSimulationSandbox() {
  const [activeTab, setActiveTab] = useState('fraud');

  return (
    <Card className="overflow-hidden mt-8 border border-primary/20 bg-surface-container-highest/10">
      <div className="p-6 border-b border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container-lowest/50">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" />
            Machine Learning Simulator
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">Direct testing sandbox for Flask ML Microservices via Express Proxy.</p>
        </div>
        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/20">
          {[
            { id: 'fraud', label: 'Fraud Engine', icon: ShieldAlert },
            { id: 'pricing', label: 'Pricing Model', icon: TrendingUp },
            { id: 'risk', label: 'Risk Profile', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-on-primary shadow-sm' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'fraud' && <FraudSim />}
        {activeTab === 'pricing' && <PricingSim />}
        {activeTab === 'risk' && <RiskSim />}
      </div>
    </Card>
  );
}

function FraudSim() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({
    worker_id: 'W-001',
    event_id: 'EVT-AQI-192',
    variance: 8.5,
    is_stationary: 0,
    network_transitions: 2,
    claim_freq_30d: 1
  });

  const handleSimulate = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const payload = {
        worker_id: form.worker_id,
        event_id: form.event_id,
        motion_data: {
          variance: Number(form.variance),
          is_stationary: Number(form.is_stationary),
          network_transitions: Number(form.network_transitions),
          claim_freq_30d: Number(form.claim_freq_30d)
        }
      };
      const response = await adminAPI.simulateFraud(payload);
      setResult(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Worker ID</label>
            <input type="text" className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                   value={form.worker_id} onChange={e => setForm({...form, worker_id: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Event ID</label>
            <input type="text" className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                   value={form.event_id} onChange={e => setForm({...form, event_id: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Motion Variance</label>
            <input type="number" step="0.1" className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                   value={form.variance} onChange={e => setForm({...form, variance: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Is Stationary (0 or 1)</label>
            <input type="number" min="0" max="1" className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                   value={form.is_stationary} onChange={e => setForm({...form, is_stationary: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Network Transitions</label>
            <input type="number" className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                   value={form.network_transitions} onChange={e => setForm({...form, network_transitions: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Claims past 30 days</label>
            <input type="number" className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                   value={form.claim_freq_30d} onChange={e => setForm({...form, claim_freq_30d: e.target.value})} />
          </div>
        </div>
        <button onClick={handleSimulate} disabled={loading} className="w-full py-2 bg-primary text-on-primary rounded font-medium flex items-center justify-center gap-2 hover:opacity-90">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          Run Simulation
        </button>
      </div>

      <div className="bg-surface-container-highest/30 border border-outline-variant/20 rounded-xl p-6 flex flex-col justify-center min-h-[200px]">
        {error ? (
          <div className="text-red-400 text-sm text-center bg-red-400/10 p-4 rounded-lg">{error}</div>
        ) : result ? (
          <div className="space-y-4">
            <h4 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest text-center">Simulation Output</h4>
            <div className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 ${
                result.decision === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30' :
                result.decision === 'soft_hold' ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="text-4xl font-bold font-mono tracking-tighter">
                {result.fraud_score}
                <span className="text-sm opacity-50 ml-1">/100</span>
              </div>
              <span className={`text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  result.decision === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                  result.decision === 'soft_hold' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
              }`}>
                {result.decision.replace('_', ' ')}
              </span>
            </div>
            <p className="text-center text-sm text-on-surface-variant">Reason: <span className="text-on-surface">{result.reason}</span></p>
          </div>
        ) : (
          <p className="text-center text-on-surface-variant/50 text-sm">Enter parameters and run simulation to view ML output.</p>
        )}
      </div>
    </div>
  );
}

function PricingSim() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    zone_code: 'BGLR-01',
    weekly_hours: 45,
    season: 'monsoon',
    claim_history: 0
  });

  const handleSimulate = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const response = await adminAPI.simulatePremium(form);
      setResult(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Zone Code</label>
            <select className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                    value={form.zone_code} onChange={e => setForm({...form, zone_code: e.target.value})}>
              <option value="BGLR-01">BGLR-01 (Koramangala)</option>
              <option value="BGLR-02">BGLR-02 (HSR Layout)</option>
              <option value="BGLR-03">BGLR-03 (Indiranagar)</option>
              <option value="BGLR-04">BGLR-04 (Whitefield)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Season</label>
            <select className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                    value={form.season} onChange={e => setForm({...form, season: e.target.value})}>
              <option value="normal">Normal</option>
              <option value="monsoon">Monsoon</option>
              <option value="smog">Smog (Winter)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Weekly Hours Avg.</label>
            <input type="number" className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                   value={form.weekly_hours} onChange={e => setForm({...form, weekly_hours: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Historical Claims</label>
            <input type="number" className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                   value={form.claim_history} onChange={e => setForm({...form, claim_history: e.target.value})} />
          </div>
        </div>
        <button onClick={handleSimulate} disabled={loading} className="w-full py-2 bg-primary text-on-primary rounded font-medium flex items-center justify-center gap-2 hover:opacity-90">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          Run Simulation
        </button>
      </div>

      <div className="bg-surface-container-highest/30 border border-outline-variant/20 rounded-xl p-6 flex flex-col justify-center min-h-[200px]">
        {error ? (
          <div className="text-red-400 text-sm text-center bg-red-400/10 p-4 rounded-lg">{error}</div>
        ) : result ? (
          <div className="space-y-4">
            <h4 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest text-center">Simulation Output</h4>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-surface-container p-4 rounded-lg border border-outline-variant/20 text-center">
                 <p className="text-xs text-on-surface-variant mb-1">Base Premium</p>
                 <p className="text-2xl font-mono text-on-surface">₹{result.base_premium}</p>
               </div>
               <div className="bg-primary/10 p-4 rounded-lg border border-primary/30 text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-1">
                   <div className="bg-primary text-[9px] px-1.5 rounded-sm font-bold text-on-primary">ML Adj.</div>
                 </div>
                 <p className="text-xs text-on-surface-variant mb-1">Final Premium</p>
                 <p className="text-2xl font-mono text-primary font-bold">₹{result.adjusted_premium}</p>
                 <p className="text-[10px] text-primary-300 font-mono mt-1">x{result.risk_multiplier} multiplier</p>
               </div>
            </div>
            <div className="text-xs text-on-surface-variant flex justify-center gap-4 border-t border-outline-variant/20 pt-3">
              <span>Zone Score: <span className="font-bold">{result.breakdown?.zone_score}</span></span>
              <span>Penalty: <span className="font-bold text-red-400">+{result.breakdown?.claim_history_penalty}</span></span>
            </div>
          </div>
        ) : (
          <p className="text-center text-on-surface-variant/50 text-sm">Enter parameters and run simulation to view ML output.</p>
        )}
      </div>
    </div>
  );
}

function RiskSim() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    zone_code: 'BGLR-03',
    worker_id: 'W-999'
  });

  const handleSimulate = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const response = await adminAPI.simulateRisk(form);
      setResult(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Zone Code</label>
            <select className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                    value={form.zone_code} onChange={e => setForm({...form, zone_code: e.target.value})}>
              <option value="BGLR-01">BGLR-01 (Koramangala)</option>
              <option value="BGLR-02">BGLR-02 (HSR Layout)</option>
              <option value="BGLR-03">BGLR-03 (Indiranagar)</option>
              <option value="BGLR-04">BGLR-04 (Whitefield)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Worker ID</label>
            <input type="text" className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant/30 text-sm focus:border-primary focus:outline-none" 
                   value={form.worker_id} onChange={e => setForm({...form, worker_id: e.target.value})} />
          </div>
        </div>
        <button onClick={handleSimulate} disabled={loading} className="w-full py-2 bg-primary text-on-primary rounded font-medium flex items-center justify-center gap-2 hover:opacity-90">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          Run Simulation
        </button>
      </div>

      <div className="bg-surface-container-highest/30 border border-outline-variant/20 rounded-xl p-6 flex flex-col justify-center min-h-[200px]">
        {error ? (
          <div className="text-red-400 text-sm text-center bg-red-400/10 p-4 rounded-lg">{error}</div>
        ) : result ? (
          <div className="space-y-4">
             <h4 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest text-center">Simulation Output</h4>
             <div className="flex items-center justify-center gap-8">
               <div className="text-center">
                 <p className="text-[10px] text-on-surface-variant uppercase">Zone Factor</p>
                 <p className="text-xl font-mono">{result.zone_score}</p>
               </div>
               <div className="w-px h-8 bg-outline-variant/30" />
               <div className="text-center">
                 <p className="text-[10px] text-on-surface-variant uppercase">Worker Factor</p>
                 <p className="text-xl font-mono">{result.worker_score}</p>
               </div>
             </div>
             
             <div className={`mt-2 p-4 rounded-lg border flex flex-col items-center justify-center gap-1 ${
                result.premium_band === 'low' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                result.premium_band === 'medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                'bg-red-500/10 border-red-500/30 text-red-400'
             }`}>
                <p className="text-3xl font-mono font-bold tracking-tighter">
                  {result.composite_score}
                  <span className="text-sm ml-1 opacity-60">Avg Score</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs uppercase tracking-widest font-bold">Risk Band:</span>
                  <span className="bg-current/20 px-2 py-0.5 rounded text-xs font-bold uppercase">{result.premium_band}</span>
                </div>
             </div>
          </div>
        ) : (
          <p className="text-center text-on-surface-variant/50 text-sm">Enter parameters and run simulation to view ML output.</p>
        )}
      </div>
    </div>
  );
}
