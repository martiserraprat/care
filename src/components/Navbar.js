// src/components/Navbar.js
"use client";

import { useContext } from "react";
import { ThemeContext, SidebarContext } from "@/app/dashboard/layout";

const SunIcon  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
const MoonIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);
const MenuIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
const BellIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);

export default function Navbar() {
  const { theme, setTheme } = useContext(ThemeContext);
  const { setOpen }         = useContext(SidebarContext);
  const dark = theme === "dark";

  const today = new Date().toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className={`flex-shrink-0 h-14 flex items-center justify-between px-4 md:px-6 border-b transition-colors ${
      dark
        ? "bg-slate-950/95 border-slate-800 backdrop-blur-md"
        : "bg-white/95 border-slate-100 backdrop-blur-md shadow-sm"
    }`}>

      {/* Left: hamburger + date */}
      <div className="flex items-center gap-3">
        <button className={`md:hidden w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
          dark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
        }`} onClick={() => setOpen(true)}>
          <MenuIcon />
        </button>
      </div>
      {/* Right: theme + bell + avatar */}
      <div className="flex items-center gap-2">

      </div>
    </header>
  );
}