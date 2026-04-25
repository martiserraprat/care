// src/app/dashboard/page.js
"use client";

import { useContext, useState } from "react";
import { ThemeContext } from "@/app/dashboard/layout";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BTN_PRIMARY = {
  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
  boxShadow: "0 4px 16px rgba(14,165,233,0.3)",
  color: "white",
  fontWeight: 600,
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

// ─── Reusable Button ──────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl text-sm transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
      style={BTN_PRIMARY}
    >
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, className = "", dark }) {
  return (
    <div className={`rounded-2xl border ${
      dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
    } ${className}`}>
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ children, color = "sky", dark }) {
  const map = {
    sky:   dark ? "bg-sky-950/60 border-sky-800/40 text-sky-300"     : "bg-sky-50 border-sky-200 text-sky-700",
    green: dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700",
    amber: dark ? "bg-amber-950/60 border-amber-800/40 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700",
    slate: dark ? "bg-slate-800 border-slate-700 text-slate-400"       : "bg-slate-50 border-slate-200 text-slate-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border ${map[color]}`}>
      {children}
    </span>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────
function StatsRow({ dark }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {[
        { value: "2 / 4", label: "Pastilles avui",       badge: "2 pendents",  bColor: "sky" },
        { value: "12",    label: "Dies sense incidents",  badge: "Molt bé 🎉",  bColor: "green" },
        { value: "1",     label: "Alerta activa",         badge: "Revisar avui",bColor: "amber" },
      ].map(({ value, label, badge, bColor }) => (
        <Card key={label} dark={dark} className="p-4 sm:p-5">
          <div className={`text-2xl sm:text-3xl font-bold mb-1.5 ${
            bColor === "sky" ? (dark ? "text-sky-400" : "text-sky-600") :
            bColor === "green" ? (dark ? "text-green-400" : "text-green-600") :
            (dark ? "text-amber-400" : "text-amber-600")
          }`} style={{ fontFamily: "var(--font-jakarta, sans-serif)" }}>
            {value}
          </div>
          <p className={`text-sm mb-2.5 ${dark ? "text-slate-300" : "text-slate-700"}`}>{label}</p>
          <Badge color={bColor} dark={dark}>{badge}</Badge>
        </Card>
      ))}
    </div>
  );
}

// ─── Status Card ──────────────────────────────────────────────────────────────
function StatusCard({ dark }) {
  return (
    <Card dark={dark} className="p-6 lg:col-span-2 relative overflow-hidden">
      <div className="absolute -bottom-8 -right-8 text-[110px] opacity-[0.04] pointer-events-none select-none">🤖</div>

      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: "0 0 6px #22c55e" }} />
        <span className={`text-sm font-medium ${dark ? "text-green-400" : "text-green-600"}`}>
          Care-E connectat
        </span>
      </div>

      <h2 className={`text-2xl font-bold mb-2 ${dark ? "text-white" : "text-slate-900"}`}
        style={{ fontFamily: "var(--font-jakarta, sans-serif)" }}>
        Estat de l'usuari
      </h2>
      <p className={`text-base mb-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        Última detecció avui a les{" "}
        <span className={`font-semibold ${dark ? "text-sky-400" : "text-sky-600"}`}>09:15h</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Badge color="green" dark={dark}>🔋 98% Bateria</Badge>
        <Badge color="sky"   dark={dark}>📶 Senyal excel·lent</Badge>
        <Badge color="slate" dark={dark}>🕒 Actiu fa 2h</Badge>
      </div>
    </Card>
  );
}

// ─── Dispense Card ────────────────────────────────────────────────────────────
function DispenseCard({ dark }) {
  const [st, setSt] = useState("idle");
  const handle = () => {
    setSt("loading");
    setTimeout(() => setSt("done"), 1800);
    setTimeout(() => setSt("idle"), 4000);
  };

  return (
    <Card dark={dark} className="p-6 flex flex-col items-center text-center justify-between gap-5">
      <div>
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl ${
          dark ? "bg-sky-950/60 border border-sky-800/40" : "bg-sky-50 border border-sky-100"
        }`}>💊</div>
        <h3 className={`text-lg font-bold mb-2 ${dark ? "text-white" : "text-slate-900"}`}
          style={{ fontFamily: "var(--font-jakarta, sans-serif)" }}>
          Control Manual
        </h3>
        <p className={`text-sm leading-relaxed max-w-[180px] mx-auto ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Dispensa la medicació manualment per a proves o emergències.
        </p>
      </div>

      {st === "done" ? (
        <div className={`w-full py-3 rounded-2xl text-sm font-semibold border text-center ${
          dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700"
        }`}>✓ Dispensat correctament</div>
      ) : (
        <PrimaryBtn onClick={handle} disabled={st === "loading"} className="w-full py-3 px-6">
          {st === "loading" ? "Enviant ordre..." : "💊 Dispensar Ara"}
        </PrimaryBtn>
      )}
    </Card>
  );
}

// ─── Medication Table ─────────────────────────────────────────────────────────
const meds = [
  { time: "08:00", name: "Omeprazol",    dose: "1 comprimit", status: "done" },
  { time: "09:00", name: "Paracetamol",  dose: "500mg",       status: "done" },
  { time: "14:00", name: "Ibuprofèn",    dose: "400mg",       status: "pending" },
  { time: "21:00", name: "Simvastatina", dose: "20mg",        status: "pending" },
];

function MedicationTable({ dark }) {
  const today = new Date().toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" });
  return (
    <Card dark={dark} className="overflow-hidden">
      <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"}`}
          style={{ fontFamily: "var(--font-jakarta, sans-serif)" }}>
          Medicació d'avui
        </h3>
        <span className={`text-sm capitalize ${dark ? "text-slate-500" : "text-slate-400"}`}>{today}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`text-xs font-medium border-b ${dark ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100"}`}>
              <th className="px-6 py-3 text-left font-medium">Hora</th>
              <th className="px-4 py-3 text-left font-medium">Medicament</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Dosi</th>
              <th className="px-6 py-3 text-right font-medium">Estat</th>
            </tr>
          </thead>
          <tbody>
            {meds.map((m, i) => (
              <tr key={i} className={`border-b last:border-0 transition-colors ${
                dark ? "border-slate-800/50 hover:bg-slate-800/20" : "border-slate-50 hover:bg-slate-50"
              }`}>
                <td className="px-6 py-4">
                  <span className={`text-sm font-semibold ${dark ? "text-sky-400" : "text-sky-600"}`}>{m.time}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-sm ${dark ? "text-slate-200" : "text-slate-800"}`}>{m.name}</span>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <span className={`text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>{m.dose}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Badge color={m.status === "done" ? "green" : "amber"} dark={dark}>
                    {m.status === "done" ? "✓ Pres" : "Pendent"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Add Medication Form ──────────────────────────────────────────────────────
function AddMedForm({ dark }) {
  const [form, setForm] = useState({ name: "", time: "", dose: "" });
  const [saved, setSaved] = useState(false);

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
    dark
      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15"
  }`;

  const handle = () => {
    if (!form.name) return;
    setSaved(true);
    setForm({ name: "", time: "", dose: "" });
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card dark={dark} className="p-6">
      <h3 className={`text-base font-bold mb-1 ${dark ? "text-white" : "text-slate-900"}`}
        style={{ fontFamily: "var(--font-jakarta, sans-serif)" }}>
        Afegir medicació
      </h3>
      <p className={`text-sm mb-5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
        Programa una nova pastilla per a l'usuari.
      </p>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>
            Nom del medicament
          </label>
          <input type="text" placeholder="Ex: Paracetamol" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Hora</label>
            <input type="time" value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Quantitat</label>
            <input type="text" placeholder="1 pastilla" value={form.dose}
              onChange={e => setForm({ ...form, dose: e.target.value })} className={inputCls} />
          </div>
        </div>

        {saved ? (
          <div className={`w-full py-3 rounded-2xl text-sm font-semibold text-center border ${
            dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700"
          }`}>✓ Medicació afegida!</div>
        ) : (
          <PrimaryBtn onClick={handle} className="w-full py-3 px-6">
            Afegir a la llista
          </PrimaryBtn>
        )}
      </div>
    </Card>
  );
}

// ─── Activity Timeline ────────────────────────────────────────────────────────
const activities = [
  { type: "Medicació",  color: "green", time: "Fa 2 hores",  text: "Pastilla del matí dispensada correctament a les 09:05." },
  { type: "Interacció", color: "sky",   time: "Avui 11:30",  text: "S'ha mantingut una conversa amb l'usuari." },
  { type: "Alerta",     color: "amber", time: "Avui 14:15",  text: "No s'ha detectat l'usuari a l'hora de la pastilla." },
];

function ActivityTimeline({ dark }) {
  const dot = { green: "bg-green-500", sky: "bg-sky-400", amber: "bg-amber-400" };
  return (
    <Card dark={dark} className="overflow-hidden">
      <div className={`flex items-center gap-2 px-6 py-4 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"}`}
          style={{ fontFamily: "var(--font-jakarta, sans-serif)" }}>
          Activitat recent
        </h3>
      </div>
      <div className="p-4 space-y-2">
        {activities.map((a, i) => (
          <div key={i} className={`flex gap-4 p-4 rounded-2xl border transition-colors ${
            dark ? "border-slate-800/50 hover:bg-slate-800/20" : "border-slate-100 hover:bg-slate-50"
          }`}>
            {/* Timeline indicator */}
            <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${dot[a.color]}`} />
              {i < activities.length - 1 && (
                <div className={`w-px flex-1 min-h-6 rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <Badge color={a.color} dark={dark}>{a.type}</Badge>
                <span className={`text-xs flex-shrink-0 ${dark ? "text-slate-600" : "text-slate-400"}`}>{a.time}</span>
              </div>
              <p className={`text-sm leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{a.text}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Next Med Panel ───────────────────────────────────────────────────────────
function NextMedPanel({ dark }) {
  return (
    <Card dark={dark} className="p-6 h-fit">
      <h3 className={`text-base font-bold mb-4 ${dark ? "text-white" : "text-slate-900"}`}
        style={{ fontFamily: "var(--font-jakarta, sans-serif)" }}>
        Propera medicació
      </h3>
      <div className={`p-5 rounded-2xl border mb-4 ${
        dark ? "border-sky-800/40 bg-sky-950/40" : "border-sky-100 bg-sky-50"
      }`}>
        <div className={`text-3xl font-bold mb-1 ${dark ? "text-sky-400" : "text-sky-600"}`}
          style={{ fontFamily: "var(--font-jakarta, sans-serif)" }}>
          14:00
        </div>
        <div className={`text-base font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
          Ibuprofèn
        </div>
        <div className={`text-sm mt-0.5 ${dark ? "text-slate-500" : "text-slate-500"}`}>
          400mg · 1 comprimit
        </div>
      </div>
      <p className={`text-sm text-center ${dark ? "text-slate-500" : "text-slate-400"}`}>
        Falten aprox. <span className={`font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>2h 45min</span>
      </p>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { theme } = useContext(ThemeContext);
  const dark = theme === "dark";

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}
            style={{ fontFamily: "var(--font-jakarta, sans-serif)" }}>
            Bona tarda! 👋
          </h1>
          <p className={`text-sm mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            Aquí tens el resum d'avui de Care-E.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: "0 0 6px #22c55e" }} />
          <span className={`text-sm font-medium ${dark ? "text-green-400" : "text-green-600"}`}>En línia</span>
        </div>
      </div>

      <StatsRow dark={dark} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StatusCard dark={dark} />
        <DispenseCard dark={dark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><MedicationTable dark={dark} /></div>
        <AddMedForm dark={dark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><ActivityTimeline dark={dark} /></div>
        <NextMedPanel dark={dark} />
      </div>

    </div>
  );
}