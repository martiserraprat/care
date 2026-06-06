// src/lib/voice-assistant.js
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

let personalitat = null;
let respostesPred = null;
let configCarregada = false;

function carregarConfiguracio() {
  if (configCarregada) return { personalitat, respostesPred };
  
  try {
    const yamlPath = path.join(process.cwd(), "src/config/personalitat.yaml");
    if (fs.existsSync(yamlPath)) {
      const yamlContent = fs.readFileSync(yamlPath, "utf8");
      personalitat = yaml.load(yamlContent);
      console.log("✅ Personalitat carregada");
    }

    const jsonPath = path.join(process.cwd(), "src/config/respostes_pred.json");
    if (fs.existsSync(jsonPath)) {
      const jsonContent = fs.readFileSync(jsonPath, "utf8");
      respostesPred = JSON.parse(jsonContent);
      console.log(`✅ ${respostesPred.respostes_pred?.length || 0} respostes predefinides`);
    }
    
    configCarregada = true;
  } catch (error) {
    console.error("❌ Error carregant configuració:", error);
  }
  
  return { personalitat, respostesPred };
}

function comprovarRespostaPredefinida(transcript) {
  const { respostesPred } = carregarConfiguracio();
  if (!respostesPred?.respostes_pred) return null;
  
  const text = transcript.toLowerCase().trim();
  
  for (const item of respostesPred.respostes_pred) {
    for (const trigger of item.trigger) {
      if (text.includes(trigger.toLowerCase())) {
        console.log(`🎯 Match: "${trigger}"`);
        return item.response;
      }
    }
  }
  return null;
}

function obtenirPersonalitatPrompt() {
  const { personalitat } = carregarConfiguracio();
  if (!personalitat) return "";
  
  const assistantName = personalitat.assistant?.name || "Care-E";
  const styleRules = personalitat.communication_style?.rules || [];
  const safetyForbidden = personalitat.medical_safety?.forbidden || [];
  
  return `
📋 PERSONALITAT (SEGUEIX AQUESTES REGLES OBLIGATÒRIAMENT):
- Ets ${assistantName}, no ets Alexa ni Wall-E
- Regles d'estil: ${styleRules.join(", ")}
- NO pots: ${safetyForbidden.join(", ")}
- Si l'usuari està confós: ${personalitat.behavior?.if_user_confused?.[0] || "respon amb senzillesa"}
- Temes permesos: ${personalitat.behavior?.allowed_topics?.join(", ") || "conversa bàsica"}
`;
}

export {
  comprovarRespostaPredefinida,
  obtenirPersonalitatPrompt,
  carregarConfiguracio
};