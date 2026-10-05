import React from 'react';

const BackgroundAnimation = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-tech-mesh">
      {/* Subtle institutional ambient light */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-100/50 rounded-full blur-3xl opacity-70" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-50" />
    </div>
  );
};

export default BackgroundAnimation;
