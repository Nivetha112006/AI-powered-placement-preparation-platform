export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface UserProfile {
  name: string;
  email: string;
  college?: string;
  branch?: string;
  skills: string[];
  projects: Array<{ title: string; description: string; tech: string[] }>;
  education: Array<{ degree: string; school: string; year: string; gpa: string }>;
  languages: string[];
  certifications: string[];
  resumeText?: string;
}

export interface AptitudeQuestion {
  id: string;
  topic: string; // 'Quantitative' | 'Logical' | 'Verbal' | 'Analytical' | 'Data Interpretation'
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

export interface CodingProblem {
  id: string;
  title: string;
  topic: string;
  description: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
  difficulty: Difficulty;
  starterCode: {
    java: string;
    python: string;
    cpp: string;
    javascript: string;
  };
  testCases: Array<{
    input: string;
    output: string;
    isHidden: boolean;
  }>;
}

export interface CodingSubmission {
  problemId: string;
  language: string;
  code: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Pending';
  executionTimeMs: number;
  memoryUsageKb: number;
  outputLog?: string;
}

export interface InterviewMessage {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export interface GDMessage {
  id: string;
  sender: 'moderator' | 'pro' | 'con' | 'neutral' | 'candidate';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface RoundScore {
  roundId: 'aptitude' | 'coding' | 'technical' | 'gd' | 'hr';
  score: number; // 0-100
  feedback: string;
  completedAt: string;
}

export interface PerformanceAnalysis {
  overallScore: number;
  readinessLabel: string; // e.g., "Highly Prepared", "Moderate Risk"
  strengths: string[];
  weaknesses: string[];
  skillGaps: Array<{
    skill: string;
    currentLevel: number; // 1-10
    requiredLevel: number; // 1-10
  }>;
  roadmap: Array<{
    timeframe: 'Daily' | 'Weekly' | 'Monthly';
    tasks: string[];
  }>;
  productCompanyReadiness: number; // 0-100
  serviceCompanyReadiness: number; // 0-100
}
