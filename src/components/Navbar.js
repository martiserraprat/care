"use client";

import { useContext } from "react";
import { ThemeContext, SidebarContext } from "@/app/dashboard/layout";

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

export default function Navbar() {
  const { theme, setTheme } = useContext(ThemeContext);
  const { setOpen } = useContext(SidebarContext);
  const dark = theme === "dark";

  const navLinks = [
    { label: "Dashboard", active: true },
    { label: "Dispositius" },
    { label: "Informes" },
  ];

  const today = new Date().toLocaleDateString("ca-ES", {
    weekday: "long", day: "numeric", month: "long"
  });
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header
      className={`flex-shrink-0 h-14 flex items-center justify-between px-4 md:px-6 border-b transition-colors ${
        dark
          ? "bg-[#0c0a09]/95 border-stone-800/80 backdrop-blur-md"
          : "bg-white/95 border-stone-200 backdrop-blur-md"
      }`}
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      {/* Left: hamburger (mobile) + date */}
      <div className="flex items-center gap-3">
        <button
          className={`md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            dark ? "text-stone-400 hover:bg-stone-800 hover:text-stone-200" : "text-stone-500 hover:bg-stone-100"
          }`}
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
        </button>

        <span className={`text-xs hidden sm:block ${dark ? "text-stone-500" : "text-stone-400"}`}>
          {todayFormatted}
        </span>
      </div>

      {/* Center: nav links (hidden on mobile) */}
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map(({ label, active }) => (
          <button
            key={label}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              active
                ? dark
                  ? "text-orange-400 bg-orange-500/10 border border-orange-500/20"
                  : "text-orange-700 bg-orange-500/8 border border-orange-300/40"
                : dark
                ? "text-stone-500 hover:text-stone-200 hover:bg-stone-800/60"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Right: theme + bell + avatar */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(dark ? "light" : "dark")}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            dark
              ? "text-stone-400 hover:bg-stone-800 hover:text-amber-400"
              : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          }`}
          title={dark ? "Tema clar" : "Tema fosc"}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Bell with dot */}
        <button
          className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            dark ? "text-stone-400 hover:bg-stone-800 hover:text-stone-200" : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          <BellIcon />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 border-2 border-[#0c0a09]" />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center cursor-pointer hover:border-orange-500/60 transition-colors"
          title="Perfil"
        >
          <span className={`text-xs font-bold ${dark ? "text-orange-400" : "text-orange-600"}`}>N</span>
        </div>
      </div>
    </header>
  );
}