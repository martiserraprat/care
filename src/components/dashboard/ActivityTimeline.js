"use client";
import Card from "@/components/ui/Card";
import Badge from "../ui/Badge";

export default function ActivityTimeline({ logs, loading, dark }) {
  const dot = { 
    fall: "bg-red-500",
    medication_missed: "bg-amber-400",
    medication_failed_inventory: "bg-orange-500",
    low_battery: "bg-yellow-500",
    offline: "bg-slate-400",
    low_inventory: "bg-orange-400",
  };
  
  const color = { 
    fall: "red",
    medication_missed: "amber",
    medication_failed_inventory: "red",
    low_battery: "amber",
    offline: "slate",
    low_inventory: "amber",
  };
  
  const label = { 
    fall: "🚨 Caiguda",
    medication_missed: "⚠️ Presa perduda",
    medication_failed_inventory: "📦 Sense estoc",
    low_battery: "🔋 Bateria baixa",
    offline: "📡 Desconnectat",
    low_inventory: "📉 Inventari baix",
  };

  // Construeix una descripció rica a partir de l'alerta + el log enllaçat
  const buildRichDescription = (a) => {
    const log = a.dispense_log;

    // Cas: presa perduda
    if (a.type === "medication_missed" && log) {
      const hora = log.scheduled_time?.slice(0, 5);
      const med = a.medication_name || "medicació";
      return `No s'ha pres ${med}${hora ? ` programada a les ${hora}h` : ""}.`;
    }

    // Cas: inventari insuficient
    if (a.type === "medication_failed_inventory" && log) {
      const hora = log.scheduled_time?.slice(0, 5);
      const med = a.medication_name || "medicació";
      const real = log.dose_real ?? 0;
      const demanat = log.dose ?? "?";
      return `${med}${hora ? ` (${hora}h)` : ""}: només s'han pogut dispensar ${real} de ${demanat} pastilles. Cal omplir el slot.`;
    }

    // Altres casos: fem servir el description directe o un per defecte
    if (a.description) return a.description;

    const defaults = {
      fall: "S'ha detectat una possible caiguda",
      low_battery: "La bateria del robot està baixa",
      offline: "El robot ha perdut la connexió",
      low_inventory: "Un slot té poques pastilles restants",
    };
    return defaults[a.type] || "Alerta del sistema";
  };

  // Format de data més útil: "Avui 14:30" / "Ahir 09:15" / "19 maig 22:00"
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
    
    const time = date.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
    
    if (isToday) return `Avui ${time}`;
    if (isYesterday) return `Ahir ${time}`;
    return date.toLocaleDateString("ca-ES", { day: "numeric", month: "short" }) + ` ${time}`;
  };

  return (
    <Card dark={dark} className="overflow-hidden">
      <div className={`flex items-center justify-between gap-2 px-6 py-4 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>
          Alertes Recents
        </h3>
        {logs.length > 0 && (
          <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {logs.filter(l => !l.resolved).length} sense resoldre
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} dark={dark} className="h-16 w-full" />)
        ) : logs.length === 0 ? (
          <p className={`text-sm text-center py-6 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            Cap alerta recent ✓
          </p>
        ) : (
          logs.map((a, i) => (
            <div 
              key={a.id} 
              className={`flex gap-4 p-4 rounded-2xl border transition-colors ${
                a.resolved 
                  ? (dark ? "border-slate-800/30 opacity-60" : "border-slate-100 opacity-60")
                  : (dark ? "border-slate-800/50 hover:bg-slate-800/20" : "border-slate-100 hover:bg-slate-50")
              }`}
            >
              <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${dot[a.type] ?? "bg-slate-400"}`} />
                {i < logs.length - 1 && (
                  <div className={`w-px flex-1 min-h-6 rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Capçal: tipus + temps */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge color={color[a.type] ?? "slate"} dark={dark}>
                    {label[a.type] ?? a.type}
                  </Badge>
                  <span className={`text-xs shrink-0 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                    {formatTime(a.created_at)}
                  </span>
                </div>

                {/* Descripció enriquida amb totes les dades */}
                <p className={`text-sm leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  {buildRichDescription(a)}
                </p>

                {/* Detalls extra en pills si hi ha info al log */}
                {a.dispense_log && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {a.dispense_log.scheduled_time && (
                      <span className={`text-xs px-2 py-0.5 rounded-md ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                        🕒 {a.dispense_log.scheduled_time.slice(0, 5)}
                      </span>
                    )}
                    {a.medication_name && (
                      <span className={`text-xs px-2 py-0.5 rounded-md ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                        💊 {a.medication_name}
                      </span>
                    )}
                    {a.type === "medication_failed_inventory" && a.dispense_log.dose_real !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-md ${dark ? "bg-red-950/40 text-red-400" : "bg-red-50 text-red-600"}`}>
                        📦 {a.dispense_log.dose_real}/{a.dispense_log.dose} dispensades
                      </span>
                    )}
                  </div>
                )}

                {a.resolved && (
                  <span className={`inline-block mt-1.5 text-xs ${dark ? "text-green-500" : "text-green-600"}`}>
                    ✓ Resolta
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}