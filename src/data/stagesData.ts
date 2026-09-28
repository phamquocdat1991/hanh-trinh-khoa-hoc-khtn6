import type { Stage } from '../types/game';

/**
 * Dữ liệu 5 chặng của trò chơi: "Hành trình nhà khoa học nhí — Chinh phục đo chiều dài"
 * (Bộ 15 câu hỏi đã được tách rời độc lập sang file questionsData.ts)
 */
export const STAGES_DATA: Stage[] = [
  {
    id: 1,
    number: 1,
    title: 'Khu rừng đơn vị đo',
    shortTitle: 'Rừng đơn vị đo',
    badge: '🌿 Chặng 1',
    description: 'Băng qua khu rừng kỳ ảo, tìm hiểu các đơn vị đo chiều dài quốc tế và quy tắc đổi đơn vị.',
    objective: 'Nhận biết các đơn vị đo mm, cm, m, km và chọn đơn vị phù hợp với từng đối tượng đo.',
    image: '/assets/4.jpg',
    pinCoords: {
      x: 40.5,
      y: 43.5,
    },
    status: 'unlocked', // Chặng 1 mở mặc định
    starsEarned: 0,
    scoreReward: 30, // 3 câu x 10đ
  },
  {
    id: 2,
    number: 2,
    title: 'Công trường thước đo',
    shortTitle: 'Công trường thước đo',
    badge: '🏗️ Chặng 2',
    description: 'Cùng các kỹ sư tại công trường xây dựng khám phá các loại thước và cách chọn thước đo tối ưu.',
    objective: 'Chọn dụng cụ đo thích hợp, xác định GHĐ, ĐCNN và đặt vạch số 0 trùng đầu vật.',
    image: '/assets/1.jpg',
    pinCoords: {
      x: 49.0,
      y: 64.0,
    },
    status: 'locked',
    starsEarned: 0,
    scoreReward: 30,
  },
  {
    id: 3,
    number: 3,
    title: 'Phòng thí nghiệm sai số',
    shortTitle: 'Phòng thí nghiệm sai số',
    badge: '🔬 Chặng 3',
    description: 'Tìm hiểu cách đặt thước, đặt mắt nhìn vuông góc và đọc kết quả đo chính xác.',
    objective: 'Nhận biết cách đặt thước dọc theo vật, đặt mắt vuông góc và đọc kết quả đo theo vạch chia.',
    image: '/assets/2.jpg',
    pinCoords: {
      x: 66.5,
      y: 46.0,
    },
    status: 'locked',
    starsEarned: 0,
    scoreReward: 30,
  },
  {
    id: 4,
    number: 4,
    title: 'Trạm vận dụng vũ trụ',
    shortTitle: 'Trạm vận dụng',
    badge: '🚀 Chặng 4',
    description: 'Vận dụng kỹ năng đổi đơn vị và giải quyết các tình huống đo đạc thực tế phức tạp.',
    objective: 'Quy đổi thành thạo các đơn vị đo chiều dài và giải quyết tình huống đo lệch vạch số 0 hoặc vật siêu mỏng.',
    /**
     * =========================================================================================
     * LƯU Ý KỸ THUẬT QUAN TRỌNG:
     * Chặng 4 hiện đang dùng hình ảnh cắt tạm từ vùng trạm tên lửa trên bản đồ chính (5.jpg)
     * Đường dẫn: '/assets/stage4_rocket.jpg'.
     * Khi đã có file ảnh vẽ minh họa riêng độ phân giải cao cho Chặng 4, vui lòng cập nhật lại
     * đường dẫn tệp tại trường 'image' này!
     * =========================================================================================
     */
    image: '/assets/stage4_rocket.jpg',
    pinCoords: {
      x: 75.5,
      y: 71.0,
    },
    status: 'locked',
    starsEarned: 0,
    scoreReward: 30,
  },
  {
    id: 5,
    number: 5,
    title: 'Kho báu nhà khoa học',
    shortTitle: 'Kho báu vương miện',
    badge: '👑 Chặng 5',
    description: 'Chinh phục bài khảo sát tổng kết, mở khóa rương kho báu hoàng gia và nhận Cây Thước Vàng Danh Dự!',
    objective: 'Vận dụng tổng hợp 5 bước đo, quy ước ghi kết quả theo ĐCNN để mở khóa rương kho báu.',
    image: '/assets/3.jpg',
    pinCoords: {
      x: 89.0,
      y: 49.0,
    },
    status: 'locked',
    starsEarned: 0,
    scoreReward: 30,
  },
];
