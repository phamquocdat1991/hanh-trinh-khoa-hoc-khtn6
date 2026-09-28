import React from 'react';
import { Star } from 'lucide-react';

interface StarParticlesProps {
  count?: number;
}

export const StarParticles: React.FC<StarParticlesProps> = ({ count = 7 }) => {
  // Tạo các ngôi sao ngẫu nhiên tỏa ra xung quanh
  const stars = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360;
    const distance = 40 + (i % 3) * 15;
    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * distance;
    const ty = Math.sin(rad) * distance - 20; // Hướng bay chếch lên trên
    const size = 14 + (i % 3) * 6;
    const delay = (i * 0.04).toFixed(2);

    return {
      id: i,
      tx,
      ty,
      size,
      delay,
    };
  });

  return (
    <div className="star-particles-overlay" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="floating-star-particle"
          style={
            {
              '--tx': `${s.tx}px`,
              '--ty': `${s.ty}px`,
              '--delay': `${s.delay}s`,
              width: `${s.size}px`,
              height: `${s.size}px`,
            } as React.CSSProperties
          }
        >
          <Star className="w-full h-full text-yellow-300 fill-yellow-400 drop-shadow-star" />
        </span>
      ))}
    </div>
  );
};
