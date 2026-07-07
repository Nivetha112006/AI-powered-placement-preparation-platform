import { useState, useEffect, useRef } from 'react';
import { Timer, HelpCircle, ArrowRight, CheckCircle2, XCircle, RefreshCw, Lock, Play, Pause, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AptitudeQuestion } from '../types';

interface AptitudeRoundProps {
  email: string;
  onRoundComplete: (score: number) => void;
  onNavigateToNextRound?: () => void;
  allRoundsCompleted?: boolean;
  id?: string;
}

export function AptitudeRound({ email, onRoundComplete, onNavigateToNextRound, allRoundsCompleted = false, id = 'aptitude-round' }: AptitudeRoundProps) {
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Test navigation and state
  const [testStarted, setTestStarted] = useState(false);
  const [testPaused, setTestPaused] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Timer state - 1 minute per question (computed dynamically based on questions.length)
  const [timeLeft, setTimeLeft] = useState(1200); 
  const [timerActive, setTimerActive] = useState(false);

  // Fetch questions on component mount without resetting (preserves stable questions during active session)
  useEffect(() => {
    fetchQuestions(false);
  }, [email]);

  // Handle active countdown timer
  useEffect(() => {
    if (!timerActive || submitted || !testStarted || testPaused) return;
    
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerActive, submitted, testStarted, testPaused]);

  // Page visibility API & Window Focus: pause the timer and hide the questions if the user switches tabs, minimizes the window, or clicks out of the window
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testStarted && !submitted) {
        setTestPaused(true);
        setTimerActive(false);
      }
    };

    const handleWindowBlur = () => {
      if (testStarted && !submitted) {
        setTestPaused(true);
        setTimerActive(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [testStarted, submitted]);

  const fetchQuestions = async (forceReset = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rounds/aptitude/questions?email=${encodeURIComponent(email)}&reset=${forceReset}`);
      let data = [];
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (!res.ok) {
          throw new Error(`Server returned error status ${res.status}.`);
        }
        throw jsonErr;
      }
      setQuestions(data);
      setAnswers({});
      setSubmitted(false);
      setScore(null);
      setTestStarted(false);
      setTestPaused(false);
      setActiveQuestionIdx(0);
      
      // Timing is dynamically based on number of questions (exactly 1 minute / 60 seconds per question)
      const calculatedTime = data.length > 0 ? data.length * 60 : 1200;
      setTimeLeft(calculatedTime);
      setTimerActive(false); // Paused initially (not visible/started yet)
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setTimerActive(true);
    setTestPaused(false);
  };

  const togglePause = () => {
    setTestPaused(prev => {
      const nextState = !prev;
      setTimerActive(!nextState);
      return nextState;
    });
  };

  const selectOption = (qId: string, optIdx: number) => {
    if (submitted || testPaused) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleAutoSubmit = () => {
    setTimerActive(false);
    handleSubmit();
  };

  const handleSubmit = async () => {
    setTimerActive(false);
    setLoading(true);

    try {
      const res = await fetch('/api/rounds/aptitude/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answers })
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
      setSubmitted(true);
      setScore(data.score);
      setFeedback(data.feedback);
      setDetails(data.details);
      onRoundComplete(data.score);
      
      // Automatically navigate after a small delay to keep UX smooth
      if (onNavigateToNextRound) {
        setTimeout(() => {
          onNavigateToNextRound();
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentQuestion = questions[activeQuestionIdx];

  return (
    <div className="space-y-6" id={id}>
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-tight">
            Round 1: Analytical & Reasoning Assessment
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Comprehensive testing suite covering Quantitative, Logical, Analytical, and Verbal Ability skills.
          </p>
        </div>

        {/* Timer Banner (ticks ONLY when test is started, not paused, and questions are visible) */}
        {testStarted && !submitted && (
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePause}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-xl font-mono text-[10px] font-bold tracking-wider transition-colors uppercase ${
                testPaused
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400 animate-pulse'
                  : 'bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900 text-zinc-400'
              }`}
              title={testPaused ? "Resume Assessment" : "Pause Assessment"}
            >
              {testPaused ? (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>RESUME TEST</span>
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3 fill-current" />
                  <span>PAUSE TEST</span>
                </>
              )}
            </button>

            <div className={`flex items-center space-x-2 px-4 py-2 border rounded-xl font-mono text-xs font-bold transition-all ${
              testPaused 
                ? 'bg-zinc-950/60 border-zinc-850 text-zinc-500' 
                : timeLeft < 120 
                  ? 'bg-rose-950/20 text-rose-400 border-rose-900/40' 
                  : 'bg-indigo-950/20 text-indigo-400 border-indigo-900/40'
            }`}>
              <Timer className={`h-4 w-4 ${!testPaused && 'animate-pulse'}`} />
              <span>TIME REMAINING: {formatTime(timeLeft)}</span>
            </div>
          </div>
        )}
      </div>

      {loading && questions.length === 0 ? (
        <div className="py-24 text-center text-zinc-400 font-sans text-xs flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
          <span>Generating high-quality dynamic aptitude assessment questions...</span>
        </div>
      ) : !testStarted && !submitted ? (
        /* Welcome / Instruction Screen (Questions not visible yet, timer paused) */
        <div className="max-w-2xl mx-auto bg-zinc-950/80 border border-zinc-850 rounded-2xl p-8 text-left space-y-6 shadow-xl backdrop-blur-md" id="aptitude-welcome-screen">
          <div className="flex items-center space-x-3.5 border-b border-zinc-850 pb-4">
            <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
              <HelpCircle className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-lg font-serif text-white font-medium">Ready to begin your Assessment?</h3>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">MNC hiring standard suite</p>
            </div>
          </div>

          <div className="space-y-4 font-sans text-zinc-300 text-xs leading-relaxed">
            <p>
              This customized aptitude round consists of <span className="text-white font-bold">{questions.length} dynamic, non-shuffled questions</span> perfectly tailored to test your comprehensive intellectual boundaries.
            </p>

            <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-4.5 space-y-3">
              <h4 className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider uppercase">GUIDELINES & RECRUITMENT RULES:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong className="text-zinc-200">Dynamic Question Bank:</strong> Generates unique questions matching top-tier technical placement standards.</li>
                <li><strong className="text-indigo-400">Smart Timer:</strong> You have exactly <strong className="text-indigo-400 font-mono text-xs">{questions.length} minutes</strong> (1 minute per question). The timer ticks <strong className="underline">only while questions are active and visible</strong> on your screen.</li>
                <li><strong className="text-zinc-200">Auto-Pause:</strong> If you pause the test or switch to another browser tab, the questions will be safely hidden and the timer will instantly suspend.</li>
                <li><strong className="text-zinc-200">Automatic Save:</strong> In case the timer runs out completely, all current answers will be automatically finalized and graded.</li>
              </ul>
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all cursor-pointer"
            id="start-assessment-btn"
          >
            <span>Start Assessment</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Active Test / Results Screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question Viewer Frame */}
          <div className="lg:col-span-8 relative min-h-[400px]">
            {testPaused && !submitted ? (
              /* Pause Screen Overlay (Question is strictly hidden, timer paused) */
              <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl flex flex-col items-center justify-center text-center p-8 min-h-[380px] space-y-4 backdrop-blur-sm animate-fade-in" id="test-paused-overlay">
                <div className="h-14 w-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400">
                  <AlertTriangle className="h-7 w-7 animate-bounce" />
                </div>
                <h3 className="text-xl font-serif text-white font-medium">Assessment Paused</h3>
                <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                  The questions have been hidden and the timer has been suspended to ensure fair play. Click below or resume whenever you are ready.
                </p>
                <button
                  onClick={() => {
                    setTestPaused(false);
                    setTimerActive(true);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  Resume Assessment
                </button>
              </div>
            ) : !submitted && currentQuestion ? (
              /* Active Single Question Presentation Frame */
              <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6 text-left space-y-6 shadow-sm min-h-[380px] flex flex-col justify-between">
                <div>
                  {/* Category Banner & Meta info */}
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-3.5 mb-5">
                    <span className="px-2.5 py-1 bg-indigo-950/40 border border-indigo-900/50 text-indigo-400 rounded-lg text-[9px] font-bold uppercase tracking-widest font-mono">
                      {currentQuestion.topic} Aptitude
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Question {activeQuestionIdx + 1} of {questions.length}
                      </span>
                      <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-semibold font-sans uppercase tracking-wider ${
                        currentQuestion.difficulty === 'Easy' ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400' :
                        currentQuestion.difficulty === 'Medium' ? 'bg-amber-950/50 border-amber-900/50 text-amber-400' : 'bg-rose-950/50 border-rose-900/50 text-rose-400'
                      }`}>
                        {currentQuestion.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-start space-x-2 font-sans leading-relaxed">
                      <span className="text-indigo-400 font-mono select-none">Q{activeQuestionIdx + 1}.</span>
                      <span>{currentQuestion.question}</span>
                    </h3>

                    {/* Options Selection block */}
                    <div className="mt-6 grid grid-cols-1 gap-3" id={`options-container-${currentQuestion.id}`}>
                      {currentQuestion.options.map((opt, oIdx) => {
                        const isSelected = answers[currentQuestion.id] === oIdx;
                        let optionStyle = 'border-zinc-850 bg-zinc-900/10 text-zinc-300 hover:bg-zinc-900/40 hover:border-zinc-800';
                        if (isSelected) {
                          optionStyle = 'border-indigo-500 bg-indigo-950/30 text-indigo-300 font-semibold ring-1 ring-indigo-950/20';
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => selectOption(currentQuestion.id, oIdx)}
                            className={`w-full text-left px-4 py-3.5 border rounded-xl text-xs transition-all ${optionStyle} cursor-pointer`}
                            id={`opt-${oIdx}`}
                          >
                            <span className="font-mono font-bold mr-3.5 uppercase text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation Toolbar inside Active card */}
                <div className="flex items-center justify-between border-t border-zinc-850 pt-5 mt-6">
                  <button
                    onClick={() => setActiveQuestionIdx(prev => Math.max(0, prev - 1))}
                    disabled={activeQuestionIdx === 0}
                    className="flex items-center space-x-1 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold tracking-wider transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>PREVIOUS</span>
                  </button>

                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:block">
                    {answers[currentQuestion.id] !== undefined ? (
                      <span className="text-emerald-400 font-bold">● Answer Saved</span>
                    ) : (
                      <span className="text-amber-500/80">○ Unanswered</span>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={activeQuestionIdx === questions.length - 1}
                    className="flex items-center space-x-1 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold tracking-wider transition-colors cursor-pointer"
                  >
                    <span>NEXT</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {submitted && (
              /* Review Mode - List of graded questions for training feedback */
              <div className="space-y-6" id="aptitude-review-cards">
                <div className="bg-zinc-950/60 border border-zinc-850 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-widest">Graded Answers Sheet</span>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                    COMPLETED
                  </span>
                </div>

                {questions.map((q, qIdx) => {
                  const selectedIdx = answers[q.id];
                  const isCorrectResult = details.find(d => d.questionId === q.id);

                  return (
                    <div
                      key={q.id}
                      className={`bg-zinc-900/30 border rounded-2xl p-5 text-left space-y-4 ${
                        isCorrectResult?.isCorrect
                          ? 'border-emerald-900/40 bg-emerald-950/5'
                          : 'border-rose-900/40 bg-rose-950/5'
                      }`}
                      id={`graded-q-${q.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
                          {q.topic} Aptitude
                        </span>
                        <span className={`text-[10px] font-bold font-mono ${
                          isCorrectResult?.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isCorrectResult?.isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-zinc-200">
                        Q{qIdx + 1}. {q.question}
                      </h4>

                      {/* Display Selected Option */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className={`p-3 rounded-xl border ${
                          isCorrectResult?.isCorrect 
                            ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300' 
                            : 'bg-rose-950/30 border-rose-900/40 text-rose-300'
                        }`}>
                          <span className="font-mono font-bold mr-2 uppercase text-zinc-400">Your Choice:</span>
                          {selectedIdx !== undefined ? q.options[selectedIdx] : 'No Answer Submitted'}
                        </div>

                        {!isCorrectResult?.isCorrect && (
                          <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl text-zinc-400">
                            <span className="font-mono font-bold mr-2 text-emerald-400 uppercase">Correct Answer:</span>
                            {q.options[q.correctOptionIndex]}
                          </div>
                        )}
                      </div>

                      {/* Step-by-Step Mathematical Explanation */}
                      <div className="p-4 bg-zinc-950/80 border border-zinc-850 rounded-xl space-y-1.5 font-sans">
                        <h5 className="text-[10px] font-bold text-zinc-400 uppercase font-mono tracking-wider">Step-by-Step Explanation:</h5>
                        <p className="text-xs text-zinc-300 leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MNC Sidebar Control Center & Sidebar Navigation Grid */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              {/* Question Navigation Map Sidebar (visible ONLY when test is started and active) */}
              {testStarted && !submitted && (
                <div className="bg-zinc-950/80 border border-zinc-850 rounded-2xl p-5 shadow-sm space-y-4 text-left">
                  <h3 className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider uppercase border-b border-zinc-800 pb-2 flex justify-between items-center">
                    <span>Aptitude Navigation Map</span>
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                      GRID
                    </span>
                  </h3>

                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                    Quickly jump between problems. Blue items have saved selections.
                  </p>

                  {/* 4x5 or 5x4 Grid for fast navigation */}
                  <div className="grid grid-cols-5 gap-2" id="navigation-grid-map">
                    {questions.map((q, idx) => {
                      const isAnswered = answers[q.id] !== undefined;
                      const isActive = activeQuestionIdx === idx;
                      
                      let gridStyle = 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900';
                      if (isActive) {
                        gridStyle = 'border-indigo-500 text-indigo-300 bg-indigo-950/20 ring-1 ring-indigo-500/40 font-bold';
                      } else if (isAnswered) {
                        gridStyle = 'border-indigo-950 bg-indigo-600 hover:bg-indigo-700 text-white font-bold';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            if (!testPaused) {
                              setActiveQuestionIdx(idx);
                            }
                          }}
                          className={`h-9 w-full rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${gridStyle}`}
                          title={`Question ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center space-x-4 pt-2.5 text-[9px] font-mono text-zinc-400 border-t border-zinc-850">
                    <div className="flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-600 block"></span>
                      <span>Answered ({Object.keys(answers).length})</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-zinc-900 border border-zinc-800 block"></span>
                      <span>Unanswered ({questions.length - Object.keys(answers).length})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* General Control Center Card */}
              <div className="bg-zinc-950/80 border border-zinc-850 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider uppercase border-b border-zinc-850 pb-2">
                  Assessment Controls
                </h3>

                {!submitted ? (
                  <div className="space-y-4 text-left">
                    <div className="p-4 bg-zinc-900/30 border border-zinc-850 rounded-xl">
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        Make sure you review your analytical calculations before submission. The system automatically saves and grades your results at timeout.
                      </p>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase flex justify-between">
                      <span>ANSWERS IN POOL:</span>
                      <span className="text-zinc-200 font-bold font-mono">{Object.keys(answers).length} / {questions.length}</span>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={loading || !testStarted}
                      className="w-full flex items-center justify-center space-x-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-900 disabled:text-zinc-500 disabled:border disabled:border-zinc-800 border border-transparent text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-md transition-all cursor-pointer"
                      id="submit-answers-btn"
                    >
                      <span>Submit Aptitude Exam</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5 text-left" id="aptitude-results-panel">
                    {/* Score feedback display */}
                    <div className="flex items-center space-x-4 pb-4 border-b border-zinc-800">
                      <div className={`h-14 w-14 flex items-center justify-center rounded-full border-2 font-bold font-mono text-sm ${
                        (score || 0) >= 70 ? 'border-emerald-500/80 text-emerald-400 bg-emerald-950/20' : 'border-rose-500/80 text-rose-400 bg-rose-950/20'
                      }`}>
                        {score}%
                      </div>
                      <div>
                        <h4 className="text-[9px] font-bold text-zinc-500 font-mono tracking-wider uppercase">ROUND GRADIENT SCORE</h4>
                        <p className="text-xs font-semibold font-serif text-zinc-100">{feedback}</p>
                      </div>
                    </div>

                    {/* Performance metrics */}
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider">GRADED STATS</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                        <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-850">
                          <span className="block text-zinc-500 text-[9px] font-mono tracking-wider uppercase">CORRECT</span>
                          <span className="text-emerald-400 font-bold font-mono text-base">
                            {details.filter(d => d.isCorrect).length}
                          </span>
                        </div>
                        <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-850">
                          <span className="block text-zinc-500 text-[9px] font-mono tracking-wider uppercase">INCORRECT</span>
                          <span className="text-rose-400 font-bold font-mono text-base">
                            {details.filter(d => !d.isCorrect).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!allRoundsCompleted && (
                      <div className="p-3 bg-zinc-900/20 border border-zinc-850 rounded-xl space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-amber-500">
                          <Lock className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold font-mono tracking-wider uppercase">SOLUTIONS UNLOCKED</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                          Correct answers and dynamic explanations are visible now below the graded question sheet for your placement preparation review.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => fetchQuestions(true)}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-300 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                      id="practice-new-questions-btn"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Practice New Questions</span>
                    </button>

                    {onNavigateToNextRound && (
                      <button
                        onClick={onNavigateToNextRound}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-md transition-all cursor-pointer"
                        id="next-section-btn"
                      >
                        <span>Proceed to Coding Round</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
