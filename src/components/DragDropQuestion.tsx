import React, { useState } from 'react';
import type { GameQuestion, DragItem, DropTarget } from '../types/game';
import { StarParticles } from './effects/StarParticles';
import { soundService } from '../services/sound';
import { CheckCircle2, RotateCcw, Lightbulb, Sparkles } from 'lucide-react';

interface DragDropQuestionProps {
  question: GameQuestion;
  onAnswerSubmitted: (isCorrect: boolean) => void;
  isCompleted: boolean;
}

export const DragDropQuestion: React.FC<DragDropQuestionProps> = ({
  question,
  onAnswerSubmitted,
  isCompleted,
}) => {
  const { dragItems = [], dropTargets = [] } = question;

  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showStars, setShowStars] = useState(false);

  const placedItemIds = new Set(Object.values(placements));
  const availableItems = dragItems.filter((item) => !placedItemIds.has(item.id));

  // 1. Chạm chọn (Tap-to-select)
  const handleItemClick = (item: DragItem) => {
    if (isChecked || isCompleted) return;
    soundService.playClick();
    if (selectedItemId === item.id) {
      setSelectedItemId(null);
    } else {
      setSelectedItemId(item.id);
    }
  };

  // 2. Chạm đích để đặt thẻ
  const handleTargetClick = (target: DropTarget) => {
    if (isChecked || isCompleted) return;
    soundService.playClick();

    if (placements[target.id] && !selectedItemId) {
      const newPlacements = { ...placements };
      delete newPlacements[target.id];
      setPlacements(newPlacements);
      return;
    }

    if (selectedItemId) {
      setPlacements((prev) => ({
        ...prev,
        [target.id]: selectedItemId,
      }));
      setSelectedItemId(null);
    }
  };

  // 3. Kéo thả chuột
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (isChecked || isCompleted) return;
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (isChecked || isCompleted) return;
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) {
      soundService.playClick();
      setPlacements((prev) => ({
        ...prev,
        [targetId]: itemId,
      }));
      setSelectedItemId(null);
    }
  };

  // 4. Kiểm tra đáp án
  const handleCheckAnswer = () => {
    let allCorrect = true;
    for (const target of dropTargets) {
      if (placements[target.id] !== target.acceptedItemId) {
        allCorrect = false;
        break;
      }
    }

    setIsChecked(true);
    if (allCorrect) {
      soundService.playCorrect();
      setShowStars(true);
      onAnswerSubmitted(true);
    } else {
      soundService.playWrong();
      setShowStars(false);
      setShowHint(true);
      onAnswerSubmitted(false);
    }
  };

  const handleRetry = () => {
    soundService.playClick();
    setIsChecked(false);
    setShowStars(false);
  };

  const allSlotsFilled = dropTargets.length > 0 && dropTargets.every((t) => !!placements[t.id]);
  const isAllCorrect = dropTargets.every((t) => placements[t.id] === t.acceptedItemId);

  return (
    <div className="drag-drop-interactive-area">
      {/* Hướng dẫn thao tác */}
      <div className="dnd-guidance-badge">
        <Sparkles className="w-4 h-4 text-cyan-300 mr-1.5" />
        <span>Kéo thả thẻ vào ô đích, hoặc <strong>chạm chọn thẻ rồi chạm ô đích</strong></span>
      </div>

      {/* KHO THẺ LỰA CHỌN */}
      <div className="drag-items-pool">
        <div className="pool-label">KHO THẺ LỰA CHỌN:</div>
        <div className="pool-items-row">
          {availableItems.length > 0 ? (
            availableItems.map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <div
                  key={item.id}
                  draggable={!isChecked && !isCompleted}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onClick={() => handleItemClick(item)}
                  className={`draggable-chip interactive-glow-btn ${isSelected ? 'chip-selected' : ''}`}
                  title="Nhấn giữ kéo hoặc chạm chọn"
                >
                  {item.icon && <span className="chip-icon">{item.icon}</span>}
                  <span className="chip-text">{item.text}</span>
                  {isSelected && <span className="chip-selected-indicator">ĐÃ CHỌN</span>}
                </div>
              );
            })
          ) : (
            <div className="pool-empty-hint">Đã đưa tất cả thẻ vào các ô bên dưới. Hãy nhấn Kiểm tra!</div>
          )}
        </div>
      </div>

      {/* KHU VỰC CÁC Ô ĐÍCH */}
      <div className="drop-targets-grid">
        {dropTargets.map((target) => {
          const placedItemId = placements[target.id];
          const placedItem = dragItems.find((i) => i.id === placedItemId);
          const isCorrect = isChecked && placedItemId === target.acceptedItemId;
          const isWrong = isChecked && placedItemId && placedItemId !== target.acceptedItemId;

          return (
            <div
              key={target.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, target.id)}
              onClick={() => handleTargetClick(target)}
              className={`drop-target-slot ${placedItem ? 'has-item' : ''} ${
                isCorrect ? 'slot-correct' : isWrong ? 'slot-wrong-gentle animate-gentle-nudge' : ''
              } ${selectedItemId && !placedItem ? 'slot-highlight-ready' : ''}`}
            >
              <div className="target-header">
                <span className="target-label">{target.label}</span>
                {isCorrect && (
                  <div className="relative inline-flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto animate-scale-check" />
                    {showStars && <StarParticles count={5} />}
                  </div>
                )}
                {isWrong && <span className="wrong-gentle-chip">Chưa đúng</span>}
              </div>

              {placedItem ? (
                <div className="placed-chip">
                  {placedItem.icon && <span className="chip-icon">{placedItem.icon}</span>}
                  <span className="chip-text">{placedItem.text}</span>
                  {!isChecked && !isCompleted && (
                    <span className="remove-tip" title="Chạm để gỡ ra">✕</span>
                  )}
                </div>
              ) : (
                <div className="empty-slot-placeholder">
                  {selectedItemId ? '👉 Chạm vào đây để đặt thẻ' : 'Kéo thả hoặc chạm đặt thẻ vào đây'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* THANH ĐIỀU KHIỂN & GỢI Ý */}
      <div className="dnd-actions-bar">
        {!isChecked ? (
          <button
            type="button"
            disabled={!allSlotsFilled}
            onClick={handleCheckAnswer}
            className={`submit-orange-button interactive-glow-btn check-answer-btn ${!allSlotsFilled ? 'btn-disabled' : ''}`}
          >
            <span>{allSlotsFilled ? 'KIỂM TRA ĐÁP ÁN' : 'HÃY XẾP ĐỦ CÁC Ô ĐÍCH'}</span>
          </button>
        ) : (
          <div className="dnd-result-actions">
            {!isAllCorrect ? (
              <button
                type="button"
                onClick={handleRetry}
                className="retry-btn interactive-glow-btn"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                <span>Thử lại (Lần thử tiếp theo: 5 điểm)</span>
              </button>
            ) : (
              <div className="dnd-success-banner animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2" />
                <span>Chính xác tuyệt đối! Em thật xuất sắc.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KHUNG GỢI Ý KHI LÀM SAI (PHẢN HỒI ÊM DỊU) */}
      {showHint && isChecked && !isAllCorrect && (
        <div className="dnd-hint-card animate-fade-in">
          <div className="hint-header">
            <Lightbulb className="w-4 h-4 text-amber-400 mr-1.5" />
            <span>GỢI Ý SƯ PHẠM:</span>
          </div>
          <p className="hint-text">{question.hint}</p>
        </div>
      )}
    </div>
  );
};
