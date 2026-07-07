import { useState } from 'react';
import { ArrowRight, BookOpen, AlertCircle, CheckCircle2, ChevronRight, FileText, Sparkles, Loader2, Award, Download, RotateCcw } from 'lucide-react';
import { RadialProgress, CustomAreaChart, SkillGapChart } from './CustomCharts';
import { RoundScore, PerformanceAnalysis } from '../types';

interface PerformanceDashboardProps {
  email: string;
  scores: Record<string, RoundScore>;
  onStartRound: (roundId: string) => void;
  onResetAssessment?: () => void;
  id?: string;
}

export function PerformanceDashboard({ email, scores, onStartRound, onResetAssessment, id = 'performance-dashboard' }: PerformanceDashboardProps) {
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);

  // Hardcoded progress milestones
  const rounds = [
    { id: 'aptitude', label: 'Analytical & Reasoning', icon: '📝', roundNum: 1 },
    { id: 'coding', label: 'Coding Assessment', icon: '💻', roundNum: 2 },
    { id: 'technical', label: 'Technical Interview', icon: '🧠', roundNum: 3 },
    { id: 'gd', label: 'Group Discussion', icon: '💬', roundNum: 4 },
    { id: 'hr', label: 'HR Interview', icon: '👔', roundNum: 5 }
  ];

  const completedCount = rounds.filter(r => scores[r.id]).length;
  
  // Calculate raw average score
  const completedRoundsList = Object.values(scores);
  const averageScore = completedRoundsList.length > 0
    ? Math.round(completedRoundsList.reduce((sum, r) => sum + r.score, 0) / completedRoundsList.length)
    : 0;

  const handleGenerateReport = async () => {
    setLoadingAnalysis(true);
    try {
      const res = await fetch('/api/rounds/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (!res.ok) {
          throw new Error(`Server returned error status ${res.status}.`);
        }
        throw jsonErr;
      }
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-5" id={id}>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
        <div>
          <h2 className="text-xl font-serif text-white tracking-tight">
            Placement Prep Cockpit
          </h2>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
            Simulate recruitment rounds, monitor analytics, and unlock career roadmap insights.
          </p>
        </div>
        
        <div className="flex space-x-2">
          {onResetAssessment && (
            <button
              onClick={onResetAssessment}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-rose-400 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer print:hidden"
              id="reset-assessment-btn"
              title="Reset all assessment progress, chats, and coding questions"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Assessment</span>
            </button>
          )}

          {completedCount > 0 && (
            <>
              {!analysis ? (
                <button
                  onClick={handleGenerateReport}
                  disabled={loadingAnalysis}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  id="generate-analysis-btn"
                >
                  {loadingAnalysis ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Run Diagnostic</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handlePrintPDF}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-755 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer print:hidden"
                  id="print-pdf-btn"
                >
                  <Download className="h-4 w-4 text-indigo-400" />
                  <span>Save Report PDF</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* High-Density Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Metric 1: Compact Circular Placement score */}
        <div className="md:col-span-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <RadialProgress percentage={averageScore} size={105} strokeWidth={9} id="overall-radial-chart" />
          <h3 className="mt-2.5 text-[9px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
            Overall Placement Score
          </h3>
        </div>

        {/* Metric 2: Streamlined Timeline Graph */}
        <div className="md:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between text-left">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[9px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
              Performance Timeline Progress
            </h3>
            <span className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Chronological Growth</span>
          </div>
          
          <div className="py-1">
            <CustomAreaChart 
              data={rounds.map(r => scores[r.id]?.score || 0)} 
              labels={rounds.map(r => `R${r.roundNum}`)} 
              height={100}
              id="progress-area-chart"
            />
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left column: Compact checklists */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-3 text-left">
          <h3 className="text-[9px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
            PREPARATION STAGES
          </h3>

          <div className="space-y-2.5" id="rounds-checklist">
            {rounds.map((round) => {
              const scoreData = scores[round.id];
              const isCompleted = !!scoreData;

              return (
                <div
                  key={round.id}
                  className={`flex items-center justify-between p-2.5 border rounded-lg transition-all ${
                    isCompleted 
                      ? 'border-emerald-950/40 bg-emerald-950/5'
                      : 'border-zinc-850 bg-zinc-950/20 hover:bg-zinc-900/20'
                  }`}
                  id={`round-row-${round.id}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base select-none">{round.icon}</span>
                    <div>
                      <span className="block text-[8px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                        ROUND {round.roundNum}
                      </span>
                      <span className="block text-xs font-semibold text-zinc-100 font-sans">
                        {round.label}
                      </span>
                    </div>
                  </div>

                  {isCompleted ? (
                    <div className="flex items-center space-x-1.5">
                      <div className="text-right">
                        <span className="block text-[7px] text-zinc-500 font-mono leading-none">GRADE</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">{scoreData.score}%</span>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    </div>
                  ) : (
                    <button
                      onClick={() => onStartRound(round.id)}
                      className="flex items-center space-x-0.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase shadow-sm transition-colors cursor-pointer"
                      id={`start-round-${round.id}`}
                    >
                      <span>Start</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Dynamic Gemini Career Diagnostics report */}
        <div className="lg:col-span-7">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 shadow-sm h-full flex flex-col justify-between text-left">
            {!analysis ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-850 rounded-xl my-auto">
                <FileText className="h-8 w-8 text-zinc-600 mb-1.5" />
                <p className="text-xs font-semibold text-zinc-300">Diagnostics Pending</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 max-w-xs font-sans leading-relaxed">
                  Complete any round and run the diagnostic to generate structured skill gap grids and schedules.
                </p>
                {completedCount > 0 && (
                  <button
                    onClick={handleGenerateReport}
                    className="mt-3 flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                    id="trigger-diagnostic-center-btn"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Run Diagnostic</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6 overflow-y-auto max-h-[460px] pr-2" id="report-analytics-display">
                {/* Visual Label Alert */}
                <div className="p-4 bg-indigo-950/20 border border-indigo-900/50 rounded-xl flex items-start space-x-3">
                  <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider uppercase">GEMINI RECRUITER DIAGNOSIS</h4>
                    <p className="text-sm font-semibold font-serif text-zinc-100">{analysis.readinessLabel}</p>
                  </div>
                </div>

                {/* Company Readiness Meters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl">
                    <span className="block text-[9px] text-zinc-500 font-mono tracking-wider uppercase">PRODUCT MNC READINESS</span>
                    <span className="text-xl font-extrabold text-indigo-400 font-mono">{analysis.productCompanyReadiness}%</span>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${analysis.productCompanyReadiness}%` }} />
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl">
                    <span className="block text-[9px] text-zinc-500 font-mono tracking-wider uppercase">CONSULTING SERVICE READY</span>
                    <span className="text-xl font-extrabold text-emerald-400 font-mono">{analysis.serviceCompanyReadiness}%</span>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${analysis.serviceCompanyReadiness}%` }} />
                    </div>
                  </div>
                </div>

                {/* Strengths & Weaknesses lists */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wider mb-2">STRENGTHS</h4>
                    <ul className="space-y-1.5">
                      {analysis.strengths.map((str, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start space-x-1.5 font-sans">
                          <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wider mb-2">WEAKNESSES</h4>
                    <ul className="space-y-1.5">
                      {analysis.weaknesses.map((weak, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start space-x-1.5 font-sans">
                          <span className="text-amber-500 shrink-0 font-bold">⚠</span>
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Skill Gaps Meter list */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wider">SKILL GAP METRIC RATINGS</h4>
                  <SkillGapChart skills={analysis.skillGaps} id="report-skill-gaps" />
                </div>

                {/* Detailed Action Roadmap */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wider">ACTION LEARNING PLAN SCHEDULE</h4>
                  <div className="space-y-3">
                    {analysis.roadmap.map((plan, i) => (
                      <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-indigo-400 rounded text-[9px] font-bold font-mono uppercase tracking-wider">
                          {plan.timeframe} Action Plan
                        </span>
                        <ul className="mt-2.5 space-y-1 text-xs text-zinc-400 font-sans leading-relaxed">
                          {plan.tasks.map((task, idx) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span className="text-indigo-400 shrink-0 font-bold">•</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Corporate Report Printable Layout (Pixel-Perfect layout for window.print()) */}
      {analysis && (
        <div className="hidden print:block text-slate-900 bg-white p-8 max-w-4xl mx-auto space-y-8 text-left" id="placement-ai-printable-cert">
          <div className="flex justify-between items-center border-b-2 border-indigo-600 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold font-sans text-indigo-900 tracking-tight">PlacementAI</h1>
              <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">OFFICIAL RECRUITMENT SIMULATOR CREDENTIAL</p>
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-slate-500">DATE: {new Date().toLocaleDateString()}</span>
              <span className="block text-xs font-bold text-slate-500">CANDIDATE ID: {email.split('@')[0].toUpperCase()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold font-sans text-slate-800">1. Placement Diagnostics Certificate</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              This credential certifies that candidate <b>{email}</b> has completed the campus recruitment simulated curriculum of PlacementAI. Based on performance across multiple AI-Moderated recruitment tests, candidate overall score has been graded as:
            </p>
            <div className="p-4 bg-slate-50 border rounded-xl flex justify-between items-center">
              <div>
                <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase">CUMULATIVE RECRUITER SCORE</span>
                <span className="text-3xl font-black font-mono text-indigo-600">{averageScore}%</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase">DIAGNOSTIC CATEGORY</span>
                <span className="text-sm font-bold text-slate-800">{analysis.readinessLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase border-b pb-1">Strengths Demonstrated</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {analysis.strengths.map((str, i) => <li key={i}>{str}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase border-b pb-1">Key Action Recommendations</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {analysis.weaknesses.map((weak, i) => <li key={i}>{weak}</li>)}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase border-b pb-1">Placement Round Scores Breakdown</h3>
            <table className="w-full border text-xs">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-2 text-left font-bold text-slate-600">Placement Round Stage</th>
                  <th className="p-2 text-center font-bold text-slate-600">Assigned Score</th>
                  <th className="p-2 text-left font-bold text-slate-600 font-mono">Assigned Feedback Summary</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r, i) => {
                  const scoreObj = scores[r.id];
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2 font-semibold text-slate-800">{r.label}</td>
                      <td className="p-2 text-center font-bold font-mono text-indigo-600">{scoreObj ? `${scoreObj.score}%` : 'N/A'}</td>
                      <td className="p-2 text-slate-500 text-[11px]">{scoreObj?.feedback || 'Stage pending candidate participation.'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-12 flex justify-between items-end">
            <div className="border-t border-slate-300 pt-2 w-48 text-center">
              <span className="block text-xs font-bold text-slate-800">PlacementAI Certifier</span>
              <span className="block text-[9px] text-slate-400 font-mono font-medium">AUTHORIZED SYSTEM SEAL</span>
            </div>
            <div className="border-t border-slate-300 pt-2 w-48 text-center">
              <span className="block text-xs font-bold text-slate-800">Campus Officer</span>
              <span className="block text-[9px] text-slate-400 font-mono font-medium">SIGNATURE BLOCK</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
