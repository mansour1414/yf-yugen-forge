import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { NeuralCanvas } from './NeuralCanvas';

interface SplashProps {
  onEnter: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const codeSnips = [
      'const future = () => build();',
      '[AI_CORE] status: online',
      'render(<Experience />)',
      'yf.deploy("v2035")',
      'neural.sync(true)',
      'while(vision){ create(); }',
      '// crafting tomorrow',
      'GET /future 200 OK',
    ];

    const splashEl = document.getElementById('splash');
    if (splashEl) {
      document.querySelectorAll('.code-frag').forEach((f) => f.remove());
      for (let i = 0; i < 8; i++) {
        const el = document.createElement('div');
        el.className = 'code-frag';
        el.textContent = codeSnips[i % codeSnips.length];
        el.style.top = 8 + Math.random() * 84 + '%';
        el.style.left = Math.random() * 80 + 4 + '%';
        splashEl.appendChild(el);
        gsap.to(el, {
          opacity: 0.55,
          duration: 1.2,
          delay: 1 + i * 0.35,
          repeat: -1,
          yoyo: true,
          repeatDelay: 2 + Math.random() * 3,
          ease: 'sine.inOut',
        });
      }
    }

    gsap.to('.splash-logo', { opacity: 1, y: -50, duration: 1, delay: 0.3, ease: 'power3.out' });
    gsap.to('.splash-eyebrow', { opacity: 1, y: 0, duration: 1, delay: 0.55, ease: 'power3.out' });
    gsap.to('#enter-btn', { opacity: 1, scale: 1, duration: 1, delay: 0.9, ease: 'back.out(1.6)' });
    gsap.to('.splash-hint', { opacity: 0.7, duration: 1, delay: 1.3 });
  }, []);

  const handleEnterClick = () => {
    const splash = document.getElementById('splash');
    const enterBtn = document.getElementById('enter-btn');
    if (!splash || !enterBtn) return;

    for (let i = 0; i < 26; i++) {
      const p = document.createElement('div');
      p.className = 'burst-particle';
      const inner = splash.querySelector('.splash-inner');
      if (inner) inner.appendChild(p);
      const ang = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 180;
      gsap.to(p, {
        x: Math.cos(ang) * dist,
        y: Math.sin(ang) * dist,
        opacity: 0,
        duration: 0.9 + Math.random() * 0.5,
        ease: 'power2.out',
      });
    }

    gsap.to('#enter-btn', { scale: 1.3, duration: 0.35, ease: 'power2.out' });
    setTimeout(() => {
      splash.classList.add('leaving');
      onEnter();
    }, 260);
  };

  return (
    <section id="splash">
      <img
        className={`bg-img ${isLoaded ? 'loaded' : ''}`}
        id="splashImg"
        src="/hero-bg.jpg"
        alt="YF"
        onLoad={() => setIsLoaded(true)}
      />
      <NeuralCanvas />
      <div className="veil"></div>
      <div className="splash-inner">
        <div className="splash-logo">
          <img src="/logo.svg" alt="YF Studio Logo" className="splash-logo-img" />
        </div>
        <div className="splash-eyebrow en">AI CREATIVE STUDIO — EST. 2035</div>
        <button id="enter-btn" className="magnetic" onClick={handleEnterClick}>
          ابدأ
        </button>
        <div className="splash-hint en">CLICK TO ENTER</div>
      </div>
    </section>
  );
};
