import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục lưu file SQLite
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'game.sqlite');
export const db = new DatabaseSync(dbPath);

// Kích hoạt foreign keys và WAL mode
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. Bảng tài khoản giáo viên
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 2. Bảng bài học (Phân tách Bản nháp và Bản đã xuất bản)
  db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT,
      grade TEXT,
      description TEXT,
      status TEXT DEFAULT 'published',
      current_version_id TEXT NOT NULL,
      draft_json TEXT NOT NULL,
      published_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 3. Bảng lượt chơi học sinh (Tách biệt học sinh và gắn đúng phiên bản bài học)
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_sessions (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      lesson_version_id TEXT NOT NULL,
      class_code TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      class_name TEXT,
      total_score INTEGER DEFAULT 0,
      completed_stages TEXT DEFAULT '[]',
      duration_seconds INTEGER DEFAULT 0,
      is_finished INTEGER DEFAULT 0,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );
  `);

  // 4. Bảng chi tiết từng lần thử câu hỏi (Lưu vết câu sai và chấm điểm máy chủ)
  db.exec(`
    CREATE TABLE IF NOT EXISTS question_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      stage_id INTEGER NOT NULL,
      submitted_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      attempts_count INTEGER NOT NULL,
      score_awarded INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE
    );
  `);

  // Khởi tạo tài khoản giáo viên mặc định nếu chưa có
  const teacherCheck = db.prepare('SELECT COUNT(*) as count FROM teachers').get();
  if (teacherCheck.count === 0) {
    const insertTeacher = db.prepare(`
      INSERT INTO teachers (id, username, password, name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertTeacher.run(
      'teacher_admin_1',
      'giaovienkhtn',
      'giaovienkhtn2026', // Mật khẩu mặc định
      'Giáo viên KHTN 6',
      new Date().toISOString()
    );
  }

  // Khởi tạo bài học Đo chiều dài mẫu nếu chưa có
  const lessonCheck = db.prepare('SELECT COUNT(*) as count FROM lessons').get();
  if (lessonCheck.count === 0) {
    // Đọc bài học mẫu ban đầu
    try {
      const initialPath = path.join(__dirname, 'initial_lesson_seed.json');
      if (fs.existsSync(initialPath)) {
        const seedData = JSON.parse(fs.readFileSync(initialPath, 'utf8'));
        const insertLesson = db.prepare(`
          INSERT INTO lessons (id, title, subject, grade, description, status, current_version_id, draft_json, published_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insertLesson.run(
          seedData.id,
          seedData.title,
          seedData.subject,
          seedData.grade,
          seedData.description,
          seedData.status,
          seedData.published.versionId,
          JSON.stringify(seedData.draft),
          JSON.stringify(seedData.published),
          seedData.createdAt,
          seedData.updatedAt
        );
      }
    } catch (err) {
      console.error('Error seeding initial lesson:', err);
    }
  }

  console.log('[SQLite DB] Database initialized successfully at:', dbPath);
}
