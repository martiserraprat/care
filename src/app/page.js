// src/app/page.js
import TablaMedicacio from '@/components/ui/TablaMedicacio';
import TimelinedeActividad from '@/components/ui/TimelinedeActividad';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-6"> {/* max-w-6xl centra el contenido si la pantalla es muy grande */}
      
      {/* Sección Superior: Estado y Control Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Estado del Usuario (Ocupa 2 columnas) */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Care-E: Connectat
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Estat de l’usuari</h1>
          <p className="text-slate-500 mb-8 font-medium">L’avi ha estat detectat per última vegada avui a les <strong className="text-blue-600">09:15h</strong>.</p>
          
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold border border-green-100">
              🔋 98% Bateria
            </span>
            <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100">
              📶 Senyal Excel·lent
            </span>
          </div>
          {/* Marca de agua simulada del robot */}
          <div className="absolute -bottom-10 -right-10 text-[150px] opacity-5">🤖</div>
        </div>

        {/* Control Manual (Ocupa 1 columna) */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-3xl mb-4">
            💊
          </div>
          <h2 className="font-bold text-lg text-slate-800 mb-2">Control Manual</h2>
          <p className="text-slate-500 text-sm mb-6 px-4">Dispensar medicació immediatament per a proves o emergències.</p>
          <button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md">
            Dispensar Ara
          </button>
        </div>
      </div>

      {/* Sección Media: Tabla y Formulario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabla (Ocupa 2 columnas) */}
        <div className="lg:col-span-2">
          <TablaMedicacio />
        </div>

        {/* Añadir Medicación (Formulario falso de momento) */}
        <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 h-fit">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-blue-600">⊕</span> Afegir Medicació
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom del Medicament</label>
              <input type="text" placeholder="Ex: Paracetamol" className="w-full bg-slate-200 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hora</label>
                <input type="time" className="w-full bg-slate-200 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-500" />
              </div>
              <div className="w-1/2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Quantitat</label>
                <input type="text" placeholder="1 pastilla" className="w-full bg-slate-200 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition shadow-md mt-2">
              Afegir a la llista
            </button>
          </div>
        </div>
      </div>

      {/* Historial d’Activitat */}
      <div className="lg:w-2/3">
        <TimelinedeActividad />
      </div>

    </div>
  );
}