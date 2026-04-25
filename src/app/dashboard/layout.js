"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export const ThemeContext = createContext({ theme: "dark", setTheme: () => {} });
export const SidebarContext = createContext({ open: false, setOpen: () => {} });

export default function DashboardLayout({ children }) {
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("care-theme") || "dark";
    setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("care-theme", theme);
  }, [theme]);

  const dark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <SidebarContext.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
        <div
          className={`flex h-screen overflow-hidden transition-colors duration-300 ${
            dark ? "bg-[#0f0d0c]" : "bg-[#f5f3f0]"
          }`}
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');`}</style>

          {/* Sidebar */}
          <Sidebar />

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </ThemeContext.Provider>
  );
}