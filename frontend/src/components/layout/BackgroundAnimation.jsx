import React from 'react';

const BackgroundAnimation = () => {
  const styles = `
    @keyframes float-1 { 0% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(20px, -20px) rotate(180deg); } 100% { transform: translate(0, 0) rotate(360deg); } }
    @keyframes float-2 { 0% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-20px, 20px) rotate(-180deg); } 100% { transform: translate(0, 0) rotate(-360deg); } }
    @keyframes float-3 { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(10px, 10px) scale(1.1); } 100% { transform: translate(0, 0) scale(1); } }
    @keyframes particle-1 { 0% { transform: translate(0, 0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(-100px, -100px); opacity: 0; } }
    @keyframes particle-2 { 0% { transform: translate(0, 0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(100px, -50px); opacity: 0; } }
    @keyframes particle-3 { 0% { transform: translate(0, 0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(-50px, 100px); opacity: 0; } }
    .animate-float-1 { animation: float-1 20s infinite linear; }
    .animate-float-2 { animation: float-2 25s infinite linear; }
    .animate-float-3 { animation: float-3 15s infinite ease-in-out; }
    .animate-particle-1 { animation: particle-1 8s infinite linear; }
    .animate-particle-2 { animation: particle-2 12s infinite linear; }
    .animate-particle-3 { animation: particle-3 10s infinite linear; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Burbujas gigantes */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl animate-float-1" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl animate-float-2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-3xl animate-float-3" />
        
        {/* Partículas */}
        <div className="absolute top-[30%] left-[40%] w-2 h-2 bg-cyan-400 rounded-full animate-particle-1" />
        <div className="absolute top-[60%] right-[30%] w-3 h-3 bg-blue-400 rounded-full animate-particle-2" />
        <div className="absolute bottom-[40%] left-[60%] w-1.5 h-1.5 bg-sky-400 rounded-full animate-particle-3" />
        <div className="absolute top-[15%] right-[50%] w-2.5 h-2.5 bg-cyan-300 rounded-full animate-particle-1" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[20%] left-[10%] w-2 h-2 bg-blue-300 rounded-full animate-particle-2" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[80%] right-[15%] w-3 h-3 bg-sky-300 rounded-full animate-particle-3" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[45%] left-[80%] w-1.5 h-1.5 bg-cyan-500 rounded-full animate-particle-1" style={{ animationDelay: '3s' }} />
      </div>
    </>
  );
};
export default BackgroundAnimation;
