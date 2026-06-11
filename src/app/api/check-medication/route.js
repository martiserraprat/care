// /api/check-medication
// Valida la seguretat farmacològica d'una nova pauta de medicació
// abans d'introduir-la al pastiller Care-E mitjançant Gemini 2.5 Flash (Vertex AI)

import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Client admin de Supabase amb service_role_key — bypassa el RLS per consultar inventari
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // 1. CREDENCIALS GOOGLE
    // A Vercel no hi ha sistema de fitxers persistent. Solució: llegir les credencials
    // de la variable d'entorn i escriure-les temporalment a /tmp durant l'execució.
    const credsJson = process.env.GOOGLE_CREDENTIALS_JSON;

    if (!credsJson) {
      console.error("❌ ERROR CRÍTICO: No se encuentra GOOGLE_CREDENTIALS_JSON en las variables de entorno");
      throw new Error("La variable de entorno GOOGLE_CREDENTIALS_JSON no está definida.");
    }

    const os = require('os');
    const credsPath = path.join(os.tmpdir(), "google-credentials-tmp.json");
    
    // Escriu les creds al fitxer temporal i apunta GOOGLE_APPLICATION_CREDENTIALS cap a ell
    fs.writeFileSync(credsPath, credsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
    
    //2. LLEGIR PETICIÓ
    // newSchedule: nova pauta a validar | existingSchedules: pautes actives del pacient
    const { newSchedule, existingSchedules } = await req.json();

    console.log("=== INICIANDO PETICIÓN A VERTEX AI ===");
  
    //3. CLIENT VERTEX AI
    // Inicialitza el client apuntant al projecte de Google Cloud i la regió us-central1
    const ai = new GoogleGenAI({
      vertexai: {
        project: "smrlp-496809",
        location: "us-central1",
      }
    });

  // 4. PROMPT
  // Instrueix Gemini com a farmacèutic clínic. Inclou: rol, context pacient,
  // nova prescripció, restriccions del robot, medicació actual i protocol de 7 passos.
  const prompt = `<role>
  Ets un farmacèutic clínic sènior especialitzat en geriatria i polifarmàcia, amb 20 anys d'experiència revisant pautes de medicació en pacients fràgils. La teva especialitat és detectar errors de prescripció abans que arribin al pacient. Tens accés mental als criteris STOPP/START, Beers Criteria 2023, i bases de dades d'interaccions tipus Lexicomp/Stockley.

  La teva missió és revisar UNA programació nova abans que s'introdueixi al pastiller automàtic d'un pacient gran. El cuidador (no professional sanitari) confia en la teva validació.

  REGLA D'OR: en qualsevol situació de dubte clínic, marca \`safe: false\`. Un error que arribi a un pacient gran pot ser mortal. Una falsa alarma només suposa que el cuidador truqui al metge per confirmar — això és acceptable i fins i tot desitjable.
  </role>

  <patient_context>
  Edat: no especificada (assumeix 60 anys per defecte)
  Condicions: no documentades
  Al·lèrgies: no documentades
  </patient_context>

  <new_prescription>
  Medicament: ${newSchedule.medication_name}
  Dosi per presa: ${newSchedule.dose} comprimit(s)
  Hora programada: ${newSchedule.time}
  Dies: ${newSchedule.days?.join(", ") || "no especificat"}
  </new_prescription>
  <robot_constraints>
IMPORTANT: El robot Care-E és un pastiller automàtic que NOMÉS pot dispensar formes farmacèutiques sòlides orals:
✅ COMPATIBLES: comprimits, càpsules, gragees, drageas, comprimits efervescents (sense aigua), comprimits sublinguals
❌ NO COMPATIBLES: 
  - Líquids: solucions, suspensions, xarops, gotes
  - Aerosols/inhaladors
  - Pomades, cremes, gels, ungüents
  - Supositoris, òvuls
  - Injectables, vials, ampolles
  - Pegats transdèrmics
  - Pólvores per reconstituir
  - Col·liris, gotes oculars/òtiques/nasals
  - Sobres/pólvores per dissoldre

Si detectes que la forma farmacèutica del nom del medicament NO és compatible (mira paraules clau com "suspensión", "jarabe", "gotas", "aerosol", "crema", "pomada", "solución", "vial", "supositorio", "parche", "ml", "g/ml", "mg/ml", etc.):
- safe: false
- severity: "high"  
- recommended_action: "block"
- warning específic indicant la forma farmacèutica detectada
- info explicant que el robot només dispensa comprimits/càpsules i que hi ha un error de selecció
</robot_constraints>

  <current_medications>
  ${existingSchedules.length === 0
    ? "(Cap altre medicament programat al pastiller en aquest moment)"
    : existingSchedules.map(s => {
        const name = s.slot_inventory?.medication_name || s.medication_name || "Desconegut";
        const dose = s.dose;
        const time = s.scheduled_time?.slice(0, 5) || s.time || "?";
        const days = s.days?.join(",") || "diari";
        return `• ${name} — ${dose} comp · ${time}h · ${days}`;
      }).join("\n")
  }
  </current_medications>

  <reasoning_protocol>
  Abans de respondre, raona MENTALMENT i en silenci aquests 6 passos. NO els incloguis a la resposta final.
  
  PAS 0 — COMPATIBILITAT AMB EL ROBOT
  És una forma farmacèutica sòlida oral (comprimit/càpsula)? Si NO (suspensió, xarop, aerosol, crema, gotes, supositori, etc.), atura aquí l'anàlisi → safe: false amb severity high i action block. La resta de passos no s'apliquen.

  PAS 1 — IDENTIFICACIÓ
  Quin principi actiu hi ha al medicament nou? Quin grup farmacològic és (ex. AINE, IECA, BZD)? Forma farmacèutica?

  PAS 2 — DOSIFICACIÓ ABSOLUTA
  És una dosi habitual? Per l'edat estimada, és segura? Considera funció renal/hepàtica si està documentada o, si no, assumeix deteriorament moderat per edat.
  - Dosi ≥ 5 comprimits/presa: gairebé sempre anormal → safe: false.
  - Dosi ≥ 3 comprimits: cal una justificació clínica clara.
  - Dosis típiques en gent gran solen ser inferiors a les d'adults (regla "start low, go slow").

  PAS 3 — DUPLICACIÓ TERAPÈUTICA
  Recorre la medicació actual: hi ha un altre fàrmac amb el mateix principi actiu? Del mateix grup terapèutic? (Ex: ibuprofèn + diclofenac, lorazepam + diazepam, enalapril + ramipril). Si sí → safe: false.

  PAS 4 — INTERACCIONS FARMACOLÒGIQUES
  Repassa contra TOTS els fàrmacs actuals. Atenció especial a:
  - Anticoagulants (warfarina, acenocumarol, apixabán, rivaroxabán, dabigatran) ↔ AINEs, antiagregants, alguns antibiòtics
  - Depressors del SNC (BZD, opioides, antipsicòtics, alcohol, alguns antihistamínics)
  - Cardiovasculars: IECA/ARA-II + diürètics estalviadors K+ (risc hiperpotassèmia)
  - QT-llarg: macròlids, quinolones, antipsicòtics, ondansetró, citalopram (risc torsades)
  - Estatines + macròlids/fibrats/amiodarona (risc rabdomiòlisi)
  - Sulfonilurees + IECA/quinolones (hipoglucèmies)
  - Litio + AINEs/diürètics (toxicitat)
  - Digoxina + amiodarona/verapamil (toxicitat)

  PAS 5 — CRITERIS DE GERIATRIA (STOPP / Beers)
  Aquest medicament està en llistes de fàrmacs potencialment inadequats en gent gran?
  Senyals d'alarma habituals:
  - Benzodiazepines de vida mitjana llarga (diazepam, clordiazepòxid)
  - Anticolinèrgics forts (amitriptilina, hidroxizina, oxibutinina)
  - AINEs en ús crònic (sobretot amb HTA/IC/IR)
  - Sulfonilurees de vida llarga (glibenclamida)
  - Opioides forts d'inici sense titulació
  - Antipsicòtics típics per delírium/agitació crònica

  PAS 6 — COHERÈNCIA HORÀRIA
  Hi ha fàrmacs amb interacció moderada programats amb < 2h de diferència? Aquest fàrmac té requeriments horaris específics (ex: bifosfonats en dejú, levotiroxina separada de calci/ferro, IBP abans dels àpats)?
  </reasoning_protocol>

  <output_rules>
  - Respon NOMÉS amb JSON vàlid (sense codi marcdown, sense backticks).
  - Camp \`safe\`: \`false\` SEMPRE que hi hagi qualsevol dels riscos del pas 2, 3 o 4. Per pas 5/6 normalment \`true\` amb warning.
  - Camp \`warnings\`: una frase per problema, breu i específica (cita els fàrmacs concrets).
  - Camp \`info\`: 1-2 frases en català planer pel cuidador. Ha d'entendre què passa i què fer (ex: "Consulta el metge abans de programar"). NO repeteixis les warnings literalment.
  - Camp \`severity\`: "critical" (risc vital/dany greu), "high" (efecte advers probable), "moderate" (vigilància), "low" (només cautela).
  - Camp \`recommended_action\`: una de "block" (no permetre), "consult_doctor" (consultar abans), "monitor" (programar però vigilar), "proceed" (cap acció).
  </output_rules>

  <edge_cases>
  Casos en què la gent es confon — fes-ho bé:

  1. Si no hi ha medicació actual, NO pots descartar interaccions: només pots avaluar la dosi i el fàrmac per si sol.

  2. "1 comprimit de paracetamol 3 cops al dia" és diferent de "3 comprimits de cop". Llegeix bé la dosi PER PRESA.

  3. Si la dosi és típica però el fàrmac és inadequat per gent gran, NO marquis safe: false només per això — usa warning amb severity moderate.

  4. Si el medicament és desconegut o un nom comercial poc clar, en lloc d'inventar, posa warning explícit demanant verificar el nom amb el metge.

  5. Una "interacció teòrica" amb antecedents de seguretat clínica (ex: paracetamol + warfarina a dosis baixes) és warning, no block.
  </edge_cases>

  <output_schema>
  {
    "safe": boolean,
    "severity": "critical" | "high" | "moderate" | "low" | "none",
    "recommended_action": "block" | "consult_doctor" | "monitor" | "proceed",
    "warnings": string[],
    "info": string
  }
  </output_schema>

  <examples>
  <!-- Exemple 1: Cas net -->
  Entrada: Paracetamol 500mg, 1 comp, 09:00, diari. Medicació actual: cap.
  Sortida:
  {"safe": true, "severity": "none", "recommended_action": "proceed", "warnings": [], "info": "Programació correcta. Paracetamol és segur a aquesta dosi en gent gran."}

  <!-- Exemple 2: Duplicació clàssica -->
  Entrada: Ibuprofèn 600mg, 1 comp, 14:00. Medicació actual: Diclofenac 50mg a les 09:00.
  Sortida:
  {"safe": false, "severity": "high", "recommended_action": "block", "warnings": ["Duplicació AINE: Ibuprofèn i Diclofenac actuen pel mateix mecanisme", "Risc augmentat de sagnat digestiu i toxicitat renal en gent gran"], "info": "No es pot combinar Ibuprofèn amb Diclofenac. Truca al metge per substituir-ne un dels dos."}

  <!-- Exemple 3: Interacció seriosa -->
  Entrada: Ibuprofèn 600mg, 1 comp, 12:00. Medicació actual: Sintrom (acenocumarol) 1mg a les 20:00.
  Sortida:
  {"safe": false, "severity": "critical", "recommended_action": "block", "warnings": ["Ibuprofèn potencia l'efecte anticoagulant del Sintrom: risc d'hemorràgia greu"], "info": "Aquesta combinació pot causar sagnats greus. Demana al metge un analgèsic alternatiu (paracetamol)."}

  <!-- Exemple 4: Inadequat per edat però gestionable -->
  Entrada: Lorazepam 1mg, 1 comp, 22:00, diari. Medicació actual: cap.
  Sortida:
  {"safe": true, "severity": "moderate", "recommended_action": "monitor", "warnings": ["Benzodiazepina en gent gran: augmenta risc de caigudes i confusió"], "info": "És vàlid però vigila si nota més mareig o desorientació. Hauria de ser tractament curt, no crònic."}

  <!-- Exemple 5: Dosi excessiva clara -->
  Entrada: Paracetamol 1g, 5 comp, 09:00, diari.
  Sortida:
  {"safe": false, "severity": "critical", "recommended_action": "block", "warnings": ["5 comprimits d'1g = 5g de paracetamol en una sola presa, supera la dosi tòxica"], "info": "Aquesta dosi és perillosa per al fetge. Probablement hi ha un error a la prescripció — verifica amb el metge."}

  <!-- Exemple 6: Nom estrany -->
  Entrada: "Lormetazepan", 1 comp, 22:00.
  Sortida:
  {"safe": true, "severity": "low", "recommended_action": "consult_doctor", "warnings": ["Nom del medicament poc habitual: pot ser Lormetazepam (BZD)"], "info": "Verifica el nom exacte del medicament amb el metge abans de programar-lo."}
  
  <!-- Exemple 7: Forma farmacèutica incompatible -->
  Entrada: "Ibuprofeno suspensión oral 100mg/5ml", 1 comp, 14:00.
  Sortida:
  {"safe": false, "severity": "high", "recommended_action": "block", "warnings": ["Forma farmacèutica incompatible: 'suspensión oral' és un líquid, no un comprimit"], "info": "El robot Care-E només dispensa pastilles i càpsules sòlides. Sembla un error de selecció — busca la versió en comprimits del mateix medicament."}

  <!-- Exemple 8: Aerosol -->
  Entrada: "Salbutamol 100mcg suspensión para inhalación en aerosol", 1 comp, 09:00.
  Sortida:
  {"safe": false, "severity": "high", "recommended_action": "block", "warnings": ["Forma farmacèutica incompatible: aerosol inhalat"], "info": "Aquest medicament és per inhalar amb un inhalador, no es pot posar al pastiller. Sembla un error de selecció."}
</examples>`;


  console.log("Enviando al modelo gemini-2.5-flash...");

  // 5. CRIDA A GEMINI
  // responseSchema força el JSON vàlid. thinkingBudget dóna marge de raonament intern.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          safe: { type: "boolean" },
          severity: { type: "string", enum: ["critical", "high", "moderate", "low", "none"] },
          recommended_action: { type: "string", enum: ["block", "consult_doctor", "monitor", "proceed"] },
          warnings: { type: "array", items: { type: "string" } },
          info: { type: "string" }
        },
        required: ["safe", "severity", "recommended_action", "warnings", "info"]
      },
      // Habilita el "thinking" pel pas mental
      thinkingConfig: {
        thinkingBudget: 1024  // dóna a Gemini espai per raonar abans de respondre
      }
    }
  });

    const text = response.text;
    console.log("=== RESPUESTA DE VERTEX AI OK ===");
    console.log(text);
    
    //6. PROCESSAR RESPOSTA
    // Si Gemini retorna JSON invàlid, fallback a resposta segura per defecte
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.log("=== PARSE ERROR ===", e.message);
      parsed = { safe: true, warnings: [], info: "Error al llegir la resposta de la IA." };
    }

    const doseNum = parseInt(newSchedule.dose);

    if (doseNum >= 5) {
      parsed.safe = false;
      parsed.warnings = [...(parsed.warnings || []), `Dosi molt elevada: ${doseNum} pastilles per presa.`];
      parsed.info = `Dosi de ${doseNum} pastilles és excessiva. Revisa la programació.`;
    }

    // 8. VERIFICACIÓ D'INVENTARI
    // Comprova que hi ha prou pastilles al slot per la dosi demanada
    if (newSchedule.slot_inventory_id) {
      const { data: slot } = await supabaseAdmin
        .from("slot_inventory")
        .select("pill_count, slot")
        .eq("id", newSchedule.slot_inventory_id)
        .single();

      if (slot && slot.pill_count < doseNum) {
        parsed.safe = false;
        parsed.warnings = [
          ...(parsed.warnings || []),
          `Inventari insuficient: només hi ha ${slot.pill_count} pastilla/es al slot ${slot.slot}, però la dosi requereix ${doseNum}.`
        ];
        parsed.info = `No es pot programar: cal omplir el slot abans. Disponibles: ${slot.pill_count}, requerides: ${doseNum}.`;
      }
    }

    return Response.json(parsed);

  } catch (error) {
    console.error("=== ERROR VERTEX AI ===", error);
    return Response.json({
      safe: true,
      warnings: ["Fallo forzado. Revisa la consola."],
      info: "Error: " + error.message,
    }, { status: 500 });
  }
}