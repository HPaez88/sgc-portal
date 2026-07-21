import React from 'react';
import { ArrowRight, ShieldCheck, Activity, Users } from 'lucide-react';

const LandingView = ({ onEnter }) => {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden selection:bg-[#0084C9]/30 font-['Inter']">
      
      {/* BACKGROUND GRADIENT GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#60B1FF] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob"></div>
      <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-[#319AFF] rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#84cc16] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-blob animation-delay-4000"></div>

      {/* NAVBAR */}
      <nav className="fixed top-[30px] left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-[1200px]">
        <div 
          className="flex items-center justify-between px-6 py-4 rounded-[16px] backdrop-blur-[50px]"
          style={{
            background: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: 'inset 0px 4px 4px 0px rgba(255,255,255,0.25)'
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* Si el usuario sube el logo a /assets/logo.png, lo reemplazará. Por ahora texto o icono */}
            <div className="w-10 h-10 bg-gradient-to-br from-[#0084C9] to-[#84cc16] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-['Fustat'] font-bold text-xl">O</span>
            </div>
            <span className="font-['Fustat'] font-bold text-xl text-slate-800 tracking-tight">OOMAPASC SGC</span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#0084C9] transition-colors">Características</a>
            <a href="#about" className="hover:text-[#0084C9] transition-colors">Institución</a>
            <a href="#contact" className="hover:text-[#0084C9] transition-colors">Soporte</a>
          </div>

          {/* CTA Nav */}
          <button 
            onClick={onEnter}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/50 hover:bg-white/80 border border-white/40 shadow-sm backdrop-blur-md transition-all text-sm font-semibold text-[#0084C9]"
          >
            Acceder
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 pt-[180px] pb-20 lg:pt-[220px] lg:pb-32 flex flex-col lg:flex-row items-center justify-between min-h-screen">
        
        {/* HERO LEFT - CONTENT */}
        <div className="w-full lg:w-[55%] flex flex-col items-start z-20">
          
          {/* Social Proof Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-slate-200/50 backdrop-blur-md shadow-sm mb-8 animate-fade-in-up">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-[#FF801E] fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-700">Sistema Certificado ISO 9001</span>
          </div>

          {/* Headline */}
          <h1 className="font-['Fustat'] font-bold text-[55px] md:text-[75px] text-slate-900 leading-[1.05] tracking-[-2px] mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Gestión de Calidad,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0084C9] to-[#319AFF]">Inteligente y Rápida</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-[18px] text-slate-600 mb-10 max-w-xl leading-relaxed tracking-[-0.5px] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Administra auditorías, acciones correctivas y planes de mejora de manera centralizada. 
            Mejora continua para OOMAPAS de Cajeme bajo los más altos estándares.
          </p>

          {/* Primary CTA */}
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <button 
              onClick={onEnter}
              className="group relative flex items-center gap-3 px-8 py-4 rounded-[16px] text-white font-semibold text-lg hover:scale-[1.02] transition-all duration-300"
              style={{
                background: 'rgba(0,132,255,0.8)',
                backdropFilter: 'blur(2px)',
                boxShadow: 'inset 0px 4px 4px 0px rgba(255,255,255,0.35), 0 20px 40px -10px rgba(0,132,255,0.4)',
              }}
            >
              <span>Ingresar al Portal SGC</span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 text-[#0084C9]" />
              </div>
            </button>
          </div>

          {/* Feature highlights */}
          <div className="mt-16 flex items-center gap-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <ShieldCheck className="w-5 h-5 text-[#84cc16]" />
              <span>Auditorías ISO</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Activity className="w-5 h-5 text-[#0084C9]" />
              <span>Planes de Mejora</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Users className="w-5 h-5 text-[#319AFF]" />
              <span>Multi-área</span>
            </div>
          </div>
        </div>

        {/* HERO RIGHT - GLASSY ORB */}
        <div className="w-full lg:w-[45%] h-[500px] lg:h-[700px] absolute lg:relative right-0 top-32 lg:top-0 opacity-40 lg:opacity-100 pointer-events-none z-0">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* The orb requires a black background to mix-blend-screen properly, so we use a container */}
            <div className="relative w-[800px] h-[800px] rounded-full flex items-center justify-center overflow-hidden">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover scale-125"
                style={{
                  mixBlendMode: 'screen',
                  /* Se convierte el morado original en azul eléctrico vibrante OOMAPAS */
                  filter: 'hue-rotate(-55deg) saturate(250%) brightness(1.2) contrast(1.1)',
                }}
              >
                <source src="https://future.co/images/homepage/glassy-orb/orb-purple.webm" type="video/webm" />
              </video>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LandingView;
