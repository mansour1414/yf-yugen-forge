import React, { useEffect } from 'react';

export const Spine: React.FC = () => {
  useEffect(() => {
    const handleScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      const fill = document.getElementById('spineFill');
      if (fill) fill.style.height = pct + '%';
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div id="spine">
      <div className="track"></div>
      <div className="fill" id="spineFill"></div>
    </div>
  );
};
