import React, { useState, useEffect } from 'react';
import type { 
  Lesson, 
  LessonContent, 
  StageConfig, 
  StudentPlayRun, 
  QuestionErrorStat 
} from '../../types/teacher';
import type { GameQuestion } from '../../types/game';
import { teacherStorageService } from '../../services/teacherStorage';
import { soundService } from '../../services/sound';
import { 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  BarChart3, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Lock, 
  LogOut, 
  Search, 
  RefreshCw,
  FileSpreadsheet,
  Server,
  UploadCloud,
  ChevronRight,
  Flame
} from 'lucide-react';

interface TeacherDashboardProps {
  onBackToGame: () => void;
  onPreviewLesson?: (lessonContent: LessonContent, stageNumber: number) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onBackToGame,
  onPreviewLesson,
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'questions' | 'results' | 'storage-spec'>('lessons');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('khtn6-do-chieu-dai');
  const [selectedStageId, setSelectedStageId] = useState<number>(1);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [studentRuns, setStudentRuns] = useState<StudentPlayRun[]>([]);
  const [errorStats, setErrorStats] = useState<QuestionErrorStat[]>([]);

  // State cho việc sửa chặng
  const [editingStage, setEditingStage] = useState<StageConfig | null>(null);

  // State cho việc sửa câu hỏi
  const [editingQuestion, setEditingQuestion] = useState<GameQuestion | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Thông báo phản hồi
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedLessonId]);

  const loadData = () => {
    const list = teacherStorageService.getLessons();
    setLessons(list);

    const currentLesson = list.find((l) => l.id === selectedLessonId) || list[0];
    if (currentLesson) {
      const runs = teacherStorageService.getStudentRuns({ lessonId: currentLesson.id });
      setStudentRuns(runs);

      const questions = currentLesson.draft.questions || [];
      const stats = teacherStorageService.getQuestionErrorAnalytics(currentLesson.id, questions);
      setErrorStats(stats);
    }
  };

  const showToast = (message: string, type: 'success' | 'warn' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const currentLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  const storageStatus = teacherStorageService.getStorageStatus();

  // Xử lý lưu sửa đổi Chặng
  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage || !currentLesson) return;
    soundService.playClick();

    const updatedStages = currentLesson.draft.stages.map((st) => 
      st.id === editingStage.id ? editingStage : st
    );

    const updatedDraft: LessonContent = {
      ...currentLesson.draft,
      stages: updatedStages,
    };

    teacherStorageService.saveLessonDraft(currentLesson.id, updatedDraft);
    setEditingStage(null);
    loadData();
    showToast(`Đã lưu bản nháp cho Chặng ${editingStage.number}: ${editingStage.title}`, 'success');
  };

  // Xử lý lưu / sửa Câu hỏi
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !currentLesson) return;
    soundService.playClick();

    let updatedQuestions: GameQuestion[];
    if (isAddingQuestion) {
      updatedQuestions = [...currentLesson.draft.questions, editingQuestion];
    } else {
      updatedQuestions = currentLesson.draft.questions.map((q) => 
        q.id === editingQuestion.id ? editingQuestion : q
      );
    }

    const updatedDraft: LessonContent = {
      ...currentLesson.draft,
      questions: updatedQuestions,
    };

    teacherStorageService.saveLessonDraft(currentLesson.id, updatedDraft);
    setEditingQuestion(null);
    setIsAddingQuestion(false);
    loadData();
    showToast(`Đã lưu câu hỏi ${editingQuestion.id} vào Bản nháp!`, 'success');
  };

  // Xử lý Xóa câu hỏi
  const handleDeleteQuestion = (questionId: string) => {
    if (!window.confirm(`Thầy/Cô có chắc chắn muốn xóa câu hỏi ${questionId} khỏi bản nháp không?`)) {
      return;
    }
    soundService.playClick();

    const updatedQuestions = currentLesson.draft.questions.filter((q) => q.id !== questionId);
    const updatedDraft: LessonContent = {
      ...currentLesson.draft,
      questions: updatedQuestions,
    };

    teacherStorageService.saveLessonDraft(currentLesson.id, updatedDraft);
    loadData();
    showToast(`Đã xóa câu hỏi ${questionId} khỏi bản nháp!`, 'warn');
  };

  // Xử lý Xuất bản phiên bản mới (Publish Draft)
  const handlePublish = () => {
    if (!currentLesson) return;
    soundService.playClick();

    if (!window.confirm(`Xuất bản nội dung Bản nháp thành phiên bản chính thức để học sinh trải nghiệm?`)) {
      return;
    }

    const res = teacherStorageService.publishLesson(currentLesson.id);
    if (res.success) {
      soundService.playStageComplete();
      loadData();
      showToast(`Đã xuất bản thành công phiên bản mới (${res.versionId})! Các lượt chơi sau sẽ học theo bản này.`, 'success');
    }
  };

  // Xử lý Xuất CSV
  const handleExportCSV = () => {
    soundService.playClick();
    const filteredRuns = teacherStorageService.getStudentRuns({
      lessonId: selectedLessonId,
      classCode: filterClass,
      studentSearch: searchStudent,
    });

    if (filteredRuns.length === 0) {
      showToast('Chưa có dữ liệu lượt chơi nào thỏa mãn điều kiện lọc để xuất CSV.', 'warn');
      return;
    }

    const csvData = teacherStorageService.exportRunsToCSV(filteredRuns);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ket_Qua_${currentLesson.id}_${filterClass}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã xuất thành công file CSV gồm ${filteredRuns.length} lượt chơi!`, 'success');
  };

  // Lọc danh sách lượt chơi
  const filteredRuns = studentRuns.filter((r) => {
    if (filterClass !== 'all' && r.classCode !== filterClass) return false;
    if (searchStudent.trim() !== '') {
      const q = searchStudent.toLowerCase().trim();
      const matchName = r.studentName.toLowerCase().includes(q);
      const matchId = r.studentId.toLowerCase().includes(q);
      const matchClass = r.className.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchClass) return false;
    }
    return true;
  });

  const availableClasses = Array.from(new Set(studentRuns.map((r) => r.classCode))).filter(Boolean);

  return (
    <div className="teacher-portal-root text-slate-100 min-h-screen bg-slate-950 font-sans p-4 sm:p-6 overflow-y-auto">
      {/* THANH THÔNG BÁO MINH BẠCH VỀ LƯU TRỮ (KHÔNG GIẢ LẬP LƯU THÀNH CÔNG) */}
      <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-300">
          <Database className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Trạng thái lưu trữ:</strong> {storageStatus.statusText} — <em>{storageStatus.notice}</em>
          </span>
        </div>
        <button
          onClick={() => setActiveTab('storage-spec')}
          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold border border-amber-500/40 whitespace-nowrap transition-all"
        >
          Xem đề xuất kết nối Database
        </button>
      </div>

      {/* TOAST THÔNG BÁO PHẢN HỒI */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2 text-sm font-bold animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' :
          toast.type === 'warn' ? 'bg-amber-950/90 border-amber-500 text-amber-200' :
          'bg-cyan-950/90 border-cyan-500 text-cyan-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER QUẢN TRỊ VIÊN */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundService.playClick();
              onBackToGame();
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Quay lại giao diện trò chơi"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>VỀ GAME</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 tracking-wide font-heading">
                KHU VỰC QUẢN TRỊ GIÁO VIÊN
              </h1>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300">
                Sư phạm & Dữ liệu
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Soạn bài, hiệu chỉnh 5 chặng, biên tập ngân hàng câu hỏi và phân tích kết quả học sinh
            </p>
          </div>
        </div>

        {/* Chọn bài học và Nút Xuất bản */}
        <div className="flex items-center gap-2">
          {lessons.length > 1 && (
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="sci-fi-select text-xs p-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          )}

          {currentLesson && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400">Phiên bản đang chạy:</span>
              <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                {currentLesson.published?.versionName || 'Chưa xuất bản'}
              </span>
              <button
                onClick={handlePublish}
                className="ml-2 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold border border-emerald-400 hover:brightness-110 flex items-center gap-1 shadow-lg shadow-emerald-900/30"
                title="Xuất bản các chỉnh sửa từ bản nháp thành phiên bản chính thức"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>XUẤT BẢN MỚI</span>
              </button>
            </div>
          )}

          <button
            onClick={() => {
              soundService.playClick();
              teacherStorageService.logoutTeacher();
              onBackToGame();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500 transition-all text-xs flex items-center gap-1"
            title="Đăng xuất tài khoản giáo viên"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* THANH TAB ĐIỀU HƯỚNG */}
      <nav className="flex items-center gap-2 mt-4 border-b border-slate-800/80 pb-2 overflow-x-auto">
        <button
          onClick={() => { soundService.playClick(); setActiveTab('lessons'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'lessons'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>QUẢN LÝ BÀI HỌC & 5 CHẶNG</span>
        </button>

        <button
          onClick={() => { soundService.playClick(); setActiveTab('questions'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'questions'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>NGÂN HÀNG CÂU HỎI ({currentLesson?.draft.questions.length || 0})</span>
        </button>

        <button
          onClick={() => { soundService.playClick(); setActiveTab('results'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'results'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>KẾT QUẢ & PHÂN TÍCH ({studentRuns.length} LƯỢT)</span>
        </button>

        <button
          onClick={() => { soundService.playClick(); setActiveTab('storage-spec'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'storage-spec'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-md shadow-amber-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Server className="w-4 h-4 text-amber-400" />
          <span>ĐỀ XUẤT BACKEND & CẤU TRÚC DỮ LIỆU</span>
        </button>
      </nav>

      {/* NỘI DUNG CHÍNH CÁC TAB */}
      <main className="mt-4">
        {/* ========================================================================= */}
        {/* TAB 1: QUẢN LÝ BÀI HỌC VÀ 5 CHẶNG */}
        {/* ========================================================================= */}
        {activeTab === 'lessons' && currentLesson && (
          <div className="space-y-6">
            {/* THÔNG TIN BÀI HỌC VÀ TRẠNG THÁI BẢN NHÁP VS XUẤT BẢN */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    <span>{currentLesson.title}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">{currentLesson.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Bản nháp đang sửa:</div>
                    <span className="text-xs font-bold text-amber-300">{currentLesson.draft.versionName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DANH SÁCH 5 CHẶNG CỦA BÀI HỌC */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>5 CHẶNG THỬ THÁCH TRONG BÀI ĐO CHIỀU DÀI</span>
                </h3>
                <span className="text-xs text-slate-400">Bấm "Chỉnh sửa chặng" để đổi tên, mô tả, mục tiêu hoặc đường dẫn ảnh</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentLesson.draft.stages.map((st) => (
                  <div key={st.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div>
                      {/* Ảnh bìa chặng */}
                      <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 border border-slate-800 bg-slate-950">
                        <img src={st.image} alt={st.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/50 text-[11px] font-bold text-cyan-300">
                          {st.badge}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">Chặng {st.number}: {st.title}</h4>
                      <p className="text-xs text-slate-400 mb-2 line-clamp-2">{st.description}</p>
                      
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 mb-3 text-[11px]">
                        <span className="text-cyan-400 font-bold block mb-0.5">Mục tiêu sư phạm:</span>
                        <span className="text-slate-300">{st.objective}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          soundService.playClick();
                          setEditingStage({ ...st });
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>SỬA CHẶNG</span>
                      </button>

                      {onPreviewLesson && (
                        <button
                          onClick={() => {
                            soundService.playClick();
                            onPreviewLesson(currentLesson.draft, st.number);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-xs font-bold text-cyan-200 transition-all flex items-center gap-1"
                          title="Xem thử giao diện chặng này trước khi xuất bản"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>XEM THỬ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MODAL SỬA CHẶNG */}
            {editingStage && (
              <div className="audio-settings-modal-overlay animate-fade-in" onClick={() => setEditingStage(null)}>
                <div className="audio-settings-card animate-zoom-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
                  <div className="settings-header">
                    <h3 className="settings-title text-base font-bold text-white">
                      HIỆU CHỈNH CHẶNG {editingStage.number}: {editingStage.shortTitle}
                    </h3>
                    <button onClick={() => setEditingStage(null)} className="close-settings-btn">✕</button>
                  </div>

                  <form onSubmit={handleSaveStage} className="space-y-3 text-left">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">TÊN ĐẦY ĐỦ CỦA CHẶNG:</label>
                      <input
                        type="text"
                        value={editingStage.title}
                        onChange={(e) => setEditingStage({ ...editingStage, title: e.target.value })}
                        className="sci-fi-input w-full p-2.5 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">TÊN RÚT GỌN (BẢN ĐỒ):</label>
                        <input
                          type="text"
                          value={editingStage.shortTitle}
                          onChange={(e) => setEditingStage({ ...editingStage, shortTitle: e.target.value })}
                          className="sci-fi-input w-full p-2.5 rounded-xl text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">HUY HIỆU (BADGE):</label>
                        <input
                          type="text"
                          value={editingStage.badge}
                          onChange={(e) => setEditingStage({ ...editingStage, badge: e.target.value })}
                          className="sci-fi-input w-full p-2.5 rounded-xl text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">MÔ TẢ CẢNH QUAN & BỐI CẢNH:</label>
                      <textarea
                        rows={2}
                        value={editingStage.description}
                        onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                        className="sci-fi-input w-full p-2.5 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">MỤC TIÊU SƯ PHẠM:</label>
                      <textarea
                        rows={2}
                        value={editingStage.objective}
                        onChange={(e) => setEditingStage({ ...editingStage, objective: e.target.value })}
                        className="sci-fi-input w-full p-2.5 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">ĐƯỜNG DẪN ẢNH NỀN (IMAGE PATH):</label>
                      <input
                        type="text"
                        value={editingStage.image}
                        onChange={(e) => setEditingStage({ ...editingStage, image: e.target.value })}
                        className="sci-fi-input w-full p-2.5 rounded-xl text-xs"
                        required
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Đang dùng ảnh mẫu: <code>/assets/4.jpg</code>, <code>/assets/1.jpg</code>, <code>/assets/2.jpg</code>, <code>/assets/stage4_rocket.jpg</code>, <code>/assets/3.jpg</code>
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingStage(null)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                      >
                        HỦY
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 border border-cyan-400"
                      >
                        LƯU VÀO BẢN NHÁP
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: NGÂN HÀNG CÂU HỎI (THÊM / SỬA / XÓA / XEM THỬ) */}
        {/* ========================================================================= */}
        {activeTab === 'questions' && currentLesson && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">LỌC THEO CHẶNG:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((stId) => (
                    <button
                      key={stId}
                      onClick={() => { soundService.playClick(); setSelectedStageId(stId); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedStageId === stId
                          ? 'bg-cyan-600 text-white border border-cyan-400'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Chặng {stId}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  soundService.playClick();
                  setIsAddingQuestion(true);
                  setEditingQuestion({
                    id: `CH${selectedStageId}-Q${Date.now().toString().slice(-3)}`,
                    stageId: selectedStageId,
                    questionNumber: 4,
                    content: 'Nội dung câu hỏi mới về đo chiều dài...',
                    interactionType: 'multiple-choice',
                    options: [
                      { key: 'A', text: 'Phương án A' },
                      { key: 'B', text: 'Phương án B' },
                      { key: 'C', text: 'Phương án C' },
                      { key: 'D', text: 'Phương án D' },
                    ],
                    correctAnswer: 'A',
                    hint: 'Gợi ý khoa học ngắn gọn giúp học sinh suy luận...',
                    explanation: 'Giải thích chi tiết chuẩn sách giáo khoa KHTN 6...',
                    pointsFirstTry: 10,
                    pointsRetry: 5,
                  });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold border border-cyan-400 hover:brightness-110 flex items-center gap-1.5 shadow-md shadow-cyan-900/40"
              >
                <Plus className="w-4 h-4" />
                <span>THÊM CÂU HỎI MỚI</span>
              </button>
            </div>

            {/* DANH SÁCH CÂU HỎI TRONG CHẶNG */}
            <div className="space-y-3">
              {currentLesson.draft.questions
                .filter((q) => q.stageId === selectedStageId)
                .map((q) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold text-xs font-mono">
                          {q.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold">
                          {q.interactionType === 'multiple-choice' ? 'Trắc nghiệm 1 đáp án' : 'Kéo thả ô đích'}
                        </span>
                        <span className="text-[11px] text-amber-300">⭐ Lần 1: {q.pointsFirstTry}đ • Lần 2: {q.pointsRetry}đ</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            soundService.playClick();
                            setIsAddingQuestion(false);
                            setEditingQuestion({ ...q });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1 border border-slate-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>SỬA</span>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold flex items-center gap-1 border border-rose-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>XÓA</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2 leading-relaxed">{q.content}</h4>

                    {/* HIỂN THỊ CÁC PHƯƠNG ÁN NẾU LÀ TRẮC NGHIỆM */}
                    {q.interactionType === 'multiple-choice' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {q.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                              opt.key === q.correctAnswer
                                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold'
                                : 'bg-slate-950/50 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              opt.key === q.correctAnswer ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                            {opt.key === q.correctAnswer && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* HIỂN THỊ CÁC THẺ KÉO & ĐÍCH NẾU LÀ DRAG & DROP */}
                    {q.interactionType === 'drag-drop' && q.dropTargets && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-3 space-y-1">
                        <span className="text-[11px] font-bold text-cyan-400 block mb-1">CÁC CẶP GHÉP ĐÚNG (KÉO THẢ):</span>
                        {q.dropTargets.map((dt) => {
                          const item = (q.dragItems || []).find((i) => i.id === dt.acceptedItemId);
                          return (
                            <div key={dt.id} className="flex items-center gap-2 text-slate-300">
                              <span className="font-bold text-slate-200">[{dt.label}]</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">{item?.text || dt.acceptedItemId}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* GỢI Ý VÀ GIẢI THÍCH */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                      <div className="text-slate-400">
                        <span className="text-amber-400 font-bold mr-1">💡 Gợi ý làm sai:</span>
                        <span>{q.hint}</span>
                      </div>
                      <div className="text-slate-400">
                        <span className="text-cyan-400 font-bold mr-1">📖 Giải thích:</span>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* MODAL SOẠN / SỬA CÂU HỎI */}
            {editingQuestion && (
              <div className="audio-settings-modal-overlay animate-fade-in" onClick={() => setEditingQuestion(null)}>
                <div className="audio-settings-card animate-zoom-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                  <div className="settings-header">
                    <h3 className="settings-title text-base font-bold text-white">
                      {isAddingQuestion ? 'THÊM CÂU HỎI MỚI' : `SỬA CÂU HỎI ${editingQuestion.id}`}
                    </h3>
                    <button onClick={() => setEditingQuestion(null)} className="close-settings-btn">✕</button>
                  </div>

                  <form onSubmit={handleSaveQuestion} className="space-y-3 text-left">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">MÃ CÂU HỎI:</label>
                        <input
                          type="text"
                          value={editingQuestion.id}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, id: e.target.value })}
                          className="sci-fi-input w-full p-2 rounded-xl text-xs font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">THUỘC CHẶNG:</label>
                        <select
                          value={editingQuestion.stageId}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, stageId: parseInt(e.target.value, 10) })}
                          className="sci-fi-select w-full p-2 rounded-xl text-xs"
                        >
                          {[1, 2, 3, 4, 5].map((st) => (
                            <option key={st} value={st}>Chặng {st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">LOẠI TƯƠNG TÁC:</label>
                        <select
                          value={editingQuestion.interactionType}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, interactionType: e.target.value as any })}
                          className="sci-fi-select w-full p-2 rounded-xl text-xs"
                        >
                          <option value="multiple-choice">Trắc nghiệm 1 đáp án</option>
                          <option value="drag-drop">Kéo thả vào ô đích</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">NỘI DUNG CÂU HỎI:</label>
                      <textarea
                        rows={2}
                        value={editingQuestion.content}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                        className="sci-fi-input w-full p-2 rounded-xl text-xs"
                        required
                      />
                    </div>

                    {/* NẾU LÀ TRẮC NGHIỆM: 4 PHƯƠNG ÁN VÀ CHỌN ĐÁP ÁN ĐÚNG */}
                    {editingQuestion.interactionType === 'multiple-choice' && (
                      <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <label className="text-[11px] font-bold text-cyan-400 block">4 PHƯƠNG ÁN LỰA CHỌN & ĐÁP ÁN ĐÚNG:</label>
                        {(editingQuestion.options || []).map((opt, i) => (
                          <div key={opt.key} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correctAnswerGroup"
                              checked={editingQuestion.correctAnswer === opt.key}
                              onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: opt.key })}
                              className="accent-cyan-400 cursor-pointer"
                              title="Đánh dấu đáp án đúng"
                            />
                            <span className="font-bold text-xs w-4">{opt.key}.</span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const newOpts = [...(editingQuestion.options || [])];
                                newOpts[i] = { ...opt, text: e.target.value };
                                setEditingQuestion({ ...editingQuestion, options: newOpts });
                              }}
                              className="sci-fi-input flex-1 p-1.5 rounded-lg text-xs"
                              placeholder={`Nội dung phương án ${opt.key}...`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-amber-400 block mb-1">GỢI Ý KHI LÀM SAI:</label>
                        <textarea
                          rows={2}
                          value={editingQuestion.hint}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, hint: e.target.value })}
                          className="sci-fi-input w-full p-2 rounded-xl text-xs"
                          placeholder="Gợi ý sư phạm..."
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-cyan-400 block mb-1">GIẢI THÍCH CHI TIẾT:</label>
                        <textarea
                          rows={2}
                          value={editingQuestion.explanation}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                          className="sci-fi-input w-full p-2 rounded-xl text-xs"
                          placeholder="Giải thích chuẩn kiến thức..."
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(null)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                      >
                        HỦY BỎ
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 border border-cyan-400"
                      >
                        LƯU CÂU HỎI VÀO BẢN NHÁP
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: KẾT QUẢ HỌC SINH & PHÂN TÍCH LỖI SAI */}
        {/* ========================================================================= */}
        {activeTab === 'results' && currentLesson && (
          <div className="space-y-6">
            {/* BỘ LỌC KẾT QUẢ VÀ NÚT XUẤT CSV */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                {/* Lọc theo lớp */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-bold">LỚP / MÃ LỚP:</span>
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="sci-fi-select p-2 rounded-xl text-xs font-bold"
                  >
                    <option value="all">Tất cả các lớp ({studentRuns.length})</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>Mã lớp: {cls}</option>
                    ))}
                  </select>
                </div>

                {/* Tìm kiếm học sinh */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Tìm theo tên hoặc mã HS..."
                    className="sci-fi-input pl-9 pr-3 py-2 rounded-xl text-xs w-48 sm:w-60"
                  />
                </div>

                <button
                  onClick={loadData}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                  title="Tải lại dữ liệu mới nhất"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Nút xuất CSV */}
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs border border-emerald-400 hover:brightness-110 flex items-center gap-2 shadow-lg shadow-emerald-950"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>XUẤT BẢNG KẾT QUẢ CSV</span>
              </button>
            </div>

            {/* BẢNG PHÂN TÍCH CÂU HỎI SAI NHIỀU NHẤT */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <h3 className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>PHÂN TÍCH CÂU HỎI HỌC SINH SAI NHIỀU NHẤT (CẦN ÔN TẬP LẠI)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Thống kê số lần trả lời sai lần đầu trên tổng số lượt thi đấu, giúp giáo viên điều chỉnh trọng tâm bài giảng
              </p>

              {errorStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {errorStats.slice(0, 6).map((stat) => (
                    <div key={stat.questionId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                            {stat.questionId} (Chặng {stat.stageId})
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            stat.failRate > 40 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            Sai {stat.failRate}% ({stat.firstTryFailCount}/{stat.totalAttempts})
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 line-clamp-2 mb-2 font-medium">{stat.content}</p>
                      </div>

                      {stat.commonWrongAnswers.length > 0 && (
                        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                          <span className="text-rose-400 font-bold block mb-0.5">Đáp án sai thường gặp:</span>
                          <div className="flex flex-wrap gap-1">
                            {stat.commonWrongAnswers.map((wa, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
                                {wa.answer} ({wa.count} em)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-950 rounded-xl border border-slate-900">
                  Chưa có dữ liệu thống kê lỗi sai. Học sinh hãy bắt đầu làm bài để hệ thống phân tích.
                </div>
              )}
            </div>

            {/* BẢNG CHI TIẾT TỪNG LƯỢT CHƠI HỌC SINH */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                <span>DANH SÁCH LƯỢT CHƠI CHI TIẾT ({filteredRuns.length})</span>
                <span className="text-xs text-slate-400 font-normal">Mỗi lượt chơi được ghi nhận độc lập và gắn đúng phiên bản bài học</span>
              </h3>

              {filteredRuns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Mã HS</th>
                        <th className="py-2.5 px-3">Học sinh</th>
                        <th className="py-2.5 px-3">Lớp / Mã lớp</th>
                        <th className="py-2.5 px-3">Bản bài học</th>
                        <th className="py-2.5 px-3 text-center">Điểm số</th>
                        <th className="py-2.5 px-3 text-center">Tiến độ</th>
                        <th className="py-2.5 px-3 text-right">Thời gian</th>
                        <th className="py-2.5 px-3 text-right">Thời điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredRuns.map((run) => (
                        <tr key={run.sessionId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{run.studentId}</td>
                          <td className="py-2.5 px-3 font-bold text-white">{run.studentName}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                              {run.className} ({run.classCode})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{run.lessonVersionId}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-extrabold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                              {run.totalScore}/150
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-800">
                              {run.progressPercent}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400">{run.durationSeconds}s</td>
                          <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                            {new Date(run.startedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(run.startedAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-950 rounded-xl border border-slate-900">
                  Không tìm thấy lượt chơi nào phù hợp với bộ lọc tìm kiếm hiện tại.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: BÁO CÁO HIỆN TRẠNG LƯU TRỮ & ĐỀ XUẤT CẤU TRÚC KẾT NỐI SERVER */}
        {/* ========================================================================= */}
        {activeTab === 'storage-spec' && (
          <div className="space-y-6 text-left max-w-4xl mx-auto">
            {/* HIỆN TRẠNG DỰ ÁN */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>1. HIỆN TRẠNG DỊCH VỤ LƯU TRỮ CỦA DỰ ÁN</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  • <strong>Kiểm tra hệ thống:</strong> Dự án hiện tại là ứng dụng Single Page App chạy bằng <code>React 19 + TypeScript + Vite</code>. Trong cây mã nguồn chưa có cơ sở dữ liệu backend, tệp biến môi trường <code>.env</code> hay dịch vụ lưu trữ đám mây nào (chưa có Supabase, Firebase, SQLite hay REST API server).
                </p>
                <p>
                  • <strong>Cơ chế lưu tạm hiện hữu:</strong> Dữ liệu phiên chơi đang được lưu tạm trên <code>window.localStorage</code> của trình duyệt máy khách (Client-side).
                </p>
                <p>
                  • <strong>Cam kết kỹ thuật:</strong> Hệ thống <strong>tuyệt đối không giả lập lưu thành công</strong> lên máy chủ. Giao diện báo rõ ràng trạng thái "Cục bộ" để giáo viên không bị hiểu nhầm dữ liệu đã lên đám mây.
                </p>
              </div>
            </div>

            {/* ĐỀ XUẤT CẤU TRÚC DỮ LIỆU CHUẨN */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-400" />
                <span>2. ĐỀ XUẤT CẤU TRÚC CƠ SỞ DỮ LIỆU (RELATIONAL SCHEMA)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Được thiết kế chuẩn mực quan hệ, bảo đảm phân tách bản nháp/xuất bản và lưu vết từng lần trả lời của học sinh:
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-mono text-cyan-300 font-bold block mb-1">Bảng 1: lessons (Bài học & Quản lý phiên bản)</span>
                  <code className="text-slate-300 text-[11px] block whitespace-pre-wrap font-mono">
{`id VARCHAR(64) PRIMARY KEY,
title VARCHAR(255) NOT NULL,
subject VARCHAR(100),
grade VARCHAR(50),
status VARCHAR(20) DEFAULT 'draft', -- 'draft' | 'published'
draft_json JSONB NOT NULL,          -- Nội dung bài nháp (5 chặng, câu hỏi, đáp án)
published_json JSONB,               -- Nội dung bản đã xuất bản
current_version_id VARCHAR(50),     -- vd: 'khtn6-v1.0'
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`}
                  </code>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-mono text-cyan-300 font-bold block mb-1">Bảng 2: student_sessions (Lượt chơi học sinh)</span>
                  <code className="text-slate-300 text-[11px] block whitespace-pre-wrap font-mono">
{`id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
lesson_id VARCHAR(64) REFERENCES lessons(id),
lesson_version_id VARCHAR(50) NOT NULL, -- Bắt buộc khóa đúng phiên bản lúc chơi
class_code VARCHAR(50) NOT NULL,       -- Mã lớp (giáo viên cấp)
student_id VARCHAR(50) NOT NULL,       -- Mã học sinh
student_name VARCHAR(100) NOT NULL,
class_name VARCHAR(50),
total_score INTEGER DEFAULT 0,         -- Điểm do MÁY CHỦ tính toán
completed_stages JSONB DEFAULT '[]',
duration_seconds INTEGER DEFAULT 0,
is_finished BOOLEAN DEFAULT FALSE,
started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
finished_at TIMESTAMP WITH TIME ZONE`}
                  </code>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-mono text-cyan-300 font-bold block mb-1">Bảng 3: question_attempts (Chi tiết từng lần thử & đáp án)</span>
                  <code className="text-slate-300 text-[11px] block whitespace-pre-wrap font-mono">
{`id BIGSERIAL PRIMARY KEY,
session_id UUID REFERENCES student_sessions(id) ON DELETE CASCADE,
question_id VARCHAR(50) NOT NULL,
stage_id INTEGER NOT NULL,
submitted_answer JSONB NOT NULL,
is_correct BOOLEAN NOT NULL,
attempts_count INTEGER NOT NULL,       -- Lần 1: 10đ, Lần 2+: 5đ
score_awarded INTEGER NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`}
                  </code>
                </div>
              </div>
            </div>

            {/* CƠ CHẾ BẢO MẬT & CHẤM ĐIỂM SERVER-SIDE */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span>3. CƠ CHẾ BẢO VỆ PHÂN QUYỀN & CHẤM ĐIỂM MÁY CHỦ</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">Phân quyền dữ liệu (Data Isolation):</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                    <li><strong>Giáo viên:</strong> Đăng nhập xác thực bằng Token JWT/Mật khẩu băm (bcrypt). Có toàn quyền SELECT/UPDATE/EXPORT mọi bài học và kết quả của các lớp.</li>
                    <li><strong>Học sinh:</strong> Đăng nhập bằng <code>Mã lớp</code> + <code>Mã học sinh</code>. Chỉ có quyền INSERT lượt chơi của bản thân. <strong>Tuyệt đối không được cấp quyền SELECT</strong> xem kết quả, điểm số của các bạn học sinh khác.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">Chấm điểm máy chủ (Server-side Grading):</span>
                  <p className="text-slate-300 text-[11px]">
                    Khi học sinh nộp câu trả lời, trình duyệt chỉ gửi <code>{`{ questionId, userAnswer }`}</code> lên endpoint <code>/api/submit-answer</code>. Máy chủ sẽ tra cứu đáp án đúng bí mật từ DB, kiểm tra số lần thử và tự tính điểm (10đ lần 1, 5đ lần thử lại). <strong>Không chấp nhận trường <code>score</code> do client tự gửi lên</strong> để chống gian lận chỉnh sửa Inspect Element.
                  </p>
                </div>
              </div>
            </div>

            {/* DANH SÁCH CẤU HÌNH CẦN CUNG CẤP */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Server className="w-5 h-5 text-sky-400" />
                <span>4. CÁC PHƯƠNG ÁN KẾT NỐI & THÔNG TIN CẤU HÌNH CẦN CUNG CẤP</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-cyan-300 font-bold text-sm block mb-1">
                    Phương án 1 (Khuyến nghị): Máy chủ Node.js/Express + SQLite tích hợp sẵn trong repo
                  </span>
                  <p className="text-slate-300 text-[11px] mb-2">
                    Chạy độc lập ngay trên máy tính của giáo viên hoặc mạng LAN phòng máy tính nhà trường mà không cần đăng ký tài khoản đám mây hay trả phí.
                  </p>
                  <span className="text-amber-300 font-bold block text-[11px]">Cấu hình Thầy/Cô cần cung cấp:</span>
                  <ul className="list-disc pl-4 text-slate-300 text-[11px] space-y-0.5">
                    <li><code>TEACHER_ADMIN_PASSWORD</code>: Mật khẩu bảo vệ khu vực giáo viên (Mặc định: <code>giaovienkhtn2026</code>).</li>
                    <li><code>SERVER_PORT</code>: Cổng chạy dịch vụ API (Mặc định: <code>3001</code>).</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-emerald-300 font-bold text-sm block mb-1">
                    Phương án 2: Cơ sở dữ liệu đám mây Supabase (PostgreSQL + RLS)
                  </span>
                  <p className="text-slate-300 text-[11px] mb-2">
                    Phù hợp nếu trường muốn học sinh về nhà làm bài trên điện thoại/máy tính cá nhân qua mạng Internet công cộng.
                  </p>
                  <span className="text-amber-300 font-bold block text-[11px]">Cấu hình Thầy/Cô cần cung cấp từ trang quản trị Supabase:</span>
                  <ul className="list-disc pl-4 text-slate-300 text-[11px] space-y-0.5">
                    <li><code>VITE_SUPABASE_URL</code>: Đường dẫn dự án (vd: <code>https://xyz.supabase.co</code>).</li>
                    <li><code>VITE_SUPABASE_ANON_KEY</code>: Khóa công khai cho học sinh làm bài.</li>
                    <li><code>SUPABASE_SERVICE_ROLE_KEY</code>: Khóa bí mật máy chủ để chấm điểm và truy xuất bảng kết quả giáo viên.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
