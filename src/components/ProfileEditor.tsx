import React, { useState } from 'react';
import { User, GraduationCap, Code2, FolderGit2, Languages, Award, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileEditorProps {
  email: string;
  profile: UserProfile;
  onUpdateSuccess: (updatedProfile: UserProfile) => void;
  id?: string;
}

export function ProfileEditor({ email, profile, onUpdateSuccess, id = 'profile-editor' }: ProfileEditorProps) {
  // Local state for profile fields
  const [name, setName] = useState(profile.name || '');
  const [college, setCollege] = useState(profile.college || '');
  const [branch, setBranch] = useState(profile.branch || '');
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [newSkill, setNewSkill] = useState('');
  
  // Projects
  const [projects, setProjects] = useState(profile.projects || []);
  
  // Education
  const [education, setEducation] = useState(profile.education || []);
  
  // Languages & Certifications
  const [languages, setLanguages] = useState<string[]>(profile.languages || []);
  const [newLanguage, setNewLanguage] = useState('');
  const [certifications, setCertifications] = useState<string[]>(profile.certifications || []);
  const [newCert, setNewCert] = useState('');
  const [verificationPassword, setVerificationPassword] = useState('');

  // Statuses
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Skill management
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Language management
  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    setLanguages(languages.filter(l => l !== langToRemove));
  };

  // Certification management
  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert('');
    }
  };

  const handleRemoveCert = (certToRemove: string) => {
    setCertifications(certifications.filter(c => c !== certToRemove));
  };

  // Project management
  const handleAddProject = () => {
    setProjects([
      ...projects,
      { title: 'New Project', description: 'Brief description of what you built and how.', tech: ['React', 'Node.js'] }
    ]);
  };

  const handleUpdateProject = (index: number, field: string, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // Education management
  const handleAddEducation = () => {
    setEducation([
      ...education,
      { degree: 'Degree Name', school: college || 'University Name', year: '2023 - 2027', gpa: '8.5 CGPA' }
    ]);
  };

  const handleUpdateEducation = (index: number, field: string, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Submit changes
  const handleSaveProfile = async () => {
    if (!verificationPassword) {
      setError('Signup password verification is required to alter your profile.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const updatedProfileData: UserProfile = {
      name,
      email,
      college,
      branch,
      skills,
      projects,
      education,
      languages,
      certifications,
      resumeText: profile.resumeText
    };

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, profile: updatedProfileData, password: verificationPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile changes.');
      }

      onUpdateSuccess(data);
      setSuccess('Profile successfully updated and synchronized!');
      setVerificationPassword(''); // Clear the password after successful save
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id={id}>
      {/* Header and status flags */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-4">
        <div>
          <h2 className="text-xl font-serif text-white tracking-tight flex items-center space-x-2">
            <User className="h-5 w-5 text-indigo-400" />
            <span>Candidate Professional Profile</span>
          </h2>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
            Access and modify your simulator resume state, project lists, and technical credentials.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          id="profile-save-btn"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Alterations...</span>
            </>
          ) : (
            <span>Save Profile Changes</span>
          )}
        </button>
      </div>

      {success && (
        <div className="flex items-center space-x-2 bg-emerald-950/20 border border-emerald-900/30 p-3.5 rounded-xl text-xs font-semibold text-emerald-400 font-sans" id="profile-success-msg">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 bg-rose-950/20 border border-rose-900/30 p-3.5 rounded-xl text-xs font-semibold text-rose-400 font-sans" id="profile-error-msg">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Basic Information & Skills */}
        <div className="md:col-span-5 space-y-6">
          {/* Section 1: Basic info */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 text-left space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
              <GraduationCap className="h-4 w-4 text-indigo-400" />
              <span>Academic & General Info</span>
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase mb-1">Full Candidate Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-850/80 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase mb-1">Registered Candidate Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-zinc-950/30 border border-zinc-850/40 text-zinc-500 text-xs rounded-xl px-3.5 py-2.5 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase mb-1">Academic Institution / College</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-850/80 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase mb-1">Branch / Specialization</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-850/80 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-rose-400 uppercase mb-1">Verify Signup Password *</label>
                <input
                  type="password"
                  placeholder="Enter your password to authorize changes"
                  value={verificationPassword}
                  onChange={(e) => setVerificationPassword(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-rose-950/40 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-zinc-600 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Skills with tags */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 text-left space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
              <Code2 className="h-4 w-4 text-indigo-400" />
              <span>Technical Skills</span>
            </h3>

            {/* Input field */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g., React, SQL)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-grow bg-zinc-950/60 border border-zinc-850/80 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="p-2 bg-zinc-800 hover:bg-zinc-750 text-indigo-400 hover:text-white rounded-xl transition-all cursor-pointer border border-zinc-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            {/* Tags wrapper */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center space-x-1 bg-zinc-950 border border-zinc-850 text-zinc-300 text-[11px] font-mono px-2.5 py-1 rounded-lg"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors focus:outline-none cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <p className="text-[11px] text-zinc-500 italic">No skills listed yet.</p>
              )}
            </div>
          </div>

          {/* Languages & Certifications */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 text-left space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
              <Languages className="h-4 w-4 text-indigo-400" />
              <span>Languages & Certs</span>
            </h3>

            {/* Languages form */}
            <div className="space-y-3">
              <form onSubmit={handleAddLanguage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add language"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="flex-grow bg-zinc-950/60 border border-zinc-850/80 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button type="submit" className="p-2 bg-zinc-800 text-indigo-400 rounded-xl hover:bg-zinc-750 cursor-pointer">
                  <Plus className="h-4 w-4" />
                </button>
              </form>
              <div className="flex flex-wrap gap-1">
                {languages.map(lang => (
                  <span key={lang} className="inline-flex items-center space-x-1 bg-zinc-950 border border-zinc-850 text-zinc-400 text-[10px] px-2 py-0.5 rounded-md font-sans">
                    <span>{lang}</span>
                    <button type="button" onClick={() => handleRemoveLanguage(lang)} className="text-zinc-600 hover:text-rose-400">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications form */}
            <div className="space-y-3 pt-2 border-t border-zinc-850/40">
              <form onSubmit={handleAddCert} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add certification"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  className="flex-grow bg-zinc-950/60 border border-zinc-850/80 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button type="submit" className="p-2 bg-zinc-800 text-indigo-400 rounded-xl hover:bg-zinc-750 cursor-pointer">
                  <Plus className="h-4 w-4" />
                </button>
              </form>
              <div className="space-y-1.5">
                {certifications.map(cert => (
                  <div key={cert} className="flex items-center justify-between bg-zinc-950 border border-zinc-850 text-zinc-300 text-xs p-2 rounded-xl">
                    <span className="truncate pr-2">{cert}</span>
                    <button type="button" onClick={() => handleRemoveCert(cert)} className="text-zinc-500 hover:text-rose-400 cursor-pointer">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Projects & Education */}
        <div className="md:col-span-7 space-y-6">
          {/* Section 3: Projects details */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-850/50 pb-2">
              <h3 className="text-xs font-bold text-zinc-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
                <FolderGit2 className="h-4 w-4 text-indigo-400" />
                <span>Hands-on Projects</span>
              </h3>
              <button
                type="button"
                onClick={handleAddProject}
                className="flex items-center space-x-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 tracking-wider uppercase focus:outline-none cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx} className="relative bg-zinc-950/60 border border-zinc-850 rounded-xl p-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 transition-colors focus:outline-none cursor-pointer"
                    title="Remove Project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase mb-0.5">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => handleUpdateProject(idx, 'title', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase mb-0.5">Tech Stack (comma-separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(proj.tech) ? proj.tech.join(', ') : ''}
                        onChange={(e) => handleUpdateProject(idx, 'tech', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase mb-0.5">Project Description</label>
                    <textarea
                      value={proj.description}
                      onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                      rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                      required
                    />
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="text-center py-6 border border-dashed border-zinc-850 rounded-xl">
                  <p className="text-xs text-zinc-500 italic">No projects registered. Click "Add Project" above to include one.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Education details */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-850/50 pb-2">
              <h3 className="text-xs font-bold text-zinc-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
                <GraduationCap className="h-4 w-4 text-indigo-400" />
                <span>Education Background</span>
              </h3>
              <button
                type="button"
                onClick={handleAddEducation}
                className="flex items-center space-x-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 tracking-wider uppercase focus:outline-none cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Education</span>
              </button>
            </div>

            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="relative bg-zinc-950/60 border border-zinc-850 rounded-xl p-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 transition-colors focus:outline-none cursor-pointer"
                    title="Remove Education"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase mb-0.5">Degree / Qualification</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase mb-0.5">School / University</label>
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => handleUpdateEducation(idx, 'school', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase mb-0.5">Year of Graduation / Duration</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => handleUpdateEducation(idx, 'year', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase mb-0.5">Grade / GPA / CGPA</label>
                      <input
                        type="text"
                        value={edu.gpa}
                        onChange={(e) => handleUpdateEducation(idx, 'gpa', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              {education.length === 0 && (
                <div className="text-center py-6 border border-dashed border-zinc-850 rounded-xl">
                  <p className="text-xs text-zinc-500 italic">No education details recorded. Click "Add Education" above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
