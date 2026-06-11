// /api/speak-message
// El cuidador envia un missatge de text que es converteix a veu (TTS) en català
// i s'envia al robot perquè el reprodueixi al pacient.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import textToSpeech from "@google-cloud/text-to-speech";

// Client admin per crear comandes i verificar el robot sense restriccions de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // ─── 1. AUTENTICAR USUARI ────────────────────────────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autenticat" }, { status: 401 });

    const { robot_id, message } = await req.json();

    // Validacions bàsiques del missatge
    if (!message?.trim()) {
      return Response.json({ error: "Missatge buit" }, { status: 400 });
    }
    if (message.length > 500) {
      return Response.json({ error: "Màxim 500 caràcters" }, { status: 400 });
    }

    // ─── 2. VERIFICAR ROBOT ──────────────────────────────────────
    // Comprova que el robot pertany a l'usuari i ha fet heartbeat en els últims 60s
    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id, status, updated_at")
      .eq("id", robot_id)
      .eq("owner_id", user.id)
      .single();

    if (!robot) {
      return Response.json({ error: "Robot no trobat" }, { status: 404 });
    }

    const lastSeen = new Date() - new Date(robot.updated_at);
    if (robot.status !== "online" || lastSeen > 60000) {
      return Response.json({ 
        error: "El robot no està en línia" 
      }, { status: 409 });
    }

    // ─── 3. GENERAR VOZ AMB GOOGLE CLOUD TTS ────────────────────
    // Usa la veu ca-ES-Standard-A (femenina en català) a velocitat lleugerament reduïda
    // per facilitar la comprensió de persones grans
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const ttsClient = new textToSpeech.TextToSpeechClient({ credentials });

    const [ttsResponse] = await ttsClient.synthesizeSpeech({
      input: { text: message.trim() },
      voice: {
        languageCode: "ca-ES",
        name: "ca-ES-Standard-A",  // veu femenina catalana natural
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95,  // una mica més lent (millor per gent gran)
        pitch: 0,
      },
    });

    // ─── 4. CONVERTIR ÀUDIO A BASE64 ────────────────────────────
    // El robot rep i reprodueix l'àudio codificat en base64
    const audioBase64 = Buffer.from(ttsResponse.audioContent).toString("base64");

    // ─── 5. CREAR COMANDA PENDENT AL ROBOT ──────────────────────
    // El robot recollirà aquesta comanda al proper polling i la reproduirà
    const { data: command, error } = await supabaseAdmin
      .from("manual_commands")
      .insert({
        robot_id,
        type: "speak",
        message_text: message.trim(),
        audio_base64: audioBase64,
        status: "pending",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      command_id: command.id,
    });

  } catch (error) {
    console.error("Error speak-message:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}