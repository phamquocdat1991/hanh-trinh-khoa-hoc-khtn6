/**
 * DỊCH VỤ ÂM THANH TỔNG HỢP (WEB AUDIO API)
 * LƯU Ý KỸ THUẬT:
 * Dự án hiện chưa có tệp âm thanh ghi âm riêng (mp3/wav), do đó toàn bộ hiệu ứng
 * âm thanh (tiếng bấm, đúng, sai, nhạc nền...) được tổng hợp thời gian thực bằng
 * Web Audio API của trình duyệt. Không tạo liên kết tài nguyên giả (fake audio links).
 * Âm thanh chỉ phát sau khi người chơi có thao tác bấm chuột hoặc chạm màn hình.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private isSfxMuted: boolean = false;
  private isBgmMuted: boolean = true; // Nhạc nền mặc định tắt, người chơi có thể bật tùy chọn
  private bgmInterval: number | null = null;
  private bgmNotesIndex: number = 0;
  private hasInteracted: boolean = false;

  constructor() {
    // Đọc cài đặt âm thanh từ bộ nhớ trình duyệt
    const savedSfx = localStorage.getItem('game_sfx_muted');
    if (savedSfx !== null) {
      this.isSfxMuted = savedSfx === 'true';
    }

    const savedBgm = localStorage.getItem('game_bgm_muted');
    if (savedBgm !== null) {
      this.isBgmMuted = savedBgm === 'true';
    }
  }

  // Khởi tạo AudioContext sau tương tác của người chơi
  private ensureContext(): boolean {
    if (!this.hasInteracted) {
      this.hasInteracted = true;
    }
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return !!this.ctx;
  }

  public getSfxMuted(): boolean {
    return this.isSfxMuted;
  }

  public getBgmMuted(): boolean {
    return this.isBgmMuted;
  }

  private emitChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('game_sound_change', {
          detail: { sfxMuted: this.isSfxMuted, bgmMuted: this.isBgmMuted },
        })
      );
    }
  }

  public toggleSfx(): boolean {
    this.ensureContext();
    this.isSfxMuted = !this.isSfxMuted;
    localStorage.setItem('game_sfx_muted', String(this.isSfxMuted));
    this.emitChange();
    if (!this.isSfxMuted) {
      this.playClick();
    }
    return this.isSfxMuted;
  }

  public toggleBgm(): boolean {
    this.ensureContext();
    this.isBgmMuted = !this.isBgmMuted;
    localStorage.setItem('game_bgm_muted', String(this.isBgmMuted));
    this.emitChange();
    if (this.isBgmMuted) {
      this.stopBgMusic();
    } else {
      this.startBgMusic();
      this.playClick();
    }
    return this.isBgmMuted;
  }

  // Bật/tắt toàn bộ âm thanh nhanh (tiện ích nút Mute trên thanh HUD)
  public toggleAllMute(): boolean {
    const isCurrentlyMuted = this.isSfxMuted;
    const newMuted = !isCurrentlyMuted;
    this.isSfxMuted = newMuted;
    this.isBgmMuted = newMuted;
    localStorage.setItem('game_sfx_muted', String(newMuted));
    localStorage.setItem('game_bgm_muted', String(newMuted));
    this.emitChange();
    if (newMuted) {
      this.stopBgMusic();
    } else {
      this.ensureContext();
      this.playClick();
    }
    return newMuted;
  }

  // 1. TIẾNG BẤM TƯƠNG TÁC (Subtle cyber tap)
  public playClick() {
    if (this.isSfxMuted || !this.ensureContext() || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // ignore
    }
  }

  // 2. TIẾNG TRẢ LỜI ĐÚNG (Bright, cheerful 3-note chime)
  public playCorrect() {
    if (this.isSfxMuted || !this.ensureContext() || !this.ctx) return;

    try {
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6
      notes.forEach((freq, idx) => {
        const startTime = this.ctx!.currentTime + idx * 0.09;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.22);
      });
    } catch {
      // ignore
    }
  }

  // 3. TIẾNG TRẢ LỜI SAI NHẸ NHÀNG (Gentle soft chime, KHÔNG gây giật mình cho học sinh)
  public playWrong() {
    if (this.isSfxMuted || !this.ensureContext() || !this.ctx) return;

    try {
      // Sử dụng sóng hình sin êm dịu, chuyển tần số nhẹ từ 330 Hz xuống 280 Hz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4
      osc.frequency.exponentialRampToValueAtTime(277.18, this.ctx.currentTime + 0.22); // C#4

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // ignore
    }
  }

  // 4. TIẾNG XUẤT HIỆN HUY HIỆU & HOÀN THÀNH CHẶNG (Triumphant gentle fanfare)
  public playStageComplete() {
    if (this.isSfxMuted || !this.ensureContext() || !this.ctx) return;

    try {
      const melody = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.5, d: 0.38 }  // C6
      ];

      let t = this.ctx.currentTime;
      melody.forEach(note => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + note.d);
        t += note.d * 0.85;
      });
    } catch {
      // ignore
    }
  }

  // 5. TIẾNG MỞ RƯƠNG KHO BÁU & VƯƠNG MIỆN THƯỚC VÀNG (Magical shimmering harp)
  public playChestOpen() {
    if (this.isSfxMuted || !this.ensureContext() || !this.ctx) return;

    try {
      // Chuỗi arpeggio vàng lấp lánh (C5 -> E5 -> G5 -> B5 -> D6 -> G6)
      const harpNotes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
      let t = this.ctx.currentTime;

      harpNotes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        const volume = idx === harpNotes.length - 1 ? 0.2 : 0.12;
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.35);
        t += 0.08;
      });
    } catch {
      // ignore
    }
  }

  // 6. NHẠC NỀN TÙY CHỌN (TỔNG HỢP ÂM THANH KHÔNG GIAN THƯ THÁI - BGM)
  public startBgMusic() {
    if (this.isBgmMuted || this.bgmInterval !== null || !this.ensureContext() || !this.ctx) return;

    // Giai điệu ngũ cung thư thái, êm dịu phù hợp học tập (C - D - E - G - A)
    const pentatonicNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

    this.bgmInterval = window.setInterval(() => {
      if (this.isBgmMuted || !this.ctx) return;

      try {
        const freq = pentatonicNotes[this.bgmNotesIndex % pentatonicNotes.length];
        this.bgmNotesIndex++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Âm lượng siêu nhỏ (0.025) để chỉ làm nền êm dịu, không lấn át
        gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.2);
      } catch {
        // ignore
      }
    }, 700);
  }

  public stopBgMusic() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public playStart() {
    this.playClick();
  }
}

export const soundService = new SoundService();
