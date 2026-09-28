import React from 'react';
import type { Stage } from '../types/game';
import { soundService } from '../services/sound';
import { SoundToggle } from './SoundToggle';
import { ArrowLeft, Target, Award, Play } from 'lucide-react';

interface StageIntroScreenProps {
  stage: Stage;
  onStartChallenge: (stage: Stage) => void;
  onBackToMap: () => void;
}

export const StageIntroScreen: React.FC<StageIntroScreenProps> = ({
  stage,
  onStartChallenge,
  onBackToMap,
}) => {
  const handleStart = () => {
    soundService.playStart();
    onStartChallenge(stage);
  };

  const handleBack = () => {
    soundService.playClick();
    onBackToMap();
  };

  return (
    <div className="game-stage-wrapper">
      <div className="game-stage 16-9-container stage-intro-stage screen-fade-enter">
        {/* 
          ẢNH NỀN CHẶNG THỰC TẾ ĐƯỢC CUNG CẤP:
          - Chặng 1: 4.jpg (Khu rừng đơn vị đo)
          - Chặng 2: 1.jpg (Công trường thước đo)
          - Chặng 3: 2.jpg (Phòng thí nghiệm sai số)
          - Chặng 4: stage4_rocket.jpg (Ảnh cắt tạm từ vùng tên lửa trên 5.jpg)
          - Chặng 5: 3.jpg (Kho báu nhà khoa học)
        */}
        <img
          src={stage.image}
          alt={stage.title}
          className="stage-bg-image stage-intro-bg"
          draggable={false}
        />

        {/* Lớp bóng đổ bảo vệ độ tương phản chữ */}
        <div className="stage-intro-vignette" />

        {/* Thanh điều hướng trên cùng */}
        <div className="stage-top-controls">
          <button
            onClick={handleBack}
            className="back-nav-btn interactive-glow-btn"
            title="Quay lại Bản đồ thử thách"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 inline" />
            <span>Bản đồ</span>
          </button>
          <SoundToggle />
        </div>

        {/* Bảng thông tin nhiệm vụ nổi (Sci-fi Mission Briefing Card) */}
        <div className="stage-briefing-card-container">
          <div className="stage-briefing-card">
            {/* Huy hiệu chặng */}
            <div className="stage-briefing-badge">
              <span>{stage.badge}</span>
            </div>

            {/* Tên chặng */}
            <h1 className="stage-briefing-title">{stage.title}</h1>
            <p className="stage-briefing-desc">{stage.description}</p>

            {/* Mục tiêu ngắn gọn theo yêu cầu đề bài */}
            <div className="stage-objective-box">
              <div className="objective-header">
                <Target className="w-5 h-5 text-cyan-400 mr-2" />
                <span className="objective-label">MỤC TIÊU THỬ THÁCH</span>
              </div>
              <p className="objective-content">{stage.objective}</p>
            </div>

            {/* Phần thưởng đạt được */}
            <div className="stage-rewards-strip">
              <Award className="w-4 h-4 text-amber-400 mr-1.5" />
              <span>Phần thưởng hoàn thành: <strong>+{stage.scoreReward} Điểm</strong> & <strong>3 Sao ⭐</strong></span>
            </div>

            {/* Nút bắt đầu thử thách */}
            <div className="stage-briefing-actions">
              <button
                type="button"
                onClick={handleStart}
                className="submit-orange-button start-challenge-btn interactive-glow-btn"
              >
                <Play className="w-5 h-5 fill-current mr-2 inline" />
                <span>BẮT ĐẦU THỬ THÁCH</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
