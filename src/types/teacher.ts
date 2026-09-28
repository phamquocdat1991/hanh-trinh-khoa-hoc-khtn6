import type { GameQuestion } from './game';

export interface StageConfig {
  id: number;
  number: number;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  objective: string;
  image: string;
  scoreReward: number;
}

export interface LessonContent {
  versionId: string;
  versionName: string;
  createdAt: string;
  stages: StageConfig[];
  questions: GameQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  draft: LessonContent;
  published: LessonContent | null;
  status: 'draft' | 'published';
  updatedAt: string;
  createdAt: string;
}

export interface StudentQuestionAnswer {
  questionId: string;
  stageId: number;
  userAnswer: string;
  isCorrect: boolean;
  attemptsCount: number;
  scoreAwarded: number;
  answeredAt: string;
}

export interface StudentPlayRun {
  sessionId: string;
  lessonId: string;
  lessonVersionId: string; // Bắt buộc gắn với phiên bản bài học lúc chơi
  classCode: string; // Mã lớp (vd: KHTN6A, LOP6B)
  studentId: string; // Mã học sinh (vd: HS01, THUY-DO)
  studentName: string;
  className: string;
  totalScore: number;
  maxScore: number;
  completedStages: number[];
  progressPercent: number;
  isFinished: boolean;
  startedAt: string;
  finishedAt?: string;
  durationSeconds: number;
  questionAnswers: Record<string, StudentQuestionAnswer>;
}

export interface QuestionErrorStat {
  questionId: string;
  stageId: number;
  content: string;
  totalAttempts: number;
  firstTryFailCount: number;
  failRate: number; // Tỷ lệ trả lời sai lần đầu (%)
  commonWrongAnswers: { answer: string; count: number }[];
}

export interface TeacherFilterOptions {
  classCode: string;
  studentSearch: string;
  lessonId: string;
  timeRange: 'all' | 'today' | 'week' | 'month';
}

export interface TeacherSessionState {
  isAuthenticated: boolean;
  teacherName: string;
  token: string | null;
  loginTime: string | null;
}
