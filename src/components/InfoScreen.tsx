import React, { useState } from 'react';
import type { PlayerProfile, SavedGameSession } from '../types/game';
import { soundService } from '../services/sound';
import { SoundToggle } from './SoundToggle';
import { ArrowLeft, User, School, AlertCircle, RotateCcw, Play, Info } from 'lucide-react';

interface InfoScreenProps {
  initialProfile: PlayerProfile;
  savedSession: SavedGameSession | null;
  onSubmit: (profile: PlayerProfile, isNewRun: boolean) => void;
  onResume: () => void;
  onBack: () => void;
}

export const InfoScreen: React.FC<InfoScreenProps> = ({
  initialProfile,
  savedSession,
  onSubmit,
  onResume,
  onBack,
}) => {
  const [name, setName] = useState(initialProfile.name || 'Thùy Đỗ');
  const [className, setClassName] = useState(initialProfile.className || '6A');
  const [classCode, setClassCode] = useState(initialProfile.classCode || 'KHTN6A');
  const [studentId, setStudentId] = useState(initialProfile.studentId || 'HS01');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasSavedProgress = savedSession && (savedSession.totalScore > 0 || savedSession.currentStageId > 1);

  const handleSubmit = (e: React.FormEvent, isNewRun: boolean) => {
    e.preventDefault();
    soundService.playClick();

    if (!classCode.trim()) {
      setErrorMessage('Em vui lòng nhập Mã lớp do thầy/cô cung cấp nhé (vd: KHTN6A)!');
      soundService.playWrong();
      return;
    }

    if (!studentId.trim()) {
      setErrorMessage('Em vui lòng nhập Mã học sinh của mình nhé (vd: HS01)!');
      soundService.playWrong();
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Em vui lòng nhập họ và tên của mình nhé!');
      soundService.playWrong();
      return;
    }

    if (!className) {
      setErrorMessage('Em vui lòng chọn lớp học của mình nhé!');
      soundService.playWrong();
      return;
    }

    setErrorMessage(null);
    soundService.playStart();
    onSubmit(
      {
        name: name.trim(),
        className,
        classCode: classCode.trim().toUpperCase(),
        studentId: studentId.trim().toUpperCase(),
      },
      isNewRun
    );
  };

  const handleBack = () => {
    soundService.playClick();
    onBack();
  };

  return (
    <div className="game-stage-wrapper">
      <div className="game-stage 16-9-container info-stage screen-fade-enter">
        {/* Nền phòng thí nghiệm phủ tối và làm mờ theo đúng yêu cầu */}
        <div className="info-bg-layer">
          <img
            src="/assets/2.jpg"
            alt="Phòng thí nghiệm khoa học"
            className="info-bg-img"
          />
          <div className="info-bg-overlay" />
        </div>

        {/* Thanh điều hướng trên cùng */}
        <div className="stage-top-controls">
          <button
            onClick={handleBack}
            className="back-nav-btn interactive-glow-btn"
            title="Quay lại trang bắt đầu"
          >
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            <span>Quay lại</span>
          </button>
          <SoundToggle />
        </div>

        {/* Biểu mẫu thật thiết kế chuẩn mực theo mẫu tham chiếu 6.jpg */}
        <div className="info-modal-wrapper">
          <div className="info-modal-card">
            {/* Biểu tượng bình tam giác trong vòng tròn phát sáng */}
            <div className="modal-icon-ring">
              <div className="modal-icon-inner">
                <svg
                  className="w-10 h-10 text-cyan-300 drop-shadow-glow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 2v7.31L4.15 19.3A2 2 0 0 0 5.86 22h12.28a2 2 0 0 0 1.71-2.7L14 9.31V2" />
                  <path d="M8.5 2h7" />
                  <path d="M7 16h10" />
                </svg>
              </div>
            </div>

            {/* Tiêu đề biểu mẫu */}
            <h1 className="modal-title">
              <span className="modal-title-cyan">THÔNG TIN</span>
              <span className="modal-title-white">NHÀ KHOA HỌC NHÍ</span>
            </h1>
            <p className="modal-subtitle">Hãy nhập thông tin để bắt đầu nhiệm vụ!</p>

            {/* Thông báo lỗi nếu thiếu dữ liệu */}
            {errorMessage && (
              <div className="info-error-alert form-error-banner animate-shake">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-amber-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form nhập liệu */}
            <form noValidate onSubmit={(e) => handleSubmit(e, true)} className="info-form">
              {/* Hàng 1: Mã lớp & Mã học sinh (để giáo viên quản lý kết quả) */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="form-group text-left">
                  <label htmlFor="student-class-code" className="form-label text-[11px] font-bold text-slate-300 mb-1 flex items-center">
                    <School className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                    <span>MÃ LỚP</span>
                  </label>
                  <div className="input-field-wrapper">
                    <input
                      id="student-class-code"
                      type="text"
                      value={classCode}
                      onChange={(e) => {
                        setClassCode(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="vd: KHTN6A"
                      className="sci-fi-input font-mono uppercase text-xs p-2 rounded-xl w-full"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                <div className="form-group text-left">
                  <label htmlFor="student-id" className="form-label text-[11px] font-bold text-slate-300 mb-1 flex items-center">
                    <User className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                    <span>MÃ HỌC SINH</span>
                  </label>
                  <div className="input-field-wrapper">
                    <input
                      id="student-id"
                      type="text"
                      value={studentId}
                      onChange={(e) => {
                        setStudentId(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="vd: HS01"
                      className="sci-fi-input font-mono uppercase text-xs p-2 rounded-xl w-full"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Hàng 2: Họ và Tên */}
              <div className="form-group mb-3 text-left">
                <label htmlFor="student-name" className="form-label text-[11px] font-bold text-slate-300 mb-1 flex items-center">
                  <User className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                  <span>HỌ VÀ TÊN</span>
                </label>
                <div className="input-field-wrapper">
                  <input
                    id="student-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Nhập họ và tên của em..."
                    className="sci-fi-input text-xs p-2 rounded-xl w-full"
                    maxLength={35}
                    required
                  />
                </div>
              </div>

              {/* Hàng 3: Chọn Lớp */}
              <div className="form-group mb-3 text-left">
                <label htmlFor="student-class" className="form-label text-[11px] font-bold text-slate-300 mb-1 flex items-center">
                  <School className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                  <span>LỚP HỌC</span>
                </label>
                <div className="input-field-wrapper">
                  <select
                    id="student-class"
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="sci-fi-select text-xs p-2 rounded-xl w-full"
                    required
                  >
                    <option value="6A">Lớp 6A</option>
                    <option value="6B">Lớp 6B</option>
                    <option value="6C">Lớp 6C</option>
                    <option value="6D">Lớp 6D</option>
                    <option value="6E">Lớp 6E</option>
                    <option value="6G">Lớp 6G</option>
                    <option value="Khối 6">Khối 6 (Chung)</option>
                    <option value="Khách">Nhà thám hiểm tự do</option>
                  </select>
                </div>
              </div>

              {/* TÙY CHỌN TIẾP TỤC HOẶC BẮT ĐẦU LƯỢT MỚI */}
              {hasSavedProgress ? (
                <div className="info-session-options">
                  <button
                    type="button"
                    onClick={onResume}
                    className="submit-orange-button resume-orange-btn interactive-glow-btn"
                  >
                    <Play className="w-4 h-4 fill-current mr-2" />
                    <span>TIẾP TỤC LƯỢT ĐANG CHƠI ({savedSession.totalScore} ĐIỂM)</span>
                  </button>

                  <button
                    type="submit"
                    className="info-new-run-btn interactive-glow-btn"
                    title="Bắt đầu lượt mới, điểm số sẽ tính lại từ 0"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    <span>BẮT ĐẦU LƯỢT CHƠI MỚI (RESET 0 ĐIỂM)</span>
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  className="submit-orange-button interactive-glow-btn"
                >
                  <span className="btn-icon">🚀</span>
                  <span className="btn-text">VÀO BẢN ĐỒ THỬ THÁCH</span>
                </button>
              )}
            </form>

            {/* Lưu ý lưu trữ tạm thời */}
            <div className="info-storage-disclaimer">
              <Info className="w-3.5 h-3.5 mr-1 text-cyan-400 inline" />
              <span>Tiến độ lưu tạm trên trình duyệt (Chưa kết nối máy chủ giáo viên).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
