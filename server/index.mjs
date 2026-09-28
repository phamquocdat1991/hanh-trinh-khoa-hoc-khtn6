import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './db.mjs';

const app = express();
const PORT = process.env.PORT || 3001;
const TEACHER_PASSWORD = process.env.TEACHER_ADMIN_PASSWORD || 'giaovienkhtn2026';

// Khởi tạo bảng dữ liệu SQLite
initDatabase();

app.use(cors());
app.use(express.json());

// Token lưu tạm thời trong bộ nhớ server cho phiên giáo viên
const activeTeacherTokens = new Set();

// Middleware xác thực quyền giáo viên
function requireTeacherAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa xác thực quyền giáo viên. Vui lòng đăng nhập.' });
  }

  const token = authHeader.split(' ')[1];
  if (!activeTeacherTokens.has(token)) {
    return res.status(403).json({ error: 'Phiên làm việc giáo viên hết hạn hoặc không hợp lệ.' });
  }

  next();
}

// ============================================================================
// 1. TRẠNG THÁI HỆ THỐNG & KIỂM TRA LƯU TRỮ
// ============================================================================
app.get('/api/status', (req, res) => {
  res.json({
    hasRemoteBackend: true,
    backendType: 'sqlite',
    statusText: 'ĐÃ KẾT NỐI MÁY CHỦ SQLITE (OFFLINE / MẠNG LAN)',
    notice: 'Máy chủ Node.js + SQLite đang hoạt động ổn định. Dữ liệu bài học và kết quả được lưu trữ bền vững tại file database cục bộ trên máy chủ.',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// 2. KHU VỰC GIÁO VIÊN: ĐĂNG NHẬP & BẢO VỆ TÀI KHOẢN
// ============================================================================
app.post('/api/teacher/login', (req, res) => {
  const { password } = req.body;
  if (!password || password.trim() !== TEACHER_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Mật khẩu giáo viên không chính xác.' });
  }

  const token = `tk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  activeTeacherTokens.add(token);

  res.json({
    success: true,
    token,
    teacherName: 'Giáo viên bộ môn KHTN',
    message: 'Đăng nhập khu vực giáo viên thành công.',
  });
});

app.post('/api/teacher/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeTeacherTokens.delete(token);
  }
  res.json({ success: true });
});

// ============================================================================
// 3. QUẢN LÝ BÀI HỌC (LESSONS): DRAFT & PUBLISH
// ============================================================================
app.get('/api/teacher/lessons', requireTeacherAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM lessons ORDER BY updated_at DESC').all();
    const lessons = rows.map((r) => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      grade: r.grade,
      description: r.description,
      status: r.status,
      currentVersionId: r.current_version_id,
      draft: JSON.parse(r.draft_json),
      published: r.published_json ? JSON.parse(r.published_json) : null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    res.json({ success: true, lessons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lưu bản nháp (Draft)
app.post('/api/teacher/lessons/:id/draft', requireTeacherAuth, (req, res) => {
  const { id } = req.params;
  const { draft } = req.body;
  if (!draft) {
    return res.status(400).json({ error: 'Thiếu dữ liệu bản nháp.' });
  }

  try {
    const now = new Date().toISOString();
    const update = db.prepare(`
      UPDATE lessons
      SET draft_json = ?, updated_at = ?
      WHERE id = ?
    `);
    const result = update.run(JSON.stringify(draft), now, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bài học.' });
    }

    res.json({ success: true, message: 'Đã lưu bản nháp thành công vào cơ sở dữ liệu SQLite.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xuất bản bản nháp thành phiên bản chính thức (Publish)
app.post('/api/teacher/lessons/:id/publish', requireTeacherAuth, (req, res) => {
  const { id } = req.params;
  const { versionName } = req.body;

  try {
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Không tìm thấy bài học.' });
    }

    const draftContent = JSON.parse(lesson.draft_json);
    const prevVersionNum = parseInt(lesson.current_version_id.replace(/\D/g, '') || '1', 10);
    const nextVersionNum = prevVersionNum + 1;
    const newVersionId = `${id}-v${nextVersionNum}.0`;

    const publishedContent = {
      ...draftContent,
      versionId: newVersionId,
      versionName: versionName || `Phiên bản ${nextVersionNum}.0 (Xuất bản ${new Date().toLocaleDateString('vi-VN')})`,
      createdAt: new Date().toISOString(),
    };

    const now = new Date().toISOString();
    const update = db.prepare(`
      UPDATE lessons
      SET published_json = ?, current_version_id = ?, status = 'published', updated_at = ?
      WHERE id = ?
    `);
    update.run(JSON.stringify(publishedContent), newVersionId, now, id);

    res.json({
      success: true,
      versionId: newVersionId,
      message: `Đã xuất bản thành công bài học với mã phiên bản: ${newVersionId}.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4. KẾT QUẢ HỌC SINH & PHÂN TÍCH LỖI SAI (CHỈ GIÁO VIÊN ĐƯỢC XEM)
// ============================================================================
app.get('/api/teacher/results', requireTeacherAuth, (req, res) => {
  const { lessonId, classCode, studentSearch } = req.query;

  try {
    let sql = `SELECT * FROM student_sessions WHERE 1=1`;
    const params = [];

    if (lessonId && lessonId !== 'all') {
      sql += ` AND lesson_id = ?`;
      params.push(lessonId);
    }
    if (classCode && classCode !== 'all') {
      sql += ` AND class_code = ?`;
      params.push(classCode);
    }
    if (studentSearch && studentSearch.trim() !== '') {
      sql += ` AND (student_name LIKE ? OR student_id LIKE ? OR class_name LIKE ?)`;
      const q = `%${studentSearch.trim()}%`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY started_at DESC`;

    const rows = db.prepare(sql).all(...params);
    const sessions = rows.map((r) => ({
      sessionId: r.id,
      lessonId: r.lesson_id,
      lessonVersionId: r.lesson_version_id,
      classCode: r.class_code,
      studentId: r.student_id,
      studentName: r.student_name,
      className: r.class_name,
      totalScore: r.total_score,
      maxScore: 150,
      completedStages: JSON.parse(r.completed_stages || '[]'),
      durationSeconds: r.duration_seconds,
      isFinished: !!r.is_finished,
      startedAt: r.started_at,
      finishedAt: r.finished_at,
    }));

    res.json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thống kê câu sai nhiều nhất (Aggregation từ SQLite)
app.get('/api/teacher/analytics/errors', requireTeacherAuth, (req, res) => {
  const { lessonId } = req.query;

  try {
    const statsQuery = db.prepare(`
      SELECT 
        question_id,
        stage_id,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 0 OR attempts_count > 1 THEN 1 ELSE 0 END) as fail_count,
        submitted_answer
      FROM question_attempts
      GROUP BY question_id, stage_id, submitted_answer
    `).all();

    // Gom nhóm theo question_id
    const grouped = {};
    statsQuery.forEach((row) => {
      if (!grouped[row.question_id]) {
        grouped[row.question_id] = {
          questionId: row.question_id,
          stageId: row.stage_id,
          totalAttempts: 0,
          firstTryFailCount: 0,
          wrongAnswers: {},
        };
      }
      grouped[row.question_id].totalAttempts += row.total_attempts;
      grouped[row.question_id].firstTryFailCount += row.fail_count;

      if (row.fail_count > 0) {
        grouped[row.question_id].wrongAnswers[row.submitted_answer] = 
          (grouped[row.question_id].wrongAnswers[row.submitted_answer] || 0) + row.fail_count;
      }
    });

    const errorStats = Object.values(grouped).map((item) => {
      const failRate = item.totalAttempts > 0 ? Math.round((item.firstTryFailCount / item.totalAttempts) * 100) : 0;
      const commonWrongAnswers = Object.entries(item.wrongAnswers)
        .map(([answer, count]) => ({ answer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        questionId: item.questionId,
        stageId: item.stageId,
        totalAttempts: item.totalAttempts,
        firstTryFailCount: item.firstTryFailCount,
        failRate,
        commonWrongAnswers,
      };
    }).sort((a, b) => b.firstTryFailCount - a.firstTryFailCount);

    res.json({ success: true, errorStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. PHÍA HỌC SINH: ĐĂNG KÝ PHIÊN & CHẤM ĐIỂM SERVER-SIDE (CHỐNG GIAN LẬN)
// ============================================================================

// Học sinh đăng ký phiên chơi (Gắn với mã lớp, mã học sinh và phiên bản bài học)
app.post('/api/student/session', (req, res) => {
  const { lessonId, classCode, studentId, studentName, className } = req.body;

  if (!classCode || !studentId || !studentName) {
    return res.status(400).json({ error: 'Học sinh phải nhập đủ Mã lớp, Mã học sinh và Họ tên.' });
  }

  try {
    const lesson = db.prepare('SELECT current_version_id, published_json FROM lessons WHERE id = ?').get(lessonId || 'khtn6-do-chieu-dai');
    if (!lesson || !lesson.published_json) {
      return res.status(404).json({ error: 'Bài học chưa được xuất bản bởi giáo viên.' });
    }

    const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO student_sessions (id, lesson_id, lesson_version_id, class_code, student_id, student_name, class_name, total_score, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    insert.run(
      sessionId,
      lessonId || 'khtn6-do-chieu-dai',
      lesson.current_version_id,
      classCode.trim().toUpperCase(),
      studentId.trim().toUpperCase(),
      studentName.trim(),
      className || '6A',
      now
    );

    res.json({
      success: true,
      sessionId,
      lessonVersionId: lesson.current_version_id,
      publishedLesson: JSON.parse(lesson.published_json),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BẢO MẬT HỌC SINH: Chỉ được lấy thông tin phiên của chính mình, KHÔNG lấy được danh sách học sinh khác
app.get('/api/student/session/:id', (req, res) => {
  const { id } = req.params;
  try {
    const session = db.prepare('SELECT id, lesson_id, lesson_version_id, class_code, student_id, student_name, class_name, total_score, started_at FROM student_sessions WHERE id = ?').get(id);
    if (!session) {
      return res.status(404).json({ error: 'Không tìm thấy phiên làm bài.' });
    }
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHẤM ĐIỂM PHÍA MÁY CHỦ (SERVER-SIDE GRADING):
// Tuyệt đối không tin điểm client gửi lên; Server tự so khớp đáp án chuẩn và tự tính điểm
app.post('/api/student/submit-answer', (req, res) => {
  const { sessionId, lessonId, questionId, stageId, submittedAnswer, attemptNumber } = req.body;

  if (!sessionId || !questionId || submittedAnswer === undefined) {
    return res.status(400).json({ error: 'Thiếu thông tin nộp bài.' });
  }

  try {
    // 1. Kiểm tra phiên học sinh
    const session = db.prepare('SELECT * FROM student_sessions WHERE id = ?').get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Phiên học sinh không hợp lệ.' });
    }

    // 2. Lấy bộ câu hỏi từ bản xuất bản chính thức trong DB
    const lesson = db.prepare('SELECT published_json FROM lessons WHERE id = ?').get(lessonId || session.lesson_id);
    if (!lesson || !lesson.published_json) {
      return res.status(404).json({ error: 'Không tìm thấy bản bài học tương ứng.' });
    }

    const published = JSON.parse(lesson.published_json);
    const question = (published.questions || []).find((q) => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
    }

    // 3. Server tự kiểm tra tính đúng đắn của đáp án
    let isCorrect = false;
    if (question.interactionType === 'multiple-choice') {
      isCorrect = submittedAnswer === question.correctAnswer;
    } else if (question.interactionType === 'drag-drop') {
      // submittedAnswer là object { [targetId]: itemId }
      isCorrect = (question.dropTargets || []).every(
        (target) => submittedAnswer[target.id] === target.acceptedItemId
      );
    }

    // 4. Server tự tính điểm: 10 điểm nếu đúng lần 1, 5 điểm nếu đúng từ lần 2+
    const attempt = Number(attemptNumber) || 1;
    let scoreAwarded = 0;

    // Kiểm tra xem câu này đã được cộng điểm trong phiên này chưa (chống gian lận gửi lặp lại)
    const existingCorrect = db.prepare(`
      SELECT COUNT(*) as count FROM question_attempts
      WHERE session_id = ? AND question_id = ? AND is_correct = 1
    `).get(sessionId, questionId);

    if (isCorrect && existingCorrect.count === 0) {
      scoreAwarded = attempt === 1 ? (question.pointsFirstTry || 10) : (question.pointsRetry || 5);
    }

    // 5. Ghi vết vào bảng question_attempts
    const insertAttempt = db.prepare(`
      INSERT INTO question_attempts (session_id, question_id, stage_id, submitted_answer, is_correct, attempts_count, score_awarded, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAttempt.run(
      sessionId,
      questionId,
      Number(stageId) || question.stageId,
      typeof submittedAnswer === 'string' ? submittedAnswer : JSON.stringify(submittedAnswer),
      isCorrect ? 1 : 0,
      attempt,
      scoreAwarded,
      new Date().toISOString()
    );

    // 6. Cập nhật lại tổng điểm của phiên trên máy chủ
    const sumScore = db.prepare(`
      SELECT SUM(score_awarded) as total FROM question_attempts WHERE session_id = ?
    `).get(sessionId);

    const newTotalScore = sumScore.total || 0;
    db.prepare('UPDATE student_sessions SET total_score = ? WHERE id = ?').run(newTotalScore, sessionId);

    // 7. Trả kết quả về cho client
    res.json({
      success: true,
      isCorrect,
      attemptsCount: attempt,
      scoreAwarded,
      totalScore: newTotalScore,
      hint: isCorrect ? null : question.hint,
      explanation: isCorrect ? question.explanation : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật hoàn thành phiên chơi
app.post('/api/student/complete-session', (req, res) => {
  const { sessionId, durationSeconds, completedStages } = req.body;
  try {
    const update = db.prepare(`
      UPDATE student_sessions
      SET is_finished = 1, finished_at = ?, duration_seconds = ?, completed_stages = ?
      WHERE id = ?
    `);
    update.run(
      new Date().toISOString(),
      durationSeconds || 0,
      JSON.stringify(completedStages || [1, 2, 3, 4, 5]),
      sessionId
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`[Express Server] API backend running at http://localhost:${PORT}`);
  console.log(`[Express Server] Teacher default password is: ${TEACHER_PASSWORD}`);
});
