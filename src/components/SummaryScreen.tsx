import React, { useState, useEffect } from 'react';
import type { PlayerProfile, SavedGameSession, Stage } from '../types/game';
import { soundService } from '../services/sound';
import { SoundToggle } from './SoundToggle';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Star, 
  RotateCcw, 
  Map, 
  CheckCircle2, 
  Info,
  Sparkles
} from 'lucide-react';

interface SummaryScreenProps {
  playerProfile: PlayerProfile;
  session: SavedGameSession;
  stages: Stage[];
  onStartNewRun: () => void;
  onBackToMap: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  playerProfile,
  session,
  stages,
  onStartNewRun,
  onBackToMap,
}) => {
  const [chestOpened, setChestOpened] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);

  const totalScore = session.totalScore;
  const attempts = Object.values(session.questionAttempts);
  const totalCompleted = attempts.filter((a) => a.isCorrect).length;
  const firstTryCount = attempts.filter((a) => a.isCorrect && a.attemptsCount === 1).length;
  const retryCount = attempts.filter((a) => a.isCorrect && a.attemptsCount > 1).length;

  // Tự động mở rương sau 0.6 giây hoặc người chơi chạm mở
  useEffect(() => {
    const timer = setTimeout(() => {
      openTreasureChest();
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Hiệu ứng tăng dần điểm số từ 0 lên totalScore
  useEffect(() => {
    if (!chestOpened) return;

    let start = 0;
    const duration = 1200; // 1.2s
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = totalScore / steps;

    const counter = setInterval(() => {
      start += increment;
      if (start >= totalScore) {
        setDisplayedScore(totalScore);
        clearInterval(counter);
      } else {
        setDisplayedScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(counter);
  }, [chestOpened, totalScore]);

  const openTreasureChest = () => {
    if (chestOpened) return;
    setChestOpened(true);
    soundService.playChestOpen();

    const isReduced = document.documentElement.classList.contains('reduced-motion');
    if (!isReduced) {
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.5 },
      });
    }
  };

  return (
    <div className="game-stage-wrapper">
      <div className="game-stage 16-9-container summary-stage screen-fade-enter">
        {/* Nền kho báu vương miện rực rỡ 3.jpg */}
        <img
          src="/assets/3.jpg"
          alt="Kho báu nhà khoa học"
          className="stage-bg-image summary-bg"
          draggable={false}
        />
        <div className="summary-bg-overlay" />

        {/* Thanh điều khiển trên cùng */}
        <div className="stage-top-controls">
          <button
            onClick={() => {
              soundService.playClick();
              onBackToMap();
            }}
            className="back-nav-btn interactive-glow-btn"
          >
            <Map className="w-4 h-4 mr-1.5 inline" />
            <span>Bản đồ</span>
          </button>
          <SoundToggle />
        </div>

        {/* BẢNG TỔNG KẾT TOÀN DIỆN VỚI HIỆU ỨNG MỞ RƯƠNG */}
        <div className="summary-card-wrapper animate-zoom-in">
          <div className="summary-card">
            
            {/* KHU VỰC DIỄN HOẠT MỞ RƯƠNG KHO BÁU & CÂY THƯỚC VÀNG VƯƠNG MIỆN */}
            <div 
              className={`chest-animation-stage ${chestOpened ? 'chest-is-open' : 'chest-is-closed'}`}
              onClick={openTreasureChest}
              title={chestOpened ? 'Rương báu đã mở!' : 'Chạm để mở rương kho báu!'}
            >
              {/* Ánh sáng vàng tỏa ra khi rương mở */}
              {chestOpened && <div className="chest-light-rays animate-sunburst-spin" aria-hidden="true" />}

              {/* Rương báu vector đồ họa nổi */}
              <div className="chest-graphic-box">
                {/* CÂY THƯỚC VÀNG HOÀNG GIA BAY LÊN TỪ TRONG RƯƠNG */}
                <div className={`royal-ruler-rising ${chestOpened ? 'ruler-elevated animate-floating-ruler' : ''}`}>
                  <div className="ruler-crown-tip">👑</div>
                  <div className="ruler-gold-body">
                    <span className="ruler-inscription">THƯỚC VÀNG KHTN</span>
                  </div>
                </div>

                {/* Thân rương */}
                <div className="chest-base-container">
                  <div className="chest-lid" />
                  <div className="chest-body">
                    <span className="chest-gem">💎</span>
                  </div>
                </div>
              </div>

              {!chestOpened && (
                <button type="button" className="tap-to-open-hint animate-bounce-subtle">
                  <Sparkles className="w-4 h-4 mr-1.5 text-yellow-300" />
                  <span>CHẠM ĐỂ MỞ RƯƠNG KHO BÁU</span>
                </button>
              )}
            </div>

            {/* DANH HIỆU & TIÊU ĐỀ */}
            <div className="summary-rank-badge">
              <Trophy className="w-4 h-4 mr-1 text-yellow-300" />
              <span>NHÀ KHOA HỌC XUẤT SẮC HẠNG NHẤT</span>
            </div>

            <h1 className="summary-title">CHINH PHỤC THÀNH CÔNG ĐO CHIỀU DÀI!</h1>
            <p className="summary-subtitle">
              Chúc mừng <strong>{playerProfile.name}</strong> ({playerProfile.className}) đã hoàn thành xuất sắc toàn bộ 5 chặng thử thách!
            </p>

            {/* BẢNG THỐNG KÊ TỔNG ĐIỂM (ANIMATED TICKER) */}
            <div className="summary-stats-grid">
              <div className="summary-stat-box score-box">
                <div className="stat-num">{displayedScore}</div>
                <div className="stat-desc">TỔNG ĐIỂM ĐẠT ĐƯỢC (Tối đa 150)</div>
              </div>
              <div className="summary-stat-box count-box">
                <div className="stat-num">{totalCompleted}/15</div>
                <div className="stat-desc">CÂU HỎI HOÀN THÀNH</div>
              </div>
              <div className="summary-stat-box first-try-box">
                <div className="stat-num">{firstTryCount}</div>
                <div className="stat-desc">ĐÚNG LẦN ĐẦU (+10đ)</div>
              </div>
              <div className="summary-stat-box retry-box">
                <div className="stat-num">{retryCount}</div>
                <div className="stat-desc">ĐÚNG SAU GỢI Ý (+5đ)</div>
              </div>
            </div>

            {/* 5 HUY HIỆU CỦA 5 CHẶNG ĐÃ CHINH PHỤC */}
            <div className="summary-stages-pills">
              {stages.map((st) => (
                <div key={st.id} className="summary-stage-pill">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1" />
                  <span className="pill-name">{st.shortTitle}</span>
                  <div className="pill-stars">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-300" />
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-300" />
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-300" />
                  </div>
                </div>
              ))}
            </div>

            {/* THÔNG BÁO MINH BẠCH VỀ LƯU TRỮ TRÌNH DUYỆT */}
            <div className="summary-sync-notice">
              <Info className="w-4 h-4 text-cyan-300 mr-2 flex-shrink-0" />
              <span>
                Tiến độ được lưu tạm thời trên trình duyệt cục bộ của thiết bị. <em>(Chưa kết nối đồng bộ máy chủ giáo viên).</em>
              </span>
            </div>

            {/* HÀNG NÚT ĐIỀU HƯỚNG */}
            <div className="summary-actions-row">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  onStartNewRun();
                }}
                className="submit-orange-button interactive-glow-btn summary-new-run-btn"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                <span>BẮT ĐẦU LƯỢT CHƠI MỚI (RESET 0 ĐIỂM)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  onBackToMap();
                }}
                className="summary-map-btn interactive-glow-btn"
              >
                <Map className="w-5 h-5 mr-2" />
                <span>XEM LẠI BẢN ĐỒ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
