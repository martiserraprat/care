// /api/voice-schedule
// El cuidador dicta per veu una programació de pastilles (ex: "Paracetamol cada dia a les 8").
// Gemini 2.5 Flash extreu medicament, hora, dosi i dies, i omple el formulari automàticament.
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import path from "path";
import fs from "fs";
import os from "os";

// Client admin per obtenir l'inventari del pastiller sense restriccions de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // ─── 1. CREDENCIALS GOOGLE ───────────────────────────────────
    // Escriu les credencials de la variable d'entorn a /tmp (necessari a Vercel serverless)
    const credsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!credsJson) throw new Error("GOOGLE_CREDENTIALS_JSON no definida.");
    const credsPath = path.join(os.tmpdir(), "google-credentials-tmp.json");
    fs.writeFileSync(credsPath, credsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;

    // ─── 2. AUTENTICAR USUARI ────────────────────────────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autenticat" }, { status: 401 });

    // ─── 3. LLEGIR ÀUDIO ─────────────────────────────────────────
    // L'àudio arriba com a FormData en format webm (gravat pel navegador)
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    if (!audioFile) {
      return Response.json({ error: "Sense àudio" }, { status: 400 });
    }
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // ─── 4. OBTENIR INVENTARI DEL PASTILLER ─────────────────────
    // Gemini necessita saber quins medicaments hi ha al pastiller
    // per identificar a quin es refereix el cuidador
    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (!robot) return Response.json({ error: "Sense robot" }, { status: 404 });

    const { data: inventory } = await supabaseAdmin
      .from("slot_inventory")
      .select("id, slot, medication_name, pill_count")
      .eq("robot_id", robot.id)
      .order("slot");

    if (!inventory || inventory.length === 0) {
      return Response.json({
        error: "No hi ha medicaments al pastiller. Afegeix-ne primer."
      }, { status: 400 });
    }

    // ─── 5. PREPARAR CONTEXT PER GEMINI ─────────────────────────
    // Llista els medicaments disponibles perquè Gemini pugui fer el match
    const inventoryText = inventory
      .map(s => `[id: "${s.id}", slot: ${s.slot}] ${s.medication_name} (${s.pill_count} pastilles)`)
      .join("\n");

    const now = new Date().toLocaleString("ca-ES", { timeZone: "Europe/Madrid" });

    // ─── 6. PROMPT ───────────────────────────────────────────────
    // Instrueix Gemini a extreure: medicament (id del inventari), hora, dosi i dies.
    // Inclou casos especials (àudio buit, frases ambigues, dies en català).
    const prompt = `<role>
Ets un assistent que escolta el cuidador d'un pacient i extrau d'un àudio en català/castellà una nova programació de medicació per un pastiller automàtic.
La data i hora actuals són: ${now}
</role>

<inventory>
Aquests són els ÚNICS medicaments disponibles al pastiller del pacient. Has d'identificar quin està demanant el cuidador entre aquests (poden referir-s'hi amb nom comercial, principi actiu, o de forma ambigua):

${inventoryText}
</inventory>

<task>
Escolta l'àudio i extreu:
1. Quin medicament de l'inventari està demanant (retorna l'id exacte de la llista)
2. A quina hora (format HH:MM, 24h)
3. Quantes pastilles per presa
4. Quins dies de la setmana
CRÍTIC SI L'ÀUDIO ÉS BUIT O INCOMPRENSIBLE:
Si l'àudio conté només soroll, està en blanc, es talla o directament no s'entén absolutament res del que diu el cuidador:
1. "transcript" ha de ser exactament "[Àudio buit o no s'entén]"
2. "medication_match_id" ha de ser null.
3. "confidence" ha de ser "low".
4. "missing_fields" ha d'incloure ["audio_content"].
5. "summary_message" ha de dir clarament en català que no s'ha detectat veu o no s'ha entès el missatge.
NO T'INVENTIS cap medicament de l'inventari si no s'ha dit clarament.

Dies vàlids (exactament aquests strings en minúscules):
"dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte", "diumenge"

Frases comunes a interpretar:
- "cada dia" / "tots els dies" / "diari" → els 7 dies
- "entre setmana" / "feiners" → dilluns a divendres
- "caps de setmana" → dissabte i diumenge
- "el matí" sense hora → 08:00
- "al migdia" → 13:00
- "a la tarda" → 17:00
- "al vespre" / "a la nit" → 21:00
</task>

<output_format>
Respon ÚNICAMENT amb JSON vàlid d'aquesta estructura exacta:
{
  "transcript": "transcripció literal del que has sentit",
  "medication_match_id": "id de l'inventari o null si no l'has identificat",
  "medication_heard": "nom del medicament tal com l'ha dit el cuidador",
  "time": "HH:MM o null",
  "dose": número (1, 2, 3...) o null,
  "days": ["dilluns", "dimarts", ...] o [],
  "confidence": "high" | "medium" | "low",
  "missing_fields": ["llista de camps que falten o no s'han pogut extreure"],
  "summary_message": "frase en català resumint què has entès, pel cuidador"
}
</output_format>

<examples>
Àudio: "Posa'm paracetamol cada dia a les 8 del matí, una pastilla"
Sortida (assumint que hi ha Paracetamol al slot 1):
{
  "transcript": "Posa'm paracetamol cada dia a les 8 del matí, una pastilla",
  "medication_match_id": "abc-123",
  "medication_heard": "paracetamol",
  "time": "08:00",
  "dose": 1,
  "days": ["dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte", "diumenge"],
  "confidence": "high",
  "missing_fields": [],
  "summary_message": "He entès: 1 pastilla de Paracetamol cada dia a les 08:00."
}

Àudio: "Vull programar ibuprofeno"
Sortida:
{
  "transcript": "Vull programar ibuprofeno",
  "medication_match_id": null,
  "medication_heard": "ibuprofeno",
  "time": null,
  "dose": null,
  "days": [],
  "confidence": "low",
  "missing_fields": ["time", "dose", "days"],
  "summary_message": "Has demanat Ibuprofeno però falta indicar l'hora, la dosi i els dies. A més, no el trobo al pastiller."
}
</examples>`;

    // ─── 7. CRIDA A GEMINI (MULTIMODAL) ─────────────────────────
    // responseSchema força l'estructura JSON de la resposta
    const ai = new GoogleGenAI({
      vertexai: { project: "smrlp-496809", location: "us-central1" },
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "audio/webm", data: audioBase64 } },
        ],
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            transcript: { type: "string" },
            medication_match_id: { type: "string", nullable: true },
            medication_heard: { type: "string" },
            time: { type: "string", nullable: true },
            dose: { type: "integer", nullable: true },
            days: { type: "array", items: { type: "string" } },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            missing_fields: { type: "array", items: { type: "string" } },
            summary_message: { type: "string" },
          },
          required: ["transcript", "medication_heard", "days", "confidence", "summary_message"],
        },
      },
    });

    const parsed = JSON.parse(response.text);

    // ─── 8. VERIFICAR QUE L'ID EXISTEIX ─────────────────────────
    // Evita que Gemini retorni un id inventat que no pertany a l'inventari real
    if (parsed.medication_match_id) {
      const exists = inventory.find(s => s.id === parsed.medication_match_id);
      if (!exists) parsed.medication_match_id = null;
    }

    return Response.json({ success: true, ...parsed });

  } catch (error) {
    console.error("Error voice-schedule:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}