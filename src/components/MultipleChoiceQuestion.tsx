import React, { useState } from 'react';
import type { GameQuestion } from '../types/game';
import { SvgRuler } from './illustrations/SvgRuler';
import { StarParticles } from './effects/StarParticles';
import { soundService } from '../services/sound';
import { CheckCircle2, RotateCcw, Lightbulb } from 'lucide-react';

interface MultipleChoiceQuestionProps {
  question: GameQuestion;
  onAnswerSubmitted: (isCorrect: boolean) => void;
  isCompleted: boolean;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  onAnswerSubmitted,
  isCompleted,
}) => {
  const [selectedKey, setSelectedKey] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showStars, setShowStars] = useState(false);

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered || isCompleted) return;

    soundService.playClick();
    setSelectedKey(key);
    setIsAnswered(true);

    const isCorrect = key === question.correctAnswer;
    if (isCorrect) {
      soundService.playCorrect();
      setShowStars(true);
      onAnswerSubmitted(true);
    } else {
      soundService.playWrong();
      setShowStars(false);
      onAnswerSubmitted(false);
    }
  };

  const handleRetry = () => {
    soundService.playClick();
    setSelectedKey(null);
    setIsAnswered(false);
    setShowStars(false);
  };

  return (
    <div className="multiple-choice-interactive-area">
      {/* NẾU CÓ MINH HỌA THƯỚC SVG TOÁN HỌC CHÍNH XÁC */}
      {question.illustration && (
        <div className="question-illustration-wrapper">
          <SvgRuler config={question.illustration} />
        </div>
      )}

      {/* LƯỚI 4 ĐÁP ÁN (A, B, C, D) */}
      <div className="options-grid">
        {(question.options || []).map((option) => {
          const isSelected = selectedKey === option.key;
          const isCorrect = option.key === question.correctAnswer;
          let optionClass = 'option-btn interactive-glow-btn';

          if (isAnswered) {
            if (isCorrect) {
              optionClass += ' option-correct';
            } else if (isSelected) {
              optionClass += ' option-wrong-gentle animate-gentle-nudge';
            } else {
              optionClass += ' option-dimmed';
            }
          }

          return (
            <button
              key={option.key}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelectOption(option.key)}
              className={optionClass}
            >
              <span className="option-badge">{option.key}</span>
              <span className="option-text">{option.text}</span>
              
              {/* KHI ĐÚNG: HIỂN THỊ DẤU KIỂM VÀ HIỆU ỨNG SAO */}
              {isAnswered && isCorrect && (
                <div className="correct-feedback-badge">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto flex-shrink-0 animate-scale-check" />
                  {showStars && <StarParticles count={8} />}
                </div>
              )}

              {/* KHI SAI: BIỂU TƯỢNG NHẸ NHÀNG, KHÔNG GÂY CĂNG THẲNG */}
              {isAnswered && isSelected && !isCorrect && (
                <span className="wrong-gentle-icon" title="Chưa đúng">
                  💡
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* KHUNG THỬ LẠI & GỢI Ý KHI TRẢ LỜI CHƯA ĐÚNG (PHẢN HỒI NHẸ NHÀNG) */}
      {isAnswered && selectedKey !== question.correctAnswer && (
        <div className="mcq-wrong-feedback-panel animate-fade-in">
          <div className="mcq-hint-box">
            <div className="hint-header">
              <Lightbulb className="w-4 h-4 text-amber-400 mr-1.5" />
              <span>GỢI Ý KHOA HỌC:</span>
            </div>
            <p className="hint-text">{question.hint}</p>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="retry-btn interactive-glow-btn"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>Thử lại (Lần thử tiếp theo: 5 điểm)</span>
          </button>
        </div>
      )}
    </div>
  );
};
