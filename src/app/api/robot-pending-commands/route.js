// /api/robot-pending-commands
// El robot consulta si té comandes pendents cada 5 segons (polling).
// Retorna fins a 5 comandes ordenades per antiguitat i les marca com "in_progress".
import { createClient } from "@supabase/supabase-js";

// Client admin per llegir i actualitzar comandes sense restriccions de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { robot_id, robot_token } = await req.json();

  // Valida el token del robot
  const { data: robot } = await supabaseAdmin
    .from("robots")
    .select("id")
    .eq("id", robot_id)
    .eq("robot_token", robot_token)
    .single();

  if (!robot) return Response.json({ error: "Token invàlid" }, { status: 401 });

  // Obté les comandes pendents amb info del slot (medicament, compartiment, quantitat)
  // Inclou audio_base64 per comandes de tipus "speak" (missatges de veu del cuidador)
  const { data: commands } = await supabaseAdmin
    .from("manual_commands")
    .select(`
      id,
      type,
      dose,
      slot_inventory_id,
      message_text,
      audio_base64,
      slot_inventory:slot_inventory_id (
        slot,
        medication_name,
        pill_count
      )
    `)
    .eq("robot_id", robot_id)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  // Marca les comandes com "in_progress" perquè no es tornin a enviar al proper polling
  if (commands && commands.length > 0) {
    const ids = commands.map(c => c.id);
    await supabaseAdmin
      .from("manual_commands")
      .update({ status: "in_progress" })
      .in("id", ids);
  }

  return Response.json({ commands: commands || [] });
}