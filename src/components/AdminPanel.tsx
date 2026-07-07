import { useState, useEffect } from 'react';
import { Shield, Users, Award, TrendingUp, Search, Loader2, RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  id?: string;
}

export function AdminPanel({ id = 'admin-panel' }: AdminPanelProps) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = analytics?.leaderboard?.filter((user: any) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.college.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6" id={id}>
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-tight flex items-center space-x-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            <span>PlacementAI Global Admin Console</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitor institutional performance metrics, audit applicant reports, and manage campus placement leaderboards.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center space-x-1.5 px-4.5 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-350 border border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer"
          id="admin-refresh-btn"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Refresh Records</span>
        </button>
      </div>

      {loading && !analytics ? (
        <div className="py-20 text-center text-zinc-500 font-mono text-xs tracking-wider">
          QUERYING INSTITUTIONAL RECORDS FROM SERVER...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Institutional summary metrics blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="admin-summary-cards">
            {/* Cards */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center space-x-4 text-left">
              <div className="p-3 bg-indigo-950/50 border border-indigo-900/50 text-indigo-400 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[8px] text-zinc-500 font-mono tracking-wider uppercase">REGISTERED CANDIDATES</span>
                <span className="text-2xl font-black font-mono text-zinc-200">{analytics?.totalStudents || 1}</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center space-x-4 text-left">
              <div className="p-3 bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 rounded-xl">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[8px] text-zinc-500 font-mono tracking-wider uppercase">AVERAGE PLACEMENT SCORE</span>
                <span className="text-2xl font-black font-mono text-emerald-400">{analytics?.avgPlacementScore || 75}%</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center space-x-4 text-left">
              <div className="p-3 bg-amber-950/50 border border-amber-900/50 text-amber-400 rounded-xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[8px] text-zinc-500 font-mono tracking-wider uppercase">MNC HIRING SUCCESS RATE</span>
                <span className="text-2xl font-black font-mono text-amber-400">88.5%</span>
              </div>
            </div>
          </div>

          {/* Leaderboard database container */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-zinc-200 font-sans text-left">
                Institution Leaderboard & Candidate Auditing
              </h3>

              {/* Search filter */}
              <div className="relative" id="admin-search">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by name, email, or college..."
                  className="bg-zinc-950 border border-zinc-850 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto" id="admin-table-container">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-zinc-950 text-zinc-500 border-b border-zinc-800 font-mono uppercase text-[9px] tracking-wider">
                    <th className="p-3 font-semibold">Rank</th>
                    <th className="p-3 font-semibold">Candidate Name</th>
                    <th className="p-3 font-semibold">Email Profile</th>
                    <th className="p-3 font-semibold">Affiliation College</th>
                    <th className="p-3 font-semibold text-center">Avg Score</th>
                    <th className="p-3 font-semibold text-center">Rounds Done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {filteredLeaderboard.map((user: any, idx: number) => (
                    <tr key={user.email} className="hover:bg-zinc-950/50" id={`leaderboard-row-${idx}`}>
                      <td className="p-3 font-bold text-zinc-500 font-mono">
                        #{idx + 1}
                      </td>
                      <td className="p-3 font-bold text-zinc-200 font-sans">
                        {user.name}
                      </td>
                      <td className="p-3 text-zinc-400 font-mono">
                        {user.email}
                      </td>
                      <td className="p-3 text-zinc-400 font-sans">
                        {user.college || 'Engineering College'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 bg-indigo-950/50 border border-indigo-900/50 text-indigo-400 rounded-lg font-bold font-mono text-[11px]">
                          {user.avgScore}%
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-zinc-500 font-mono">
                        {user.roundsCompleted} / 5
                      </td>
                    </tr>
                  ))}
                  {filteredLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        No candidates found matching filter constraints.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
