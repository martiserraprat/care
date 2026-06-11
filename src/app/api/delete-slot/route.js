// /api/delete-slot
// Esborra un slot de l'inventari del pastiller gestionant les foreign keys.
// El RLS de Supabase no permet fer UPDATE a manual_commands des del client,
// per això es fa des del servidor amb service_role_key.

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // 1. Autenticar usuari
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autenticat" }, { status: 401 });

    const { slot_id } = await req.json();

    // 2. Verificar que el slot pertany a un robot de l'usuari
    const { data: slot } = await supabaseAdmin
      .from("slot_inventory")
      .select("id, robot_id, robots!inner(owner_id)")
      .eq("id", slot_id)
      .single();

    if (!slot || slot.robots.owner_id !== user.id) {
      return Response.json({ error: "No autoritzat" }, { status: 403 });
    }

    // 3. Desvincular schedules
    await supabaseAdmin
      .from("dispense_schedules")
      .update({ active: false, slot_inventory_id: null })
      .eq("slot_inventory_id", slot_id);

    // 4. Desvincular manual_commands
    await supabaseAdmin
      .from("manual_commands")
      .update({ slot_inventory_id: null })
      .eq("slot_inventory_id", slot_id);

    // 5. Esborrar el slot
    const { error } = await supabaseAdmin
      .from("slot_inventory")
      .delete()
      .eq("id", slot_id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}