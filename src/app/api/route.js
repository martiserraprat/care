// src/app/api/check-medication/route.js
import { VertexAI } from "@google-cloud/vertexai";
import path from "path";

export async function POST(req) {
  try {
    const { newSchedule, existingSchedules } = await req.json();

    // Inicialitza Vertex AI
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
      googleAuthOptions: {
        keyFilename: path.join(process.cwd(), process.env.GOOGLE_CREDENTIALS_FILE),
      },
    });

    const model = vertexAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
    });

    // Construeix el prompt
    const prompt = `Ets un assistent mèdic expert. Analitza si aquesta nova programació de medicació és segura.

Nova programació:
- Medicament: ${newSchedule.medication_name}
- Dosi: ${newSchedule.dose} pastilla/es
- Hora: ${newSchedule.time}
- Dies: ${newSchedule.days?.join(", ")}

Programacions existents del pacient:
${existingSchedules.length === 0 
  ? "Cap altre medicament programat." 
  : existingSchedules.map(s => 
    `- ${s.slot_inventory?.medication_name}: ${s.dose} pastilla/es a les ${s.scheduled_time?.slice(0,5)}`
  ).join("\n")
}

Comprova:
1. Si la dosi sembla excessiva per al medicament
2. Si hi ha interaccions perilloses amb els altres medicaments
3. Si la freqüència és massa alta

Respon ÚNICAMENT en format JSON sense cap text addicional:
{
  "safe": true o false,
  "warnings": ["warning 1", "warning 2"],
  "info": "missatge breu per a l'usuari"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates[0].content.parts[0].text;

    // Neteja la resposta i parseja el JSON
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return Response.json(parsed);

  } catch (error) {
    console.error("Error Vertex AI:", error);
    return Response.json(
      { safe: true, warnings: [], info: "No s'ha pogut verificar la seguretat." },
      { status: 200 }
    );
  }
}
