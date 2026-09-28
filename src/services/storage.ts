import type { SavedGameSession, PlayerProfile } from '../types/game';

const STORAGE_KEY = 'hanh_trinh_khoa_hoc_session_v1';

export const storageService = {
  // Lấy dữ liệu phiên chơi đã lưu
  loadSession(): SavedGameSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as SavedGameSession;
    } catch {
      return null;
    }
  },

  // Lưu phiên chơi hiện tại vào trình duyệt (localStorage)
  saveSession(session: SavedGameSession): void {
    try {
      session.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Bỏ qua lỗi hạn mức lưu trữ
    }
  },

  // Tạo một lượt chơi mới hoàn toàn (reset điểm về 0, không cộng dồn lượt cũ)
  createNewSession(profile: PlayerProfile): SavedGameSession {
    const freshSession: SavedGameSession = {
      version: '1.0.0',
      playerProfile: profile,
      currentStageId: 1,
      stagesStatus: {
        1: 'unlocked',
        2: 'locked',
        3: 'locked',
        4: 'locked',
        5: 'locked',
      },
      questionAttempts: {},
      totalScore: 0,
      lastUpdated: new Date().toISOString(),
    };
    this.saveSession(freshSession);
    return freshSession;
  },

  // Xóa sạch phiên chơi
  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
