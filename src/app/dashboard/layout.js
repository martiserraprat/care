// src/app/dashboard/layout.js
"use client";

import { useState, useEffect, createContext } from "react";
import Sidebar from "@/components/Sidebar";

export const ThemeContext   = createContext({ theme: "light", setTheme: () => {} });
export const SidebarContext = createContext({ open: false,    setOpen:  () => {} });

export default function DashboardLayout({ children }) {
  const [theme, setTheme]             = useState("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("care-theme") || "light";
    setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("care-theme", theme);
  }, [theme]);

  const dark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <SidebarContext.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
        <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
          dark ? "bg-slate-950" : "bg-slate-50"
        }`}>
          <Sidebar />
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content — no navbar */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0">
            {children}
          </main>
        </div>
      </SidebarContext.Provider>
    </ThemeContext.Provider>
  );
}