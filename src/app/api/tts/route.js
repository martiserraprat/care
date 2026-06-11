// /api/tts
// El robot demana convertir un text a veu (Text-to-Speech) en català.
// S'usa per reproduir les respostes de Gemini al pacient.
// Autenticació via token del robot (no cookie d'usuari).
import { createClient } from "@supabase/supabase-js";
import textToSpeech from "@google-cloud/text-to-speech";

// Client admin per validar el token del robot
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { robot_id, robot_token, text } = await req.json();

    if (!text?.trim()) {
      return Response.json({ error: "Text buit" }, { status: 400 });
    }

    // Valida el token del robot abans de generar àudio
    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id")
      .eq("id", robot_id)
      .eq("robot_token", robot_token)
      .single();

    if (!robot) {
      return Response.json({ error: "Token invàlid" }, { status: 401 });
    }

    // ─── GENERAR VOZ AMB GOOGLE CLOUD TTS ───────────────────────
    // Veu ca-ES-Standard-A: femenina en català, velocitat 0.95x per gent gran
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const ttsClient = new textToSpeech.TextToSpeechClient({ credentials });

    const [ttsResponse] = await ttsClient.synthesizeSpeech({
      input: { text: text.trim() },
      voice: {
        languageCode: "ca-ES",
        name: "ca-ES-Standard-A",
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95,
      },
    });

    // Retorna l'àudio MP3 codificat en base64 perquè el robot el reprodueixi
    const audioBase64 = Buffer.from(ttsResponse.audioContent).toString("base64");

    return Response.json({ 
      success: true,
      audio_base64: audioBase64,
    });

  } catch (error) {
    console.error("Error TTS:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}