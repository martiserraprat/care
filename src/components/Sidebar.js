"use client";
 
import { useContext } from "react";
import Link from "next/link";
import { ThemeContext, SidebarContext } from "@/app/dashboard/layout";
 
const NavItem = ({ href, icon, label, active, dark, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className="block"
  >
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 group ${
        active
          ? dark
            ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
            : "bg-orange-500/10 text-orange-700 border border-orange-300/50"
          : dark
          ? "text-stone-500 hover:bg-stone-800/60 hover:text-stone-200 border border-transparent"
          : "text-stone-500 hover:bg-stone-200/80 hover:text-stone-800 border border-transparent"
      }`}
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      <span className={`text-sm flex-shrink-0 ${active ? "" : "opacity-50 group-hover:opacity-100"}`}>
        {icon}
      </span>
      <span className="truncate tracking-tight">{label}</span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
      )}
    </div>
  </Link>
);
 
export default function Sidebar() {
  const { theme } = useContext(ThemeContext);
  const { open, setOpen } = useContext(SidebarContext);
  const dark = theme === "dark";
 
  const navItems = [
    { href: "/dashboard", icon: "⊞", label: "Dashboard", active: true },
    { href: "/dashboard/medications", icon: "💊", label: "Medicació" },
    { href: "/dashboard/activity", icon: "🕒", label: "Activitat" },
    { href: "/dashboard/robot", icon: "🤖", label: "Control Robot" },
    { href: "/dashboard/reports", icon: "📊", label: "Informes" },
    { href: "/dashboard/settings", icon: "⚙️", label: "Configuració" },
  ];
 
  return (
    <aside
      className={`
        fixed md:relative inset-y-0 left-0 z-40
        w-60 flex-shrink-0 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${dark
          ? "bg-[#0c0a09] border-r border-stone-800/80"
          : "bg-white border-r border-stone-200"
        }
      `}
    >
      {/* Top */}
      <div className="p-4 flex flex-col gap-1">
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-3 py-3 mb-4 border-b ${dark ? "border-stone-800" : "border-stone-100"}`}>
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: "0 0 12px rgba(249,115,22,0.4)" }}>
            <span className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>C</span>
          </div>
          <div>
            <div className={`font-extrabold text-sm leading-tight ${dark ? "text-stone-100" : "text-stone-900"}`}
              style={{ fontFamily: "'Syne', sans-serif" }}>
              CARE-E
            </div>
            <div className={`text-[10px] font-bold tracking-widest ${dark ? "text-orange-500/70" : "text-orange-600/70"}`}>
              HUB
            </div>
          </div>
          {/* Mobile close */}
          <button
            className={`ml-auto md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
              dark ? "bg-stone-800 text-stone-400 hover:text-stone-200" : "bg-stone-100 text-stone-500"
            }`}
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
 
        {/* Status badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${
          dark ? "bg-stone-900/60" : "bg-stone-50"
        }`}>
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" style={{ boxShadow: "0 0 6px #22c55e" }} />
          <span className={`text-xs font-bold ${dark ? "text-stone-400" : "text-stone-500"}`} style={{ fontFamily: "'Space Mono', monospace" }}>
            Robot connectat
          </span>
        </div>
 
        {/* Nav items */}
        <nav className="space-y-0.5 mt-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              dark={dark}
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>
      </div>
 
      {/* Bottom */}
      <div className={`p-4 border-t space-y-3 ${dark ? "border-stone-800" : "border-stone-100"}`}>
        {/* Dispense button */}
        <button
          className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:-translate-y-px"
          style={{
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            boxShadow: "0 0 20px rgba(249,115,22,0.3)",
            fontFamily: "'Space Mono', monospace"
          }}
        >
          💊 Dispensar Ara
        </button>
 
        {/* User row */}
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl ${dark ? "hover:bg-stone-800/50" : "hover:bg-stone-50"} transition-colors cursor-pointer`}>
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
            <span className={`text-xs font-bold ${dark ? "text-orange-400" : "text-orange-600"}`}>N</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-bold truncate ${dark ? "text-stone-300" : "text-stone-700"}`}>Usuari</div>
            <div className={`text-[10px] truncate ${dark ? "text-stone-600" : "text-stone-400"}`}>Família Care-E</div>
          </div>
        </div>
 
        {/* Links */}
        <div className="space-y-1">
          <button className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            dark ? "text-stone-500 hover:text-stone-300 hover:bg-stone-800/50" : "text-stone-400 hover:text-stone-600"
          }`} style={{ fontFamily: "'Space Mono', monospace" }}>
            <span>❓</span> Suport
          </button>
          <button className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            dark ? "text-red-500/70 hover:text-red-400 hover:bg-red-500/5" : "text-red-500 hover:text-red-600"
          }`} style={{ fontFamily: "'Space Mono', monospace" }}>
            <span>🚪</span> Tancar sessió
          </button>
        </div>
      </div>
    </aside>
  );
}
 