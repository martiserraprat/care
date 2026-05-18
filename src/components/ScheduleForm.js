"use client";

import { useState } from "react";
import ClockPicker from "@/components/ClockPicker";

const DAYS_CA = [
  { key: "dilluns",   short: "Dl" },
  { key: "dimarts",   short: "Dt" },
  { key: "dimecres",  short: "Dc" },
  { key: "dijous",    short: "Dj" },
  { key: "divendres", short: "Dv" },
  { key: "dissabte",  short: "Ds" },
  { key: "diumenge",  short: "Dg" },
];

const COLORS = [
  { dot: "bg-sky-400",     ring: "border-sky-500" },
  { dot: "bg-violet-400",  ring: "border-violet-500" },
  { dot: "bg-emerald-400", ring: "border-emerald-500" },
  { dot: "bg-amber-400",   ring: "border-amber-500" },
];

const EMPTY = { slot_inventory_id: "", time: "", dose: "1", days: [] };

export default function ScheduleForm({ loadedSlots, dark, onSave, onCancel, title = "Nova programació" }) {
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const inp = dark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200";

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.slot_inventory_id || !form.time || form.days.length === 0) return;
    setSaving(true);
    await onSave(form);
    setForm(EMPTY);
    setSaving(false);
  };

  return (
    <div className={`p-6 rounded-2xl border ${ dark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 shadow-sm text-slate-900"}`}>
      <h3 className={`font-semibold mb-5 ${dark ? "text-white" : "text-slate-900"}`}>{title}</h3>
      <div className="mb-4">
        <label className={`block text-xs font-medium opacity-60 mb-2 ${dark ? "text-slate-300" : "text-slate-600"}`}>Selecciona el medicament</label>
        {loadedSlots.length === 0 ? (
          <p className={`text-sm opacity-50 italic ${dark ? "text-slate-400" : "text-slate-500"}`}>Cap slot disponible.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {loadedSlots.map((s) => {
              const color    = COLORS[s.slot - 1];
              const selected = form.slot_inventory_id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setForm(f => ({ ...f, slot_inventory_id: s.id }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? `border-2 ${color.ring} ${dark ? "bg-sky-900/20" : "bg-sky-50"}`
                      : dark ? "border-slate-700 hover:border-slate-500" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                    <span className="text-xs font-bold opacity-60">Slot {s.slot}</span>
                    {selected && <span className="ml-auto text-sky-500 text-sm">✓</span>}
                  </div>
                  <p className={`text-sm font-semibold truncate ${dark ? "text-white" : "text-slate-900"}`}>{s.medication_name}</p>
                  <p className="text-xs opacity-50">{s.pill_count} pastilles</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hora + Dosi */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium opacity-60 mb-1.5">Hora</label>
          <ClockPicker
            dark={dark}
            value={form.time}
            onChange={(val) => setForm(f => ({ ...f, time: val }))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium opacity-60 mb-1.5">Dosi</label>
          <input
            type="number"
            placeholder="1"
            value={form.dose}
            onChange={e => setForm(f => ({ ...f, dose: e.target.value }))}
            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm ${inp}`}
          />
        </div>
      </div>

      {/* Dies */}
      <div className="mb-5">
        <label className="block text-xs font-medium opacity-60 mb-2">Dies</label>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS_CA.map(({ key, short }) => {
            const active = form.days.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleDay(key)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                  active ? "bg-sky-500 text-white" : dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {short}
              </button>
            );
          })}
          <button
            onClick={() => setForm(f => ({ ...f, days: DAYS_CA.map(d => d.key) }))}
            className={`px-3 h-10 rounded-lg text-xs ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"}`}
          >
            Tots
          </button>
          <button
            onClick={() => setForm(f => ({ ...f, days: [] }))}
            className={`px-3 h-10 rounded-lg text-xs ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-300 hover:text-slate-500"}`}
          >
            Cap
          </button>
        </div>
      </div>

      {/* Botons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !form.slot_inventory_id || !form.time || form.days.length === 0}
          className="flex-1 py-3 rounded-xl bg-linear-to-r from-sky-500 to-sky-600 text-white font-semibold text-sm disabled:opacity-40"
        >
          {saving ? "Guardant..." : "Crear programació"}
        </button>
        <button
          onClick={onCancel}
          className={`px-5 py-3 rounded-xl text-sm border ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}
        >
          Cancel·lar
        </button>
      </div>
    </div>
  );
}

