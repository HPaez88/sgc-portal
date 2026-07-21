import React, { useState, useEffect } from 'react';

const BackgroundAnimation = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Use requestAnimationFrame for smoother performance if needed, 
      // but standard state update is usually fine for a blur effect.
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const styles = `
    @keyframes float-1 { 0% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(20px, -20px) rotate(180deg); } 100% { transform: translate(0, 0) rotate(360deg); } }
    @keyframes float-2 { 0% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-20px, 20px) rotate(-180deg); } 100% { transform: translate(0, 0) rotate(-360deg); } }
    
    .animate-float-1 { animation: float-1 25s infinite linear; }
    .animate-float-2 { animation: float-2 30s infinite linear; }
    
    /* Ensure the body or app container has the dark background, 
       but we can enforce it here globally as well */
    body {
      background-color: #000c1a !important; 
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {/* Base Dark Background overlay just in case */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#000c1a]">
        
        {/* Deep ambient orbs for the dark liquid feel */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#001f42] rounded-full blur-[150px] opacity-60 animate-float-1" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-[#002855] rounded-full blur-[150px] opacity-50 animate-float-2" />
        <div className="absolute top-[30%] left-[20%] w-[600px] h-[600px] bg-[#0084C9] rounded-full blur-[180px] opacity-20 animate-float-1" style={{ animationDelay: '5s' }} />

        {/* Dynamic Mouse Tracker Glow */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(49,154,255,0.15) 0%, rgba(0,132,201,0) 70%)',
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
            transform: 'translate(-50%, -50%)',
            opacity: mousePosition.x === 0 && mousePosition.y === 0 ? 0 : 1, // Hide until mouse moves
            zIndex: 1
          }}
        />
        
        {/* High-contrast particles mimicking data/tech flow */}
        <div className="absolute top-[30%] left-[40%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        <div className="absolute top-[60%] right-[30%] w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[40%] left-[60%] w-1 h-1 bg-sky-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(56,189,248,0.8)]" style={{ animationDelay: '2s' }} />
      </div>
    </>
  );
};

export default BackgroundAnimation;
