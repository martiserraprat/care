# main.py
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
from commands import processar_comandes, gestionar_veu
from utils import get_wifi_signal, flush_pendents, carregar_pendents

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

MIC_DEVICE = 1    # USB PnP Audio Device (sr.Microphone index)
MIC_RATE   = 48000
AMP_DEVICE = 0    # Google Voice HAT
AMP_RATE   = 48000

# ─── Funcions de sincronització local ────────────────────────────────────────

def save_schedules_local(schedules):
    try:
        with open(LOCAL_FILE, "w", encoding="utf-8") as f:
            json.dump(schedules, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"⚠️ Error guardant en local: {e}")

def load_schedules_local():
    if os.path.exists(LOCAL_FILE):
        try:
            with open(LOCAL_FILE, "r", encoding="utf-8") as f:
                dades = json.load(f)
                print(f"📁 Carregats {len(dades)} horaris de la memòria local.")
                return dades
        except Exception as e:
            print(f"⚠️ Error llegint fitxer local: {e}")
    return []

# ─── Events compartits ────────────────────────────────────────────────────────

wake_word_activat = threading.Event()
robot_parlant     = threading.Event()
pausar_wake_word  = threading.Event()

# ─── Wake Word ────────────────────────────────────────────────────────────────

def escoltar_wake_word():
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = False

    print("🎤 Wake word actiu. Di 'Care-E' per activar.")

    with sr.Microphone(device_index=MIC_DEVICE, sample_rate=MIC_RATE) as source:
        print("Calibrant soroll ambient...")
        recognizer.adjust_for_ambient_noise(source, duration=2)
        print("Calibració acabada. Escoltant...")

        while True:
            if robot_parlant.is_set() or pausar_wake_word.is_set():
                time.sleep(0.5)
                continue

            try:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=4)
                text = recognizer.recognize_google(audio, language="ca-ES").lower()
                print(f" 👂 Detectat: '{text}'")

                if any(w in text for w in WAKE_WORDS):
                    print("✅ Wake word detectat!")
                    pausar_wake_word.set()
                    wake_word_activat.set()

            except sr.WaitTimeoutError:
                pass
            except sr.UnknownValueError:
                pass
            except sr.RequestError as e:
                print(f"⚠️ Error Google: {e}")
            except Exception as e:
                print(f"⚠️ Error wake word: {e}")
                time.sleep(1)

# ─── Manté l'amplificador encès ──────────────────────────────────────────────

def mantenir_amp_encesa():
    try:
        with sd.OutputStream(
            samplerate=AMP_RATE,
            channels=2,
            dtype='int16',
            device=AMP_DEVICE,
            blocksize=4096
        ) as stream:
            silenci = np.zeros((4096, 2), dtype=np.int16)
            while True:
                stream.write(silenci)
    except Exception as e:
        print(f"⚠️ Error amp: {e}")

# ─── Inicialització ───────────────────────────────────────────────────────────

res = supabase.table("robots").select("id, owner_id, name, robot_token").eq("id", ROBOT_ID).execute()
token = None

if not res.data:
    supabase.table("robots").insert({
        "id": ROBOT_ID, "name": "Care-E", "status": "offline",
    }).execute()
    print("=" * 40 + f"\n  Care-E Robot ID:\n  {ROBOT_ID}\n" + "=" * 40)
    print("Introdueix aquest ID a la web per vincular el robot.")
else:
    robot_data = res.data[0]
    token = robot_data.get("robot_token")
    if robot_data.get("owner_id"):
        print(f"✓ Care-E funcionant | Robot: {robot_data.get('name', 'Care-E')}")
    else:
        print("Esperant que l'usuari vinculi el robot...")

current_schedules   = load_schedules_local()
last_sync_time      = 0
last_command_check  = 0
historial_dispensat = {}
last_heartbeat      = 0

pendents_inicials = carregar_pendents()
if pendents_inicials:
    print(f"📦 {len(pendents_inicials)} logs pendents de l'última sessió.")

threading.Thread(target=escoltar_wake_word, daemon=True).start()
threading.Thread(target=mantenir_amp_encesa, daemon=True).start()

print("\nIniciant bucle principal...\n")

# ─── Bucle Principal ──────────────────────────────────────────────────────────

while True:
    now = time.time()

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
                    flush_pendents()
            except Exception as e:
                print(f"⚠️ Sense internet. ({e})")
        else:
            refresh = supabase.table("robots").select("robot_token").eq("id", ROBOT_ID).execute()
            if refresh.data and refresh.data[0].get("robot_token"):
                token = refresh.data[0].get("robot_token")
                print("🎉 Robot vinculat!")

    current_time_str = time.strftime("%H:%M")
    today_date_str   = time.strftime("%Y-%m-%d")
    today_weekday    = DIES_CAT[datetime.datetime.today().weekday()]

    for s in current_schedules:
        processar_schedule(s, token, historial_dispensat, today_date_str, current_time_str, today_weekday)

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

    if wake_word_activat.is_set() and token:
        wake_word_activat.clear()
        pausar_wake_word.set()
        time.sleep(1.0)

        print("\n🎤 Processant veu del pacient...")
        try:
            gestionar_veu(token, pausar_wake_word, robot_parlant)
        except Exception as e:
            import traceback
            print(f"❌ Error: {traceback.format_exc()}")
        finally:
            pausar_wake_word.clear()

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

    time.sleep(0.1)