import React, { useState } from 'react';
import { teacherStorageService } from '../../services/teacherStorage';
import { soundService } from '../../services/sound';
import { Lock, ShieldCheck, AlertCircle, X, KeyRound } from 'lucide-react';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();

    const res = teacherStorageService.authenticateTeacher(password);
    if (res.success) {
      soundService.playCorrect();
      setErrorMessage(null);
      setPassword('');
      onSuccess();
    } else {
      soundService.playWrong();
      setErrorMessage(res.message || 'Mật khẩu không hợp lệ');
    }
  };

  return (
    <div className="audio-settings-modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="audio-settings-card teacher-login-card animate-zoom-in" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        <div className="settings-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="settings-title text-base font-bold text-white">KHU VỰC QUẢN TRỊ GIÁO VIÊN</h3>
              <p className="text-xs text-slate-400">Dành riêng cho giáo viên bộ môn KHTN</p>
            </div>
          </div>
          <button onClick={onClose} className="close-settings-btn" title="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="teacher-login-form">
          <div className="login-security-notice mb-4 p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>BẢO VỆ PHÂN QUYỀN SƯ PHẠM</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Khu vực giáo viên được bảo vệ bằng mật khẩu. Học sinh không có quyền truy cập vào bảng soạn đề, đáp án và kết quả của các bạn khác.
            </p>
          </div>

          <div className="form-group text-left mb-4">
            <label className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>MẬT KHẨU GIÁO VIÊN:</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Nhập mật khẩu quản trị..."
              autoFocus
              className="sci-fi-input w-full px-3 py-2.5 rounded-xl text-sm"
            />
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
              <span>Mật khẩu mặc định: <code className="text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">giaovienkhtn2026</code></span>
            </div>
          </div>

          {errorMessage && (
            <div className="form-error-banner mb-4 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-600 hover:bg-slate-700/80 transition-all"
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400 shadow-lg shadow-cyan-900/50 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>ĐĂNG NHẬP</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
