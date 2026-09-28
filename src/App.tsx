import React, { useState, useEffect } from 'react';
import type { ScreenState, PlayerProfile, Stage, SavedGameSession, QuestionAttemptState } from './types/game';
import { STAGES_DATA } from './data/stagesData';
import { storageService } from './services/storage';
import { StartScreen } from './components/StartScreen';
import { InfoScreen } from './components/InfoScreen';
import { MapScreen } from './components/MapScreen';
import { StageIntroScreen } from './components/StageIntroScreen';
import { ChallengeScreen } from './components/ChallengeScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { TeacherLoginModal } from './components/teacher/TeacherLoginModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { teacherStorageService } from './services/teacherStorage';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('start');
  const [savedSession, setSavedSession] = useState<SavedGameSession | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isTeacherDashboardOpen, setIsTeacherDashboardOpen] = useState(false);

  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>({
    name: 'Thùy Đỗ',
    className: '6A',
    classCode: 'KHTN6A',
    studentId: 'HS01',
  });

  const [stages, setStages] = useState<Stage[]>(STAGES_DATA);
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [questionAttempts, setQuestionAttempts] = useState<Record<string, QuestionAttemptState>>({});

  // Khởi tạo: đọc phiên lưu từ trình duyệt
  useEffect(() => {
    const existing = storageService.loadSession();
    if (existing) {
      setSavedSession(existing);
      setPlayerProfile(existing.playerProfile);
      setSessionScore(existing.totalScore);
      setQuestionAttempts(existing.questionAttempts || {});

      // Đồng bộ trạng thái các chặng đã mở/hoàn thành
      if (existing.stagesStatus) {
        setStages((prev) =>
          prev.map((s) => ({
            ...s,
            status: existing.stagesStatus[s.id] || s.status,
          }))
        );
      }
    }
  }, []);

  const activeStage = stages.find((s) => s.id === activeStageId) || stages[0];

  // Lưu tiến độ vào localStorage mỗi khi có cập nhật
  const persistSession = (
    updatedProfile: PlayerProfile,
    updatedScore: number,
    updatedAttempts: Record<string, QuestionAttemptState>,
    updatedStages: Stage[],
    currentStage: number
  ) => {
    const stagesStatus: Record<number, 'locked' | 'unlocked' | 'completed'> = {};
    updatedStages.forEach((s) => {
      stagesStatus[s.id] = s.status;
    });

    const newSession: SavedGameSession = {
      version: '1.0.0',
      playerProfile: updatedProfile,
      currentStageId: currentStage,
      stagesStatus,
      questionAttempts: updatedAttempts,
      totalScore: updatedScore,
      lastUpdated: new Date().toISOString(),
    };

    setSavedSession(newSession);
    storageService.saveSession(newSession);

    // Đồng bộ kết quả vào kho quản lý của giáo viên (gắn đúng phiên bản bài học)
    const published = teacherStorageService.getPublishedLesson('khtn6-do-chieu-dai');
    const versionId = published?.versionId || 'khtn6-v1.0.0';

    teacherStorageService.saveStudentRun({
      sessionId: `run_${updatedProfile.studentId || 'HS'}_${updatedProfile.classCode || '6A'}`,
      lessonId: 'khtn6-do-chieu-dai',
      lessonVersionId: versionId,
      classCode: updatedProfile.classCode || 'KHTN6A',
      studentId: updatedProfile.studentId || 'HS01',
      studentName: updatedProfile.name || 'Thùy Đỗ',
      className: updatedProfile.className || '6A',
      totalScore: updatedScore,
      maxScore: 150,
      completedStages: updatedStages.filter((s) => s.status === 'completed').map((s) => s.id),
      progressPercent: Math.round((Object.values(updatedAttempts).filter((a) => a.isCorrect).length / 15) * 100),
      isFinished: updatedStages.every((s) => s.status === 'completed'),
      startedAt: newSession.lastUpdated,
      durationSeconds: 120,
      questionAnswers: Object.fromEntries(
        Object.entries(updatedAttempts).map(([qId, att]) => [
          qId,
          {
            questionId: qId,
            stageId: parseInt(qId.replace(/\D/g, '')[0] || '1', 10),
            userAnswer: att.isCorrect ? 'Đúng' : 'Chưa đúng',
            isCorrect: att.isCorrect,
            attemptsCount: att.attemptsCount,
            scoreAwarded: att.scoreAwarded,
            answeredAt: new Date().toISOString(),
          },
        ])
      ),
    });
  };

  // 1. Chuyển từ Trang bắt đầu sang Trang thông tin
  const handleStart = () => {
    setCurrentScreen('info');
  };

  // Tiếp tục lượt chơi đang lưu từ Trang bắt đầu
  const handleResumeFromStart = () => {
    setCurrentScreen('map');
  };

  // 2. Chuyển từ Trang thông tin sang Bản đồ (Bắt đầu lượt mới hoặc Tiếp tục)
  const handleSubmitProfile = (profile: PlayerProfile, isNewRun: boolean) => {
    setPlayerProfile(profile);

    if (isNewRun) {
      // BẮT ĐẦU LƯỢT MỚI: Reset toàn bộ điểm về 0, reset câu hỏi, khóa lại chặng 2-5
      const freshStages: Stage[] = STAGES_DATA.map((s) => ({
        ...s,
        status: s.id === 1 ? 'unlocked' : 'locked',
        starsEarned: 0,
      }));

      setStages(freshStages);
      setSessionScore(0);
      setQuestionAttempts({});
      setActiveStageId(1);

      const freshSession = storageService.createNewSession(profile);
      setSavedSession(freshSession);
      setCurrentScreen('map');
    } else {
      // Tiếp tục lượt chơi
      setCurrentScreen('map');
    }
  };

  // 3. Chọn 1 chặng trên Bản đồ -> Mở Trang giới thiệu chặng
  const handleSelectStage = (stage: Stage) => {
    setActiveStageId(stage.id);
    setCurrentScreen('stage-intro');
  };

  // 4. Bắt đầu thử thách từ Trang giới thiệu
  const handleStartChallenge = (stage: Stage) => {
    setActiveStageId(stage.id);
    setCurrentScreen('challenge');
  };

  // Quay lại Bản đồ
  const handleBackToMap = () => {
    setCurrentScreen('map');
  };

  // 5. Ghi nhận kết quả trả lời từng câu hỏi (10 điểm lần 1, 5 điểm lần sau)
  const handleRecordQuestionResult = (
    questionId: string,
    isCorrect: boolean,
    attemptsCount: number,
    scoreAwarded: number
  ) => {
    const updatedAttempts: Record<string, QuestionAttemptState> = {
      ...questionAttempts,
      [questionId]: {
        questionId,
        attemptsCount,
        isCorrect,
        scoreAwarded,
        usedHint: attemptsCount > 1,
      },
    };

    const newTotalScore = sessionScore + scoreAwarded;
    setSessionScore(newTotalScore);
    setQuestionAttempts(updatedAttempts);

    persistSession(
      playerProfile,
      newTotalScore,
      updatedAttempts,
      stages,
      activeStageId
    );
  };

  // 6. Hoàn thành 3 câu của 1 chặng: Mở khóa chặng kế tiếp
  const handleCompleteStage = (stageId: number) => {
    const updatedStages = stages.map((st) => {
      if (st.id === stageId) {
        return {
          ...st,
          status: 'completed' as const,
          starsEarned: 3,
        };
      }
      if (st.id === stageId + 1 && st.status === 'locked') {
        return {
          ...st,
          status: 'unlocked' as const,
        };
      }
      return st;
    });

    setStages(updatedStages);

    persistSession(
      playerProfile,
      sessionScore,
      questionAttempts,
      updatedStages,
      stageId < 5 ? stageId + 1 : 5
    );

    // Nếu hoàn thành chặng 5 -> Chuyển sang màn Tổng kết
    if (stageId === 5) {
      setCurrentScreen('summary');
    } else {
      setCurrentScreen('map');
    }
  };

  // Bắt đầu lượt mới từ Màn hình tổng kết hoặc Màn hình chính
  const handleStartNewRun = () => {
    const freshStages: Stage[] = STAGES_DATA.map((s) => ({
      ...s,
      status: s.id === 1 ? 'unlocked' : 'locked',
      starsEarned: 0,
    }));

    setStages(freshStages);
    setSessionScore(0);
    setQuestionAttempts({});
    setActiveStageId(1);

    const freshSession = storageService.createNewSession(playerProfile);
    setSavedSession(freshSession);
    setCurrentScreen('map');
  };

  // Xử lý mở khu vực giáo viên
  const handleOpenTeacherArea = () => {
    if (teacherStorageService.isTeacherAuthenticated()) {
      setIsTeacherDashboardOpen(true);
    } else {
      setIsTeacherModalOpen(true);
    }
  };

  const handleTeacherLoginSuccess = () => {
    setIsTeacherModalOpen(false);
    setIsTeacherDashboardOpen(true);
  };

  const completedQuestionsCount = Object.values(questionAttempts).filter((a) => a.isCorrect).length;

  return (
    <div className="game-app-root">
      {/* 1. NẾU ĐANG MỞ KHU VỰC QUẢN TRỊ GIÁO VIÊN */}
      {isTeacherDashboardOpen ? (
        <TeacherDashboard
          onBackToGame={() => setIsTeacherDashboardOpen(false)}
        />
      ) : (
        <>
          {currentScreen === 'start' && (
            <StartScreen
              onStart={handleStart}
              savedSession={savedSession}
              onResumeSession={handleResumeFromStart}
              onStartNewRun={handleStartNewRun}
              onOpenTeacherArea={handleOpenTeacherArea}
            />
          )}

          {currentScreen === 'info' && (
            <InfoScreen
              initialProfile={playerProfile}
              savedSession={savedSession}
              onSubmit={handleSubmitProfile}
              onResume={() => setCurrentScreen('map')}
              onBack={() => setCurrentScreen('start')}
            />
          )}

          {currentScreen === 'map' && (
            <MapScreen
              playerProfile={playerProfile}
              stages={stages}
              sessionScore={sessionScore}
              completedQuestionsCount={completedQuestionsCount}
              onSelectStage={handleSelectStage}
              onChangeProfile={() => setCurrentScreen('info')}
              onViewSummary={() => setCurrentScreen('summary')}
              onOpenTeacherArea={handleOpenTeacherArea}
            />
          )}

          {currentScreen === 'stage-intro' && (
            <StageIntroScreen
              stage={activeStage}
              onStartChallenge={handleStartChallenge}
              onBackToMap={handleBackToMap}
            />
          )}

          {currentScreen === 'challenge' && (
            <ChallengeScreen
              stage={activeStage}
              playerProfile={playerProfile}
              sessionScore={sessionScore}
              questionAttempts={questionAttempts}
              onRecordQuestionResult={handleRecordQuestionResult}
              onCompleteStage={handleCompleteStage}
              onBackToMap={handleBackToMap}
            />
          )}

          {currentScreen === 'summary' && (
            <SummaryScreen
              playerProfile={playerProfile}
              session={
                savedSession || {
                  version: '1.0.0',
                  playerProfile,
                  currentStageId: 5,
                  stagesStatus: { 1: 'completed', 2: 'completed', 3: 'completed', 4: 'completed', 5: 'completed' },
                  questionAttempts,
                  totalScore: sessionScore,
                  lastUpdated: new Date().toISOString(),
                }
              }
              stages={stages}
              onStartNewRun={handleStartNewRun}
              onBackToMap={handleBackToMap}
            />
          )}
        </>
      )}

      {/* 2. MODAL ĐĂNG NHẬP BẢO VỆ DÀNH RIÊNG CHO GIÁO VIÊN */}
      <TeacherLoginModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onSuccess={handleTeacherLoginSuccess}
      />
    </div>
  );
};

export default App;
