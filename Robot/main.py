# main.py
import time
import datetime
import json
import os
import requests
from config import supabase, ROBOT_ID, API_URL, LOCAL_FILE, DIES_CAT
from dispensing import processar_schedule
from commands import processar_comandes
from utils import get_wifi_signal, flush_pendents, carregar_pendents

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

current_schedules = load_schedules_local()
last_sync_time = 0
last_command_check = 0
historial_dispensat = {}

pendents_inicials = carregar_pendents()
if pendents_inicials:
    print(f"📦 {len(pendents_inicials)} logs pendents de l'última sessió.")

print("\nIniciant bucle principal...\n")

# ─── Bucle Principal ──────────────────────────────────────────────────────────

while True:
    now = time.time()

    # ── A) Sincronització d'horaris (cada 60s) ──────────────────────────────
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
                print(f"⚠️ Sense internet. Mode local. ({e})")
        else:
            refresh = supabase.table("robots").select("robot_token").eq("id", ROBOT_ID).execute()
            if refresh.data and refresh.data[0].get("robot_token"):
                token = refresh.data[0].get("robot_token")
                print("🎉 Robot vinculat! Iniciant sincronització...")

    # ── B) Comprovació de dispensació programada ────────────────────────────
    current_time_str = time.strftime("%H:%M")
    today_date_str   = time.strftime("%Y-%m-%d")
    today_weekday    = DIES_CAT[datetime.datetime.today().weekday()]

    for s in current_schedules:
        processar_schedule(s, token, historial_dispensat, today_date_str, current_time_str, today_weekday)

    # ── C) Comprovació d'ordres manuals (cada 5s) ───────────────────────────
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

    # ── D) Heartbeat (cada 10s) ─────────────────────────────────────────────
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

    time.sleep(10)