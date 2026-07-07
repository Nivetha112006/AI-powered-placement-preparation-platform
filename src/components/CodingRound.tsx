import React, { useState, useEffect } from 'react';
import { Play, Send, RefreshCw, Terminal, CheckCircle2, AlertCircle, Cpu, HardDrive, ArrowRight } from 'lucide-react';
import { CodingProblem } from '../types';

interface CodingRoundProps {
  email: string;
  onRoundComplete: (score: number) => void;
  onNavigateToNextRound?: () => void;
  id?: string;
}

export function CodingRound({ email, onRoundComplete, onNavigateToNextRound, id = 'coding-round' }: CodingRoundProps) {
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [language, setLanguage] = useState<'javascript' | 'python' | 'cpp' | 'java'>('javascript');
  const [code, setCode] = useState('');
  const [outputConsole, setOutputConsole] = useState<string>('Console ready. Write code and press "Run Code".');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metrics, setMetrics] = useState<{ time?: number; memory?: number; status?: string } | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchProblems(false);
  }, [email]);

  const fetchProblems = async (forceReset = false) => {
    try {
      const res = await fetch(`/api/rounds/coding/problems?email=${encodeURIComponent(email)}&reset=${forceReset}`);
      let data = [];
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (!res.ok) {
          throw new Error(`Server returned error status ${res.status}.`);
        }
        throw jsonErr;
      }
      setProblems(data);
      if (data.length > 0) {
        const activeIdx = forceReset ? 0 : (activeProblemIdx < data.length ? activeProblemIdx : 0);
        setActiveProblemIdx(activeIdx);
        setCode(data[activeIdx].starterCode[language] || data[activeIdx].starterCode.javascript);
        if (forceReset) {
          setOutputConsole('New set of dynamic coding questions loaded. Select a task to begin!');
          setMetrics(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProblemChange = (idx: number) => {
    setActiveProblemIdx(idx);
    const prob = problems[idx];
    if (prob) {
      // Restore previous submission code if exists, otherwise starter code
      const prevSub = submissionHistory[prob.id];
      if (prevSub) {
        setCode(prevSub.code);
        setLanguage(prevSub.language);
      } else {
        setCode(prob.starterCode[language]);
      }
    }
    setOutputConsole('Console ready. Write code and press "Run Code".');
    setMetrics(null);
  };

  const handleLanguageChange = (lang: 'javascript' | 'python' | 'cpp' | 'java') => {
    setLanguage(lang);
    const prob = problems[activeProblemIdx];
    if (prob) {
      setCode(prob.starterCode[lang]);
    }
    setMetrics(null);
  };

  const handleResetCode = () => {
    const prob = problems[activeProblemIdx];
    if (prob) {
      setCode(prob.starterCode[language]);
      setOutputConsole('Code reset completed.');
      setMetrics(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const pairs: Record<string, string> = {
      '(': ')',
      '{': '}',
      '[': ']',
      '"': '"',
      "'": "'",
      '`': '`'
    };

    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    // Handle Tab key to insert 4 spaces and retain focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabSpaces = '    '; // 4 spaces
      const newVal = val.substring(0, start) + tabSpaces + val.substring(end);
      setCode(newVal);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSpaces.length;
      }, 0);
      return;
    }

    // Handle Enter key to automatically maintain leading indentation (line alignment)
    if (e.key === 'Enter') {
      e.preventDefault();
      const linesBefore = val.substring(0, start).split('\n');
      const currentLine = linesBefore[linesBefore.length - 1];
      const match = currentLine.match(/^(\s*)/);
      const indentation = match ? match[1] : '';

      const newVal = val.substring(0, start) + '\n' + indentation + val.substring(end);
      setCode(newVal);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indentation.length;
      }, 0);
      return;
    }

    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closingChar = pairs[e.key];

      // Insert both brackets and position selection cursor in between
      const newVal = val.substring(0, start) + e.key + closingChar + val.substring(end);
      setCode(newVal);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  const handleRunCode = async () => {
    const prob = problems[activeProblemIdx];
    if (!prob) return;

    setRunning(true);
    setOutputConsole('Compiling solution...\nExecuting on Sample Test Cases...');
    setMetrics(null);

    try {
      const res = await fetch('/api/rounds/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, problemId: prob.id, language, code })
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
      if (!data || !data.submission) {
        throw new Error(data?.error || 'Invalid compiler response received.');
      }
      const sub = data.submission;
      setMetrics({
        time: sub.executionTimeMs,
        memory: sub.memoryUsageKb,
        status: sub.status
      });

      setSubmissionHistory(prev => ({ ...prev, [prob.id]: sub }));
      setOutputConsole(`DRY RUN RESULT: ${sub.status}\n\n${sub.outputLog}\nExecution Time: ${sub.executionTimeMs}ms\nMemory Usage: ${(sub.memoryUsageKb / 1024).toFixed(2)}MB`);
    } catch (err: any) {
      console.error(err);
      setOutputConsole(`Compilation error: ${err.message || 'local sandbox execution exception.'}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    const prob = problems[activeProblemIdx];
    if (!prob) return;

    setSubmitting(true);
    setOutputConsole('Submitting solution to corporate grading compiler...\nEvaluating edge cases and efficiency...');

    try {
      const res = await fetch('/api/rounds/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, problemId: prob.id, language, code })
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
      if (!data || !data.submission) {
        throw new Error(data?.error || 'Invalid compiler response received.');
      }
      const sub = data.submission;
      setMetrics({
        time: sub.executionTimeMs,
        memory: sub.memoryUsageKb,
        status: sub.status
      });

      setSubmissionHistory(prev => ({ ...prev, [prob.id]: sub }));
      setOutputConsole(`SUBMISSION RESULT: ${sub.status}\n\n${sub.outputLog}\nExecution Time: ${sub.executionTimeMs}ms\nMemory Usage: ${(sub.memoryUsageKb / 1024).toFixed(2)}MB`);
      
      onRoundComplete(data.totalCodingScore);
    } catch (err: any) {
      console.error(err);
      setOutputConsole(`Grading platform compilation error: ${err.message || 'local sandbox execution exception.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentProblem = problems[activeProblemIdx];

  return (
    <div className="space-y-6" id={id}>
      {/* Round Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-tight">
            Round 2: Coding Assessment
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Solve exactly 3 MNC-style core algorithmic challenges. Code efficiency directly affects placement scores.
          </p>
        </div>

        {onNavigateToNextRound && (
          <button
            onClick={onNavigateToNextRound}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold tracking-wider uppercase shadow-md transition-all cursor-pointer"
            id="next-section-btn"
          >
            <span>Proceed to Technical Round</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
        <div>
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">TASK NAVIGATOR</span>
          <p className="text-xs text-zinc-300 mt-0.5">Switch between tasks or shuffle questions to get a brand new set of challenges.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to shuffle and load 3 brand-new coding questions? Your current code progress on this active set will be reset.")) {
                fetchProblems(true);
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-indigo-400 hover:text-indigo-300 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer"
            id="shuffle-coding-questions-btn"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin-slow text-indigo-400" />
            <span>Shuffle Questions</span>
          </button>

          {/* Problem Navigator tabs */}
          <div className="flex space-x-1 bg-zinc-950 border border-zinc-850 p-1 rounded-xl" id="problem-selector">
          {problems.map((p, idx) => {
            const hasSub = submissionHistory[p.id];
            const isAccepted = hasSub?.status === 'Accepted';

            return (
              <button
                key={p.id}
                onClick={() => handleProblemChange(idx)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  activeProblemIdx === idx
                    ? 'bg-zinc-900 text-indigo-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                id={`problem-tab-${p.id}`}
              >
                <span>Task {idx + 1}</span>
                {hasSub && (
                  isAccepted 
                    ? <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    : <AlertCircle className="h-3 w-3 text-rose-400" />
                )}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {currentProblem ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left panel: Problem description */}
          <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-indigo-950/50 border border-indigo-900/50 text-indigo-400 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                  {currentProblem.topic}
                </span>
                <span className={`px-2 py-0.5 border rounded text-[9px] font-semibold font-sans uppercase tracking-wider ${
                  currentProblem.difficulty === 'Easy' ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400' : 'bg-amber-950/50 border-amber-900/50 text-amber-400'
                }`}>
                  {currentProblem.difficulty}
                </span>
              </div>

              <h3 className="text-base font-bold text-zinc-100 font-sans">
                {currentProblem.title}
              </h3>

              <div className="text-xs text-zinc-300 space-y-2 leading-relaxed font-sans">
                {/* Parse descriptive text format */}
                {currentProblem.description.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Sample cases */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase font-mono">Sample Cases</h4>
                <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800/80 space-y-2">
                  <div className="text-xs">
                    <span className="block text-[8px] text-zinc-500 font-mono tracking-wider uppercase">SAMPLE INPUT</span>
                    <code className="text-zinc-300 font-mono text-[11px] font-semibold">{currentProblem.sampleInput}</code>
                  </div>
                  <div className="text-xs">
                    <span className="block text-[8px] text-zinc-500 font-mono tracking-wider uppercase">SAMPLE OUTPUT</span>
                    <code className="text-zinc-300 font-mono text-[11px] font-semibold">{currentProblem.sampleOutput}</code>
                  </div>
                </div>
              </div>

              {/* Constraints */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase font-mono">Constraints</h4>
                <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-0.5 font-sans leading-relaxed">
                  {currentProblem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Submission Stats */}
            {metrics && (
              <div className="mt-4 p-4 bg-zinc-950 border border-zinc-850 rounded-xl grid grid-cols-2 gap-3" id="grading-metrics-panel">
                <div className="flex items-center space-x-2 text-xs">
                  <Cpu className="h-4 w-4 text-indigo-400" />
                  <div>
                    <span className="block text-[9px] text-zinc-500 font-mono">EXEC TIME</span>
                    <span className="font-bold text-zinc-200 font-mono">{metrics.time} ms</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <HardDrive className="h-4 w-4 text-indigo-400" />
                  <div>
                    <span className="block text-[9px] text-zinc-500 font-mono">MEMORY CONSUMED</span>
                    <span className="font-bold text-zinc-200 font-mono">{((metrics.memory || 0) / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Live Integrated Code Editor */}
          <div className="lg:col-span-7 flex flex-col justify-between border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 text-white min-h-[460px]">
            {/* Editor Top Control Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800/80" id="editor-control">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wide">
                MAIN_SOURCE_CODE
              </span>

              {/* Language switcher */}
              <div className="flex items-center space-x-2">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  id="editor-language-select"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ 17</option>
                  <option value="java">Java 11</option>
                </select>

                <button
                  onClick={handleResetCode}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors cursor-pointer"
                  title="Reset to starter templates"
                  id="editor-reset-btn"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Editable code text box */}
            <div className="flex-grow flex items-stretch min-h-[250px]">
              {/* Line Numbers column */}
              <div className="w-10 bg-zinc-950 text-right pr-2 select-none py-4 border-r border-zinc-850 text-[10px] font-mono font-semibold text-zinc-600">
                {Array.from({ length: Math.max(12, code.split('\n').length) }).map((_, i) => (
                  <span key={i} className="block leading-5">{i + 1}</span>
                ))}
              </div>

              {/* Code TextArea */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow bg-transparent p-4 text-[12px] font-mono leading-5 text-zinc-200 focus:outline-none resize-none font-medium"
                placeholder="// Write your code solution here..."
                id="editor-textarea"
              />
            </div>

            {/* Console Logger Display */}
            <div className="bg-zinc-900 border-t border-zinc-850 p-4" id="editor-console">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  <span>GRADES & CONSOLE LOGGER</span>
                </div>
                {submissionHistory[currentProblem.id] && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    submissionHistory[currentProblem.id].status === 'Accepted'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
                      : 'bg-rose-950 text-rose-400 border border-rose-900/50'
                  }`}>
                    {submissionHistory[currentProblem.id].status} ({submissionHistory[currentProblem.id].testCasesPassed ?? 0}/{submissionHistory[currentProblem.id].testCasesTotal ?? 3} Passed)
                  </span>
                )}
              </div>

              {/* Rich compiler output details */}
              {submissionHistory[currentProblem.id] ? (
                <div className="space-y-3 max-h-48 overflow-y-auto text-left" id="compiler-output-details">
                  {/* Compiler / Interpreter Log */}
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850">
                    <span className="block text-[8px] text-zinc-500 font-mono tracking-wider uppercase">Compilation & Runtime Log</span>
                    <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap mt-1">
                      {submissionHistory[currentProblem.id].outputLog || 'Compilation successful.'}
                    </pre>
                  </div>

                  {/* Individual Test Cases List */}
                  {submissionHistory[currentProblem.id].testCaseDetails && submissionHistory[currentProblem.id].testCaseDetails.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[8px] text-zinc-500 font-mono tracking-wider uppercase">Test Case Executions</span>
                      <div className="grid grid-cols-1 gap-2">
                        {submissionHistory[currentProblem.id].testCaseDetails.map((tc: any, tcIdx: number) => (
                          <div key={tcIdx} className={`p-2.5 rounded border text-xs font-mono flex flex-col space-y-1.5 ${
                            tc.passed 
                              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
                              : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px]">Test Case {tcIdx + 1} {tc.isHidden && '(Hidden Edge Case)'}</span>
                              <span className={`text-[10px] uppercase font-bold ${tc.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {tc.passed ? '● Passed' : '✕ Failed'}
                              </span>
                            </div>
                            {!tc.isHidden ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] bg-zinc-950/50 p-1.5 rounded">
                                <div>
                                  <span className="text-zinc-500 block">INPUT</span>
                                  <span className="text-zinc-300 break-all">{tc.input}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">EXPECTED</span>
                                  <span className="text-zinc-300 break-all">{tc.expected}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">ACTUAL</span>
                                  <span className={tc.passed ? 'text-emerald-400' : 'text-rose-400 break-all'}>{tc.actual}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-zinc-400 italic px-1.5 py-0.5 bg-zinc-950/30 rounded">
                                Inputs and outputs are hidden to prevent hardcoding. Evaluated against enterprise efficiency benchmarks.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <pre className="text-[11px] font-mono text-zinc-350 bg-zinc-950 p-2 rounded border border-zinc-850 max-h-24 overflow-y-auto text-left">
                  {outputConsole}
                </pre>
              )}
            </div>

            {/* Editor Action buttons */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-t border-zinc-850" id="editor-actions">
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">
                AUTOSAVED SECURELY
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRunCode}
                  disabled={running || submitting}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 disabled:bg-zinc-950 text-zinc-350 border border-zinc-800 rounded-lg text-xs font-bold tracking-wider uppercase shadow-sm transition-colors cursor-pointer"
                  id="editor-run-btn"
                >
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{running ? 'Executing...' : 'Run Code'}</span>
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={running || submitting}
                  className="flex items-center space-x-1.5 px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold tracking-wider uppercase shadow-sm transition-colors cursor-pointer"
                  id="editor-submit-btn"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Evaluating...' : 'Submit Code'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500">
          Loading coding assessment environment...
        </div>
      )}
    </div>
  );
}
