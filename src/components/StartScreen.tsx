import React from 'react';
import { soundService } from '../services/sound';
import { SoundToggle } from './SoundToggle';
import type { SavedGameSession } from '../types/game';
import { Play, RotateCcw, ShieldCheck } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  savedSession: SavedGameSession | null;
  onResumeSession?: () => void;
  onStartNewRun?: () => void;
  onOpenTeacherArea?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  savedSession,
  onResumeSession,
  onStartNewRun,
  onOpenTeacherArea,
}) => {
  const handleButtonClick = () => {
    soundService.playStart();
    onStart();
  };

  const hasProgress = savedSession && (savedSession.totalScore > 0 || savedSession.currentStageId > 1);

  return (
    <div className="game-stage-wrapper">
      <div className="game-stage 16-9-container screen-fade-enter">
        {/* Background Image: Hành trình nhà khoa học nhí */}
        <img
          src="/assets/5.jpg"
          alt="Hành trình nhà khoa học nhí — Chinh phục đo chiều dài"
          className="stage-bg-image"
          draggable={false}
        />

        {/* Top Control Bar: Audio toggle & Teacher area */}
        <div className="stage-top-controls">
          {onOpenTeacherArea && (
            <button
              onClick={() => {
                soundService.playClick();
                onOpenTeacherArea();
              }}
              className="teacher-portal-shortcut-btn interactive-glow-btn"
              title="Dành cho giáo viên: Soạn bài & xem kết quả"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-cyan-300" />
              <span>DÀNH CHO GIÁO VIÊN</span>
            </button>
          )}
          <SoundToggle />
        </div>

        {/* 
          NÚT HTML THẬT TRÙNG VÙNG "BẮT ĐẦU HÀNH TRÌNH" TRÊN 5.JPG
          - Tọa độ chính xác theo tỷ lệ % ảnh: left 36.5%, top 79.2%, width 30.8%, height 14.8%
          - Không hiển thị chữ trùng lặp trên ảnh
          - Chỉ phát âm thanh sau thao tác bấm của người chơi
        */}
        <button
          type="button"
          onClick={handleButtonClick}
          className="start-hotspot-button interactive-glow-btn"
          aria-label="Bắt đầu hành trình"
          title="Nhấn để bắt đầu hành trình khoa học!"
        >
          <span className="hotspot-glow-ring" />
          <span className="hotspot-shimmer" />
        </button>

        {/* NẾU ĐÃ CÓ TIẾN ĐỘ ĐƯỢC LƯU TRÊN TRÌNH DUYỆT: HIỂN THỊ CHỈ DẪN TIẾP TỤC HOẶC LÀM MỚI */}
        {hasProgress && onResumeSession && onStartNewRun ? (
          <div className="start-resume-floater animate-fade-in">
            <div className="resume-info">
              <span>Đang lưu lượt chơi: <strong>{savedSession.playerProfile.name}</strong> ({savedSession.playerProfile.className}) • Điểm: <strong>{savedSession.totalScore}đ</strong></span>
            </div>
            <div className="resume-btns">
              <button onClick={onResumeSession} className="resume-btn interactive-glow-btn">
                <Play className="w-3.5 h-3.5 mr-1" />
                <span>Tiếp tục chơi</span>
              </button>
              <button onClick={onStartNewRun} className="restart-btn interactive-glow-btn" title="Bắt đầu lượt mới (reset điểm)">
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Lượt mới</span>
              </button>
            </div>
          </div>
        ) : (
          /* Chỉ dẫn phụ cho người chơi lần đầu */
          <div className="start-hint-banner">
            ✨ Nhấn vào nút <strong>Bắt đầu hành trình</strong> để tham gia khám phá thế giới đo lường!
          </div>
        )}
      </div>
    </div>
  );
};
