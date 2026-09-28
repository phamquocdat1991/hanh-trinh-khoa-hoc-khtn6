import React, { useState } from 'react';
import type { Stage, GameQuestion, PlayerProfile, QuestionAttemptState } from '../types/game';
import { getQuestionsForStage } from '../data/questionsData';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { DragDropQuestion } from './DragDropQuestion';
import { soundService } from '../services/sound';
import { SoundToggle } from './SoundToggle';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Flame, 
  Star, 
  HelpCircle,
  Award,
  ChevronRight,
  Sparkles,
  Trophy,
  CheckCircle2
} from 'lucide-react';

interface ChallengeScreenProps {
  stage: Stage;
  playerProfile: PlayerProfile;
  sessionScore: number;
  questionAttempts: Record<string, QuestionAttemptState>;
  onRecordQuestionResult: (
    questionId: string, 
    isCorrect: boolean, 
    attemptsCount: number, 
    scoreAwarded: number
  ) => void;
  onCompleteStage: (stageId: number) => void;
  onBackToMap: () => void;
}

export const ChallengeScreen: React.FC<ChallengeScreenProps> = ({
  stage,
  playerProfile,
  sessionScore,
  questionAttempts,
  onRecordQuestionResult,
  onCompleteStage,
  onBackToMap,
}) => {
  const stageQuestions: GameQuestion[] = getQuestionsForStage(stage.id);

  // Khởi tạo vị trí câu hỏi đầu tiên chưa hoàn thành (hoặc câu 0 nếu chưa làm gì)
  const findFirstUnansweredIndex = () => {
    const idx = stageQuestions.findIndex((q) => !questionAttempts[q.id]?.isCorrect);
    return idx >= 0 ? idx : 0;
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(findFirstUnansweredIndex);
  const [combo, setCombo] = useState(0);
  const [attemptsOnCurrentQ, setAttemptsOnCurrentQ] = useState(1);
  const [isCurrentQDone, setIsCurrentQDone] = useState(() => {
    const initIdx = findFirstUnansweredIndex();
    const q = stageQuestions[initIdx];
    return q ? !!questionAttempts[q.id]?.isCorrect : false;
  });
  const [isStageFinished, setIsStageFinished] = useState(false);

  const currentQ: GameQuestion = stageQuestions[currentQuestionIndex] || stageQuestions[0];
  const existingAttempt = questionAttempts[currentQ.id];

  const handleAnswerResult = (isCorrect: boolean) => {
    if (isCorrect) {
      let pointsToAward = 0;
      if (!existingAttempt?.isCorrect) {
        pointsToAward = attemptsOnCurrentQ === 1 ? currentQ.pointsFirstTry : currentQ.pointsRetry;
      }

      setCombo((prev) => prev + 1);
      setIsCurrentQDone(true);

      onRecordQuestionResult(
        currentQ.id,
        true,
        attemptsOnCurrentQ,
        pointsToAward
      );
    } else {
      setAttemptsOnCurrentQ((prev) => prev + 1);
      setCombo(0);
    }
  };

  const handleNextQuestion = () => {
    soundService.playClick();
    if (currentQuestionIndex + 1 < stageQuestions.length) {
      const nextIdx = currentQuestionIndex + 1;
      const nextQ = stageQuestions[nextIdx];
      setCurrentQuestionIndex(nextIdx);
      setAttemptsOnCurrentQ(1);
      setIsCurrentQDone(nextQ ? !!questionAttempts[nextQ.id]?.isCorrect : false);
    } else {
      finishStage();
    }
  };

  const finishStage = () => {
    setIsStageFinished(true);
    soundService.playStageComplete();

    // Bắn pháo hoa ăn mừng nhẹ nhàng (tự tắt nếu bật chế độ giảm chuyển động)
    const isReduced = document.documentElement.classList.contains('reduced-motion');
    if (!isReduced) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleClaimReward = () => {
    soundService.playClick();
    onCompleteStage(stage.id);
  };

  return (
    <div className="game-stage-wrapper">
      <div className="game-stage 16-9-container challenge-stage screen-fade-enter">
        {/* Nền chặng tương ứng */}
        <img
          src={stage.image}
          alt={stage.title}
          className="stage-bg-image challenge-bg"
          draggable={false}
        />
        <div className="challenge-bg-overlay" />

        {/* THANH HUD PHÍA TRÊN - THEO THIẾT KẾ MẪU 7.JPG */}
        <div className="challenge-top-hud">
          {/* Thông tin nhà thám hiểm */}
          <div className="hud-badge player-hud-badge">
            <span className="badge-avatar">👦</span>
            <div className="badge-text-col">
              <span className="badge-sub">NHÀ THÁM HIỂM</span>
              <span className="badge-main">{playerProfile.name || 'Thùy Đỗ'}</span>
            </div>
          </div>

          {/* Điểm số trực tiếp */}
          <div className="hud-badge score-hud-badge">
            <Sparkles className="w-4 h-4 text-amber-300 mr-1" />
            <span className="hud-metric-label">ĐIỂM:</span>
            <span className="hud-metric-value">{sessionScore}</span>
          </div>

          {/* Chuỗi Combo */}
          <div className="hud-badge combo-hud-badge">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 mr-1" />
            <span className="hud-metric-label">COMBO:</span>
            <span className="hud-metric-value">x{combo}</span>
          </div>

          {/* Huy hiệu chặng đang chơi */}
          <div className="hud-badge stage-hud-badge">
            <span className="stage-hud-text">{stage.badge}</span>
          </div>

          {/* Thanh tiến độ 3 câu trong chặng */}
          <div className="hud-badge progress-hud-badge">
            <span className="hud-metric-label">TIẾN ĐỘ:</span>
            <span className="hud-metric-value">
              Câu {currentQuestionIndex + 1}/3
            </span>
          </div>

          {/* Điều khiển âm thanh & Thoát về bản đồ */}
          <div className="hud-actions-group">
            <SoundToggle />
            <button
              onClick={() => {
                soundService.playClick();
                onBackToMap();
              }}
              className="hud-back-btn interactive-glow-btn"
              title="Quay về Bản đồ"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KHU VỰC THỬ THÁCH CHÍNH */}
        {!isStageFinished ? (
          <div className="challenge-content-area">
            {/* Hộp câu hỏi kính mờ chuẩn 7.jpg */}
            <div className="question-glass-box">
              <div className="question-header-capsule">
                <span className="capsule-dot" />
                <span className="capsule-icon">⚗️</span>
                <span className="capsule-dot" />
              </div>

              {/* Mã câu hỏi & Loại tương tác */}
              <div className="question-meta-row">
                <span className="question-code-chip">{currentQ.id}</span>
                <span className="question-type-chip">
                  {currentQ.interactionType === 'multiple-choice' ? 'Trắc nghiệm 1 đáp án' : 'Kéo thả / Ghép nối'}
                </span>
                <span className="question-points-chip">
                  {attemptsOnCurrentQ === 1 ? '⭐ 10 điểm (Lần 1)' : '⭐ 5 điểm (Thử lại)'}
                </span>
              </div>

              {/* Nội dung câu hỏi */}
              <h2 className="question-text">{currentQ.content}</h2>
            </div>

            {/* ĐIỀU PHỐI 2 LOẠI TƯƠNG TÁC */}
            {currentQ.interactionType === 'multiple-choice' ? (
              <MultipleChoiceQuestion
                key={currentQ.id}
                question={currentQ}
                onAnswerSubmitted={handleAnswerResult}
                isCompleted={isCurrentQDone}
              />
            ) : (
              <DragDropQuestion
                key={currentQ.id}
                question={currentQ}
                onAnswerSubmitted={handleAnswerResult}
                isCompleted={isCurrentQDone}
              />
            )}

            {/* THANH GIẢI THÍCH SƯ PHẠM KHI ĐÃ HOÀN THÀNH CÂU HỎI */}
            {isCurrentQDone && (
              <div className="explanation-bar animate-fade-in">
                <div className="explanation-text-col">
                  <div className="explanation-title">
                    <HelpCircle className="w-4 h-4 mr-1 inline text-cyan-300" />
                    <strong>Giải thích khoa học:</strong>
                  </div>
                  <p className="explanation-body">{currentQ.explanation}</p>
                </div>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="next-question-btn interactive-glow-btn"
                >
                  <span>
                    {currentQuestionIndex + 1 < stageQuestions.length ? 'Câu tiếp theo' : 'Hoàn thành chặng'}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-1 inline" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* MÀN ĂN MỪNG: HUY HIỆU XUẤT HIỆN THEO ĐÚNG YÊU CẦU */
          <div className="stage-complete-modal-wrapper animate-fade-in">
            <div className="stage-complete-card stage-badge-celebration animate-zoom-in">
              {/* Vòng hào quang tia sáng xoay quanh huy hiệu */}
              <div className="badge-sunburst-halo" aria-hidden="true" />

              {/* HUY HIỆU XUẤT HIỆN (Stage Badge) */}
              <div className="stage-medal-emblem animate-badge-pop">
                <div className="medal-outer-ring">
                  <div className="medal-inner-core">
                    <span className="medal-icon">{stage.number === 1 ? '🌿' : stage.number === 2 ? '🏗️' : stage.number === 3 ? '🔬' : stage.number === 4 ? '🚀' : '👑'}</span>
                  </div>
                </div>
                <div className="medal-ribbon-tag">
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-300" />
                  <span>HUY HIỆU CHẶNG {stage.number}</span>
                </div>
              </div>

              <div className="victory-badge">XUẤT SẮC!</div>
              <h2 className="victory-title">ĐÃ CHINH PHỤC {stage.title.toUpperCase()}</h2>
              <p className="victory-subtitle">
                Em đã giải đáp đúng toàn bộ 3 thử thách đo chiều dài và vinh dự nhận được <strong>Huy hiệu Chặng {stage.number}</strong>!
              </p>

              {/* 3 Ngôi sao vàng */}
              <div className="victory-stars-row">
                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce" />
                <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-bounce delay-100" />
                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce delay-200" />
              </div>

              {/* Nút mở khóa chặng tiếp theo */}
              <button
                type="button"
                onClick={handleClaimReward}
                className="submit-orange-button interactive-glow-btn victory-claim-btn"
              >
                {stage.id === 5 ? (
                  <>
                    <Trophy className="w-5 h-5 mr-2 inline" />
                    <span>MỞ RƯƠNG KHO BÁU & XEM TỔNG ĐIỂM</span>
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 mr-2 inline" />
                    <span>MỞ KHÓA CHẶNG {stage.id + 1} TRÊN BẢN ĐỒ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
