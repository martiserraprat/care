"use client";

import { useContext } from "react";
import { ThemeContext } from "@/app/dashboard/layout";
import { SidebarContext } from "@/app/dashboard/layout";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// --- COMPONENTE BÚSQUEDA API CIMA ---
function MedicationSearch({ onSelect, dark }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 3) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`https://cima.aemps.es/cima/rest/medicamentos?nombre=${query}`);
        const data = await res.json();
        setResults(data.resultados || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="🔍 Cerca el medicament..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
          dark ? "bg-slate-800 border-slate-700 text-white focus:border-sky-500" : "bg-white border-slate-200 focus:border-sky-400"
        }`}
      />
      {results.length > 0 && (
        <div className={`absolute z-50 w-full mt-2 rounded-xl border shadow-2xl max-h-60 overflow-y-auto ${
          dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
        }`}>
          {results.map((m) => (
            <button
              key={m.nregistro}
              onClick={() => { onSelect(m.nombre); setResults([]); setQuery(m.nombre); }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-sky-600 hover:text-white transition-colors ${
                dark ? "text-slate-200 border-b border-slate-700" : "text-slate-700 border-b border-slate-50"
              }`}
            >
              {m.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function IndependentMedications() {
  const { theme } = useContext(ThemeContext);
  const { setOpen } = useContext(SidebarContext);
  const dark = theme === "dark";
  const [meds, setMeds] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscamos el robot y el paciente
    const { data: robot } = await supabase.from("robots").select("id").eq("owner_id", user.id).single();
    if (!robot) return;

    const { data: patient } = await supabase.from("patients").select("id").eq("robot_id", robot.id).single();
    if (!patient) return;

    setPatientId(patient.id);
    const { data: medications } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", patient.id)
      .eq("active", true);
    
    setMeds(medications || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleDelete = async (id) => {
    await supabase.from("medications").update({ active: false }).eq("id", id);
    fetchInitialData();
  };

  return (
    <div className={`${dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"} min-h-screen transition-colors duration-300`}>
      {/* Header Simple */}
      <button className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${ dark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}onClick={() => setOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <main className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Gestió de Dispensadors</h2>
          <p className="opacity-60 text-sm">Assigna cada medicament a una de les 4 entrades físiques del robot.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((num) => {
            const currentMed = meds.find(m => m.slot === num);
            return (
              <div key={num} className={`relative p-8 rounded-[2rem] border transition-all ${
                dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    dark ? "bg-sky-500/10 text-sky-400" : "bg-sky-50 text-sky-600"
                  }`}>
                    Slot {num}
                  </div>
                  {currentMed && (
                    <button 
                      onClick={() => handleDelete(currentMed.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {currentMed ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h3 className="text-2xl font-bold mb-2">{currentMed.name}</h3>
                    <div className="flex gap-4">
                      <div className={`px-3 py-1 rounded-lg ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                        <span className="text-xs block opacity-50">Hora</span>
                        <span className="font-mono font-bold">{currentMed.scheduled_time.slice(0, 5)}h</span>
                      </div>
                      <div className={`px-3 py-1 rounded-lg ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                        <span className="text-xs block opacity-50">Dosi</span>
                        <span className="font-bold">{currentMed.dose}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <AddFormIndependent 
                    slot={num} 
                    patientId={patientId} 
                    onAdded={fetchInitialData} 
                    dark={dark} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function AddFormIndependent({ slot, patientId, onAdded, dark }) {
  const [form, setForm] = useState({ name: "", time: "", dose: "1 pastilla" });

  const save = async () => {
    if (!form.name || !form.time) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("medications").insert({
      name: form.name,
      dose: form.dose,
      scheduled_time: form.time,
      slot: slot,
      patient_id: patientId,
      created_by: user.id,
      active: true,
      days: ["dilluns","dimarts","dimecres","dijous","divendres","dissabte","diumenge"]
    });
    onAdded();
  };

  return (
    <div className="space-y-4">
      <MedicationSearch dark={dark} onSelect={(val) => setForm({...form, name: val})} />
      <div className="grid grid-cols-2 gap-3">
        <input 
          type="time" 
          onChange={e => setForm({...form, time: e.target.value})}
          className={`px-4 py-3 rounded-xl border outline-none ${dark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`} 
        />
        <input 
          type="text" 
          placeholder="Ex: 1 pastilla" 
          onChange={e => setForm({...form, dose: e.target.value})}
          className={`px-4 py-3 rounded-xl border outline-none ${dark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`} 
        />
      </div>
      <button 
        onClick={save}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold shadow-lg shadow-sky-500/30 hover:scale-[1.02] transition-transform"
      >
        Configurar Slot {slot}
      </button>
    </div>
  );
}