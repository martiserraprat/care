// src/app/api/robot-action/route.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { robot_id, robot_token, action, payload } = await req.json();

    // 1. Validar el token del robot
    const { data: robot, error: robotError } = await supabaseAdmin
      .from("robots")
      .select("id")
      .eq("id", robot_id)
      .eq("robot_token", robot_token)
      .single();

    if (robotError || !robot) {
      return Response.json({ error: "Token invàlid" }, { status: 401 });
    }

    // 2. Acció: dispense
    if (action === "dispense") {
      const { 
        schedule_id, 
        slot_inventory_id, 
        dose,                    // dosi demanada
        dose_real,               // ⭐ NOU: dosi realment dispensada
        status: robotStatus,     // ⭐ NOU: status que envia el robot
        dispensed_at 
      } = payload;

      // ⭐ NOU: Determinem el status final
      // Si el robot envia un status, l'usem. Si no, calculem segons dose_real.
      const finalDoseReal = dose_real !== undefined ? dose_real : dose;
      const finalStatus = robotStatus || (
        finalDoseReal === 0 ? "failed_inventory" :
        finalDoseReal < dose ? "failed_inventory" :
        "dispensed"
      );

      // A) Carreguem dades del schedule per fer snapshot
      const { data: schedule, error: schErr } = await supabaseAdmin
        .from("dispense_schedules")
        .select(`
          id,
          scheduled_time,
          dose,
          slot_inventory:slot_inventory_id (
            medication_name,
            slot
          )
        `)
        .eq("id", schedule_id)
        .single();

      // No bloquegem si el schedule ja no existeix (pot haver-se esborrat)
      const medication_name = schedule?.slot_inventory?.medication_name || "Desconegut";
      const scheduled_time = schedule?.scheduled_time || null;

      // ⭐ NOU: Construïm error_reason si la dispensació no ha estat completa
      let error_reason = null;
      if (finalStatus === "failed_inventory") {
        error_reason = `Dispensació incompleta: demanades ${dose}, dispensades ${finalDoseReal}.`;
      }

      // B) Creem el log AMB SNAPSHOT (sobreviu si s'esborra el schedule)
      const { error: logError } = await supabaseAdmin
        .from("dispense_logs")
        .insert({
          schedule_id,
          robot_id,
          status: finalStatus,                                    // ⭐ pot ser dispensed o failed_inventory
          medication_name,
          dose,                                                    // dosi demanada (snapshot)
          dose_real: finalDoseReal,                                // ⭐ NOU: dosi real
          scheduled_time,
          dispensed_at: dispensed_at || new Date().toISOString(),
          error_reason,                                            // ⭐ NOU
        });

      if (logError) {
        console.error("❌ Error creant log:", logError);
        return Response.json(
          { error: "No s'ha pogut guardar el log", details: logError.message },
          { status: 500 }
        );
      }

      // C) ⭐ Restem només la dosi REALMENT dispensada (no la demanada)
      if (slot_inventory_id && finalDoseReal > 0) {
        const { error: rpcError } = await supabaseAdmin.rpc("decrement_pill_count", {
          slot_id: slot_inventory_id,
          amount: finalDoseReal,
        });

        if (rpcError) {
          console.error("⚠️ Error restant inventari:", rpcError);
          // No fem fail: el log ja està guardat
        }
      }

      // D) ⭐ NOU: Si ha estat failed_inventory, creem alerta
      if (finalStatus === "failed_inventory") {
        // Recuperem l'id del log que acabem de crear
        const { data: newLog } = await supabaseAdmin
          .from("dispense_logs")
          .select("id")
          .eq("robot_id", robot_id)
          .order("dispensed_at", { ascending: false })
          .limit(1)
          .single();

        await supabaseAdmin.from("alerts").insert({
          robot_id,
          type: "medication_failed_inventory",  // tipus específic
          severity: "high",
          medication_name,
          dispense_log_id: newLog?.id,
          description: `${medication_name}: dispensació incompleta (${finalDoseReal}/${dose} pastilles). Cal omplir el slot.`,
        });
      }

      return Response.json({ 
        success: true,
        status: finalStatus,
        dose_real: finalDoseReal,
      });
    }

    return Response.json({ error: "Acció desconeguda" }, { status: 400 });
  } catch (error) {
    console.error("❌ Error general:", error);
    return Response.json(
      { error: "Error del servidor", details: error.message },
      { status: 500 }
    );
  }
}