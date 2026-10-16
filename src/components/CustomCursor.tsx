import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let currentMx = 0;
    let currentMy = 0;
    let currentRx = 0;
    let currentRy = 0;

    const handleMouseMove = (e: MouseEvent) => {
      currentMx = e.clientX;
      currentMy = e.clientY;
      const dot = document.getElementById('cursorDot');
      if (dot) {
        dot.style.left = currentMx + 'px';
        dot.style.top = currentMy + 'px';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const cursorLoop = () => {
      currentRx += (currentMx - currentRx) * 0.16;
      currentRy += (currentMy - currentRy) * 0.16;
      const ring = document.getElementById('cursorRing');
      if (ring) {
        ring.style.left = currentRx + 'px';
        ring.style.top = currentRy + 'px';
      }
      animationFrameId = requestAnimationFrame(cursorLoop);
    };
    cursorLoop();

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, .service-card, .p-card, input, textarea, select')) {
        setActive(true);
      } else {
        setActive(false);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" id="cursorDot"></div>
      <div className={`cursor-ring ${active ? 'active' : ''}`} id="cursorRing"></div>
    </>
  );
};
