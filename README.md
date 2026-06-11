CLOUD FUNCTIONS — Care-E
========================

Què són?
--------
Les cloud functions de Care-E són funcions serverless desplegades
a Vercel mitjançant Next.js App Router (API Routes). Cada fitxer
route.js dins de /src/app/api/ es compila i desplega automàticament
com una funció independent que s'executa sota demanda al núvol,
sense necessitat de gestionar servidors.

URL base de producció: https://care-seven-zeta.vercel.app

Com s'invoquen?
---------------
Totes les funcions s'invoquen via HTTP POST a la seva URL.
Hi ha dos tipus d'autenticació:

  1. USUARIS (cuidadors/familiars): cookie de sessió de Supabase
  2. ROBOT: token únic per robot guardat a la base de dades

LLISTA DE FUNCIONS:
-------------------

1. /api/robot-info
   - Arxiu: robot-info/route.js
   - Auth: token robot
   - Descripció: El robot consulta els horaris de dispensació actius
   - Body: { robot_id, robot_token }

2. /api/robot-pending-commands
   - Arxiu: robot-pending-commands/route.js
   - Auth: token robot
   - Descripció: Retorna comandes pendents (dispensació manual o veu)
   - Body: { robot_id, robot_token }

3. /api/robot-action
   - Arxiu: robot-action/route.js
   - Auth: token robot
   - Descripció: El robot reporta el resultat d'una acció executada
   - Body: { robot_id, robot_token, action, payload }

4. /api/robot-voice
   - Arxiu: robot-voice/route.js
   - Auth: token robot
   - Descripció: Rep àudio del pacient, el processa amb Gemini 2.5 Flash
     (Vertex AI), transcriu, classifica intenció i urgència, retorna resposta
   - Body: FormData { audio (wav), robot_id, robot_token }

5. /api/tts
   - Arxiu: tts/route.js
   - Auth: token robot
   - Descripció: Genera veu en català amb Google Cloud TTS
   - Body: { robot_id, robot_token, text }

6. /api/robot-voice-text
   - Arxiu: robot-voice-text/route.js
   - Auth: token robot
   - Descripció: Processa text del pacient amb Gemini (versió text)
   - Body: { robot_id, robot_token, text }

7. /api/manual-dispense
   - Arxiu: manual-dispense/route.js
   - Auth: cookie sessió usuari
   - Descripció: Cuidador ordena dispensació manual d'un slot
   - Body: { robot_id, slot_inventory_id, dose }

8. /api/speak-message
   - Arxiu: speak-message/route.js
   - Auth: cookie sessió usuari
   - Descripció: Cuidador envia missatge de veu al robot (genera TTS)
   - Body: { robot_id, message }

9. /api/check-medication
   - Arxiu: check-medication/route.js
   - Auth: cookie sessió usuari
   - Descripció: Valida seguretat farmacològica d'una nova pauta
     mitjançant Gemini 2.5 Flash amb criteris STOPP/Beers
   - Body: { newSchedule, existingSchedules }

10. /api/voice-schedule
    - Arxiu: voice-schedule/route.js
    - Auth: cookie sessió usuari
    - Descripció: El cuidador dicta per veu una programació de
      pastilles. Gemini extreu medicament, hora, dosi i dies
    - Body: FormData { audio (webm) }

11. /api/delete-slot
    - Arxiu: delete-slot/route.js
    - Auth: cookie sessió usuari
    - Descripció: Esborra un slot de l'inventari gestionant
      les foreign keys de manual_commands i dispense_schedules
    - Body: { slot_id }

12. /api/chat-stream
    - Arxiu: chat-stream/route.js
    - Auth: cookie sessió usuari
    - Descripció: Chat en streaming amb IA per al cuidador
    - Body: { messages }