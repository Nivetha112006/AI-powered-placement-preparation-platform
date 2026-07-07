import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader2, Play, Users, Award, HelpCircle, ArrowRight, Mic, MicOff, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { GDMessage } from '../types';

interface GDRoundProps {
  email: string;
  onRoundComplete: (score: number) => void;
  onNavigateToNextRound?: () => void;
  id?: string;
}

export function GDRound({ email, onRoundComplete, onNavigateToNextRound, id = 'gd-round' }: GDRoundProps) {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [messages, setMessages] = useState<GDMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [typingParticipant, setTypingParticipant] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const recognitionRef = useRef<any>(null);
  const speechQueueRef = useRef<any[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const lastSpokenIndexRef = useRef<number>(-1);
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  useEffect(() => {
    // Initialize Web Speech API Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsRecording(true);
          setSpeechError(null);
          // Cancel ongoing speech synthesis when candidate starts recording to prevent feedback loop
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
          isSpeakingRef.current = false;
          speechQueueRef.current = [];
        };

        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setIsRecording(false);
          setSpeechError(null);
          if (transcript.trim()) {
            sendMessageText(transcript);
          }
        };

        rec.onerror = (e: any) => {
          console.error('Speech recognition error:', e);
          setIsRecording(false);
          if (e.error === 'not-allowed') {
            setSpeechError('Microphone access is blocked. Please enable permissions in your browser settings.');
          } else if (e.error === 'no-speech') {
            setSpeechError('No speech was detected. Please try again.');
          } else {
            setSpeechError('Speech recognition failed. Please try typing your response.');
          }
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error(e);
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakNext = () => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    if (isSpeakingRef.current) return;
    if (speechQueueRef.current.length === 0) return;

    const nextItem = speechQueueRef.current[0];
    if (!nextItem) return;

    isSpeakingRef.current = true;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(nextItem.text);
    const voices = window.speechSynthesis.getVoices();

    // Customize voice settings based on speaker persona to feel like a phone/mobile call
    if (nextItem.sender === 'moderator') {
      utterance.pitch = 0.95;
      utterance.rate = 0.95;
    } else if (nextItem.sender === 'pro') {
      utterance.pitch = 1.15; // Amit: enthusiastic pro stance
      utterance.rate = 1.05;
    } else if (nextItem.sender === 'con') {
      utterance.pitch = 0.85; // Priya: serious, clinical con stance
      utterance.rate = 0.9;
    } else if (nextItem.sender === 'neutral') {
      utterance.pitch = 1.0;  // Rohan: steady neutral analytical stance
      utterance.rate = 1.0;
    }

    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    if (enVoices.length > 0) {
      if (nextItem.sender === 'moderator') {
        const modVoice = enVoices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural')) || enVoices[0];
        utterance.voice = modVoice;
      } else if (nextItem.sender === 'pro') {
        const proVoice = enVoices.find(v => v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('google')) || enVoices[Math.min(1, enVoices.length - 1)];
        utterance.voice = proVoice;
      } else if (nextItem.sender === 'con') {
        const conVoice = enVoices.find(v => v.name.toLowerCase().includes('female')) || enVoices[Math.min(2, enVoices.length - 1)];
        utterance.voice = conVoice;
      } else if (nextItem.sender === 'neutral') {
        const neuVoice = enVoices.find(v => v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('microsoft')) || enVoices[Math.min(3, enVoices.length - 1)];
        utterance.voice = neuVoice;
      } else {
        utterance.voice = enVoices[0];
      }
    }

    utterance.onend = () => {
      isSpeakingRef.current = false;
      speechQueueRef.current.shift();
      setTimeout(() => {
        speakNext();
      }, 800);
    };

    utterance.onerror = (err) => {
      console.warn('SpeechSynthesis error:', err);
      isSpeakingRef.current = false;
      speechQueueRef.current.shift();
      speakNext();
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!isStarted || !voiceEnabled) {
      speechQueueRef.current = [];
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
      lastSpokenIndexRef.current = -1;
      return;
    }

    const startIndex = lastSpokenIndexRef.current + 1;
    if (startIndex < messages.length) {
      let addedToQueue = false;
      for (let i = startIndex; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.sender !== 'candidate') {
          speechQueueRef.current.push({
            sender: msg.sender,
            senderName: msg.senderName,
            text: msg.text
          });
          addedToQueue = true;
        }
      }
      lastSpokenIndexRef.current = messages.length - 1;

      if (addedToQueue && !isSpeakingRef.current) {
        setTimeout(() => {
          speakNext();
        }, 300);
      }
    }
  }, [messages, isStarted, voiceEnabled]);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isStarted || evaluated || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Automatically trigger evaluation when time runs out
          handleCompleteGD(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, evaluated, timeLeft]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/rounds/gd/topics');
      let data = [];
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (!res.ok) {
          throw new Error(`Server returned error status ${res.status}.`);
        }
        throw jsonErr;
      }
      setTopics(data);
      if (data.length > 0) {
        setSelectedTopic(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartGD = async () => {
    if (!selectedTopic) return;
    setIsStarted(true);
    setSubmitting(true);
    setMessages([]);
    setEvaluated(false);
    setEvaluation(null);
    setTimeLeft(600); // Reset to 10 minutes
    lastSpokenIndexRef.current = -1;
    speechQueueRef.current = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;

    try {
      const res = await fetch('/api/rounds/gd/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, topic: selectedTopic })
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

    setInputText('');
    setSubmitting(true);
    setTypingParticipant('Preparing arguments...');

    const userMsg: GDMessage = {
      id: 'msg_cand_' + Date.now(),
      sender: 'candidate',
      senderName: 'You (Candidate)',
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    const updatedLog = [...messagesRef.current, userMsg];
    setMessages(updatedLog);

    try {
      const res = await fetch('/api/rounds/gd/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          topic: selectedTopic,
          messages: updatedLog,
          studentMessage: trimmed
        })
      });

      const data = res.ok ? await res.json() : null;
      
      // Snappy response! Enable the user to continue typing or prep their next message immediately
      setSubmitting(false);

      if (data && data.chatLog) {
        const allMsgs = data.chatLog;
        const newMsgs = allMsgs.slice(updatedLog.length);

        if (newMsgs.length > 0) {
          let currentList = [...updatedLog];
          for (let i = 0; i < newMsgs.length; i++) {
            const nextMsg = newMsgs[i];
            setTypingParticipant(nextMsg.senderName);
            
            // Fast-paced conversational stagger delay (e.g., 600ms to 1200ms) for high responsiveness
            const delay = Math.min(1200, Math.max(600, nextMsg.text.length * 8));
            await new Promise(resolve => setTimeout(resolve, delay));
            
            currentList = [...currentList, nextMsg];
            setMessages(currentList);
          }
        } else {
          setMessages(allMsgs);
        }
      } else {
        const errorMsg = data?.error || 'Server error occurred.';
        setSpeechError(`Error: ${errorMsg}`);
        setMessages(prev => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            sender: 'moderator',
            senderName: 'System Notice',
            text: `⚠️ [System Error] Failed to receive replies: ${errorMsg}. Please try sending again.`,
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
          sender: 'moderator',
          senderName: 'System Notice',
          text: `⚠️ [Network Error] Failed to connect: ${err.message}. Please check your connection and retry.`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setSubmitting(false);
      setTypingParticipant(null);
    }
  };

  const handleSendMessage = async () => {
    await sendMessageText(inputText);
  };

  const handleToggleVoiceRecord = () => {
    if (evaluated) return;
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error('Error starting recognition:', e);
          setSpeechError('Failed to start microphone. Please try again.');
        }
      } else {
        setSpeechError('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your response.');
      }
    }
  };

  const handleCompleteGD = async (auto = false) => {
    const currentMsgs = messagesRef.current;
    if (!auto && currentMsgs.length < 3) {
      alert('Contribute to the group discussion with at least one argument first.');
      return;
    }

    setLoadingEval(true);
    try {
      const res = await fetch('/api/rounds/gd/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, topic: selectedTopic })
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
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-tight flex items-center space-x-2">
            <span>Round 4: Simulated Group Discussion</span>
            <span className="p-1.5 bg-indigo-950/50 border border-indigo-900/50 text-indigo-400 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3 w-3" />
              Multi-Agent AI
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            A real-time simulated forum of 3 AI candidates (Pro, Con, Neutral) and 1 Moderator evaluating your leadership skills.
          </p>
        </div>

        {isStarted && !evaluated && (
          <div className="flex items-center space-x-3">
            <div className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 ${
              timeLeft < 60 
                ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40 animate-pulse' 
                : 'bg-zinc-900 text-indigo-400 border border-zinc-850'
            }`}>
              <span className={`w-2 h-2 rounded-full ${timeLeft < 60 ? 'bg-rose-500' : 'bg-indigo-500'} animate-ping`} />
              <span>TIME LEFT: {formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => handleCompleteGD(false)}
              disabled={loadingEval || submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm transition-colors cursor-pointer"
              id="gd-complete-btn"
            >
              {loadingEval ? 'AI Grading Discussion...' : 'Submit Contribution'}
            </button>
          </div>
        )}
      </div>

      {!isStarted ? (
        /* Topic Selection Panel */
        <div className="max-w-2xl mx-auto bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 text-left" id="gd-topic-selector">
          <div className="flex items-center space-x-3 pb-4 border-b border-zinc-800">
            <div className="p-3 bg-indigo-950/50 border border-indigo-900/50 text-indigo-400 rounded-xl">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Choose Group Discussion Topic</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Predefined trending MNC campus placement discussion topics.</p>
            </div>
          </div>

          <div className="space-y-3">
            {topics.map((t, idx) => (
              <label
                key={idx}
                className={`flex items-start space-x-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                  selectedTopic === t
                    ? 'border-indigo-850 bg-indigo-950/20 text-indigo-400 font-medium'
                    : 'border-zinc-800 text-zinc-300 hover:bg-zinc-850/50'
                }`}
                id={`gd-topic-label-${idx}`}
              >
                <input
                  type="radio"
                  name="gd-topic"
                  checked={selectedTopic === t}
                  onChange={() => setSelectedTopic(t)}
                  className="mt-1 accent-indigo-600 cursor-pointer"
                  id={`gd-topic-input-${idx}`}
                />
                <span className="text-xs leading-relaxed">{t}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleStartGD}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm transition-colors cursor-pointer"
            id="gd-start-btn"
          >
            <Play className="h-4 w-4" />
            <span>Enter Discussion Forum</span>
          </button>
        </div>
      ) : (
        /* Active discussion environment */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Chat log forum */}
          <div className="lg:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col justify-between min-h-[440px] shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-850 bg-zinc-950 text-left">
              <span className="block text-[8px] text-zinc-500 font-mono tracking-wider uppercase">ACTIVE DISCUSSION ON:</span>
              <p className="text-xs font-semibold text-zinc-200 mt-1 line-clamp-1">{selectedTopic}</p>
            </div>

            {/* Chats list */}
            <div className="flex-grow p-4 overflow-y-auto max-h-[340px] space-y-4" id="gd-chat-history">
              {messages.map((m, idx) => {
                const isMod = m.sender === 'moderator';
                const isStudent = m.sender === 'candidate';
                
                let avatarStyle = 'bg-zinc-950 border border-zinc-800 text-zinc-400';
                if (isMod) avatarStyle = 'bg-amber-950 border border-amber-800 text-amber-400';
                else if (m.sender === 'pro') avatarStyle = 'bg-emerald-950 border border-emerald-800 text-emerald-400';
                else if (m.sender === 'con') avatarStyle = 'bg-rose-950 border border-rose-800 text-rose-400';
                else if (m.sender === 'neutral') avatarStyle = 'bg-indigo-950 border border-indigo-800 text-indigo-400';
                else if (isStudent) avatarStyle = 'bg-indigo-650 border border-indigo-700 text-white';

                return (
                  <div key={m.id || idx} className={`flex items-start space-x-2 text-left ${isStudent ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold select-none font-mono ${avatarStyle}`}>
                      {m.senderName.substring(0, 2).toUpperCase()}
                    </div>

                    <div className={`max-w-[78%] space-y-0.5 ${isStudent ? 'text-right' : ''}`}>
                      <span className="block text-[8px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                        {m.senderName}
                      </span>
                      <div className={`rounded-xl px-4 py-2.5 text-xs font-sans leading-relaxed ${
                        isMod 
                          ? 'bg-amber-950/20 text-amber-400 border border-amber-900/50'
                          : isStudent
                            ? 'bg-indigo-650 text-white rounded-tr-none'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-200'
                      }`}>
                        {m.text}

                        {/* Read Out Loud option for AI */}
                        {!isStudent && (
                          <button
                            onClick={() => {
                              if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                                const utterance = new SpeechSynthesisUtterance(m.text);
                                const voices = window.speechSynthesis.getVoices();
                                const enVoices = voices.filter(v => v.lang.startsWith('en'));
                                if (enVoices.length > 0) {
                                  if (m.sender === 'moderator') utterance.voice = enVoices[0];
                                  else if (m.sender === 'pro') utterance.voice = enVoices[1] || enVoices[0];
                                  else if (m.sender === 'con') utterance.voice = enVoices[2] || enVoices[0];
                                  else if (m.sender === 'neutral') utterance.voice = enVoices[3] || enVoices[0];
                                }
                                window.speechSynthesis.speak(utterance);
                              }
                            }}
                            className="mt-1.5 text-[8px] text-indigo-400 hover:underline font-semibold flex items-center space-x-1 uppercase tracking-wider font-mono cursor-pointer"
                            id={`gd-speak-btn-${idx}`}
                          >
                            <Volume2 className="h-2.5 w-2.5" />
                            <span>Listen</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={chatEndRef} />
            </div>

            {/* Inputs footer */}
            <div className="p-3 border-t border-zinc-850 bg-zinc-950 flex flex-col space-y-2">
                {speechError && (
                  <div className="px-3 py-1.5 bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-lg text-[10px] font-medium flex items-center space-x-1 font-sans">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{speechError}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {/* Voice toggle button */}
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      voiceEnabled
                        ? 'bg-indigo-950 border-indigo-900/50 text-indigo-400 hover:bg-indigo-900/30'
                        : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:bg-zinc-900'
                    }`}
                    title={voiceEnabled ? 'Mute AI speaking voices' : 'Unmute AI speaking voices'}
                    id="gd-voice-toggle-btn"
                  >
                    {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>

                  {/* Vocal Speak API input mic */}
                  <button
                    onClick={handleToggleVoiceRecord}
                    disabled={evaluated || submitting}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isRecording 
                        ? 'bg-rose-600 border-rose-700 text-white animate-pulse'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                    title={isRecording ? 'Listening... click to complete.' : 'Microphone Vocal Speech-to-Text assistance.'}
                    id="gd-mic-btn"
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
                          ? 'Discussion group is formulating arguments...'
                          : isRecording 
                            ? 'Listening... Speak clearly now...' 
                            : 'Contribute your structured argument or click mic to speak...'
                    }
                    className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    id="gd-input-field"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || evaluated || submitting}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-indigo-950 border border-indigo-900/40 transition-colors shadow-sm cursor-pointer"
                    id="gd-send-btn"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
            </div>
          </div>

          {/* Side control evaluation stats */}
          <div className="lg:col-span-4 text-left">
            <div className="sticky top-20 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider uppercase mb-3 border-b border-zinc-800 pb-2">
                  Discussion Panel Metrics
                </h3>

                {evaluated && evaluation ? (
                  <div className="space-y-4" id="gd-eval-panel">
                    {/* Score radial */}
                    <div className="flex items-center space-x-4 pb-4 border-b border-zinc-800">
                      <div className="h-14 w-14 flex items-center justify-center rounded-full border-2 border-emerald-900/80 text-emerald-400 bg-emerald-950/20 font-bold text-sm font-mono">
                        {evaluation.score}%
                      </div>
                      <div>
                        <h4 className="text-[9px] font-bold text-zinc-500 font-mono tracking-wider uppercase">GD PERFORMANCE</h4>
                        <p className="text-xs font-semibold font-serif text-zinc-200">Discussion Completed</p>
                      </div>
                    </div>

                    {/* Feedback report */}
                    <div className="space-y-2 bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
                      <div className="flex items-center space-x-1.5 text-zinc-300 font-bold text-xs font-mono tracking-wider uppercase">
                        <Award className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Moderator Evaluation:</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-2 font-sans">
                        {evaluation.feedback}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsStarted(false)}
                      className="w-full flex items-center justify-center py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-colors cursor-pointer"
                      id="gd-new-topic-btn"
                    >
                      Choose Another Topic
                    </button>

                    {onNavigateToNextRound && (
                      <button
                        onClick={onNavigateToNextRound}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold tracking-wider uppercase shadow-md transition-all cursor-pointer"
                        id="next-section-btn"
                      >
                        <span>Proceed to HR Interview</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-950/20 border border-indigo-900/50 rounded-xl">
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        Focus on building upon points made by Amit, Priya, or Rohan. Bring data points, logic reasoning, and maintain professional etiquette during conflicts.
                      </p>
                    </div>

                    {/* Quick guides */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Discussion Participants</h4>
                      <div className="space-y-1.5 text-xs text-zinc-400 font-sans leading-relaxed">
                        <div className="flex items-center space-x-2"><div className="h-2 w-2 rounded-full bg-emerald-500"/><span>Amit (Pro) - Supportive stance</span></div>
                        <div className="flex items-center space-x-2"><div className="h-2 w-2 rounded-full bg-rose-500"/><span>Priya (Con) - Critical opponent stance</span></div>
                        <div className="flex items-center space-x-2"><div className="h-2 w-2 rounded-full bg-indigo-500"/><span>Rohan (Neutral) - Hybrid analytical stance</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!evaluated && (
                <div className="pt-6">
                  <button
                    onClick={handleCompleteGD}
                    disabled={loadingEval || submitting}
                    className="w-full flex items-center justify-center py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-950 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm transition-colors cursor-pointer"
                    id="gd-evaluate-sidebar-btn"
                  >
                    {loadingEval ? 'AI Grading Discussion...' : 'Complete & Grade Round'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
