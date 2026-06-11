# main.py
# Programa principal del robot Care-E.
# Gestiona el bucle principal, la detecció del wake word, la sincronització
# d'horaris amb el cloud, el polling de comandes i el heartbeat.
import sounddevice as sd
import numpy as np
import time
import datetime
import json
import os
import threading
import requests
import speech_recognition as sr
from config import supabase, ROBOT_ID, API_URL, LOCAL_FILE, DIES_CAT
from dispensing import processar_schedule
from commands import processar_comandes, gestionar_veu, set_events
from utils import get_wifi_signal, flush_pendents, carregar_pendents

# Paraules que activen l'assistent de veu
# Inclou variants fonètiques per millorar la detecció en català, castellà i anglès
WAKE_WORDS = [
    "care", "care-e", "cari", "cares", "carey",
    "kare", "kari", "kares",
    "cari", "cariño", "caris", "queri", "eri",
    "kerry", "carry", "cary", "carrie", "eric",
    "ker", "kar", "car", "are",
    "alí", "alé", "ali", "ale",
    "caro", "cara", "dare", "bare", "fare", "rare",
    "quer", "kel", "key",
    "carée", "caré", "karé",
    "hector", "héctor",
]

MIC_DEVICE = 1      # USB PnP Audio Device (micròfon extern)
MIC_RATE   = 48000  # Freqüència nativa del micròfon USB
AMP_DEVICE = 0      # Google Voice HAT (altaveu)
AMP_RATE   = 48000  # Freqüència nativa del Voice HAT

# ─── Events compartits entre threads ─────────────────────────────────────────
# S'usen per coordinar l'accés als dispositius d'àudio entre els threads
wake_word_activat = threading.Event()  # El wake word ha estat detectat
robot_parlant     = threading.Event()  # El robot està reproduint àudio
pausar_wake_word  = threading.Event()  # Cal pausar la detecció del wake word

# Injecta els events al mòdul commands per coordinar l'àudio
set_events(robot_parlant, pausar_wake_word)

# ─── Funcions de sincronització local ────────────────────────────────────────

def save_schedules_local(schedules):
    # Guarda els horaris en local per funcionar en mode offline
    try:
        with open(LOCAL_FILE, "w", encoding="utf-8") as f:
            json.dump(schedules, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"⚠️ Error guardant en local: {e}")

def load_schedules_local():
    # Carrega els horaris guardats localment a l'inici del programa
    if os.path.exists(LOCAL_FILE):
        try:
            with open(LOCAL_FILE, "r", encoding="utf-8") as f:
                dades = json.load(f)
                print(f"📁 Carregats {len(dades)} horaris de la memòria local.")
                return dades
        except Exception as e:
            print(f"⚠️ Error llegint fitxer local: {e}")
    return []

# ─── Wake Word ────────────────────────────────────────────────────────────────

def escoltar_wake_word():
    # Thread que escolta contínuament el micròfon esperant que el pacient digui "Care-E"
    # Usa Google Speech Recognition per transcriure i detectar la paraula clau
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = False

    print("🎤 Wake word actiu. Di 'Care-E' per activar.")

    while True:
        try:
            # Obre i tanca el micròfon en cada iteració per alliberar-lo quan cal pausar
            with sr.Microphone(device_index=MIC_DEVICE, sample_rate=MIC_RATE) as source:
                print("Calibrant soroll ambient...")
                recognizer.adjust_for_ambient_noise(source, duration=2)
                print("Calibració acabada. Escoltant...")

                while True:
                    # Surt del with (allibera el micròfon) si el robot parla o grava
                    if robot_parlant.is_set() or pausar_wake_word.is_set():
                        break

                    try:
                        audio = recognizer.listen(source, timeout=5, phrase_time_limit=4)
                        text = recognizer.recognize_google(audio, language="ca-ES").lower()
                        print(f" 👂 Detectat: '{text}'")

                        # Comprova si algun wake word és present al text detectat
                        if any(w in text for w in WAKE_WORDS):
                            print("✅ Wake word detectat!")
                            pausar_wake_word.set()
                            wake_word_activat.set()
                            break

                    except sr.WaitTimeoutError:
                        pass  # Silenci durant 5s, torna a escoltar
                    except sr.UnknownValueError:
                        pass  # No s'ha entès res, torna a escoltar
                    except sr.RequestError as e:
                        print(f"⚠️ Error Google: {e}")

            # Espera fora del with mentre el robot parla o grava
            while pausar_wake_word.is_set() or robot_parlant.is_set():
                time.sleep(0.3)

        except Exception as e:
            print(f"⚠️ Error wake word: {e}")
            time.sleep(2)

# ─── Manté l'amplificador encès ──────────────────────────────────────────────

def mantenir_amp_encesa():
    # Thread que envia silenci continu al Voice HAT per evitar que l'amplificador
    # MAX98357 s'apagui entre reproduccions (causaria "pops" molestos al altaveu)
    while True:
        if robot_parlant.is_set() or pausar_wake_word.is_set():
            time.sleep(0.3)  # Pausa quan el robot parla o grava per alliberar el dispositiu
            continue
        try:
            with sd.OutputStream(
                samplerate=AMP_RATE,
                channels=2,
                dtype='int16',
                device=AMP_DEVICE,
                blocksize=4096
            ) as stream:
                silenci = np.zeros((4096, 2), dtype=np.int16)
                # Escriu silenci fins que calgui pausar
                while not (robot_parlant.is_set() or pausar_wake_word.is_set()):
                    stream.write(silenci)
        except Exception as e:
            print(f"⚠️ Error amp: {e}")
            time.sleep(1)

# ─── Inicialització ───────────────────────────────────────────────────────────

# Comprova si el robot ja existeix a Supabase, si no el crea
res = supabase.table("robots").select("id, owner_id, name, robot_token").eq("id", ROBOT_ID).execute()
token = None

if not res.data:
    # Primera execució: registra el robot i espera que l'usuari el vinculi via web
    supabase.table("robots").insert({
        "id": ROBOT_ID, "name": "Care-E", "status": "offline",
    }).execute()
    print("=" * 40 + f"\n  Care-E Robot ID:\n  {ROBOT_ID}\n" + "=" * 40)
else:
    robot_data = res.data[0]
    token = robot_data.get("robot_token")
    if robot_data.get("owner_id"):
        print(f"✓ Care-E funcionant | Robot: {robot_data.get('name', 'Care-E')}")
    else:
        print("Esperant que l'usuari vinculi el robot...")

# Carrega horaris locals i inicialitza comptadors
current_schedules   = load_schedules_local()
last_sync_time      = 0   # Última sincronització d'horaris (cada 60s)
last_command_check  = 0   # Última comprovació de comandes (cada 5s)
historial_dispensat = {}  # Registre de dispensacions del dia per evitar duplicats
last_heartbeat      = 0   # Últim heartbeat enviat a Supabase (cada 10s)

# Intenta enviar logs pendents de sessions anteriors
pendents_inicials = carregar_pendents()
if pendents_inicials:
    print(f"📦 {len(pendents_inicials)} logs pendents de l'última sessió.")

# Inicia els threads de detecció de wake word i manteniment de l'amplificador
threading.Thread(target=escoltar_wake_word, daemon=True).start()
threading.Thread(target=mantenir_amp_encesa, daemon=True).start()

print("\nIniciant bucle principal...\n")

# ─── Bucle Principal ──────────────────────────────────────────────────────────

while True:
    now = time.time()

    # ── A) SINCRONITZACIÓ D'HORARIS (cada 60s) ──────────────────────────────
    if now - last_sync_time > 60:
        if token:
            try:
                r = requests.post(f"{API_URL}/api/robot-info", json={
                    "robot_id": ROBOT_ID, "robot_token": token
                }, timeout=5)
                if r.status_code == 200:
                    data = r.json()
                    nous_horaris = data.get("schedules") or []
                    if nous_horaris != current_schedules:
                        current_schedules = nous_horaris
                        save_schedules_local(current_schedules)
                        print(f"✅ Horaris actualitzats: {len(current_schedules)} actius.")
                    last_sync_time = now
                    flush_pendents()  # Envia logs pendents aprofitant que hi ha connexió
            except Exception as e:
                print(f"⚠️ Sense internet. ({e})")
        else:
            # Si no té token, comprova si l'usuari l'ha vinculat via web
            refresh = supabase.table("robots").select("robot_token").eq("id", ROBOT_ID).execute()
            if refresh.data and refresh.data[0].get("robot_token"):
                token = refresh.data[0].get("robot_token")
                print("🎉 Robot vinculat!")

    # ── B) COMPROVACIÓ DE DISPENSACIÓ PROGRAMADA ────────────────────────────
    current_time_str = time.strftime("%H:%M")
    today_date_str   = time.strftime("%Y-%m-%d")
    today_weekday    = DIES_CAT[datetime.datetime.today().weekday()]

    # Comprova cada horari actiu per veure si toca dispensar ara
    for s in current_schedules:
        processar_schedule(s, token, historial_dispensat, today_date_str, current_time_str, today_weekday)

    # ── C) POLLING DE COMANDES MANUALS (cada 5s) ────────────────────────────
    if now - last_command_check > 5 and token:
        try:
            r = requests.post(f"{API_URL}/api/robot-pending-commands", json={
                "robot_id": ROBOT_ID, "robot_token": token
            }, timeout=5)
            if r.status_code == 200:
                commands = r.json().get("commands", [])
                if commands:
                    processar_comandes(commands, token)
            last_command_check = now
        except Exception:
            pass

    # ── D) GESTIÓ DEL WAKE WORD ACTIVAT ─────────────────────────────────────
    if wake_word_activat.is_set() and token:
        wake_word_activat.clear()
        pausar_wake_word.set()
        robot_parlant.set()  # Bloqueja amp i wake word per alliberar dispositius
        time.sleep(1.5)      # Espera que els threads alliberin el micròfon i altaveu

        print("\n🎤 Processant veu del pacient...")
        try:
            gestionar_veu(token, pausar_wake_word, robot_parlant)
        except Exception as e:
            import traceback
            print(f"❌ Error: {traceback.format_exc()}")
        finally:
            # Sempre reactiva els threads en acabar, fins i tot si hi ha error
            robot_parlant.clear()
            pausar_wake_word.clear()

    # ── E) HEARTBEAT (cada 10s) ──────────────────────────────────────────────
    # Actualitza l'estat del robot a Supabase per indicar que està online
    if now - last_heartbeat > 10:
        try:
            supabase.table("robots").update({
                "status":  "online",
                "battery": None,
                "signal":  get_wifi_signal(),
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }).eq("id", ROBOT_ID).execute()
            print(f"Ping ✓ | {time.strftime('%H:%M:%S')}")
        except Exception:
            pass
        last_heartbeat = now

    time.sleep(0.1)  # Petit delay per no saturar la CPU