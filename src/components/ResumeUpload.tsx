import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface ResumeUploadProps {
  email: string;
  onUploadSuccess: (updatedProfile: UserProfile) => void;
  onNavigateToNextRound?: () => void;
  id?: string;
}

const templates = [
  {
    name: 'CS Student Template (Product MNC Focus)',
    text: `NIVETHA V
Email: nivethav535@gmail.com
Education:
Bachelor of Technology in Computer Science (2023 - 2027) | GPA: 9.2 CGPA
Projects:
1. PlacementAI (TypeScript, Express, React, Tailwind, Google Gemini SDK)
An AI-driven campus recruitment simulator that evaluates aptitude, coding skills, and features technical/HR voice dialogue agents.
2. Distributed Cloud Query Engine (Python, Go, gRPC, PostgreSQL)
Created an optimized concurrent querying engine that improved data delivery performance by 35%.
Skills:
JavaScript, React, Node.js, Python, Java, SQL, Data Structures, Algorithms, System Design
Certifications:
AWS Certified Developer Associate (2025), freeCodeCamp Responsive Web Design`
  },
  {
    name: 'Full Stack Web Developer (General MNC)',
    text: `Siddharth Sharma
Email: siddharth@example.com
Education:
B.E. Information Technology (2022 - 2026) | GPA: 8.5 CGPA
Projects:
1. E-Commerce Platform (React, Node.js, MongoDB, Stripe API)
Designed a full-stack store with real-time checkout, automated email invoicing, and dashboard analytics.
Skills:
HTML/CSS, JavaScript, TypeScript, Next.js, Express, MongoDB, RESTful APIs, Git, Agile Development
Certifications:
MongoDB Associate Developer, Udemy Complete Web Development Bootcamp`
  }
];

export function ResumeUpload({ email, onUploadSuccess, onNavigateToNextRound, id = 'resume-upload' }: ResumeUploadProps) {
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    
    const isTextFile = file.type.startsWith('text/') || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.md') || 
                       file.name.endsWith('.json') || 
                       file.name.endsWith('.rtf');
                       
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (isTextFile) {
        setResumeText(content);
      } else {
        const cleanedText = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        const ultraCleaned = cleanedText.replace(/\s+/g, ' ').trim();
        
        if (ultraCleaned.length > 200) {
          setResumeText(`[Extracted text from ${file.name} - Please verify/edit below if needed]\n\n` + ultraCleaned.substring(0, 4000));
        } else {
          setResumeText(`[Uploaded File: ${file.name}]\n\n(Note: Binary .pdf/.docx structures are secured. Please paste your plain text content directly below for 100% accurate Gemini extraction.)`);
        }
      }
    };
    
    reader.readAsText(file);
  };

  const handleLoadTemplate = (txt: string) => {
    setResumeText(txt);
    setError(null);
  };

  const handleParse = async () => {
    if (!resumeText.trim()) {
      setError('Please write, paste, or load a resume template first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resumeText })
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
        throw new Error(data.error || 'Failed to analyze resume.');
      }

      setSuccess(true);
      setParsedProfile(data.profile);
      onUploadSuccess(data.profile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server error parsing resume.');
    } finally {
      setLoading(false);
    }
  };

  if (success && parsedProfile) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-6 text-center" id="resume-upload-success-page">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-3xl font-serif text-white font-medium tracking-tight">
            Resume Uploaded & Parsed!
          </h2>
          <p className="text-sm text-zinc-400 font-sans max-w-lg">
            Your professional resume has been analyzed and successfully processed. Your custom placement dashboard is ready, and all upcoming rounds are now dynamic and fully aligned with your profile!
          </p>
        </div>

        {/* Structured Profile Cards (Bento style) */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-6 text-left space-y-6 shadow-xl backdrop-blur-md">
          <div className="border-b border-zinc-850 pb-3 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase font-mono tracking-widest">
              PARSED PLACEMENT PROFILE
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
              ATS MATCH READY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Education</h4>
              {parsedProfile.education?.map((edu, i) => (
                <div key={i} className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-850">
                  <span className="font-bold text-white block text-sm">{edu.school}</span>
                  <span className="text-zinc-400 block mt-1">{edu.degree} ({edu.year || 'N/A'})</span>
                  {edu.gpa && <span className="text-indigo-400 font-mono text-[10px] font-bold block mt-1.5">GPA: {edu.gpa}</span>}
                </div>
              )) || <p className="text-zinc-500 text-xs italic">No education details parsed.</p>}
            </div>

            {/* Core Skills */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Skills & Programming Languages</h4>
              <div className="flex flex-wrap gap-2 p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-850">
                {parsedProfile.skills?.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-indigo-950/40 border border-indigo-900/50 text-indigo-400 text-[10px] font-semibold rounded-lg font-sans">
                    {skill}
                  </span>
                ))}
                {parsedProfile.languages?.map((lang, i) => (
                  <span key={i} className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono rounded-lg">
                    {lang}
                  </span>
                ))}
                {(!parsedProfile.skills?.length && !parsedProfile.languages?.length) && (
                  <p className="text-zinc-500 text-xs italic">No skills or languages identified.</p>
                )}
              </div>
            </div>
          </div>

          {/* Projects */}
          {parsedProfile.projects && parsedProfile.projects.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Relevant Projects</h4>
              <div className="grid grid-cols-1 gap-3">
                {parsedProfile.projects.map((proj, i) => (
                  <div key={i} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
                    <p className="text-xs font-bold text-zinc-100 flex items-center justify-between">
                      <span>{proj.title}</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-1.5">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setSuccess(false)}
            className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Re-Upload Resume
          </button>
          {onNavigateToNextRound && (
            <button
              onClick={onNavigateToNextRound}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <span>Proceed to Aptitude Test</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id={id}>
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-tight">
            ATS Resume Parsing & Personalization Engine
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Provide your details so our AI interviewers can ask tailored technical and situational questions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map((tpl, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadTemplate(tpl.text)}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Load {idx === 0 ? 'CS Product' : 'Full Stack'} Resume
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Block */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-sm">
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('device-resume-input')?.click()}
              className={`border-2 border-dashed rounded-xl p-6 mb-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-950/20' 
                  : 'border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/40 hover:border-zinc-700'
              }`}
              id="file-dropzone"
            >
              <input
                type="file"
                id="device-resume-input"
                className="hidden"
                accept=".txt,.md,.pdf,.docx,.rtf,.json"
                onChange={handleFileChange}
              />
              <UploadCloud className="h-8 w-8 text-indigo-400 mb-2 animate-bounce" style={{ animationDuration: '3s' }} />
              <p className="text-xs font-bold text-zinc-200 font-sans">
                Drag & Drop your resume file here
              </p>
              <p className="text-[10px] text-zinc-500 font-sans mt-1">
                or <span className="text-indigo-400 underline font-semibold">browse files</span> from your device
              </p>
              <p className="text-[9px] text-zinc-600 font-mono mt-1.5 uppercase">
                Supports .txt, .pdf, .docx, .md, .rtf
              </p>
            </div>

            {error && (
              <p className="mt-2 text-xs font-medium text-rose-500 font-sans">{error}</p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-mono">
                CHARACTERS: {resumeText.length}
              </span>
              <button
                onClick={handleParse}
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold tracking-wider uppercase shadow-sm transition-colors cursor-pointer"
                id="resume-parse-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Gemini Parsing Resume...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    <span>Analyze & Personalize</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Block */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 h-full flex flex-col">
            <h3 className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider uppercase mb-3 border-b border-zinc-800 pb-2">
              STRUCTURED RECRUITMENT PROFILE
            </h3>

            {success && parsedProfile ? (
              <div className="space-y-4 flex-grow overflow-y-auto max-h-[420px] pr-2 text-left" id="resume-parse-success">
                <div className="flex items-center space-x-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  <span className="text-xs font-sans font-bold">Successfully Parsed Profile!</span>
                </div>

                <div className="space-y-4">
                  {/* Education */}
                  <div>
                    <h4 className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Education</h4>
                    {parsedProfile.education.map((edu, i) => (
                      <p key={i} className="text-xs text-zinc-300 font-medium mt-1 leading-relaxed">
                        • {edu.degree} at <b>{edu.school}</b> ({edu.year || 'N/A'}) - <span className="font-mono text-[10px] text-indigo-400 font-bold">{edu.gpa || 'N/A'}</span>
                      </p>
                    ))}
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Core Skills Identified</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {parsedProfile.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-950/45 border border-indigo-900/50 text-indigo-400 text-[10px] font-semibold rounded font-sans">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <h4 className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Programming Languages</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {parsedProfile.languages.map((lang, i) => (
                        <span key={i} className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-mono rounded">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <h4 className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Academic / Personal Projects</h4>
                    <div className="space-y-2 mt-1.5">
                      {parsedProfile.projects.map((proj, i) => (
                        <div key={i} className="pb-2 border-b border-dashed border-zinc-800 last:border-0">
                          <p className="text-xs font-bold text-zinc-200">{proj.title}</p>
                          <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-850 rounded-xl">
                <FileText className="h-10 w-10 text-zinc-600 mb-2" />
                <p className="text-xs font-semibold text-zinc-300">No profile parsed yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-[200px] font-sans leading-relaxed">
                  Fill or load a template and run "Analyze" to customize interview questions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
