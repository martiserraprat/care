// src/app/api/robot-voice/route.js
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // Rebem àudio com a form-data
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const robotId = formData.get("robot_id");
    const robotToken = formData.get("robot_token");
    
    const now = new Date().toLocaleString("ca-ES", { 
      timeZone: "Europe/Madrid",
      weekday: "long",
      day: "numeric", 
      month: "long",
      hour: "2-digit", 
      minute: "2-digit" 
    });

    // 1. Validar token
    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id")
      .eq("id", robotId)
      .eq("robot_token", robotToken)
      .single();

    if (!robot) {
      return Response.json({ error: "Token invàlid" }, { status: 401 });
    }

    // 2. Trobem el pacient
    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("id, full_name")
      .eq("robot_id", robotId)
      .single();

    // 3. Convertim àudio a base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // 4. Cridem Gemini amb àudio
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const ai = new GoogleGenAI({
      vertexai: {
        project: "smrlp-496809",
        location: "us-central1",
        googleAuthOptions: {
          credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key,
          },
        },
      },
    });

    const prompt = `Ets l'assistent del robot Care-E, dissenyat per a pacients grans. 
T'arribarà un àudio del pacient. Has de:
La data i hora ACTUAL és: ${now}
1. TRANSCRIURE el que diu el pacient (en català, castellà o l'idioma que detectis).

2. CLASSIFICAR la INTENCIÓ:
   - "caregiver": el pacient parla AL CUIDADOR/FAMÍLIA (ex: "digues al meu fill que vingui", "necessito ajuda", "no em trobo bé", "vine a casa", emergències).
   - "robot": el pacient parla AMB EL ROBOT directament (ex: "quina hora és?", "com et dius?", "explica'm un acudit", "quins medicaments toquen avui?").
   - "unclear": no s'entén o és ambigu.

3. URGÈNCIA (només si és "caregiver"):
   - "emergency": dolor, caiguda, sang, mareig fort, dificultat respiratòria.
   - "high": preocupació, demanen ajuda no urgent.
   - "normal": missatge informatiu sense urgència.
   - "low": comentaris quotidians.

4. Si la intenció és "robot", genera una RESPOSTA empàtica, breu (màxim 2 frases), en català.
   - Tracta el pacient amb respecte i amabilitat.
   - Si demana medicació, indica que ho ha de mirar el cuidador.
   - Si demana ajuda mèdica, redirigeix al cuidador.

Respon ÚNICAMENT amb JSON vàlid:
{
  "transcript": "...",
  "intent": "caregiver" | "robot" | "unclear",
  "urgency": "low" | "normal" | "high" | "emergency",
  "robot_response": "..." (només si intent és "robot", sinó null)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { 
            inlineData: { 
              mimeType: "audio/wav",   // depèn del format del robot
              data: audioBase64 
            } 
          }
        ]
      }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text);

  // 5. Guardar a la BD NOMÉS si és per al cuidador

  if (!parsed.transcript || parsed.transcript.trim().length === 0) {
    return Response.json({
      success: true,
      intent: "unclear",
      transcript: "",
      response_text: "No t'he entès bé, pots repetir-ho?",
    });
  }

  let voiceMessage = null;
  if (parsed.intent === "caregiver") {
    const { data } = await supabaseAdmin
      .from("voice_messages")
      .insert({
        robot_id: robotId,
        patient_id: patient?.id,
        transcript: parsed.transcript,
        intent: parsed.intent,
        urgency: parsed.urgency || "normal",
        robot_response: parsed.robot_response,
      })
      .select()
      .single();
    voiceMessage = data;
  }

  // 6. Alerta només si és caregiver urgent
  if (parsed.intent === "caregiver" && ["high", "emergency"].includes(parsed.urgency)) {
    await supabaseAdmin.from("alerts").insert({
      robot_id: robotId,
      type: "voice_message",
      severity: parsed.urgency === "emergency" ? "high" : "medium",
      description: `Missatge del pacient: "${parsed.transcript}"`,
      medication_name: null,
    });
}

    // 7. Retornar al robot què fer
    return Response.json({
      success: true,
      intent: parsed.intent,
      transcript: parsed.transcript,
      // Si és per al robot, retornem text perquè el robot el digui amb TTS local
      response_text: parsed.intent === "robot" ? parsed.robot_response : 
                     parsed.intent === "caregiver" ? "Ho he enviat al teu cuidador." :
                     "No t'he entès bé, pots repetir-ho?",
    });

  } catch (error) {
    console.error("Error voice:", error);
    return Response.json({ 
      error: error.message,
      response_text: "Ho sento, ha hagut un problema. Torna-ho a provar.",
    }, { status: 500 });
  }
}