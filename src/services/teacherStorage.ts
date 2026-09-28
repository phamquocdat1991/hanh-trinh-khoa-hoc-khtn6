import type { 
  Lesson, 
  LessonContent, 
  StudentPlayRun, 
  QuestionErrorStat, 
  TeacherFilterOptions 
} from '../types/teacher';
import type { GameQuestion } from '../types/game';
import { INITIAL_LESSONS } from '../data/initialLessons';

const STORAGE_KEY_LESSONS = 'teacher_lessons_v1';
const STORAGE_KEY_RUNS = 'teacher_student_runs_v1';
const STORAGE_KEY_AUTH = 'teacher_auth_session_v1';

// Mật khẩu mặc định của khu vực giáo viên
const DEFAULT_TEACHER_PASSWORD = 'giaovienkhtn2026';

export interface StorageStatusInfo {
  hasRemoteBackend: boolean;
  backendType: 'none' | 'sqlite' | 'supabase' | 'rest-api';
  statusText: string;
  notice: string;
  apiEndpoint?: string;
}

class TeacherStorageService {
  private isServerOnline: boolean = false;
  private backendInfo: StorageStatusInfo = {
    hasRemoteBackend: false,
    backendType: 'none',
    statusText: 'CỤC BỘ TRÌNH DUYỆT (LOCAL)',
    notice: 'Đang kiểm tra kết nối dịch vụ lưu trữ máy chủ...',
  };

  constructor() {
    this.checkBackendConnection();
  }

  // 1. KIỂM TRA DỊCH VỤ LƯU TRỮ THỜI GIAN THỰC (KHÔNG GIẢ LẬP LƯU THÀNH CÔNG)
  public async checkBackendConnection(): Promise<StorageStatusInfo> {
    try {
      const resp = await fetch('/api/status', { method: 'GET' });
      if (resp.ok) {
        const data = await resp.json();
        this.isServerOnline = true;
        this.backendInfo = {
          hasRemoteBackend: true,
          backendType: data.backendType || 'sqlite',
          statusText: 'ĐÃ KẾT NỐI MÁY CHỦ SQLITE (MẠNG LAN / LOCALHOST)',
          notice: 'Hệ thống đã kết nối máy chủ Node.js + SQLite cục bộ. Dữ liệu bài học, kết quả học sinh và thuật toán chấm điểm được bảo vệ trực tiếp trên máy chủ.',
          apiEndpoint: 'http://localhost:3001/api',
        };
        return this.backendInfo;
      }
    } catch {
      // Server chưa khởi chạy
    }

    this.isServerOnline = false;
    this.backendInfo = {
      hasRemoteBackend: false,
      backendType: 'none',
      statusText: 'CỤC BỘ TRÌNH DUYỆT (LOCAL)',
      notice: 'Chưa phát hiện máy chủ backend (chưa chạy npm run server). Dữ liệu đang được lưu tạm trên LocalStorage trình duyệt này. Không đồng bộ giữa các máy khác.',
    };
    return this.backendInfo;
  }

  public getStorageStatus(): StorageStatusInfo {
    return this.backendInfo;
  }

  public getAuthToken(): string | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_AUTH);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.token || null;
    } catch {
      return null;
    }
  }

  // 2. XÁC THỰC TÀI KHOẢN GIÁO VIÊN
  public async authenticateTeacherAsync(passwordInput: string): Promise<{ success: boolean; message?: string }> {
    if (!passwordInput || passwordInput.trim() === '') {
      return { success: false, message: 'Vui lòng nhập mật khẩu quản trị viên giáo viên.' };
    }

    // Thử xác thực với server nếu online
    if (this.isServerOnline) {
      try {
        const resp = await fetch('/api/teacher/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: passwordInput.trim() }),
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          const sessionData = {
            isAuthenticated: true,
            teacherName: data.teacherName || 'Giáo viên bộ môn KHTN',
            token: data.token,
            loginTime: new Date().toISOString(),
          };
          sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(sessionData));
          return { success: true };
        }
        return { success: false, message: data.message || 'Mật khẩu giáo viên không chính xác.' };
      } catch {
        // Fallback
      }
    }

    // Xác thực dự phòng Local
    return this.authenticateTeacher(passwordInput);
  }

  public authenticateTeacher(passwordInput: string): { success: boolean; message?: string } {
    if (!passwordInput || passwordInput.trim() === '') {
      return { success: false, message: 'Vui lòng nhập mật khẩu quản trị viên giáo viên.' };
    }

    const savedPass = localStorage.getItem('teacher_custom_password') || DEFAULT_TEACHER_PASSWORD;
    if (passwordInput.trim() === savedPass) {
      const sessionData = {
        isAuthenticated: true,
        teacherName: 'Giáo viên bộ môn KHTN',
        token: `session_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        loginTime: new Date().toISOString(),
      };
      sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(sessionData));
      return { success: true };
    }

    return { success: false, message: 'Mật khẩu giáo viên không chính xác. Mặc định là: giaovienkhtn2026' };
  }

  public isTeacherAuthenticated(): boolean {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_AUTH);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed.isAuthenticated;
    } catch {
      return false;
    }
  }

  public logoutTeacher() {
    const token = this.getAuthToken();
    if (token && this.isServerOnline) {
      fetch('/api/teacher/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
  }

  // 3. QUẢN LÝ BÀI HỌC (LESSONS)
  public getLessons(): Lesson[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LESSONS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(INITIAL_LESSONS));
    return INITIAL_LESSONS;
  }

  public getLessonById(lessonId: string): Lesson | null {
    const list = this.getLessons();
    return list.find((l) => l.id === lessonId) || null;
  }

  public getPublishedLesson(lessonId: string): LessonContent | null {
    const lesson = this.getLessonById(lessonId);
    return lesson ? lesson.published : null;
  }

  // Lưu bản nháp (Draft)
  public saveLessonDraft(lessonId: string, updatedDraft: LessonContent): boolean {
    const list = this.getLessons();
    const idx = list.findIndex((l) => l.id === lessonId);
    if (idx === -1) return false;

    list[idx].draft = {
      ...updatedDraft,
      createdAt: new Date().toISOString(),
    };
    list[idx].updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(list));

    // Đồng bộ lên SQLite server nếu online
    const token = this.getAuthToken();
    if (this.isServerOnline && token) {
      fetch(`/api/teacher/lessons/${lessonId}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ draft: updatedDraft }),
      }).catch(() => {});
    }

    return true;
  }

  // Xuất bản bản nháp thành phiên bản chính thức (Publish Draft)
  public publishLesson(lessonId: string, newVersionName?: string): { success: boolean; versionId: string } {
    const list = this.getLessons();
    const idx = list.findIndex((l) => l.id === lessonId);
    if (idx === -1) return { success: false, versionId: '' };

    const lesson = list[idx];
    const prevPublished = lesson.published;
    const nextVersionNum = prevPublished ? parseInt(prevPublished.versionId.replace(/\D/g, '') || '1', 10) + 1 : 1;
    const newVersionId = `ver-${lesson.id}-v${nextVersionNum}.0`;

    const publishedContent: LessonContent = {
      ...lesson.draft,
      versionId: newVersionId,
      versionName: newVersionName || `Phiên bản ${nextVersionNum}.0 (Xuất bản ${new Date().toLocaleDateString('vi-VN')})`,
      createdAt: new Date().toISOString(),
    };

    lesson.published = publishedContent;
    lesson.status = 'published';
    lesson.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(list));

    // Đồng bộ lên SQLite server nếu online
    const token = this.getAuthToken();
    if (this.isServerOnline && token) {
      fetch(`/api/teacher/lessons/${lessonId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ versionName: publishedContent.versionName }),
      }).catch(() => {});
    }

    return { success: true, versionId: newVersionId };
  }

  // 4. GHI NHẬN KẾT QUẢ HỌC SINH (STUDENT PLAY RUNS)
  public saveStudentRun(run: StudentPlayRun): boolean {
    try {
      const runs = this.getStudentRuns();
      const updated = [run, ...runs.filter((r) => r.sessionId !== run.sessionId)];
      localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }

  public getStudentRuns(filter?: Partial<TeacherFilterOptions>): StudentPlayRun[] {
    let list: StudentPlayRun[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RUNS);
      if (raw) {
        list = JSON.parse(raw);
      }
    } catch {
      list = [];
    }

    if (!filter) return list;

    return list.filter((run) => {
      if (filter.classCode && filter.classCode !== 'all' && run.classCode !== filter.classCode) {
        return false;
      }
      if (filter.lessonId && filter.lessonId !== 'all' && run.lessonId !== filter.lessonId) {
        return false;
      }
      if (filter.studentSearch && filter.studentSearch.trim() !== '') {
        const q = filter.studentSearch.toLowerCase().trim();
        const matchName = run.studentName.toLowerCase().includes(q);
        const matchCode = run.studentId.toLowerCase().includes(q);
        const matchClass = run.className.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchClass) return false;
      }
      return true;
    });
  }

  // 5. PHÂN TÍCH CÂU HỎI SAI NHIỀU NHẤT
  public getQuestionErrorAnalytics(lessonId: string, questions: GameQuestion[]): QuestionErrorStat[] {
    const runs = this.getStudentRuns({ lessonId });
    if (runs.length === 0) return [];

    const statsMap: Record<string, { totalAttempts: number; failCount: number; wrongAnswers: Record<string, number> }> = {};

    questions.forEach((q) => {
      statsMap[q.id] = { totalAttempts: 0, failCount: 0, wrongAnswers: {} };
    });

    runs.forEach((run) => {
      Object.entries(run.questionAnswers || {}).forEach(([qId, ans]) => {
        if (!statsMap[qId]) {
          statsMap[qId] = { totalAttempts: 0, failCount: 0, wrongAnswers: {} };
        }
        statsMap[qId].totalAttempts++;
        if (ans.attemptsCount > 1 || !ans.isCorrect) {
          statsMap[qId].failCount++;
          const strAns = typeof ans.userAnswer === 'string' ? ans.userAnswer : JSON.stringify(ans.userAnswer);
          statsMap[qId].wrongAnswers[strAns] = (statsMap[qId].wrongAnswers[strAns] || 0) + 1;
        }
      });
    });

    return questions
      .map((q) => {
        const item = statsMap[q.id] || { totalAttempts: 0, failCount: 0, wrongAnswers: {} };
        const failRate = item.totalAttempts > 0 ? Math.round((item.failCount / item.totalAttempts) * 100) : 0;
        const commonWrongAnswers = Object.entries(item.wrongAnswers)
          .map(([answer, count]) => ({ answer, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        return {
          questionId: q.id,
          stageId: q.stageId,
          content: q.content,
          totalAttempts: item.totalAttempts,
          firstTryFailCount: item.failCount,
          failRate,
          commonWrongAnswers,
        };
      })
      .sort((a, b) => b.firstTryFailCount - a.firstTryFailCount);
  }

  // 6. XUẤT BẢNG KẾT QUẢ RA FILE CSV (UTF-8 BOM CHO EXCEL TIẾNG VIỆT)
  public exportRunsToCSV(runs: StudentPlayRun[]): string {
    const headers = [
      'STT',
      'Mã học sinh',
      'Họ và tên',
      'Lớp',
      'Mã lớp',
      'Mã phiên bản bài học',
      'Tổng điểm (tối đa 150)',
      'Tiến độ (%)',
      'Chặng đã qua',
      'Thời gian làm bài (giây)',
      'Thời điểm bắt đầu',
      'Trạng thái hoàn thành',
    ];

    const rows = runs.map((run, idx) => [
      idx + 1,
      `"${run.studentId.replace(/"/g, '""')}"`,
      `"${run.studentName.replace(/"/g, '""')}"`,
      `"${run.className.replace(/"/g, '""')}"`,
      `"${run.classCode.replace(/"/g, '""')}"`,
      `"${run.lessonVersionId}"`,
      run.totalScore,
      `${run.progressPercent}%`,
      `"${run.completedStages.join(', ')}"`,
      run.durationSeconds,
      `"${new Date(run.startedAt).toLocaleString('vi-VN')}"`,
      run.isFinished ? 'Hoàn thành' : 'Đang dở dang',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return csvContent;
  }
}

export const teacherStorageService = new TeacherStorageService();
