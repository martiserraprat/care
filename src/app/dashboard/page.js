"use client";

import { useContext, useState } from "react";
import { ThemeContext } from "@/app/dashboard/layout";

// ─── Tiny icon components ────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Shared card wrapper ─────────────────────────────────────────────────────
function Card({ children, className = "", dark }) {
  return (
    <div className={`rounded-2xl border transition-colors ${
      dark
        ? "bg-stone-900/50 border-stone-800/70"
        : "bg-white border-stone-200"
    } ${className}`}>
      {children}
    </div>
  );
}

// ─── Status Card ─────────────────────────────────────────────────────────────
function StatusCard({ dark }) {
  const lastSeen = "09:15h";
  return (
    <Card dark={dark} className="p-6 lg:col-span-2 relative overflow-hidden">
      {/* Background robot watermark */}
      <div
        className="absolute -bottom-8 -right-8 text-[120px] pointer-events-none select-none"
        style={{ opacity: 0.04, filter: "grayscale(1)" }}
      >
        🤖
      </div>

      {/* Online badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
          style={{ boxShadow: "0 0 6px #22c55e" }} />
        <span className={`text-xs font-bold ${dark ? "text-green-400" : "text-green-600"}`}
          style={{ fontFamily: "'Space Mono', monospace" }}>
          Care-E: Connectat
        </span>
      </div>

      <h2 className={`text-xl font-extrabold mb-1 ${dark ? "text-stone-100" : "text-stone-900"}`}
        style={{ fontFamily: "'Syne', sans-serif" }}>
        Estat de l'usuari
      </h2>
      <p className={`text-sm mb-6 ${dark ? "text-stone-400" : "text-stone-500"}`}
        style={{ fontFamily: "'Space Mono', monospace" }}>
        Última detecció avui a les{" "}
        <span className={`font-bold ${dark ? "text-orange-400" : "text-orange-600"}`}>
          {lastSeen}
        </span>
      </p>

      <div className="flex flex-wrap gap-3">
        <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${
          dark ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"
        }`} style={{ fontFamily: "'Space Mono', monospace" }}>
          🔋 98% Bateria
        </span>
        <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${
          dark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"
        }`} style={{ fontFamily: "'Space Mono', monospace" }}>
          📶 Senyal Excel·lent
        </span>
        <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${
          dark ? "bg-stone-800 border-stone-700 text-stone-400" : "bg-stone-50 border-stone-200 text-stone-600"
        }`} style={{ fontFamily: "'Space Mono', monospace" }}>
          🕒 Actiu fa 2h
        </span>
      </div>
    </Card>
  );
}

// ─── Quick Dispense Card ─────────────────────────────────────────────────────
function DispenseCard({ dark }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDispense = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1800);
    setTimeout(() => setDone(false), 4000);
  };

  return (
    <Card dark={dark} className="p-6 flex flex-col justify-between">
      <div className="text-center">
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
          dark ? "bg-orange-500/10 border border-orange-500/20" : "bg-orange-50 border border-orange-200"
        }`}>
          <span className="text-2xl">💊</span>
        </div>
        <h3 className={`font-extrabold text-base mb-1 ${dark ? "text-stone-100" : "text-stone-900"}`}
          style={{ fontFamily: "'Syne', sans-serif" }}>
          Control Manual
        </h3>
        <p className={`text-xs leading-relaxed mb-6 ${dark ? "text-stone-500" : "text-stone-500"}`}
          style={{ fontFamily: "'Space Mono', monospace" }}>
          Dispensar medicació immediatament per a proves o emergències.
        </p>
      </div>

      <button
        onClick={handleDispense}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
          done
            ? dark ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-green-50 text-green-700 border border-green-200"
            : "text-white hover:-translate-y-px active:translate-y-0"
        } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
        style={!done ? {
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          boxShadow: "0 0 20px rgba(249,115,22,0.25)",
          fontFamily: "'Space Mono', monospace"
        } : { fontFamily: "'Space Mono', monospace" }}
      >
        {done ? "✓ Dispensat!" : loading ? "Enviant ordre..." : "Dispensar Ara"}
      </button>
    </Card>
  );
}

// ─── Medication Table ────────────────────────────────────────────────────────
const medications = [
  { time: "08:00", name: "Omeprazol", dose: "1 comprimit", status: "done" },
  { time: "09:00", name: "Paracetamol", dose: "500mg", status: "done" },
  { time: "14:00", name: "Ibuprofèn", dose: "400mg", status: "pending" },
  { time: "21:00", name: "Simvastatina", dose: "20mg", status: "pending" },
];

function MedicationTable({ dark }) {
  const today = new Date().toLocaleDateString("ca-ES", {
    weekday: "long", day: "numeric", month: "long"
  });
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <Card dark={dark} className="overflow-hidden">
      <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? "border-stone-800" : "border-stone-100"}`}>
        <h3 className={`font-extrabold text-base ${dark ? "text-stone-100" : "text-stone-900"}`}
          style={{ fontFamily: "'Syne', sans-serif" }}>
          Pla de Medicació d'Avui
        </h3>
        <span className={`text-xs ${dark ? "text-stone-500" : "text-stone-400"}`}
          style={{ fontFamily: "'Space Mono', monospace" }}>
          {todayFormatted}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`text-xs font-bold border-b ${
              dark ? "text-stone-600 border-stone-800" : "text-stone-400 border-stone-100"
            }`} style={{ fontFamily: "'Space Mono', monospace" }}>
              <th className="px-6 py-3 text-left">HORA</th>
              <th className="px-4 py-3 text-left">MEDICAMENT</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">QUANTITAT</th>
              <th className="px-6 py-3 text-right">ESTAT</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med, i) => (
              <tr
                key={i}
                className={`border-b last:border-b-0 transition-colors ${
                  dark
                    ? "border-stone-800/60 hover:bg-stone-800/30"
                    : "border-stone-50 hover:bg-stone-50/80"
                }`}
              >
                <td className="px-6 py-4">
                  <span className={`text-sm font-bold ${dark ? "text-orange-400" : "text-orange-600"}`}
                    style={{ fontFamily: "'Space Mono', monospace" }}>
                    {med.time}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-sm font-bold ${dark ? "text-stone-200" : "text-stone-800"}`}
                    style={{ fontFamily: "'Space Mono', monospace" }}>
                    {med.name}
                  </span>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <span className={`text-sm ${dark ? "text-stone-500" : "text-stone-400"}`}
                    style={{ fontFamily: "'Space Mono', monospace" }}>
                    {med.dose}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                    med.status === "done"
                      ? dark
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-green-50 border-green-200 text-green-700"
                      : dark
                      ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                      : "bg-orange-50 border-orange-200 text-orange-700"
                  }`} style={{ fontFamily: "'Space Mono', monospace" }}>
                    {med.status === "done" ? (
                      <><CheckIcon /> Pres</>
                    ) : (
                      <>⏳ Pendent</>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Add Medication Form ─────────────────────────────────────────────────────
function AddMedicationForm({ dark }) {
  const [form, setForm] = useState({ name: "", time: "", dose: "" });
  const [saved, setSaved] = useState(false);

  const handleSubmit = () => {
    if (!form.name) return;
    setSaved(true);
    setForm({ name: "", time: "", dose: "" });
    setTimeout(() => setSaved(false), 2500);
  };

  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all ${
    dark
      ? "bg-stone-800/70 border-stone-700/60 text-stone-200 placeholder-stone-600 focus:border-orange-500/50"
      : "bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-300 focus:border-orange-400"
  }`;

  return (
    <Card dark={dark} className="p-5">
      <h3 className={`font-extrabold text-base mb-4 flex items-center gap-2 ${dark ? "text-stone-100" : "text-stone-900"}`}
        style={{ fontFamily: "'Syne', sans-serif" }}>
        <span className={dark ? "text-orange-400" : "text-orange-500"}>⊕</span>
        Afegir Medicació
      </h3>

      <div className="space-y-3">
        <div>
          <label className={`block text-[10px] font-bold mb-1.5 tracking-wider ${dark ? "text-stone-500" : "text-stone-400"}`}
            style={{ fontFamily: "'Space Mono', monospace" }}>
            NOM DEL MEDICAMENT
          </label>
          <input
            type="text"
            placeholder="Ex: Paracetamol"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            style={{ fontFamily: "'Space Mono', monospace" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-[10px] font-bold mb-1.5 tracking-wider ${dark ? "text-stone-500" : "text-stone-400"}`}
              style={{ fontFamily: "'Space Mono', monospace" }}>
              HORA
            </label>
            <input
              type="time"
              value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
              className={inputClass}
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-bold mb-1.5 tracking-wider ${dark ? "text-stone-500" : "text-stone-400"}`}
              style={{ fontFamily: "'Space Mono', monospace" }}>
              QUANTITAT
            </label>
            <input
              type="text"
              placeholder="1 pastilla"
              value={form.dose}
              onChange={e => setForm({ ...form, dose: e.target.value })}
              className={inputClass}
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 mt-1 ${
            saved
              ? dark ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-green-50 text-green-700 border border-green-200"
              : "text-white hover:-translate-y-px"
          }`}
          style={!saved ? {
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            boxShadow: "0 0 16px rgba(249,115,22,0.2)",
            fontFamily: "'Space Mono', monospace"
          } : { fontFamily: "'Space Mono', monospace" }}
        >
          {saved ? "✓ Afegida!" : "Afegir a la llista"}
        </button>
      </div>
    </Card>
  );
}

// ─── Activity Timeline ───────────────────────────────────────────────────────
const activities = [
  {
    type: "MEDICACIÓ",
    typeColor: "green",
    icon: "✓",
    time: "Fa 2 hores",
    text: "09:05 — Pastilla del matí dispensada correctament.",
  },
  {
    type: "INTERACCIÓ",
    typeColor: "blue",
    icon: "💬",
    time: "Avui 11:30",
    text: "S'ha mantingut una conversa amb l'usuari.",
  },
  {
    type: "ALERTA",
    typeColor: "orange",
    icon: "⚠",
    time: "Avui 14:15",
    text: "No s'ha detectat l'usuari a l'hora de la pastilla.",
  },
];

function ActivityTimeline({ dark }) {
  const colorMap = {
    green: {
      badge: dark ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700",
      dot: "bg-green-500",
      line: dark ? "border-green-500/20" : "border-green-200",
    },
    blue: {
      badge: dark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700",
      dot: "bg-blue-400",
      line: dark ? "border-blue-500/20" : "border-blue-200",
    },
    orange: {
      badge: dark ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-700",
      dot: "bg-orange-500",
      line: dark ? "border-orange-500/20" : "border-orange-200",
    },
  };

  return (
    <Card dark={dark} className="overflow-hidden">
      <div className={`flex items-center gap-2 px-6 py-4 border-b ${dark ? "border-stone-800" : "border-stone-100"}`}>
        <span className={dark ? "text-stone-400" : "text-stone-400"}>🕒</span>
        <h3 className={`font-extrabold text-base ${dark ? "text-stone-100" : "text-stone-900"}`}
          style={{ fontFamily: "'Syne', sans-serif" }}>
          Historial d'Activitat
        </h3>
      </div>

      <div className="p-4 space-y-3">
        {activities.map((act, i) => {
          const c = colorMap[act.typeColor];
          return (
            <div
              key={i}
              className={`flex gap-4 p-4 rounded-xl border transition-colors ${
                dark ? "border-stone-800/60 hover:bg-stone-800/30" : "border-stone-100 hover:bg-stone-50/80"
              }`}
            >
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                  dark ? "bg-stone-800 text-stone-300" : "bg-stone-50 text-stone-500"
                }`}>
                  {act.icon}
                </div>
                {i < activities.length - 1 && (
                  <div className={`w-px flex-1 min-h-3 border-l border-dashed ${
                    dark ? "border-stone-700" : "border-stone-200"
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold border tracking-wider ${c.badge}`}
                    style={{ fontFamily: "'Space Mono', monospace" }}>
                    {act.type}
                  </span>
                  <span className={`text-[10px] flex-shrink-0 ${dark ? "text-stone-600" : "text-stone-400"}`}
                    style={{ fontFamily: "'Space Mono', monospace" }}>
                    {act.time}
                  </span>
                </div>
                <p className={`text-sm ${dark ? "text-stone-400" : "text-stone-600"}`}
                  style={{ fontFamily: "'Space Mono', monospace" }}>
                  {act.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Stats mini row ──────────────────────────────────────────────────────────
function StatsRow({ dark }) {
  const stats = [
    { label: "Pastilles avui", value: "2/4", ok: true },
    { label: "Dies sense incidents", value: "12", ok: true },
    { label: "Alertes pendents", value: "1", ok: false },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, ok }) => (
        <Card key={label} dark={dark} className="p-4 text-center">
          <div className={`text-2xl font-extrabold mb-1 ${
            ok
              ? dark ? "text-orange-400" : "text-orange-600"
              : dark ? "text-red-400" : "text-red-600"
          }`} style={{ fontFamily: "'Syne', sans-serif" }}>
            {value}
          </div>
          <div className={`text-[10px] leading-tight ${dark ? "text-stone-500" : "text-stone-400"}`}
            style={{ fontFamily: "'Space Mono', monospace" }}>
            {label}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { theme } = useContext(ThemeContext);
  const dark = theme === "dark";

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-extrabold ${dark ? "text-stone-100" : "text-stone-900"}`}
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Dashboard
          </h1>
          <p className={`text-xs mt-0.5 ${dark ? "text-stone-500" : "text-stone-400"}`}
            style={{ fontFamily: "'Space Mono', monospace" }}>
            Monitoratge en temps real · Care-E Hub
          </p>
        </div>
        <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`}
          style={{ boxShadow: "0 0 8px #22c55e" }} />
      </div>

      {/* Stats row */}
      <StatsRow dark={dark} />

      {/* Top row: status + dispense */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StatusCard dark={dark} />
        <DispenseCard dark={dark} />
      </div>

      {/* Middle row: table + form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <MedicationTable dark={dark} />
        </div>
        <AddMedicationForm dark={dark} />
      </div>

      {/* Activity timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ActivityTimeline dark={dark} />
        </div>
        {/* Quick info panel */}
        <Card dark={dark} className="p-5 h-fit">
          <h3 className={`font-extrabold text-sm mb-4 ${dark ? "text-stone-100" : "text-stone-900"}`}
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Propera Medicació
          </h3>
          <div className={`p-4 rounded-xl border mb-3 ${
            dark ? "border-orange-500/20 bg-orange-500/5" : "border-orange-200 bg-orange-50/60"
          }`}>
            <div className={`text-xl font-extrabold ${dark ? "text-orange-400" : "text-orange-600"}`}
              style={{ fontFamily: "'Syne', sans-serif" }}>
              14:00
            </div>
            <div className={`text-sm font-bold ${dark ? "text-stone-300" : "text-stone-700"}`}
              style={{ fontFamily: "'Space Mono', monospace" }}>
              Ibuprofèn
            </div>
            <div className={`text-xs mt-0.5 ${dark ? "text-stone-500" : "text-stone-400"}`}
              style={{ fontFamily: "'Space Mono', monospace" }}>
              400mg · 1 comprimido
            </div>
          </div>
          <div className={`text-xs text-center ${dark ? "text-stone-600" : "text-stone-400"}`}
            style={{ fontFamily: "'Space Mono', monospace" }}>
            Falten ~2h 45min
          </div>
        </Card>
      </div>

    </div>
  );
}