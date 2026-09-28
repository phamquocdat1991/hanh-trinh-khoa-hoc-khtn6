import type { Lesson, StageConfig } from '../types/teacher';
import { STAGES_DATA } from './stagesData';
import { QUESTIONS_DATA } from './questionsData';

const initialStagesConfig: StageConfig[] = STAGES_DATA.map((s) => ({
  id: s.id,
  number: s.number,
  title: s.title,
  shortTitle: s.shortTitle,
  badge: s.badge,
  description: s.description,
  objective: s.objective,
  image: s.image,
  scoreReward: s.scoreReward,
}));

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'khtn6-do-chieu-dai',
    title: 'Bài 4: Đo chiều dài — Khoa học tự nhiên 6',
    subject: 'Khoa học tự nhiên',
    grade: 'Khối 6',
    description: 'Bài học tương tác gồm 5 chặng, 15 câu hỏi khám phá đơn vị, dụng cụ, cách đặt thước - mắt và giải quyết tình huống đo đạc thực tế.',
    status: 'published',
    createdAt: '2026-09-28T08:00:00.000Z',
    updatedAt: '2026-09-28T14:30:00.000Z',
    published: {
      versionId: 'khtn6-v1.0.0',
      versionName: 'Phiên bản 1.0 (Chính thức)',
      createdAt: '2026-09-28T14:30:00.000Z',
      stages: initialStagesConfig,
      questions: QUESTIONS_DATA,
    },
    draft: {
      versionId: 'khtn6-v1.1.0-draft',
      versionName: 'Bản thảo 1.1 (Đang chỉnh sửa)',
      createdAt: '2026-09-28T15:00:00.000Z',
      stages: initialStagesConfig,
      questions: QUESTIONS_DATA,
    },
  },
];
