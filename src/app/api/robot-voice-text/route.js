import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import os from "os";
import { comprovarRespostaPredefinida, obtenirPersonalitatPrompt } from "@/lib/voice-assistant";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { robot_id, robot_token, text } = await req.json();

    if (!text?.trim()) {
      return Response.json({ intent: "unclear", response_text: "No t'he entès bé." });
    }

    // Validar robot
    const { data: robot } = await supabaseAdmin
      .from("robots").select("id")
      .eq("id", robot_id).eq("robot_token", robot_token).single();

    if (!robot) return Response.json({ error: "Token invàlid" }, { status: 401 });

    const { data: patient } = await supabaseAdmin
      .from("patients").select("id, full_name")
      .eq("robot_id", robot_id).single();

    const textLower = text.trim().toLowerCase();

    // Respostes predefinides
    const respostaPredefinida = comprovarRespostaPredefinida(textLower);
    if (respostaPredefinida) {
      return Response.json({ intent: "robot", response_text: respostaPredefinida });
    }

    // Credencials Google
    const credsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    const credsPath = path.join(os.tmpdir(), "google-credentials-tmp.json");
    fs.writeFileSync(credsPath, credsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;

    const ai = new GoogleGenAI({ vertexai: { project: "smrlp-496809", location: "us-central1" } });

    const now = new Date().toLocaleString("ca-ES", {
      timeZone: "Europe/Madrid", weekday: "long", day: "numeric",
      month: "long", hour: "2-digit", minute: "2-digit",
    });

    const personalitatPrompt = obtenirPersonalitatPrompt();

    const prompt = `${personalitatPrompt}

CONTEXT: Ets Care-E. La data i hora ACTUAL és: ${now}
El pacient ha dit (per text, via reconeixement de veu): "${text}"

1. CLASSIFICAR la INTENCIÓ ("intent"):
   - "caregiver": demana enviar missatge, pregunta al cuidador o demana ajuda.
   - "robot": interacció directa amb la IA.
   - "unclear": no s'entén res.

2. REESCRIURE PER AL CUIDADOR ("clean_message") si és "caregiver":
   - Tercera persona, professional i empàtic.
   - Afegeix "[Nota de l'Assistent]" si hi ha preguntes mèdiques objectives.

3. URGÈNCIA ("urgency") si és "caregiver":
   - "emergency": dolor intens, caiguda, sang, mareig fort.
   - "high": malestar moderat, dubtes urgents medicació.
   - "normal": dubtes genèrics.
   - "low": rutinari.

4. RESPOSTA PEL ROBOT ("robot_response"):
   - Si "robot": respon de forma empàtica i útil.
   - Si "caregiver": confirma l'enviament.

Respon ÚNICAMENT amb JSON vàlid:
{
  "intent": "caregiver" | "robot" | "unclear",
  "clean_message": "...",
  "urgency": "low" | "normal" | "high" | "emergency",
  "robot_response": "..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text);

    // Guardar a Supabase si és caregiver
    if (parsed.intent === "caregiver") {
      await supabaseAdmin.from("voice_messages").insert({
        robot_id, patient_id: patient?.id,
        transcript: parsed.clean_message,
        intent: parsed.intent,
        urgency: parsed.urgency || "normal",
        robot_response: parsed.robot_response,
      });

      if (["high", "emergency"].includes(parsed.urgency)) {
        await supabaseAdmin.from("alerts").insert({
          robot_id, type: "voice_message",
          severity: parsed.urgency === "emergency" ? "high" : "medium",
          description: `Missatge del pacient: "${parsed.clean_message}"`,
          medication_name: null,
        });
      }
    }

    return Response.json({
      success: true,
      intent: parsed.intent,
      response_text: parsed.robot_response || "No t'he entès bé.",
    });

  } catch (error) {
    console.error("Error robot-voice-text:", error);
    return Response.json({ error: error.message, response_text: "Ho sento, ha hagut un problema." }, { status: 500 });
  }
}