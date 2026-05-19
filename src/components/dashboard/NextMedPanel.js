"use client";
import Card from "@/components/ui/Card";

export default function NextMedPanel({ meds, dark }) {
  const next = meds
    .filter(m => m.log_status !== "taken" && m.log_status !== "dispensed")
    .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))[0];

  return (
    <Card dark={dark} className="p-6 h-fit">
      <h3 className={`text-base font-bold mb-4 ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>
        Propera medicació
      </h3>
      {!next ? (
        <p className={`text-sm text-center py-4 ${dark ? "text-slate-500" : "text-slate-400"}`}>
          Tota la medicació d'avui ja s'ha pres ✓
        </p>
      ) : (
        <div className={`p-5 rounded-2xl border ${dark ? "border-sky-800/40 bg-sky-950/40" : "border-sky-100 bg-sky-50"}`}>
          <div className={`text-3xl font-bold mb-1 ${dark ? "text-sky-400" : "text-sky-600"} font-jakarta`}>
            {next.scheduled_time?.slice(0, 5)}
          </div>
          
          {/* ARREGLAT: Busquem el nom dins de slot_inventory */}
          <div className={`text-base font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
            {next.slot_inventory?.medication_name || "Medicament desconegut"}
          </div>
          
          {/* ARREGLAT: Afegim el text "pastilla/es" al costat del número de la dosi */}
          <div className={`text-sm mt-0.5 ${dark ? "text-slate-500" : "text-slate-500"}`}>
            {next.dose} {next.dose === 1 ? "pastilla" : "pastilles"}
          </div>
        </div>
      )}
    </Card>
  );
}