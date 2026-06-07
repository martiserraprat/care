// src/app/api/robot-voice/route.js
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import os from "os";
import { 
  comprovarRespostaPredefinida, 
  obtenirPersonalitatPrompt 
} from "@/lib/voice-assistant";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const credsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!credsJson) {
      throw new Error("La variable GOOGLE_CREDENTIALS_JSON no està definida.");
    }
    const credsPath = path.join(os.tmpdir(), "google-credentials-tmp.json");
    fs.writeFileSync(credsPath, credsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;

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
      minute: "2-digit",
    });

    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id")
      .eq("id", robotId)
      .eq("robot_token", robotToken)
      .single();

    if (!robot) {
      return Response.json({ error: "Token invàlid" }, { status: 401 });
    }

    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("id, full_name")
      .eq("robot_id", robotId)
      .single();

    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    if (!audioBase64 || audioBase64.length < 100) {
      return Response.json({
        success: true,
        intent: "unclear",
        transcript: "",
        response_text: "Hola! M'has cridat? Recorda parlar després d'activar-me.",
      });
    }

    const ai = new GoogleGenAI({
      vertexai: {
        project: "smrlp-496809",
        location: "us-central1",
      },
    });

    // ✅ PAS 1: Transcripció ràpida + respostes predefinides
    let respostaPredefinida = null;
    let rawTranscript = "";

    try {
      const quickResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          role: "user",
          parts: [
            { text: "Transcriu literalment aquest àudio en català. Respon només amb el text transcrit sense cap altra explicació." },
            { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
          ],
        }],
      });

      rawTranscript = quickResponse.text.trim().toLowerCase();
      respostaPredefinida = comprovarRespostaPredefinida(rawTranscript);

      if (respostaPredefinida) {
        return Response.json({
          success: true,
          intent: "robot",
          transcript: rawTranscript,
          response_text: respostaPredefinida,
        });
      }
    } catch (error) {
      console.log("⚠️ Error transcripció ràpida, continuant:", error.message);
    }

    // ✅ PAS 2: Prompt complet amb personalitat
    const personalitatPrompt = obtenirPersonalitatPrompt();

    const prompt = `${personalitatPrompt}

CONTEXT IMPORTANT:
- Ets l'assistent intel·ligent del robot Care-E, dissenyat per acompanyar pacients grans i ajudar els seus cuidadors.
- Has de seguir TOTES les regles de personalitat definides a dalt.
- La data i hora ACTUAL és: ${now}

    1. TRANSCRIURE: Fes una transcripció literal del que sents a "raw_transcript".
    2. REESCRIURE EL MISSATGE PER AL CUIDADOR ("clean_message"): 
       - Ignora sorolls, errors i quequejos.
       - Redacta un missatge professional, empàtic i complet en TERCERA PERSONA que resumeixi perfectament què vol el pacient.
       - 🧠 AFEGIT DE VALOR: Si el pacient fa una pregunta objectiva sobre medicació (ex: dosis, freqüència), salut, o fets coneguts, AFEGEIX al final del text una "[Nota de l'Assistent]" amb la informació general recomanada per ajudar el cuidador a respondre ràpidament.
       - Exemple: "El pacient demana saber quants paracetamols pot prendre com a màxim al dia. \\n\\n[Nota de l'Assistent: La dosi recomanada per a adults no ha de superar els 4 grams al dia, generalment prenent 1 gram cada 8 hores. Cal revisar la seva pauta mèdica específica.]"
    3. CLASSIFICAR la INTENCIÓ ("intent"):
       - "caregiver": el pacient demana enviar un missatge, fer una pregunta al cuidador o demana ajuda.
       - "robot": el pacient busca interacció directa amb la IA (ex: "quina hora és?", "quin temps fa?").
       - "unclear": no s'entén absolutament res.
    4. URGÈNCIA ("urgency", només si és "caregiver"):
       - "emergency": dolor intens, caiguda, sang, mareig fort.
       - "high": preocupació, malestar moderat, dubtes urgents de medicació.
       - "normal": comentaris o dubtes genèrics sense perill.
       - "low": salutacions o informació rutinària.
    5. RESPOSTA PEL ROBOT ("robot_response"): 
       - Si la intenció és "robot", respon al pacient de forma empàtica i útil, seguint les regles de personalitat.
       - Si la intenció és "caregiver", confirma l'enviament amb una frase com: "Molt bé, acabo d'enviar aquesta pregunta al teu cuidador perquè t'ho revisi."

    Respon ÚNICAMENT amb JSON vàlid:
    {
      "raw_transcript": "...",
      "clean_message": "...",
      "intent": "caregiver" | "robot" | "unclear",
      "urgency": "low" | "normal" | "high" | "emergency",
      "robot_response": "..."
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
        ],
      }],
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text);

    if (!parsed.clean_message || parsed.clean_message.trim().length === 0) {
      return Response.json({
        success: true,
        intent: "unclear",
        transcript: parsed.raw_transcript || rawTranscript,
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
          transcript: parsed.clean_message,
          intent: parsed.intent,
          urgency: parsed.urgency || "normal",
          robot_response: parsed.robot_response,
        })
        .select()
        .single();
      voiceMessage = data;
    }

    if (parsed.intent === "caregiver" && ["high", "emergency"].includes(parsed.urgency)) {
      await supabaseAdmin.from("alerts").insert({
        robot_id: robotId,
        type: "voice_message",
        severity: parsed.urgency === "emergency" ? "high" : "medium",
        description: `Missatge del pacient: "${parsed.clean_message}"`,
        medication_name: null,
      });
    }

    // ✅ L'únic canvi clau: sempre usar parsed.robot_response
    return Response.json({
      success: true,
      intent: parsed.intent,
      transcript: parsed.raw_transcript || rawTranscript,
      response_text:
        parsed.intent === "robot" ? parsed.robot_response :
        parsed.intent === "caregiver" ? parsed.robot_response :  // ← aquí estava el bug
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