// src/components/ui/TimelinedeActividad.js
export default function TimelinedeActividad() {
  const eventos = [
    { tipo: 'MEDICACIÓ', desc: '09:05 - Pastilla del matí dispensada correctament.', tiempo: 'Fa 2 hores', colorText: 'text-green-500', bgIcon: 'bg-green-100', icon: '✓', border: 'border-green-100' },
    { tipo: 'INTERACCIÓ', desc: "S'ha mantingut una conversa amb l'usuari.", tiempo: 'Avui 11:30', colorText: 'text-blue-500', bgIcon: 'bg-blue-100', icon: '💬', border: 'border-blue-100' },
    { tipo: 'ALERTA', desc: "No s'ha detectat l'usuari a l'hora de la pastilla.", tiempo: 'Avui 14:15', colorText: 'text-red-500', bgIcon: 'bg-red-100', icon: '⚠️', border: 'border-red-100' },
  ];

  return (
    <div className="bg-transparent mt-8">
      <h2 className="font-bold text-lg flex items-center gap-2 mb-6 text-slate-800">
        <span className="text-blue-500 text-xl">🕒</span> Historial d'Activitat
      </h2>
      
      {/* Contenedor de la línea vertical */}
      <div className="space-y-6 border-l-2 border-slate-200 ml-4 pl-8 relative">
        
        {eventos.map((evento, idx) => (
          <div key={idx} className={`bg-white p-5 rounded-xl border ${evento.border} shadow-sm relative`}>
            {/* El icono circular que va sobre la línea */}
            <div className={`absolute -left-[43px] top-4 w-10 h-10 rounded-full ${evento.bgIcon} ${evento.colorText} flex items-center justify-center font-bold border-4 border-slate-50`}>
              {evento.icon}
            </div>
            
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs font-bold tracking-wider ${evento.colorText}`}>{evento.tipo}</span>
              <span className="text-xs text-slate-400 font-medium">{evento.tiempo}</span>
            </div>
            <p className="text-sm font-medium text-slate-700">{evento.desc}</p>
          </div>
        ))}
        
      </div>
    </div>
  );
}