import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, ArrowRight, ArrowLeft, Brain, Code, MessageSquare, ShieldAlert, Sparkles, BookOpen, ChevronRight, ChevronLeft, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { UserProfile, RoundScore } from './types';
import { Navbar } from './components/Navbar';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { ResumeUpload } from './components/ResumeUpload';
import { AptitudeRound } from './components/AptitudeRound';
import { CodingRound } from './components/CodingRound';
import { InterviewRound } from './components/InterviewRound';
import { GDRound } from './components/GDRound';
import { AdminPanel } from './components/AdminPanel';
import { ProfileEditor } from './components/ProfileEditor';

export default function App() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('Nivetha College of Engineering');
  const [branch, setBranch] = useState('Computer Science');
  
  const [password, setPassword] = useState('');
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scores, setScores] = useState<Record<string, RoundScore>>({});
  
  // Navigation tabs
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'resume' | 'aptitude' | 'coding' | 'technical' | 'gd' | 'hr' | 'admin'>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Authenticate user
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setAuthError('Please provide a valid candidate email.');
      return;
    }
    if (!password.trim()) {
      setAuthError('Please provide a password.');
      return;
    }

    setLoadingAuth(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password })
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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      setProfile(data.profile);
      setScores(data.scores || {});
      setEmail(email.toLowerCase().trim());
      setIsLoggedIn(true);
      setCurrentTab('dashboard');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Server connection failed.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setAuthError('Please provide a valid registered email.');
      return;
    }
    if (!newPassword.trim()) {
      setAuthError('Please provide a new password.');
      return;
    }

    setLoadingAuth(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.toLowerCase().trim(), newPassword })
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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setAuthSuccess('Password changed successfully! You can now log in with your new password.');
      setAuthTab('signin');
      setEmail(forgotEmail.toLowerCase().trim());
      setPassword(newPassword);
      setForgotEmail('');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Failed to update password');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !name.trim() || !password.trim()) {
      setAuthError('Email, Candidate Name, and Password are required.');
      return;
    }

    setLoadingAuth(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          name,
          college,
          branch
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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account.');
      }

      setProfile(data.profile);
      setScores(data.scores || {});
      setEmail(email.toLowerCase().trim());
      setIsLoggedIn(true);
      setCurrentTab('dashboard');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Server connection failed.');
    } finally {
      setLoadingAuth(false);
    }
  };

  // For 1-click quick access
  const handleQuickLogin = async (userEmail: string) => {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail.toLowerCase() })
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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      setProfile(data.profile);
      setScores(data.scores || {});
      setEmail(userEmail.toLowerCase());
      setIsLoggedIn(true);
      setCurrentTab('dashboard');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Quick login failed.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setProfile(null);
    setScores({});
    setEmail('');
    setName('');
    setPassword('');
    setIsAdmin(false);
  };

  const handleOnboardSuccess = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  const handleRoundComplete = (score: number) => {
    // Refresh user scores and stats from server
    if (email) {
      fetch(`/api/profile/state?email=${encodeURIComponent(email)}`)
        .then(async res => {
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data) setScores(data.scores || {});
        })
        .catch(console.error);
    }
  };

  const handleResetAssessment = async () => {
    if (!window.confirm("Are you sure you want to reset all your assessment scores, coding submissions, and interview chats to start a completely fresh placement round?")) {
      return;
    }
    try {
      const res = await fetch('/api/rounds/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setScores({});
        setCurrentTab('dashboard');
        alert("Your assessment has been fully reset. All chats, coding submissions, and scores are cleared. You can now start a fresh test!");
      }
    } catch (err) {
      console.error("Failed to reset assessment:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 font-sans flex flex-col justify-between" id="app-container">
      {isLoggedIn && profile ? (
        /* Authenticated Application Shell */
        <>
          <Navbar
            currentTab={currentTab}
            setCurrentTab={(tab: any) => setCurrentTab(tab)}
            userName={profile.name}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
            onLogout={handleLogout}
            id="app-navbar"
          />

          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="app-main-content">
            {currentTab !== 'dashboard' && (
              <div className="flex justify-start mb-6">
                <button
                  onClick={() => {
                    setIsAdmin(false);
                    setCurrentTab('dashboard');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850 transition-all cursor-pointer shadow-md inline-flex"
                  id="back-to-start-navigation-arrow"
                >
                  <ArrowLeft className="h-4 w-4 text-indigo-400" />
                  <span>Back to start</span>
                </button>
              </div>
            )}

            {!isAdmin && (() => {
              const SECTIONS = [
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'resume', label: 'Resume Analyzer' },
                { id: 'aptitude', label: 'Aptitude Test' },
                { id: 'coding', label: 'Coding Assessment' },
                { id: 'technical', label: 'Technical Interview' },
                { id: 'gd', label: 'Group Discussion' },
                { id: 'hr', label: 'HR Interview' }
              ];
              const currentIndex = SECTIONS.findIndex(s => s.id === currentTab);
              if (currentIndex === -1) return null;
              
              return (
                <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/85 rounded-2xl p-3 sm:p-4 mb-6 shadow-md" id="stage-navigator">
                  <button
                    onClick={() => setCurrentTab(SECTIONS[currentIndex - 1].id as any)}
                    disabled={currentIndex === 0}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#2c2c2e] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white cursor-pointer shadow-lg"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  
                  {/* Step indicators */}
                  <div className="hidden md:flex items-center space-x-1">
                    {SECTIONS.map((sec, idx) => {
                      const isCurrent = sec.id === currentTab;
                      const isPast = idx < currentIndex;
                      return (
                        <div key={sec.id} className="flex items-center">
                          <button
                            onClick={() => setCurrentTab(sec.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isCurrent 
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold' 
                                : isPast 
                                  ? 'text-emerald-400 hover:text-emerald-300 font-medium' 
                                  : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {sec.label}
                          </button>
                          {idx < SECTIONS.length - 1 && (
                            <ChevronRight className="h-3 w-3 text-zinc-850 mx-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="md:hidden text-xs font-medium text-zinc-400">
                    Stage {currentIndex + 1} of {SECTIONS.length}: <span className="text-indigo-400 font-bold">{SECTIONS[currentIndex].label}</span>
                  </div>

                  <button
                    onClick={() => setCurrentTab(SECTIONS[currentIndex + 1].id as any)}
                    disabled={currentIndex === SECTIONS.length - 1}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#2c2c2e] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white cursor-pointer shadow-lg"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })()}

            <AnimatePresence mode="wait">
              <motion.div
                key={isAdmin ? 'admin' : currentTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {isAdmin ? (
                  <AdminPanel id="app-admin-panel" />
                ) : (
                  <>
                    {currentTab === 'dashboard' && (
                      <PerformanceDashboard
                        email={email}
                        scores={scores}
                        onStartRound={(roundId) => setCurrentTab(roundId as any)}
                        onResetAssessment={handleResetAssessment}
                        id="app-dashboard"
                      />
                    )}

                    {currentTab === 'resume' && (
                      <ResumeUpload
                        email={email}
                        onUploadSuccess={handleOnboardSuccess}
                        onNavigateToNextRound={() => setCurrentTab('aptitude')}
                        id="app-resume-upload"
                      />
                    )}

                    {currentTab === 'aptitude' && (
                      <AptitudeRound
                        email={email}
                        onRoundComplete={handleRoundComplete}
                        onNavigateToNextRound={() => setCurrentTab('coding')}
                        allRoundsCompleted={Object.keys(scores).length >= 5}
                        id="app-aptitude-round"
                      />
                    )}

                    {currentTab === 'coding' && (
                      <CodingRound
                        email={email}
                        onRoundComplete={handleRoundComplete}
                        onNavigateToNextRound={() => setCurrentTab('technical')}
                        id="app-coding-round"
                      />
                    )}

                    {(currentTab === 'technical' || currentTab === 'hr') && (
                      <InterviewRound
                        email={email}
                        roundType={currentTab}
                        scores={scores}
                        onRoundComplete={handleRoundComplete}
                        onNavigateToNextRound={() => setCurrentTab(currentTab === 'technical' ? 'gd' : 'dashboard')}
                        id={`app-interview-${currentTab}`}
                      />
                    )}

                    {currentTab === 'gd' && (
                      <GDRound
                        email={email}
                        onRoundComplete={handleRoundComplete}
                        onNavigateToNextRound={() => setCurrentTab('hr')}
                        id="app-gd-round"
                      />
                    )}

                    {currentTab === 'profile' && (
                      <ProfileEditor
                        email={email}
                        profile={profile}
                        onUpdateSuccess={handleOnboardSuccess}
                        id="app-profile-editor"
                      />
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </>
      ) : (
        /* Corporate Onboarding & Landing Page Portal - Clean Dark Theme Signup/Login Card */
        <div className="flex-grow flex flex-col items-center justify-center p-4 py-16 bg-[#09090B]" id="landing-container">
          <div className="max-w-[400px] w-full bg-zinc-950/60 border border-zinc-800/80 rounded-[28px] p-8 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col items-stretch" id="onboarding-auth-card">
            {authTab === 'signin' ? (
              /* SIGN IN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <h1 className="text-[32px] font-bold text-white text-center tracking-tight">Log in</h1>
                <p className="text-[15px] text-zinc-400 text-center mb-6">
                  Don't have an account?
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signup'); setAuthError(null); setAuthSuccess(null); }}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold ml-1 transition-colors focus:outline-none cursor-pointer font-sans"
                  >
                    Sign up
                  </button>
                </p>

                <div className="space-y-3.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Mobile number or email"
                    className="w-full bg-zinc-900/50 text-white border border-zinc-800/70 placeholder-zinc-500 rounded-2xl px-5 py-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-zinc-900/50 text-white border border-zinc-800/70 placeholder-zinc-500 rounded-2xl px-5 py-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('forgot'); setAuthError(null); setAuthSuccess(null); setForgotEmail(email); }}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition-colors focus:outline-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {authSuccess && (
                  <p className="text-xs font-semibold text-emerald-400 font-sans bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30 text-center">{authSuccess}</p>
                )}

                {authError && (
                  <p className="text-xs font-semibold text-rose-400 font-sans bg-rose-950/20 p-3 rounded-xl border border-rose-900/30 text-center">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full flex items-center justify-center py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/30 transition-all cursor-pointer mt-4"
                >
                  {loadingAuth ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Log in</span>
                  )}
                </button>
              </form>
            ) : authTab === 'signup' ? (
              /* SIGN UP FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
                <h1 className="text-[32px] font-bold text-white text-center tracking-tight">Sign up</h1>
                <p className="text-[15px] text-zinc-400 text-center mb-6">
                  Have an account?
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signin'); setAuthError(null); setAuthSuccess(null); }}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold ml-1 transition-colors focus:outline-none cursor-pointer font-sans"
                  >
                    Log in
                  </button>
                </p>

                <div className="space-y-3.5">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-zinc-900/50 text-white border border-zinc-800/70 placeholder-zinc-500 rounded-2xl px-5 py-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Mobile number or email"
                    className="w-full bg-zinc-900/50 text-white border border-zinc-800/70 placeholder-zinc-500 rounded-2xl px-5 py-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-zinc-900/50 text-white border border-zinc-800/70 placeholder-zinc-500 rounded-2xl px-5 py-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="text-xs font-semibold text-rose-400 font-sans bg-rose-950/20 p-3 rounded-xl border border-rose-900/30 text-center">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full flex items-center justify-center py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/30 transition-all cursor-pointer mt-4"
                >
                  {loadingAuth ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Signing up...</span>
                    </>
                  ) : (
                    <span>Sign up</span>
                  )}
                </button>
              </form>
            ) : (
              /* FORGOT PASSWORD FORM */
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
                <h1 className="text-[32px] font-bold text-white text-center tracking-tight">Forgot Password</h1>
                <p className="text-[15px] text-zinc-400 text-center mb-6">
                  Remembered your password?
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signin'); setAuthError(null); setAuthSuccess(null); }}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold ml-1 transition-colors focus:outline-none cursor-pointer font-sans"
                  >
                    Log in
                  </button>
                </p>

                <div className="space-y-3.5">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter registered email"
                    className="w-full bg-zinc-900/50 text-white border border-zinc-800/70 placeholder-zinc-500 rounded-2xl px-5 py-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      className="w-full bg-zinc-900/50 text-white border border-zinc-800/70 placeholder-zinc-500 rounded-2xl px-5 py-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="text-xs font-semibold text-rose-400 font-sans bg-rose-950/20 p-3 rounded-xl border border-rose-900/30 text-center">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full flex items-center justify-center py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/30 transition-all cursor-pointer mt-4"
                >
                  {loadingAuth ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer corporate notice */}
      <footer className="py-4 border-t border-zinc-800 text-center text-[9px] font-mono tracking-widest text-zinc-500 select-none print:hidden" id="app-footer">
        PLACEMENTAI CORPORATE SYSTEMS INC. © 2026. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}
