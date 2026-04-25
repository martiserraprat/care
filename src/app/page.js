// src/app/page.js
"use client";

import { useState, useEffect } from "react";

const IconShield = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IconHeart = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const IconBell = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
const IconPill = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v2"/><circle cx="17" cy="17" r="5"/><path d="m14.5 19.5 5-5"/></svg>);
const IconMic = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>);
const IconGlobe = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>);
const IconSun = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
const IconMoon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);

const Robot = ({ dark }) => {
  const accent = dark ? "#f97316" : "#ea580c";
  const body = dark ? "#1c1917" : "#292524";
  const metal = dark ? "#44403c" : "#57534e";
  return (
    <svg viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
      <defs>
        <filter id="rg"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="rs"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="eg" cx="50%" cy="35%" r="60%"><stop offset="0%" stopColor="#fff7ed"/><stop offset="40%" stopColor={accent}/><stop offset="100%" stopColor="#7c2d12"/></radialGradient>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={metal}/><stop offset="50%" stopColor={body}/><stop offset="100%" stopColor="#0c0a09"/></linearGradient>
      </defs>
      <rect x="140" y="155" width="40" height="35" rx="4" fill="url(#bg)"/>
      <rect x="148" y="158" width="6" height="29" rx="2" fill={metal} opacity="0.5"/>
      <rect x="166" y="158" width="6" height="29" rx="2" fill={metal} opacity="0.5"/>
      <rect x="70" y="190" width="180" height="160" rx="18" fill="url(#bg)"/>
      <rect x="90" y="210" width="140" height="2" rx="1" fill={metal} opacity="0.4"/>
      <rect x="90" y="320" width="140" height="2" rx="1" fill={metal} opacity="0.4"/>
      <rect x="100" y="225" width="120" height="75" rx="10" fill="#0c0a09" stroke={accent} strokeWidth="1.5"/>
      <rect x="108" y="233" width="104" height="59" rx="7" fill="#1c0a00"/>
      <polyline points="115,262 125,262 132,245 140,278 148,255 155,262 175,262 180,252 186,272 192,262 205,262" fill="none" stroke={accent} strokeWidth="2" filter="url(#rs)" opacity="0.9"/>
      <circle cx="185" cy="310" r="4" fill="#22c55e" filter="url(#rs)"/>
      <circle cx="200" cy="310" r="4" fill={accent} filter="url(#rs)"/>
      <circle cx="215" cy="310" r="4" fill={metal} opacity="0.4"/>
      <rect x="30" y="200" width="38" height="100" rx="12" fill="url(#bg)"/>
      <ellipse cx="49" cy="315" rx="18" ry="14" fill={body} stroke={metal} strokeWidth="1.5"/>
      <rect x="252" y="200" width="38" height="100" rx="12" fill="url(#bg)"/>
      <ellipse cx="271" cy="315" rx="18" ry="14" fill={body} stroke={metal} strokeWidth="1.5"/>
      <ellipse cx="110" cy="368" rx="32" ry="16" fill={body} stroke={metal} strokeWidth="2"/>
      <ellipse cx="110" cy="368" rx="18" ry="9" fill="#0c0a09"/>
      <ellipse cx="110" cy="368" rx="5" ry="3" fill={metal} opacity="0.6"/>
      <ellipse cx="210" cy="368" rx="32" ry="16" fill={body} stroke={metal} strokeWidth="2"/>
      <ellipse cx="210" cy="368" rx="18" ry="9" fill="#0c0a09"/>
      <ellipse cx="210" cy="368" rx="5" ry="3" fill={metal} opacity="0.6"/>
      <rect x="80" y="55" width="160" height="105" rx="22" fill="url(#bg)"/>
      <rect x="95" y="68" width="60" height="60" rx="14" fill="#0c0a09" stroke={accent} strokeWidth="2" filter="url(#rs)"/>
      <rect x="165" y="68" width="60" height="60" rx="14" fill="#0c0a09" stroke={accent} strokeWidth="2" filter="url(#rs)"/>
      <circle cx="125" cy="98" r="22" fill="url(#eg)" filter="url(#rg)"/>
      <circle cx="195" cy="98" r="22" fill="url(#eg)" filter="url(#rg)"/>
      <circle cx="125" cy="98" r="10" fill="#1c0a00"/>
      <circle cx="195" cy="98" r="10" fill="#1c0a00"/>
      <circle cx="119" cy="91" r="4" fill="white" opacity="0.6"/>
      <circle cx="189" cy="91" r="4" fill="white" opacity="0.6"/>
      <line x1="160" y1="55" x2="160" y2="20" stroke={metal} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="160" cy="16" r="7" fill={accent} filter="url(#rg)"/>
      <circle cx="160" cy="16" r="3" fill="white" opacity="0.8"/>
      <rect x="105" y="135" width="110" height="16" rx="8" fill="#0c0a09" stroke={metal} strokeWidth="1" opacity="0.8"/>
      <line x1="120" y1="141" x2="200" y2="141" stroke={metal} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
    </svg>
  );
};

export default function LandingPage() {
  const [dark, setDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [authMode, setAuthMode] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("care-theme");
    if (saved) setDark(saved === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("care-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const features = [
    { icon: <IconShield />, title: "Detecció de Caigudes", desc: "Visió per computador que detecta caigudes a l'instant i avisa la família via Telegram o app." },
    { icon: <IconPill />, title: "Dispensació de Medicació", desc: "Recorda, prepara i apropa la dosi exacta a l'hora programada. Mai més oblits." },
    { icon: <IconMic />, title: "Conversa Natural", desc: "Parla amb Care-E com si fos una persona. Escolta ordres, respon amb veu i fa companyia." },
    { icon: <IconHeart />, title: "Reconeixement Facial", desc: "Identifica l'usuari i el saluda pel nom. Cap i ulls expressius per crear vincle emocional." },
    { icon: <IconBell />, title: "Alertes a la Família", desc: "Dashboard web on la família programa horaris i rep notificacions d'emergència." },
    { icon: <IconGlobe />, title: "Navegació Autònoma", desc: "Es mou per l'habitatge evitant obstacles, catifes i mobles sense incidents." },
  ];

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors ${
    dark
      ? "bg-stone-900 border-stone-700 text-stone-100 placeholder-stone-600 focus:border-orange-500"
      : "bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-orange-500"
  }`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-[#0c0a09] text-stone-100" : "bg-[#fafaf9] text-stone-900"}`}>

      {/* Scanlines */}
      <div className="scanlines" />

      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? dark ? "bg-stone-950/90 backdrop-blur-md border-b border-stone-800" : "bg-white/90 backdrop-blur-md border-b border-stone-200"
          : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 12px rgba(249,115,22,0.4)" }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>C</span>
            </div>
            <span className="font-bold text-base tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>CARE-E</span>
            <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full border ${dark ? "border-orange-500/30 text-orange-400 bg-orange-500/5" : "border-orange-300 text-orange-600 bg-orange-50"}`}>v0.1</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setDark(!dark)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${dark ? "bg-stone-800 hover:bg-stone-700 text-stone-300" : "bg-stone-100 hover:bg-stone-200 text-stone-600"}`} aria-label="Canviar tema">
              {dark ? <IconSun /> : <IconMoon />}
            </button>
            <button onClick={() => setAuthMode("login")} className={`hidden sm:block px-4 py-2 rounded-xl text-sm font-bold transition-colors ${dark ? "text-stone-300 hover:text-white hover:bg-stone-800" : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"}`}>
              Iniciar sessió
            </button>
            <button onClick={() => setAuthMode("register")} className="btn-accent px-4 sm:px-5 py-2 rounded-xl text-sm font-bold text-white">
              Registrar-se
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden grid-bg">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none animate-pulse-glow" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6 border animate-fade-up delay-0 ${dark ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-600"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-blink" />
                Robot actiu · UAB Escola d'Enginyeria
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-5 animate-fade-up delay-100" style={{ fontFamily: "'Syne', sans-serif" }}>
                CARE<span className="text-orange-500">-E</span>
                <br />
                <span className={`text-2xl sm:text-3xl lg:text-4xl font-semibold ${dark ? "text-stone-400" : "text-stone-500"}`}>
                  Autonomia, seguretat<br />& companyia.
                </span>
              </h1>
              <p className={`text-sm sm:text-base leading-relaxed mb-8 max-w-md animate-fade-up delay-200 ${dark ? "text-stone-400" : "text-stone-600"}`}>
                Care-E és el robot domèstic que cuida de les persones grans quan la família no hi pot ser. Detecta caigudes, recorda la medicació i fa companyia.
              </p>
              <div className="flex flex-wrap gap-3 animate-fade-up delay-300">
                <button onClick={() => setAuthMode("register")} className="btn-accent px-6 py-3 rounded-2xl font-bold text-white text-sm">
                  Accedir al Dashboard →
                </button>
                <a href="#features" className={`px-6 py-3 rounded-2xl font-bold text-sm border transition-colors ${dark ? "border-stone-700 text-stone-300 hover:border-orange-500/40 hover:text-white" : "border-stone-300 text-stone-600 hover:border-orange-400 hover:text-stone-900"}`}>
                  Veure funcions
                </a>
              </div>
              <div className="flex gap-6 sm:gap-10 mt-10 animate-fade-up delay-400">
                {[["24/7", "Monitoratge"], ["3s", "Alerta caiguda"], ["100%", "Veu natural"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="text-xl sm:text-2xl font-extrabold text-orange-500" style={{ fontFamily: "'Syne', sans-serif" }}>{n}</div>
                    <div className={`text-xs ${dark ? "text-stone-500" : "text-stone-500"}`}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex justify-center order-first lg:order-last">
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-10 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(249,115,22,0.2) 0%, transparent 70%)", filter: "blur(10px)" }} />
              <div className="animate-float w-full max-w-xs sm:max-w-sm">
                <Robot dark={dark} />
              </div>
              <div className={`absolute top-6 right-2 sm:right-4 px-3 py-1.5 rounded-full text-xs font-bold border ${dark ? "bg-stone-900/90 border-stone-700 text-green-400" : "bg-white/90 border-stone-200 text-green-600"}`}>● Online</div>
              <div className={`absolute bottom-16 left-2 px-3 py-1.5 rounded-full text-xs font-bold border ${dark ? "bg-stone-900/90 border-orange-500/30 text-orange-400" : "bg-white/90 border-orange-200 text-orange-600"}`}>💊 14:00</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={`py-20 sm:py-24 ${dark ? "bg-stone-950" : "bg-stone-50"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className={`text-xs font-bold tracking-widest uppercase mb-3 ${dark ? "text-orange-500" : "text-orange-600"}`}>// FUNCIONALITATS</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Tot el que necessita<br /><span className="text-orange-500">un cuidador intel·ligent.</span>
            </h2>
            <p className={`max-w-xl mx-auto text-sm ${dark ? "text-stone-400" : "text-stone-500"}`}>Dissenyat per a persones majors que viuen soles. Cada funció respon a un problema real del dia a dia.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f) => (
              <div key={f.title} className={`rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 ${dark ? "bg-stone-900/60 border-stone-700/50 hover:border-orange-500/40" : "bg-white border-stone-200 hover:border-orange-300 hover:shadow-sm"}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${dark ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-600"}`}>{f.icon}</div>
                <h3 className={`font-bold text-base mb-1.5 ${dark ? "text-stone-100" : "text-stone-900"}`} style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
                <p className={`text-sm leading-relaxed ${dark ? "text-stone-400" : "text-stone-500"}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`py-20 sm:py-24 ${dark ? "bg-[#0c0a09]" : "bg-white"} grid-bg`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className={`text-xs font-bold tracking-widest uppercase mb-3 ${dark ? "text-orange-500" : "text-orange-600"}`}>// COM FUNCIONA</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>Tres passos. Res més.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: "01", title: "Configura des del web", desc: "La família programa medicació, horaris i contacts d'emergència des del dashboard." },
              { n: "02", title: "Care-E s'encarrega", desc: "El robot patrulla, reconeix l'usuari, dispensa pastilles i manté conversa natural." },
              { n: "03", title: "Rep alertes al mòbil", desc: "Si hi ha caiguda o emergència, reps una notificació immediata al teu dispositiu." },
            ].map(({ n, title, desc }) => (
              <div key={n} className={`relative p-6 rounded-2xl border ${dark ? "border-stone-800 bg-stone-900/40" : "border-stone-200 bg-stone-50"}`}>
                <div className="text-5xl font-extrabold text-orange-500/15 mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>{n}</div>
                <div className="absolute top-5 right-5 w-5 h-5 rounded-full border-2 border-orange-500/30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                </div>
                <h3 className={`font-bold text-base mb-2 ${dark ? "text-white" : "text-stone-900"}`} style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h3>
                <p className={`text-sm ${dark ? "text-stone-400" : "text-stone-500"}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-20 sm:py-24 ${dark ? "bg-stone-950" : "bg-stone-50"}`}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-orange-500 flex items-center justify-center mx-auto mb-6" style={{ boxShadow: "0 0 50px rgba(249,115,22,0.35)" }}>
            <span className="text-white text-2xl font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>C</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Comença avui.<br /><span className="text-orange-500">Cuida millor.</span>
          </h2>
          <p className={`mb-8 text-sm max-w-md mx-auto ${dark ? "text-stone-400" : "text-stone-500"}`}>
            Registra't i accedeix al dashboard per gestionar Care-E des de qualsevol dispositiu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setAuthMode("register")} className="btn-accent px-8 py-3.5 rounded-2xl font-bold text-white">Crear compte gratuït</button>
            <button onClick={() => setAuthMode("login")} className={`px-8 py-3.5 rounded-2xl font-bold border transition-colors ${dark ? "border-stone-700 text-stone-300 hover:border-orange-500/40" : "border-stone-300 text-stone-600 hover:border-orange-400"}`}>Ja tinc compte</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`border-t py-8 ${dark ? "border-stone-800 bg-stone-950" : "border-stone-100 bg-white"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>CARE-E</span>
          </div>
          <p className={`text-xs text-center ${dark ? "text-stone-600" : "text-stone-400"}`}>© 2025-26 UAB Escola d'Enginyeria · Robòtica, Llenguatge i Planificació</p>
          <p className={`text-xs ${dark ? "text-stone-600" : "text-stone-400"}`}>Bertrans · Cantero · Domene · Serra · Vidal</p>
        </div>
      </footer>

      {/* AUTH MODAL */}
      {authMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }} onClick={(e) => e.target === e.currentTarget && setAuthMode(null)}>
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border ${dark ? "bg-stone-950 border-stone-800" : "bg-white border-stone-200"}`} style={{ boxShadow: dark ? "0 0 80px rgba(249,115,22,0.1), 0 25px 60px rgba(0,0,0,0.5)" : "0 25px 80px rgba(0,0,0,0.12)" }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">C</span>
                  </div>
                  <span className="font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>CARE-E</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {authMode === "login" ? "Benvingut de nou" : "Crear compte"}
                </h2>
              </div>
              <button onClick={() => setAuthMode(null)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${dark ? "bg-stone-800 hover:bg-stone-700 text-stone-400" : "bg-stone-100 hover:bg-stone-200 text-stone-500"}`}>✕</button>
            </div>
            <div className={`flex rounded-xl p-1 mb-5 ${dark ? "bg-stone-900" : "bg-stone-100"}`}>
              {[["login", "Iniciar sessió"], ["register", "Registrar-se"]].map(([m, label]) => (
                <button key={m} onClick={() => setAuthMode(m)} className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${authMode === m ? "bg-orange-500 text-white" : dark ? "text-stone-400 hover:text-stone-200" : "text-stone-500 hover:text-stone-800"}`}>{label}</button>
              ))}
            </div>
            <div className="space-y-3">
              {authMode === "register" && (
                <div>
                  <label className={`block text-[10px] font-bold mb-1.5 tracking-wider ${dark ? "text-stone-500" : "text-stone-400"}`}>NOM</label>
                  <input type="text" placeholder="El teu nom" className={inputCls} />
                </div>
              )}
              <div>
                <label className={`block text-[10px] font-bold mb-1.5 tracking-wider ${dark ? "text-stone-500" : "text-stone-400"}`}>CORREU</label>
                <input type="email" placeholder="nom@exemple.com" className={inputCls} />
              </div>
              <div>
                <label className={`block text-[10px] font-bold mb-1.5 tracking-wider ${dark ? "text-stone-500" : "text-stone-400"}`}>CONTRASENYA</label>
                <input type="password" placeholder="••••••••" className={inputCls} />
              </div>
            </div>
            <button className="btn-accent w-full mt-5 py-3.5 rounded-2xl font-bold text-white text-sm">
              {authMode === "login" ? "Entrar al Dashboard →" : "Crear compte →"}
            </button>
            <p className={`text-xs text-center mt-4 ${dark ? "text-stone-600" : "text-stone-400"}`}>
              {authMode === "login"
                ? <><span>Nou aquí? </span><button onClick={() => setAuthMode("register")} className="text-orange-500 hover:underline">Crea un compte</button></>
                : <><span>Ja tens compte? </span><button onClick={() => setAuthMode("login")} className="text-orange-500 hover:underline">Inicia sessió</button></>
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}