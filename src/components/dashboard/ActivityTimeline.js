"use client";
import Card from "@/components/ui/Card";

export default function ActivityTimeline({ logs, loading, dark }) {
  const dot   = { medication: "bg-green-500", interaction: "bg-sky-400", alert: "bg-amber-400", fall: "bg-red-500" };
  const color = { medication: "green", interaction: "sky", alert: "amber", fall: "red" };
  const label = { medication: "Medicació", interaction: "Interacció", alert: "Alerta", fall: "Caiguda" };

  return (
    <Card dark={dark} className="overflow-hidden">
      <div className={`flex items-center gap-2 px-6 py-4 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>Activitat recent</h3>
      </div>
      <div className="p-4 space-y-2">
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} dark={dark} className="h-16 w-full" />)
        ) : logs.length === 0 ? (
          <p className={`text-sm text-center py-6 ${dark ? "text-slate-500" : "text-slate-400"}`}>Cap activitat recent</p>
        ) : (
          logs.map((a, i) => (
            <div key={a.id} className={`flex gap-4 p-4 rounded-2xl border transition-colors ${dark ? "border-slate-800/50 hover:bg-slate-800/20" : "border-slate-100 hover:bg-slate-50"}`}>
              <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${dot[a.type] ?? "bg-slate-400"}`} />
                {i < logs.length - 1 && <div className={`w-px flex-1 min-h-6 rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge color={color[a.type] ?? "slate"} dark={dark}>{label[a.type] ?? a.type}</Badge>
                  <span className={`text-xs shrink-0 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                    {new Date(a.created_at).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{a.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}