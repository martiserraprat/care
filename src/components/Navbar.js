// src/components/Navbar.js
export default function Navbar() {
  return (
    <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center z-10">
      <div className="font-bold text-xl text-slate-800">Care-E Vitals</div>
      
      {/* Enlaces centrales */}
      <nav className="hidden md:flex space-x-6 text-sm font-medium text-slate-500">
        <a href="#" className="text-emerald-600 border-b-2 border-emerald-600 pb-1">Dashboard</a>
        <a href="#" className="hover:text-slate-800">Dispositius</a>
        <a href="#" className="hover:text-slate-800">Informes</a>
      </nav>

      {/* Iconos de la derecha */}
      <div className="flex items-center space-x-4">
        <button className="text-slate-400 hover:text-slate-600 text-xl">🔔</button>
        <button className="text-slate-400 hover:text-slate-600 text-xl">⚙️</button>
        <div className="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div> {/* Avatar */}
      </div>
    </header>
  );
}