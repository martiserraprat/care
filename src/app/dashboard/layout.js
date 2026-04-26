// src/app/dashboard/layout.js
"use client";

import { useState, useEffect, createContext } from "react";
import Sidebar from "@/components/Sidebar";

export const ThemeContext   = createContext({ theme: "light", setTheme: () => {} });
export const SidebarContext = createContext({ open: false,    setOpen:  () => {} });

// Llegeix el tema del localStorage de forma síncrona
// per evitar el flash de tema incorrecte en el primer render
function getInitialTheme() {
  if (typeof window === "undefined") return "light"; // servidor
  return localStorage.getItem("care-theme") ?? "light";
}

export default function DashboardLayout({ children }) {
  const [theme, setTheme]             = useState(getInitialTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sincronitza al localStorage cada cop que canvia
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

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0">
            {children}
          </main>
        </div>
      </SidebarContext.Provider>
    </ThemeContext.Provider>
  );
}