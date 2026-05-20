// src/app/api/robot-action/route.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { robot_id, robot_token, action, payload } = await req.json();

  // 1. Validar el token del robot
  const { data: robot } = await supabaseAdmin
    .from("robots")
    .select("id")
    .eq("id", robot_id)
    .eq("robot_token", robot_token)
    .single();

  if (!robot) return Response.json({ error: "Token invàlid" }, { status: 401 });

  // 2. Si l'acció és "dispense", ho registrem
  if (action === "dispense") {
    const { schedule_id, slot_inventory_id, dose } = payload;

    // A) Creem el log
    await supabaseAdmin.from("dispense_logs").insert({
      schedule_id,
      robot_id,
      status: "dispensed"
    });

    // B) Restem la quantitat de pastilles
    if (slot_inventory_id && dose) {
      const { data: slot } = await supabaseAdmin
        .from("slot_inventory")
        .select("pill_count")
        .eq("id", slot_inventory_id)
        .single();

      if (slot && slot.pill_count > 0) {
        await supabaseAdmin
          .from("slot_inventory")
          .update({ pill_count: Math.max(0, slot.pill_count - dose) })
          .eq("id", slot_inventory_id);
      }
    }

    return Response.json({ success: true });
  }

  return Response.json({ error: "Acció desconeguda" }, { status: 400 });
}