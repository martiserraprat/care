// /api/robot-info
// El robot consulta els horaris de dispensació actius i la info del seu pacient.
// S'invoca cada 60 segons des del robot per mantenir els horaris sincronitzats.
import { createClient } from "@supabase/supabase-js";

// Client admin per llegir dades sense restriccions de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { robot_id, robot_token } = await req.json();

  // Valida el token del robot — cada robot té un token únic a la BD
  const { data: robot } = await supabaseAdmin
    .from("robots")
    .select("id, name, owner_id")
    .eq("id", robot_id)
    .eq("robot_token", robot_token)
    .single();

  if (!robot) return Response.json({ error: "Token invàlid" }, { status: 401 });

  // Obté el pacient vinculat al robot
  const { data: patient } = await supabaseAdmin
    .from("patients")
    .select("id")
    .eq("robot_id", robot.id)
    .single();

  let schedules = [];
  if (patient) {
    // Obté els horaris actius amb info del slot (medicament, quantitat, compartiment)
    const { data: schData } = await supabaseAdmin
      .from("dispense_schedules")
      .select("*, slot_inventory(id, slot, medication_name, pill_count)")
      .eq("patient_id", patient.id)
      .eq("active", true);

    schedules = schData || [];
  }

  return Response.json({
    robot_name: robot.name,
    schedules: schedules,
  });
}