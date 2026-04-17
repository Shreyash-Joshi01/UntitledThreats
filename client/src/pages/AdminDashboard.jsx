import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, IndianRupee, TrendingUp, AlertTriangle, Clock, Activity, LogOut } from 'lucide-react';
import { Card } from '../components/ui/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import MLSimulationSandbox from '../components/admin/MLSimulationSandbox';

const ICONS = {
  activepolicies: Users,
  totalclaimspaid: IndianRupee,
  systemlossratio: TrendingUp,
  suspiciousclaims: ShieldAlert
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await adminAPI.getDashboard();
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold animate-pulse">Aggregating Live Data...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-red-400 flex items-center justify-center p-6">
        <div className="bg-red-400/10 p-6 rounded-2xl border border-red-400/20 max-w-lg text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold mb-2">Network Failure</h2>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  const { stats, claimsData, disruptionSplit, suspiciousClaims, isMocked } = data;

  return (
    <div className="min-h-screen bg-background text-on-surface p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface flex items-center gap-3">
              Insurer Command Center
              {isMocked && (
                <span>

                </span>
              )}
            </h1>
            <p className="text-on-surface-variant mt-1">Real-time parametric monitoring & fraud detection.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-full border border-outline-variant/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium">System Online • Monitoring Database</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 bg-surface-container hover:bg-error/10 hover:text-error hover:border-error/30 text-on-surface-variant transition-colors rounded-full border border-outline-variant/20 shadow-sm"
              title="Logout Administrative Access"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const IconComp = ICONS[stat.name?.replace(/\s/g, '').toLowerCase().replace(/\([^)]*\)/, '')] || Activity;
            return (
              <Card key={stat.id} className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <IconComp className={`w-6 h-6 ${stat.color}`} />
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.id === 4 ? 'bg-amber-500/10 text-amber-400' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant font-medium">{stat.name}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bar Chart */}
          <Card className="col-span-1 lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-6">Claims Volume (7 Days)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={claimsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#ffffff0a' }}
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="completed" name="Auto-Approved" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="flagged" name="Flagged (Held)" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pie Chart */}
          <Card className="col-span-1 p-6">
            <h3 className="text-lg font-semibold mb-6">Payout by Trigger Class</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={disruptionSplit}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {disruptionSplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Suspicious Claims Table */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Syndicate & Fraud Flags
              </h3>
              <p className="text-sm text-on-surface-variant">Claims held for secondary review based on biometric mismatch.</p>
            </div>
            <button className="text-sm px-4 py-2 bg-surface-container-highest hover:bg-surface-container-highest/80 rounded-lg font-medium transition-colors">
              View All Holds
            </button>
          </div>
          <div className="overflow-x-auto">
            {suspiciousClaims.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                No active fraud holds found in the database.
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-container-highest/30 text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4 font-medium">Claim ID</th>
                    <th className="px-6 py-4 font-medium">Worker Profile</th>
                    <th className="px-6 py-4 font-medium">Event Zone & Type</th>
                    <th className="px-6 py-4 font-medium">Fraud Score</th>
                    <th className="px-6 py-4 font-medium">Time Held</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {suspiciousClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-surface-container-highest/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary-300">{claim.id}</td>
                      <td className="px-6 py-4 text-on-surface">{claim.worker}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-on-surface">{claim.zone}</span>
                          <span className="text-xs text-on-surface-variant">{claim.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className={`h-full ${claim.score > 90 ? 'bg-red-500' : 'bg-amber-500'}`}
                              style={{ width: `${claim.score}%` }}
                            />
                          </div>
                          <span className={`font-mono text-xs ${claim.score > 90 ? 'text-red-400' : 'text-amber-400'}`}>
                            {claim.score}/100
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface flex items-center gap-2">
                        <Clock className="w-4 h-4 text-on-surface-variant" />
                        {claim.time}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm font-medium text-primary hover:text-primary-300 underline underline-offset-2">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* ML Simulator Interactive Sandbox */}
        <MLSimulationSandbox />

      </div>
    </div>
  );
}
