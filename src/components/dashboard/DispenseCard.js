"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import PrimaryBtn from "@/components/ui/PrimaryBtn";

export default function DispenseCard({ robot, dark }) {
  const [st, setSt] = useState("idle");
  const handle = async () => {
    setSt("loading");
    if (robot?.id) {
      await supabase.from("activity_logs").insert({
        robot_id: robot.id, type: "medication", description: "Dispensació manual des del dashboard",
      });
    }
    setTimeout(() => setSt("done"), 1800);
    setTimeout(() => setSt("idle"), 4000);
  };
  return (
    <Card dark={dark} className="p-6 flex flex-col items-center text-center justify-between gap-5">
      <div>
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl ${dark ? "bg-sky-950/60 border border-sky-800/40" : "bg-sky-50 border border-sky-100"}`}>💊</div>
        <h3 className={`text-lg font-bold mb-2 ${dark ? "text-white" : "text-slate-900"} font-jakarta`} >Control Manual</h3>
        <p className={`text-sm leading-relaxed max-w-45 mx-auto ${dark ? "text-slate-400" : "text-slate-500"}`}>Dispensa la medicació manualment per a proves o emergències.</p>
      </div>
      {st === "done" ? (
        <div className={`w-full py-3 rounded-2xl text-sm font-semibold border text-center ${dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>✓ Dispensat correctament</div>
      ) : (
        <PrimaryBtn onClick={handle} disabled={st === "loading"} className="w-full py-3 px-6">
          {st === "loading" ? "Enviant ordre..." : "💊 Dispensar Ara"}
        </PrimaryBtn>
      )}
    </Card>
  );
}