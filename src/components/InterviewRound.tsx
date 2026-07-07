import { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Mic, MicOff, MessageSquare, Loader2, Play, AlertCircle, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { InterviewMessage } from '../types';

interface InterviewRoundProps {
  email: string;
  roundType: 'technical' | 'hr';
  scores?: any;
  onRoundComplete: (score: number) => void;
  onNavigateToNextRound?: () => void;
  id?: string;
}

export function InterviewRound({ email, roundType, scores, onRoundComplete, onNavigateToNextRound, id = 'interview-round' }: InterviewRoundProps) {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  
  // Voice integration states
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Use refs to avoid stale state closures inside Web Speech API callbacks
  const messagesRef = useRef<InterviewMessage[]>([]);
  const submittingRef = useRef<boolean>(false);
  const evaluatedRef = useRef<boolean>(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    evaluatedRef.current = evaluated;
  }, [evaluated]);

  useEffect(() => {
    if (scores && scores[roundType]) {
      setEvaluated(true);
      setEvaluation({
        score: scores[roundType].score,
        feedback: scores[roundType].feedback
      });
    } else {
      setEvaluated(false);
      setEvaluation(null);
    }
  }, [scores, roundType]);

  useEffect(() => {
    // Reset state for new round type
    setMessages([]);
    setInputText('');
    setSpeechError(null);
    
    // Welcome message trigger
    initiateInterview();

    // Initialize Web Speech API Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setIsRecording(false);
        setSpeechError(null);
        if (transcript.trim()) {
          // Deliver the speech transcript directly to the AI
          sendMessageText(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech error:', e.error);
        setIsRecording(false);
        if (e.error === 'not-allowed') {
          setSpeechError('Microphone permission denied.');
        } else {
          setSpeechError('Failed to capture speech. Please speak clearly.');
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, [roundType]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initiateInterview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/rounds/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          sessionType: roundType,
          messages: [] // Empty initiates the greeting
        })
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
      setMessages(data.chatLog || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessageText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || submittingRef.current || evaluatedRef.current) return;

    const userMsg: InterviewMessage = {
      id: 'msg_cand_' + Date.now(),
      sender: 'candidate',
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    const updatedLog = [...messagesRef.current, userMsg];
    setMessages(updatedLog);
    setInputText('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/rounds/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          sessionType: roundType,
          messages: updatedLog
        })
      });

      const data = res.ok ? await res.json() : null;

      if (data && data.chatLog) {
        setMessages(data.chatLog);
      } else {
        const errorMsg = data?.error || 'Server error occurred.';
        setSpeechError(`Error: ${errorMsg}`);
        setMessages(prev => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            sender: 'interviewer',
            text: `⚠️ [System Error] Unable to receive response from AI: ${errorMsg}. Please try resending your message.`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setSpeechError(`Network error: ${err.message}`);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'interviewer',
          text: `⚠️ [Network Error] Failed to connect: ${err.message}. Please check your internet connection or API key status.`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    await sendMessageText(inputText);
  };

  const handleResetInterview = async () => {
    if (!window.confirm('Are you sure you want to clear this interview history and start a brand-new practice session?')) {
      return;
    }
    setSubmitting(true);
    setMessages([]);
    setInputText('');
    setEvaluated(false);
    setEvaluation(null);
    setSpeechError(null);
    try {
      const res = await fetch('/api/rounds/interview/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sessionType: roundType })
      });
      if (res.ok) {
        onRoundComplete(0); // Trigger parent to fetch updated empty scores!
        await initiateInterview();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Speaks out text using Web Speech API synthesis
  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // professional pacing
      utterance.pitch = 1.0;
      
      // Select appropriate professional corporate voice if available
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith('en-'));
      if (engVoice) utterance.voice = engVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleVoiceRecord = () => {
    if (!recognitionRef.current) {
      setSpeechError('Web Speech Recognition API is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setSpeechError(null);
      setIsRecording(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
        setIsRecording(false);
      }
    }
  };

  const handleCompleteInterview = async () => {
    const candidateResponsesCount = messages.filter(m => m.sender === 'candidate').length;
    if (candidateResponsesCount < 5) {
      alert(`The PlacementAI system requires a minimum of 5 completed answers to perform a comprehensive placement evaluation. Currently, you have answered ${candidateResponsesCount}/5 questions. Please continue talking with the interviewer!`);
      return;
    }

    setLoadingEval(true);
    try {
      const res = await fetch('/api/rounds/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sessionType: roundType })
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
      setEvaluated(true);
      setEvaluation(data);
      onRoundComplete(data.score);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEval(false);
    }
  };

  return (
    <div className="space-y-6" id={id}>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-tight flex items-center space-x-2">
            <span>Round {roundType === 'technical' ? '3: Technical' : '5: HR'} Interview Simulation</span>
            <span className="p-1.5 bg-indigo-950/50 border border-indigo-900/50 text-indigo-400 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Gemini AI Agent
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {roundType === 'technical' 
              ? 'MNC-style technical check covering DSA, Software Design, and your uploaded projects.' 
              : 'Enterprise behavioral analysis covering leadership skills, STAR methodology, and culture fit.'}
          </p>
        </div>

        {!evaluated && (
          <button
            onClick={handleCompleteInterview}
            disabled={loadingEval || submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm transition-colors cursor-pointer"
            id="interview-complete-btn"
          >
            {loadingEval ? 'AI Grading Interview...' : 'Complete & Grade Round'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chat window */}
        <div className="lg:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col justify-between min-h-[480px] shadow-sm overflow-hidden">
          {/* Plain Professional Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-850">
            <div className="flex items-center space-x-3 text-left">
              <div className="relative">
                <div className="h-10 w-10 bg-indigo-950/50 border border-indigo-900/30 rounded-full flex items-center justify-center text-indigo-400 font-bold text-sm font-sans select-none">
                  {roundType === 'technical' ? 'TC' : 'HR'}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-100">
                  {roundType === 'technical' ? 'AI Technical Architect' : 'AI HR Director'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase hidden sm:inline bg-zinc-950 px-2 py-1 rounded-md border border-zinc-850">
                MNC Placement Simulation
              </span>
              <button
                onClick={handleResetInterview}
                disabled={submitting || evaluated}
                className="text-[10px] text-zinc-400 hover:text-rose-400 disabled:text-zinc-600 font-bold flex items-center space-x-1 uppercase tracking-wider font-mono bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Restart this interview from the beginning"
                id="reset-interview-chat-btn"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Round</span>
              </button>
            </div>
          </div>

          {/* Clean Solid Chat Area */}
          <div 
            className="flex-grow p-4 overflow-y-auto max-h-[380px] space-y-4 bg-zinc-900/20 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent" 
            id="interview-chat-history"
          >
            {messages.length === 0 ? (
              <div className="flex justify-center items-center h-full py-12">
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 text-center max-w-sm shadow-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">Loading AI Interviewer greeting...</p>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isInterviewer = m.sender === 'interviewer';
                const formattedTime = m.timestamp 
                  ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={m.id || idx}
                    className={`flex ${isInterviewer ? 'justify-start' : 'justify-end'} items-start space-x-2 text-left`}
                  >
                    {isInterviewer && (
                      <div className="h-8 w-8 bg-zinc-950 border border-zinc-850 rounded-full flex items-center justify-center text-indigo-400 text-[10px] font-bold font-mono select-none flex-shrink-0 mt-0.5">
                        AI
                      </div>
                    )}

                    <div 
                      className={`max-w-[78%] rounded-xl px-4 py-2.5 text-xs font-sans leading-relaxed relative shadow-sm ${
                        isInterviewer 
                          ? 'bg-zinc-950 text-zinc-200 rounded-tl-none border border-zinc-850'
                          : 'bg-indigo-650 text-white rounded-tr-none border border-indigo-600/30'
                      }`}
                    >
                      {/* Message Text */}
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      
                      {/* Meta Footer (Time only - No double checks) */}
                      <div className="mt-1.5 flex items-center justify-end space-x-1 text-[9px] text-zinc-500 select-none font-mono">
                        <span>{formattedTime}</span>
                      </div>

                      {/* TTS Speak assist for interviewer */}
                      {isInterviewer && (
                        <button
                          onClick={() => handleSpeakText(m.text)}
                          className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 uppercase tracking-wider font-mono cursor-pointer border border-zinc-850 hover:border-indigo-900/30 rounded-md px-1.5 py-0.5 bg-zinc-900/40 transition-all"
                          id={`speak-btn-${idx}`}
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Listen Out Loud</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Action Footer Inputs - Clean Flat Style */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-850">
            {speechError && (
              <div className="mb-2 px-3 py-1.5 bg-rose-950/40 border border-rose-900/40 text-rose-300 rounded-lg text-xs font-medium flex items-center space-x-1 font-sans animate-pulse">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span>{speechError}</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {/* Vocal Speak API input mic */}
              <button
                onClick={handleToggleVoiceRecord}
                disabled={evaluated || submitting}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isRecording 
                    ? 'bg-rose-600 border-rose-700 text-white animate-pulse'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
                title={isRecording ? 'Listening... click to complete.' : 'Microphone Vocal Speech-to-Text assistance.'}
                id="interview-mic-btn"
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                disabled={evaluated || submitting}
                placeholder={
                  evaluated 
                    ? 'Round complete. Results calculated.' 
                    : submitting
                      ? 'AI Interviewer is thinking...'
                      : isRecording 
                        ? 'Listening... Speak clearly now...' 
                        : 'Type your professional corporate response...'
                }
                className="flex-grow bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                id="interview-input-field"
              />

              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || evaluated || submitting}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-zinc-950 disabled:text-zinc-600 border border-indigo-900/40 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                id="interview-send-btn"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Evaluation Sidebar Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between text-left">
            <div>
              <h3 className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider uppercase mb-3 border-b border-zinc-800 pb-2">
                Evaluation Statistics
              </h3>

              {evaluated && evaluation ? (
                <div className="space-y-4" id="interview-eval-panel">
                  {/* Grade Score Bubble */}
                  <div className="flex items-center space-x-4 pb-4 border-b border-zinc-800">
                    <div className="h-14 w-14 flex items-center justify-center rounded-full border-2 border-emerald-900/80 text-emerald-400 bg-emerald-950/20 font-bold text-sm font-mono">
                      {evaluation.score}%
                    </div>
                    <div>
                      <h4 className="text-[9px] font-bold text-zinc-500 font-mono tracking-wider uppercase">PLACEMENT STATUS</h4>
                      <p className="text-xs font-semibold font-serif text-zinc-200">Round Completed Successfully</p>
                    </div>
                  </div>

                  {/* Feedback summary */}
                  <div className="space-y-2 bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
                    <div className="flex items-center space-x-1.5 text-zinc-300 font-bold text-xs font-mono tracking-wider uppercase">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Corporate Feedback:</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-2 font-sans">
                      {evaluation.feedback}
                    </p>
                  </div>

                  {onNavigateToNextRound && (
                    <button
                      onClick={onNavigateToNextRound}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold tracking-wider uppercase shadow-md transition-all cursor-pointer mt-3"
                      id="next-section-btn"
                    >
                      <span>Proceed to Next Section</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/50 rounded-xl">
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      {roundType === 'technical'
                        ? 'Ensure you explain data structures constraints clearly. Mention Big-O complexity calculations and real projects highlights.'
                        : 'Utilize the STAR framework structure to describe behavioral examples from your projects and academic career.'}
                    </p>
                  </div>
                  
                  <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                    CONVERSATION DEPTH: <span className="text-zinc-300 font-bold">{messages.filter(m => m.sender === 'candidate').length}</span> exchanges.
                  </div>
                </div>
              )}
            </div>

            {!evaluated && (
              <div className="pt-6">
                <button
                  onClick={handleCompleteInterview}
                  disabled={loadingEval || submitting}
                  className="w-full flex items-center justify-center py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-950 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm transition-colors cursor-pointer"
                  id="interview-evaluate-sidebar-btn"
                >
                  {loadingEval ? 'AI Grading Interview...' : 'Complete & Grade Round'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
