export interface PlayerProfile {
  name: string;
  className: string;
  classCode?: string;
  studentId?: string;
}

export type ScreenState = 
  | 'start' 
  | 'info' 
  | 'map' 
  | 'stage-intro' 
  | 'challenge' 
  | 'summary';

export type InteractionType = 'multiple-choice' | 'drag-drop';

export interface MultipleChoiceOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface DragItem {
  id: string;
  text: string;
  icon?: string;
}

export interface DropTarget {
  id: string;
  label: string;
  description?: string;
  acceptedItemId: string; // id của DragItem tương ứng
}

export interface SvgIllustrationConfig {
  type: 'ruler-ghd-dcnn' | 'ruler-eye-direction' | 'ruler-measure-zero' | 'ruler-measure-offset' | 'ruler-golden-key';
  rulerLengthCm?: number;
  dcnnMm?: number;
  objectStartCm?: number;
  objectEndCm?: number;
  objectName?: string;
  highlightCm?: number;
}

export interface GameQuestion {
  id: string; // Mã câu hỏi (vd: 'CH1-Q1')
  stageId: number; // Chặng (1 đến 5)
  questionNumber: number; // Câu 1, 2 hoặc 3 trong chặng
  content: string; // Nội dung câu hỏi
  interactionType: InteractionType;
  
  // Dành cho Multiple Choice
  options?: MultipleChoiceOption[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D';

  // Dành cho Drag & Drop
  dragItems?: DragItem[];
  dropTargets?: DropTarget[];

  hint: string; // Gợi ý sư phạm khi làm sai
  explanation: string; // Giải thích chi tiết khi trả lời xong
  
  pointsFirstTry: number; // Mặc định 10 điểm
  pointsRetry: number; // Mặc định 5 điểm

  illustration?: SvgIllustrationConfig;
}

export interface QuestionAttemptState {
  questionId: string;
  attemptsCount: number;
  isCorrect: boolean;
  scoreAwarded: number;
  usedHint: boolean;
}

export interface Stage {
  id: number;
  number: number;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  objective: string;
  image: string;
  pinCoords: {
    x: number;
    y: number;
  };
  status: 'locked' | 'unlocked' | 'completed';
  starsEarned: number;
  scoreReward: number;
}

export interface SavedGameSession {
  version: string;
  playerProfile: PlayerProfile;
  currentStageId: number;
  stagesStatus: Record<number, 'locked' | 'unlocked' | 'completed'>;
  questionAttempts: Record<string, QuestionAttemptState>;
  totalScore: number;
  lastUpdated: string;
}
