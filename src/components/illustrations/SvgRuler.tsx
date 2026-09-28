import React from 'react';
import type { SvgIllustrationConfig } from '../../types/game';

interface SvgRulerProps {
  config: SvgIllustrationConfig;
  className?: string;
}

export const SvgRuler: React.FC<SvgRulerProps> = ({ config, className = '' }) => {
  const {
    type,
    rulerLengthCm = 10,
    objectStartCm = 0,
    objectEndCm = 5,
    objectName = 'Vật mẫu',
  } = config;

  // Tỷ lệ toán học chuẩn: 1 cm = 54 pixel, 1 mm = 5.4 pixel
  const pxPerCm = 54;
  const startMarginX = 40;
  const endMarginX = 35;
  const rulerWidth = rulerLengthCm * pxPerCm + startMarginX + endMarginX;
  const rulerHeight = 65;
  const svgWidth = Math.max(rulerWidth, 620);
  const svgHeight = type === 'ruler-eye-direction' ? 180 : 135;

  const rulerY = svgHeight - rulerHeight - 12;

  // Tính tọa độ X của một số cm bất kỳ trên thước
  const getX = (cm: number) => startMarginX + cm * pxPerCm;

  // Tạo các vạch chia mm và cm
  const renderTicks = () => {
    const ticks = [];
    const totalMm = rulerLengthCm * 10;

    for (let mm = 0; mm <= totalMm; mm++) {
      const x = startMarginX + (mm / 10) * pxPerCm;
      const isCm = mm % 10 === 0;
      const isHalfCm = mm % 5 === 0 && !isCm;

      const tickHeight = isCm ? 22 : isHalfCm ? 15 : 9;
      const strokeWidth = isCm ? 1.8 : isHalfCm ? 1.2 : 0.8;
      const strokeColor = isCm ? '#38bdf8' : isHalfCm ? '#94a3b8' : '#64748b';

      ticks.push(
        <line
          key={`tick-${mm}`}
          x1={x}
          y1={rulerY}
          x2={x}
          y2={rulerY + tickHeight}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          shapeRendering="crispEdges"
        />
      );

      // In số đo cm (0, 1, 2, ..., N)
      if (isCm) {
        const cmVal = mm / 10;
        ticks.push(
          <text
            key={`num-${cmVal}`}
            x={x}
            y={rulerY + tickHeight + 16}
            fill="#f1f5f9"
            fontSize="12"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            textAnchor="middle"
          >
            {cmVal}
          </text>
        );
      }
    }
    return ticks;
  };

  return (
    <div className={`svg-ruler-container ${className}`}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="svg-ruler-canvas"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradient thân thước nhựa kỹ thuật trong suốt */}
          <linearGradient id="rulerBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f2b48" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#081b33" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#040e1d" stopOpacity="0.98" />
          </linearGradient>

          {/* Gradient thanh vật thể kim loại */}
          <linearGradient id="metalBlockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Gradient thanh gỗ mẫu */}
          <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Gradient thanh nhiên liệu tên lửa */}
          <linearGradient id="rocketFuelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Gradient chìa khóa vàng */}
          <linearGradient id="goldKeyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* Bộ lọc phát sáng */}
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* THÂN CÂY THƯỚC ĐƯỢC DỰNG BẰNG TOÁN HỌC CHÍNH XÁC */}
        <g id="ruler-body">
          {/* Khung thước */}
          <rect
            x={startMarginX - 25}
            y={rulerY}
            width={rulerLengthCm * pxPerCm + 50}
            height={rulerHeight}
            rx={8}
            fill="url(#rulerBodyGrad)"
            stroke="#0284c7"
            strokeWidth={1.5}
          />
          {/* Nhãn đơn vị cm ở góc thước */}
          <text
            x={startMarginX - 12}
            y={rulerY + 45}
            fill="#38bdf8"
            fontSize="10"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
          >
            cm
          </text>
          {/* Các vạch chia chính xác từng mm và cm */}
          {renderTicks()}
        </g>

        {/* MINH HỌA 1: CHỈ DẪN GHĐ & ĐCNN (Chặng 2 - Câu 2) */}
        {type === 'ruler-ghd-dcnn' && (
          <g id="annotation-ghd-dcnn">
            {/* Mũi tên chỉ GHĐ ở cuối thước */}
            <path
              d={`M ${getX(10)} ${rulerY - 18} L ${getX(10)} ${rulerY - 2}`}
              stroke="#fbbf24"
              strokeWidth="2"
              markerEnd="url(#arrowGold)"
            />
            <rect
              x={getX(10) - 48}
              y={rulerY - 38}
              width={96}
              height={20}
              rx={4}
              fill="rgba(15, 23, 42, 0.9)"
              stroke="#fbbf24"
              strokeWidth="1"
            />
            <text
              x={getX(10)}
              y={rulerY - 24}
              fill="#fbbf24"
              fontSize="10"
              fontWeight="800"
              fontFamily="Outfit, sans-serif"
              textAnchor="middle"
            >
              GHĐ = 10 cm
            </text>

            {/* Mũi tên chỉ ĐCNN giữa vạch 0 và 0.1 cm */}
            <path
              d={`M ${getX(0.1) + 2} ${rulerY - 18} L ${getX(0.1)} ${rulerY - 2}`}
              stroke="#00f5d4"
              strokeWidth="1.5"
            />
            <rect
              x={getX(0) - 2}
              y={rulerY - 38}
              width={105}
              height={20}
              rx={4}
              fill="rgba(15, 23, 42, 0.9)"
              stroke="#00f5d4"
              strokeWidth="1"
            />
            <text
              x={getX(0) + 50}
              y={rulerY - 24}
              fill="#00f5d4"
              fontSize="10"
              fontWeight="800"
              fontFamily="Outfit, sans-serif"
              textAnchor="middle"
            >
              1 khoảng = 1 mm
            </text>
          </g>
        )}

        {/* MINH HỌA 2: SƠ ĐỒ ĐẶT MẮT THỊ SAI (Chặng 3 - Câu 1) */}
        {type === 'ruler-eye-direction' && (
          <g id="annotation-eye-directions">
            {/* Vật mẫu đặt từ 0 đến 5 cm */}
            <rect
              x={getX(0)}
              y={rulerY - 18}
              width={5 * pxPerCm}
              height={16}
              rx={3}
              fill="url(#woodGrad)"
              stroke="#d97706"
              strokeWidth="1"
            />
            <text
              x={getX(2.5)}
              y={rulerY - 6}
              fill="#fff"
              fontSize="10"
              fontWeight="700"
              textAnchor="middle"
            >
              Vật cần đo (đầu kia tại vạch 5 cm)
            </text>

            {/* Điểm ngắm tại vạch 5 cm */}
            <circle cx={getX(5)} cy={rulerY} r="3.5" fill="#f43f5e" />

            {/* Hướng mắt A (Nghiêng trái 45°) */}
            <line
              x1={getX(5) - 65}
              y1={rulerY - 75}
              x2={getX(5)}
              y2={rulerY}
              stroke="#f87171"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <circle cx={getX(5) - 65} cy={rulerY - 75} r="10" fill="#1e293b" stroke="#f87171" strokeWidth="1.5" />
            <text x={getX(5) - 65} y={rulerY - 71} fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">A</text>
            <text x={getX(5) - 65} y={rulerY - 90} fill="#f87171" fontSize="10" fontWeight="700" textAnchor="middle">👁️ Mắt A (Nghiêng)</text>

            {/* Hướng mắt B (Vuông góc 90° CHUẨN) */}
            <line
              x1={getX(5)}
              y1={rulerY - 80}
              x2={getX(5)}
              y2={rulerY}
              stroke="#00f5d4"
              strokeWidth="2.5"
              filter="url(#cyanGlow)"
            />
            <circle cx={getX(5)} cy={rulerY - 80} r="12" fill="#0369a1" stroke="#00f5d4" strokeWidth="2" />
            <text x={getX(5)} y={rulerY - 76} fill="#fff" fontSize="11" fontWeight="900" textAnchor="middle">B</text>
            <text x={getX(5)} y={rulerY - 96} fill="#00f5d4" fontSize="11" fontWeight="800" textAnchor="middle">👁️ Mắt B (Vuông góc 90°)</text>

            {/* Hướng mắt C (Nghiêng phải 45°) */}
            <line
              x1={getX(5) + 65}
              y1={rulerY - 75}
              x2={getX(5)}
              y2={rulerY}
              stroke="#f87171"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <circle cx={getX(5) + 65} cy={rulerY - 75} r="10" fill="#1e293b" stroke="#f87171" strokeWidth="1.5" />
            <text x={getX(5) + 65} y={rulerY - 71} fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">C</text>
            <text x={getX(5) + 65} y={rulerY - 90} fill="#f87171" fontSize="10" fontWeight="700" textAnchor="middle">👁️ Mắt C (Nghiêng)</text>
          </g>
        )}

        {/* MINH HỌA 3: ĐO VẬT TỪ VẠCH SỐ 0 (Chặng 2 - Câu 3 & Chặng 3 - Câu 2) */}
        {type === 'ruler-measure-zero' && (
          <g id="annotation-measure-zero">
            {/* Vật thể nằm phía trên vạch thước */}
            <rect
              x={getX(objectStartCm)}
              y={rulerY - 24}
              width={(objectEndCm - objectStartCm) * pxPerCm}
              height={22}
              rx={4}
              fill="url(#metalBlockGrad)"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <text
              x={getX((objectStartCm + objectEndCm) / 2)}
              y={rulerY - 10}
              fill="#ffffff"
              fontSize="11"
              fontWeight="800"
              fontFamily="Outfit, sans-serif"
              textAnchor="middle"
            >
              {objectName}
            </text>

            {/* Đường chỉ gióng mốc vạch 0 */}
            <line
              x1={getX(0)}
              y1={rulerY - 32}
              x2={getX(0)}
              y2={rulerY + 22}
              stroke="#22c55e"
              strokeWidth="1.5"
              strokeDasharray="3,2"
            />
            <circle cx={getX(0)} cy={rulerY} r="3" fill="#22c55e" />

            {/* Đường chỉ gióng mốc đầu kia */}
            <line
              x1={getX(objectEndCm)}
              y1={rulerY - 32}
              x2={getX(objectEndCm)}
              y2={rulerY + 22}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="3,2"
            />
            <circle cx={getX(objectEndCm)} cy={rulerY} r="3" fill="#ef4444" />

            {/* Nhãn chỉ dẫn đầu mút */}
            <text
              x={getX(objectEndCm)}
              y={rulerY - 36}
              fill="#f87171"
              fontSize="11"
              fontWeight="800"
              fontFamily="Outfit, sans-serif"
              textAnchor="middle"
            >
              ▼ Vạch kết quả: ? cm
            </text>
          </g>
        )}

        {/* MINH HỌA 4: ĐO VẬT KHI ĐẦU LỆCH KHỎI VẠCH 0 (Chặng 4 - Câu 2) */}
        {type === 'ruler-measure-offset' && (
          <g id="annotation-measure-offset">
            {/* Thanh nhiên liệu đặt từ 2.0 cm đến 7.4 cm */}
            <rect
              x={getX(objectStartCm)}
              y={rulerY - 24}
              width={(objectEndCm - objectStartCm) * pxPerCm}
              height={22}
              rx={4}
              fill="url(#rocketFuelGrad)"
              stroke="#c084fc"
              strokeWidth="1.5"
            />
            <text
              x={getX((objectStartCm + objectEndCm) / 2)}
              y={rulerY - 10}
              fill="#ffffff"
              fontSize="11"
              fontWeight="800"
              fontFamily="Outfit, sans-serif"
              textAnchor="middle"
            >
              {objectName}
            </text>

            {/* Đường dóng đầu đầu (2.0 cm) */}
            <line
              x1={getX(objectStartCm)}
              y1={rulerY - 32}
              x2={getX(objectStartCm)}
              y2={rulerY + 24}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="3,2"
            />
            <text
              x={getX(objectStartCm)}
              y={rulerY - 36}
              fill="#38bdf8"
              fontSize="11"
              fontWeight="800"
              fontFamily="Outfit, sans-serif"
              textAnchor="middle"
            >
              ▼ 2,0 cm
            </text>

            {/* Đường dóng đầu cuối (7.4 cm) */}
            <line
              x1={getX(objectEndCm)}
              y1={rulerY - 32}
              x2={getX(objectEndCm)}
              y2={rulerY + 24}
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeDasharray="3,2"
            />
            <text
              x={getX(objectEndCm)}
              y={rulerY - 36}
              fill="#f43f5e"
              fontSize="11"
              fontWeight="800"
              fontFamily="Outfit, sans-serif"
              textAnchor="middle"
            >
              ▼ 7,4 cm
            </text>
          </g>
        )}

        {/* MINH HỌA 5: CHÌA KHÓA VÀNG KHO BÁU (Chặng 5 - Câu 3) */}
        {type === 'ruler-golden-key' && (
          <g id="annotation-golden-key">
            {/* Vẽ chiếc chìa khóa hoàng gia bằng vector SVG từ 0 đến 8.5 cm */}
            <g transform={`translate(${getX(0)}, ${rulerY - 26})`}>
              {/* Thân chìa khóa */}
              <rect x="0" y="8" width={8.5 * pxPerCm} height="6" rx="2" fill="url(#goldKeyGrad)" stroke="#ca8a04" strokeWidth="1" />
              {/* Vòng cán chìa khóa tại đầu 0 */}
              <circle cx="12" cy="11" r="10" fill="none" stroke="url(#goldKeyGrad)" strokeWidth="4" />
              <circle cx="12" cy="11" r="5" fill="#070b19" />
              {/* Răng chìa khóa hoàng gia ở đầu 8.5 cm */}
              <rect x={8.5 * pxPerCm - 24} y="14" width="5" height="10" rx="1" fill="url(#goldKeyGrad)" />
              <rect x={8.5 * pxPerCm - 12} y="14" width="6" height="12" rx="1" fill="url(#goldKeyGrad)" />
              {/* Mũi nhọn ở đầu mút chìa khóa */}
              <polygon
                points={`${8.5 * pxPerCm},11 ${8.5 * pxPerCm - 4},8 ${8.5 * pxPerCm - 4},14`}
                fill="#fde047"
              />
            </g>

            {/* Dóng mốc 0 cm */}
            <line
              x1={getX(0)}
              y1={rulerY - 32}
              x2={getX(0)}
              y2={rulerY + 22}
              stroke="#22c55e"
              strokeWidth="1.5"
              strokeDasharray="3,2"
            />
            <text x={getX(0)} y={rulerY - 36} fill="#22c55e" fontSize="10" fontWeight="800" textAnchor="middle">
              Đầu 0 cm
            </text>

            {/* Dóng mốc 8.5 cm */}
            <line
              x1={getX(8.5)}
              y1={rulerY - 32}
              x2={getX(8.5)}
              y2={rulerY + 22}
              stroke="#eab308"
              strokeWidth="2"
              strokeDasharray="3,2"
              filter="url(#cyanGlow)"
            />
            <text x={getX(8.5)} y={rulerY - 36} fill="#fde047" fontSize="11" fontWeight="900" textAnchor="middle">
              ▼ 8,5 cm (? mm)
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
