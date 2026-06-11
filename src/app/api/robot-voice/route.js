// /api/robot-voice
// Rep l'àudio del pacient des del robot i el processa amb Gemini 2.5 Flash (Vertex AI).
// Gemini és multimodal: transcriu, classifica la intenció i genera resposta en una sola crida.
// Si la intenció és "caregiver", guarda el missatge i crea alerta si és urgent.
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import os from "os";
import { 
  comprovarRespostaPredefinida, 
  obtenirPersonalitatPrompt 
} from "@/lib/voice-assistant";

// Client admin per guardar missatges de veu i alertes sense restriccions de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // ─── 1. CREDENCIALS GOOGLE ───────────────────────────────────
    // Escriu les credencials de la variable d'entorn a /tmp (necessari a Vercel serverless)
    const credsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!credsJson) {
      throw new Error("La variable GOOGLE_CREDENTIALS_JSON no està definida.");
    }
    const credsPath = path.join(os.tmpdir(), "google-credentials-tmp.json");
    fs.writeFileSync(credsPath, credsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;

    // ─── 2. LLEGIR FORMULARI ─────────────────────────────────────
    // L'àudio arriba com a FormData (fitxer WAV) juntament amb el token del robot
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const robotId = formData.get("robot_id");
    const robotToken = formData.get("robot_token");

    // Data i hora actual en català per incloure al context del prompt
    const now = new Date().toLocaleString("ca-ES", {
      timeZone: "Europe/Madrid",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    // ─── 3. VALIDAR TOKEN DEL ROBOT ──────────────────────────────
    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id")
      .eq("id", robotId)
      .eq("robot_token", robotToken)
      .single();

    if (!robot) {
      return Response.json({ error: "Token invàlid" }, { status: 401 });
    }

    // Obté el pacient vinculat al robot per associar el missatge de veu
    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("id, full_name")
      .eq("robot_id", robotId)
      .single();

    // ─── 4. CONVERTIR ÀUDIO A BASE64 ─────────────────────────────
    // Gemini rep l'àudio com a inlineData en base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // Si l'àudio és massa curt, probablement és soroll — resposta per defecte
    if (!audioBase64 || audioBase64.length < 100) {
      return Response.json({
        success: true,
        intent: "unclear",
        transcript: "",
        response_text: "Hola! M'has cridat? Recorda parlar després d'activar-me.",
      });
    }

    // ─── 5. INICIALITZAR GEMINI (VERTEX AI) ──────────────────────
    // La llibreria llegeix les credencials de GOOGLE_APPLICATION_CREDENTIALS automàticament
    const ai = new GoogleGenAI({
      vertexai: {
        project: "smrlp-496809",
        location: "us-central1",
      },
    });

    // ─── 6. PROMPT MULTIMODAL ────────────────────────────────────
    // Gemini rep text + àudio directament (sense STT intermedi).
    // Instrueix a: transcriure, classificar intenció, determinar urgència i generar resposta.
    const prompt = `Ets l'assistent intel·ligent del robot Care-E, dissenyat per acompanyar pacients grans i ajudar els seus cuidadors. 
    T'arribarà un àudio del pacient. Has de fer el següent:
    La data i hora ACTUAL és: ${now}

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

    // ─── 7. CRIDA A GEMINI ───────────────────────────────────────
    // Envia text + àudio en una sola crida multimodal
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

    // Si Gemini no ha entès res, retorna resposta per defecte
    if (!parsed.clean_message || parsed.clean_message.trim().length === 0) {
      return Response.json({
        success: true,
        intent: "unclear",
        transcript: parsed.raw_transcript || rawTranscript,
        response_text: "No t'he entès bé, pots repetir-ho?",
      });
    }

    // ─── 8. GUARDAR MISSATGE SI ÉS PER AL CUIDADOR ───────────────
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

    // ─── 9. CREAR ALERTA SI ÉS URGENT ────────────────────────────
    // Alertes per urgència "high" o "emergency" apareixen al dashboard del cuidador
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