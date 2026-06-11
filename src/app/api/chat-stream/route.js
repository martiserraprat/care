// src/app/api/chat-stream/route.js
import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs";
import os from "os";
import { comprovarRespostaPredefinida, obtenirPersonalitatPrompt } from "@/lib/voice-assistant";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response("Manca el prompt", { status: 400 });
    }

    // ============================================================
    // 🔥 COMPROVAR RESPOSTES PREDEFINIDES PRIMER
    // ============================================================
    const respostaPredefinida = comprovarRespostaPredefinida(prompt);
    if (respostaPredefinida) {
      console.log(`🎯 [chat-stream] Resposta predefinida per: "${prompt}"`);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(respostaPredefinida));
          controller.close();
        }
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // ============================================================
    // SI NO HI HA RESPOSTA PREDEFINIDA, CONTINUAR AMB GEMINI
    // ============================================================
    
    // Configuració credencials
    const credsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!credsJson) {
      throw new Error("La variable GOOGLE_CREDENTIALS_JSON no està definida.");
    }
    const credsPath = path.join(os.tmpdir(), "google-credentials-tmp.json");
    fs.writeFileSync(credsPath, credsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;

    const ai = new GoogleGenAI({
      vertexai: {
        project: "smrlp-496809",
        location: "us-central1",
      },
    });

    const now = new Date().toLocaleString("ca-ES", {
      timeZone: "Europe/Madrid",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 🔥 Afegir personalitat al prompt
    const personalitatPrompt = obtenirPersonalitatPrompt();
    
    const promptComplet = `${personalitatPrompt}

La data i hora actual és: ${now}.

Usuari: ${prompt}

Respon de forma breu, natural i en català. Màxim 2-3 frases.
Segueix les regles de personalitat: NO ets Alexa, ets Queri (o Care-E).`;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: promptComplet,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Error dins de l'stream:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (error) {
    console.error("Error a chat-stream:", error);
    return new Response("Error intern del servidor", { status: 500 });
  }
}