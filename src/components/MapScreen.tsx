import React, { useState } from 'react';
import type { PlayerProfile, Stage } from '../types/game';
import { soundService } from '../services/sound';
import { SoundToggle } from './SoundToggle';
import { Lock, CheckCircle2, Star, Sparkles, LogOut, Info, Trophy, ShieldCheck } from 'lucide-react';

interface MapScreenProps {
  playerProfile: PlayerProfile;
  stages: Stage[];
  sessionScore: number;
  completedQuestionsCount: number;
  onSelectStage: (stage: Stage) => void;
  onChangeProfile: () => void;
  onViewSummary?: () => void;
  onOpenTeacherArea?: () => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  playerProfile,
  stages,
  sessionScore,
  completedQuestionsCount,
  onSelectStage,
  onChangeProfile,
  onViewSummary,
  onOpenTeacherArea,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalStars = stages.reduce((acc, s) => acc + (s.status === 'completed' ? 3 : 0), 0);
  const allStagesCompleted = stages.every((s) => s.status === 'completed');

  const handleStageClick = (stage: Stage) => {
    if (stage.status === 'locked') {
      soundService.playWrong();
      showToast(`🔒 Chặng ${stage.number} chưa mở! Hãy hoàn thành Chặng ${stage.number - 1} trước nhé.`);
      return;
    }

    soundService.playClick();
    onSelectStage(stage);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <div className="game-stage-wrapper">
      <div className="game-stage 16-9-container map-stage screen-fade-enter">
        {/* Bản đồ nền thế giới các đảo bay khoa học */}
        <img
          src="/assets/5.jpg"
          alt="Bản đồ Hành trình khoa học"
          className="stage-bg-image"
          draggable={false}
        />

        {/* Lớp phủ tương tác nhẹ nhàng tăng độ nổi cho các điểm đánh dấu */}
        <div className="map-lighting-overlay" />

        {/* Thanh HUD phía trên: Thông tin người chơi, Điểm, Sao, Nút âm thanh */}
        <div className="map-top-hud">
          {/* Huy hiệu thông tin nhà thám hiểm nhí */}
          <div className="hud-player-card">
            <div className="hud-avatar-ring">
              <span className="hud-avatar-icon">🧑‍🔬</span>
            </div>
            <div className="hud-player-text">
              <div className="hud-player-label">NHÀ THÁM HIỂM</div>
              <div className="hud-player-name">
                {playerProfile.name || 'Nhà khoa học nhí'}
                <span className="hud-class-badge">{playerProfile.className || '6A'}</span>
              </div>
            </div>
            <button
              onClick={onChangeProfile}
              className="hud-edit-profile-btn interactive-glow-btn"
              title="Đổi thông tin thí sinh"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Huy hiệu thành tích: Điểm, Câu hỏi, Sao */}
          <div className="hud-stats-group">
            <div className="hud-stat-pill score-pill">
              <Sparkles className="w-4 h-4 text-amber-300 mr-1.5" />
              <span className="stat-label">ĐIỂM:</span>
              <span className="stat-val">{sessionScore}</span>
            </div>

            <div className="hud-stat-pill progress-pill">
              <span className="stat-label">TIẾN ĐỘ:</span>
              <span className="stat-val">{completedQuestionsCount}/15</span>
            </div>

            <div className="hud-stat-pill stars-pill">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-400 mr-1.5" />
              <span className="stat-label">SAO:</span>
              <span className="stat-val">{totalStars}/15</span>
            </div>

            {allStagesCompleted && onViewSummary && (
              <button
                onClick={onViewSummary}
                className="hud-summary-shortcut-btn animate-bounce-subtle interactive-glow-btn"
                title="Xem Bảng tổng kết thành tích"
              >
                <Trophy className="w-4 h-4 mr-1 text-yellow-300" />
                <span>TỔNG KẾT</span>
              </button>
            )}

            {onOpenTeacherArea && (
              <button
                onClick={() => {
                  soundService.playClick();
                  onOpenTeacherArea();
                }}
                className="hud-stat-pill interactive-glow-btn text-cyan-300 hover:text-white hover:border-cyan-400"
                title="Khu vực quản trị giáo viên: Soạn bài & xem kết quả"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400 mr-1" />
                <span className="text-[11px] font-bold">GIÁO VIÊN</span>
              </button>
            )}

            <SoundToggle />
          </div>
        </div>

        {/* Đường nối giữa các chặng dạng SVG ánh sáng neon */}
        <svg className="map-connections-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffb703" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff007f" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glowEffect">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 40.5 43.5 Q 43 55 49 64 Q 58 55 66.5 46 Q 71 60 75.5 71 Q 82 60 89 49"
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="0.8"
            strokeDasharray="2, 1.5"
            className="animated-map-path"
            filter="url(#glowEffect)"
          />
        </svg>

        {/* 5 ĐIỂM TƯƠNG TÁC TƯƠNG ỨNG CÁC KHU VỰC TRÊN BẢN ĐỒ */}
        <div className="map-pins-layer">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isUnlocked = stage.status === 'unlocked';
            const isLocked = stage.status === 'locked';

            return (
              <div
                key={stage.id}
                className={`map-stage-pin-anchor stage-${stage.number} status-${stage.status}`}
                style={{
                  left: `${stage.pinCoords.x}%`,
                  top: `${stage.pinCoords.y}%`,
                }}
              >
                {/* Vòng hào quang phát sáng xung quanh điểm chơi */}
                {isUnlocked && <div className="pin-pulse-beacon" />}
                {isCompleted && <div className="pin-completed-halo" />}

                {/* Nút bấm tương tác chính của Chặng */}
                <button
                  type="button"
                  onClick={() => handleStageClick(stage)}
                  className={`stage-pin-button interactive-glow-btn ${isUnlocked ? 'animate-bounce-subtle' : ''}`}
                  aria-label={`Chặng ${stage.number}: ${stage.title} (${stage.status})`}
                >
                  <div className="pin-inner-badge">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-300 drop-shadow" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-slate-400" />
                    ) : (
                      <span className="pin-number-text">{stage.number}</span>
                    )}
                  </div>

                  {/* Nhãn tên chặng bám sát điểm pin */}
                  <div className="pin-title-tag">
                    <span className="tag-number">Chặng {stage.number}</span>
                    <span className="tag-name">{stage.shortTitle}</span>
                  </div>

                  {/* Hiệu ứng trạng thái */}
                  {isUnlocked && (
                    <span className="pin-ready-chip">CHƠI NGAY (3 CÂU)</span>
                  )}
                  {isCompleted && (
                    <div className="pin-stars-row">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-300" />
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-300" />
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-300" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Thanh ghi chú / hướng dẫn dưới đáy bản đồ */}
        <div className="map-bottom-legend">
          <div className="legend-item">
            <span className="legend-dot status-active" />
            <span>Sẵn sàng (3 câu/chặng)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot status-done" />
            <span>Đã hoàn thành</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot status-locked" />
            <span>Chưa mở khóa</span>
          </div>
        </div>

        {/* Toast thông báo khi chạm vào chặng chưa mở */}
        {toastMessage && (
          <div className="map-toast-notification animate-fade-in">
            <Info className="w-4 h-4 text-cyan-300 mr-2 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
