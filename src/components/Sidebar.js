// src/components/Sidebar.js
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-50 border-r flex flex-col justify-between hidden md:flex">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="font-bold text-emerald-700 text-lg">Care-E Hub</h2>
          <p className="text-xs text-slate-500 font-semibold tracking-wider">ACTIVE MONITORING</p>
        </div>
        
        <nav className="space-y-2">
          {/* El enlace activo tiene fondo verde claro */}
          <Link href="/" className="flex items-center space-x-3 text-emerald-700 bg-emerald-100 px-4 py-3 rounded-lg font-medium">
            <span>⊞</span> <span>Dashboard</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 text-slate-600 hover:bg-slate-200 px-4 py-3 rounded-lg font-medium transition">
            <span>💊</span> <span>Medications</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 text-slate-600 hover:bg-slate-200 px-4 py-3 rounded-lg font-medium transition">
            <span>🕒</span> <span>Activity</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 text-slate-600 hover:bg-slate-200 px-4 py-3 rounded-lg font-medium transition">
            <span>🤖</span> <span>Robot Control</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 text-slate-600 hover:bg-slate-200 px-4 py-3 rounded-lg font-medium transition">
            <span>⚙️</span> <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Botón dispensar y logout abajo del todo */}
      <div className="p-6 border-t border-slate-200 space-y-4">
         <button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-3 font-semibold shadow-md transition">
            Dispense Now
         </button>
         <div className="space-y-3 pt-2 text-sm font-medium text-slate-600">
            <button className="flex items-center space-x-3 hover:text-slate-900">
               <span className="text-lg">❓</span> <span>Support</span>
            </button>
            <button className="flex items-center space-x-3 text-red-600 hover:text-red-700">
               <span className="text-lg">🚪</span> <span>Logout</span>
            </button>
         </div>
      </div>
    </aside>
  );
}