import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Settings, X, Eye, Info } from 'lucide-react';
import { soundService } from '../services/sound';

interface SoundToggleProps {
  className?: string;
  onReducedMotionChange?: (reduced: boolean) => void;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ 
  className = '',
  onReducedMotionChange,
}) => {
  const [isMuted, setIsMuted] = useState(soundService.getSfxMuted());
  const [isBgmMuted, setIsBgmMuted] = useState(soundService.getBgmMuted());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Đọc cài đặt giảm chuyển động
    const savedMotion = localStorage.getItem('game_reduced_motion');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const initialReduced = savedMotion !== null ? savedMotion === 'true' : prefersReduced;
    
    setReducedMotion(initialReduced);
    applyReducedMotion(initialReduced);

    // Lắng nghe sự kiện thay đổi âm thanh giữa các màn hình
    const handleSoundChange = (e: Event) => {
      const customEvt = e as CustomEvent<{ sfxMuted: boolean; bgmMuted: boolean }>;
      if (customEvt.detail) {
        setIsMuted(customEvt.detail.sfxMuted);
        setIsBgmMuted(customEvt.detail.bgmMuted);
      }
    };

    window.addEventListener('game_sound_change', handleSoundChange);
    return () => {
      window.removeEventListener('game_sound_change', handleSoundChange);
    };
  }, []);

  const applyReducedMotion = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
    if (onReducedMotionChange) {
      onReducedMotionChange(enabled);
    }
  };

  // Nút tắt tiếng nhanh (luôn dễ tìm ở góc trên)
  const handleQuickMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = soundService.toggleAllMute();
    setIsMuted(newMuted);
    setIsBgmMuted(newMuted);
  };

  const handleToggleBgm = () => {
    const newBgm = soundService.toggleBgm();
    setIsBgmMuted(newBgm);
  };

  const handleToggleSfx = () => {
    const newSfx = soundService.toggleSfx();
    setIsMuted(newSfx);
  };

  const handleToggleReducedMotion = () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    localStorage.setItem('game_reduced_motion', String(nextVal));
    applyReducedMotion(nextVal);
    soundService.playClick();
  };

  return (
    <div className={`sound-controls-wrapper ${className}`}>
      {/* 1. NÚT TẮT TIẾNG NHANH - LUÔN DỄ TÌM */}
      <button
        onClick={handleQuickMute}
        className={`sound-toggle-btn interactive-glow-btn ${isMuted ? 'btn-muted' : 'btn-unmuted'}`}
        title={isMuted ? 'Bật tất cả âm thanh' : 'Tắt tiếng (Mute)'}
        aria-label={isMuted ? 'Bật tất cả âm thanh' : 'Tắt tiếng (Mute)'}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-rose-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" />
        )}
        <span className="sound-label">{isMuted ? 'TẮT TIẾNG' : 'ÂM THANH'}</span>
      </button>

      {/* 2. NÚT MỞ BẢNG TÙY CHỌN (CÀI ĐẶT ÂM THANH & CHUYỂN ĐỘNG) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          soundService.playClick();
          setShowSettingsModal(true);
        }}
        className="settings-toggle-btn interactive-glow-btn"
        title="Tùy chọn âm thanh & Giảm chuyển động"
        aria-label="Cài đặt"
      >
        <Settings className="w-4 h-4 text-slate-300" />
      </button>

      {/* MODAL CÀI ĐẶT TIỆN ÍCH */}
      {showSettingsModal && (
        <div className="audio-settings-modal-overlay animate-fade-in" onClick={() => setShowSettingsModal(false)}>
          <div className="audio-settings-card animate-zoom-in" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h3 className="settings-title">CÀI ĐẶT TRẢI NGHIỆM</h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="close-settings-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="settings-options-list">
              {/* Tùy chọn Hiệu ứng âm thanh */}
              <div className="settings-row">
                <div className="row-text">
                  <div className="row-label">
                    <Volume2 className="w-4 h-4 mr-1.5 text-cyan-400 inline" />
                    <strong>Hiệu ứng âm thanh (SFX)</strong>
                  </div>
                  <div className="row-desc">Tiếng bấm, chuông đúng, âm nhắc sai êm dịu</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSfx}
                  className={`toggle-switch-btn ${!isMuted ? 'active' : ''}`}
                >
                  <span className="toggle-slider" />
                  <span className="toggle-text">{!isMuted ? 'BẬT' : 'TẮT'}</span>
                </button>
              </div>

              {/* Tùy chọn Nhạc nền ngũ cung */}
              <div className="settings-row">
                <div className="row-text">
                  <div className="row-label">
                    <Music className="w-4 h-4 mr-1.5 text-amber-400 inline" />
                    <strong>Nhạc nền không gian (BGM)</strong>
                  </div>
                  <div className="row-desc">Giai điệu thư thái tổng hợp nhẹ nhàng</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleBgm}
                  className={`toggle-switch-btn ${!isBgmMuted ? 'active' : ''}`}
                >
                  <span className="toggle-slider" />
                  <span className="toggle-text">{!isBgmMuted ? 'BẬT' : 'TẮT'}</span>
                </button>
              </div>

              {/* Tùy chọn Giảm chuyển động (Reduced Motion) */}
              <div className="settings-row">
                <div className="row-text">
                  <div className="row-label">
                    <Eye className="w-4 h-4 mr-1.5 text-emerald-400 inline" />
                    <strong>Giảm chuyển động</strong>
                  </div>
                  <div className="row-desc">Tắt hiệu ứng rung nảy, pháo hoa & nhịp thở</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleReducedMotion}
                  className={`toggle-switch-btn ${reducedMotion ? 'active' : ''}`}
                >
                  <span className="toggle-slider" />
                  <span className="toggle-text">{reducedMotion ? 'BẬT' : 'TẮT'}</span>
                </button>
              </div>
            </div>

            {/* Thông báo minh bạch về tệp âm thanh theo yêu cầu */}
            <div className="audio-notice-box">
              <Info className="w-4 h-4 text-cyan-300 mr-2 flex-shrink-0" />
              <span>
                <strong>Ghi chú kỹ thuật:</strong> Dự án hiện chưa có tệp âm thanh ghi âm riêng (.mp3). Toàn bộ âm thanh đang dùng thuật toán tổng hợp Web Audio API thời gian thực.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
